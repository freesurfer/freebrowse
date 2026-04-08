import os
import csv
import json
import random
import logging
import threading
import base64
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import nibabel as nib
import yaml
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from thunderpack import ThunderReader

from utils import encode_nifti

logger = logging.getLogger(__name__)

data_dir = os.getenv('DATA_DIR')
master_json = os.getenv('MASTER_JSON')
megamedical_base_dir = os.getenv('MEGAMEDICAL_BASE_DIR')

_MM5_QC_CONFIG_FILE = Path(__file__).parent.parent.parent / "data" / "megamedical5-qc.yml"
_mm5_qc_config: dict = yaml.safe_load(_MM5_QC_CONFIG_FILE.read_text())
MM5_QA_DATASETS: list[str] = _mm5_qc_config["datasets"]
MIN_LABEL_VOXELS: float = _mm5_qc_config["min_label_voxels"]
blind_rating: bool = _mm5_qc_config["blind_rating"]
_MM5_QA_HIERARCHY: tuple[str, ...] = tuple(_mm5_qc_config["hierarchy"])

router = APIRouter()



class ElucidQaInitRequest(BaseModel):
    name: str
    seed: int


class ElucidQaSubmitRequest(BaseModel):
    session_id: str
    rating: int


class ElucidQaNextRequest(BaseModel):
    session_id: str


class MM5QaInitRequest(BaseModel):
    name: str
    seed: int


class MM5QaRateRequest(BaseModel):
    session_id: str
    rating: int


class MM5QaNextRequest(BaseModel):
    session_id: str





@dataclass
class ElucidQaSession:
    """State for an Elucid QA session. Persisted to disk as JSON."""
    name: str
    seed: int
    current_index: int
    total_volumes: int


@dataclass
class MM5QaSession:
    """State for an MM5 QA session. Persisted to disk as JSON."""
    name: str
    seed: int
    current_index: int
    current_metadata: dict | None = None
    rng_state: list | None = None


@dataclass
class MM5QaTask:
    """One (database, label) pair -- the unit of MM5 QA sampling."""
    db_path: str
    dataset: str
    group: str
    modality: str
    vol_file: str
    seg_file: str
    task_name: str
    label_idx: int
    label_name: str
    n_labels: int
    samples: list[str]
    original_label_type: str
    overlapping_labels: bool





_mm5_qa_index: list[MM5QaTask] | None = None
_mm5_qa_index_lock = threading.Lock()
_session_locks: dict[str, threading.Lock] = {}
_session_locks_lock = threading.Lock()





def get_elucid_qa_dir() -> Path:
    """Return the Elucid QA sessions directory, creating it if needed."""
    elucid_qa_dir = Path(data_dir) / "elucid_qa_sessions"
    elucid_qa_dir.mkdir(parents=True, exist_ok=True)
    return elucid_qa_dir


def make_elucid_qa_session_id(name: str, seed: int) -> str:
    """Deterministic session ID from name + seed. Same inputs = same session."""
    safe_name = name.strip().lower().replace(" ", "_")
    return f"elucid_qa_{safe_name}_{seed}"


def load_shuffled_paths(seed: int) -> list[str]:
    """Load master path list and shuffle deterministically with seed."""
    with open(master_json, "r") as f:
        paths = [line.strip() for line in f if line.strip()]
    rng = random.Random(seed)
    rng.shuffle(paths)
    return paths


def save_elucid_qa_session(session_id: str, session: ElucidQaSession) -> None:
    """Persist Elucid QA session state to JSON on disk."""
    path = get_elucid_qa_dir() / f"{session_id}.json"
    with open(path, "w") as f:
        json.dump({
            "name": session.name,
            "seed": session.seed,
            "current_index": session.current_index,
            "total_volumes": session.total_volumes,
        }, f)


def load_elucid_qa_session(session_id: str) -> ElucidQaSession | None:
    """Load Elucid QA session from disk, or return None if not found."""
    path = get_elucid_qa_dir() / f"{session_id}.json"
    if not path.exists():
        return None
    with open(path, "r") as f:
        data = json.load(f)
    return ElucidQaSession(**data)


def append_elucid_qa_rating_to_csv(
    session_id: str,
    nifti_path: str,
    rating: int,
) -> None:
    """Append a single rating row to the session CSV."""
    csv_path = get_elucid_qa_dir() / f"{session_id}_ratings.csv"
    file_exists = csv_path.exists()
    with open(csv_path, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["timestamp", "path", "rating"])
        writer.writerow([
            datetime.now(timezone.utc).isoformat(), nifti_path, rating,
        ])





def build_mm5_qa_index() -> list[MM5QaTask]:
    """Scan MegaMedical LMDB databases and build a flat task index.

    Each entry is one (database, label) pair. Cached after first call.
    """
    global _mm5_qa_index
    if _mm5_qa_index is not None:
        return _mm5_qa_index
    with _mm5_qa_index_lock:
        if _mm5_qa_index is not None:
            return _mm5_qa_index

        base = Path(megamedical_base_dir)
        db_infos: list[dict] = []

        for dataset_spec in MM5_QA_DATASETS:
            dataset_path = base / dataset_spec
            if not dataset_path.exists():
                logger.warning(f"MM5 QA dataset not found: {dataset_path}")
                continue

            for mdb_file in dataset_path.rglob("data.mdb"):
                db_dir = mdb_file.parent
                rel = db_dir.relative_to(base)
                parts = rel.parts
                modality = parts[-1]
                task_prefix = parts[-2] if len(parts) >= 2 else ""
                proc_version = parts[2] if len(parts) >= 5 else ""
                group = parts[1] if len(parts) >= 4 else parts[0]

                db_infos.append({
                    "db_dir": db_dir,
                    "rel": rel,
                    "dataset": dataset_spec,
                    "group": group,
                    "proc_version": proc_version,
                    "task_prefix": task_prefix,
                    "modality": modality,
                })

        latest_versions: dict[tuple[str, str], str] = {}
        for info in db_infos:
            key = (info["dataset"], info["group"])
            cur = latest_versions.get(key, "")
            if info["proc_version"] > cur:
                latest_versions[key] = info["proc_version"]

        entries: list[MM5QaTask] = []
        for info in db_infos:
            key = (info["dataset"], info["group"])
            if info["proc_version"] != latest_versions[key]:
                continue

            task_prefix = info["task_prefix"]
            if "_seg" in task_prefix:
                a, b = task_prefix.split("_seg", 1)
                vol_file, seg_file = a, "seg" + b
            elif "_prob" in task_prefix:
                a, b = task_prefix.split("_prob", 1)
                vol_file, seg_file = a, "prob" + b
            else:
                logger.warning(
                    f"Unrecognized task_prefix: {task_prefix!r} "
                    f"in {info['db_dir']}"
                )
                vol_file, seg_file = task_prefix, task_prefix

            reader = None
            try:
                reader = ThunderReader(str(info["db_dir"]))
                attrs = reader["_attrs"]
                subject_df = reader["_subject_df"]
                try:
                    label_densities = reader["_label_densities"]
                except Exception:
                    label_densities = None
            except Exception as e:
                logger.warning(f"Failed to read {info['db_dir']}: {e}")
                continue
            finally:
                if reader is not None and hasattr(reader, 'close'):
                    try:
                        reader.close()
                    except Exception:
                        pass

            labelled_df = subject_df[subject_df["labelled"]].reset_index(
                drop=True)
            if labelled_df.empty:
                continue

            n_labels = attrs.get("n_labels", 1)
            label_names = attrs.get("label_names", {})
            original_label_type = attrs.get("original_label_type", "hard")
            overlapping_labels = attrs.get("overlapping_labels", False)
            task_name = str(info["rel"])

            for label_idx in range(n_labels):
                if (label_densities is not None
                        and MIN_LABEL_VOXELS > 0):
                    counts = label_densities[
                        :len(labelled_df), label_idx]
                    mask = counts >= MIN_LABEL_VOXELS
                    label_samples = labelled_df[mask][
                        "sample"].tolist()
                else:
                    label_samples = labelled_df["sample"].tolist()

                if not label_samples:
                    continue

                entries.append(MM5QaTask(
                    db_path=str(info["db_dir"]),
                    dataset=info["dataset"],
                    group=info["group"],
                    modality=info["modality"],
                    vol_file=vol_file,
                    seg_file=seg_file,
                    task_name=task_name,
                    label_idx=label_idx,
                    label_name=label_names.get(label_idx, ""),
                    n_labels=n_labels,
                    samples=label_samples,
                    original_label_type=original_label_type,
                    overlapping_labels=overlapping_labels,
                ))

        logger.info(
            f"MM5 QA index built: {len(entries)} task-label combinations"
        )
        _mm5_qa_index = entries
        return entries


def sample_mm5_qa_item(
    index: list[MM5QaTask],
    rng: random.Random,
) -> tuple[MM5QaTask, str]:
    """Draw one (task, sample_key) using flat uniform sampling.

    Every task has equal probability regardless of dataset size.
    """
    task = rng.choice(index)
    sample_key = rng.choice(task.samples)
    return task, sample_key


def _select_label_for_mm5_qa(
    seg: np.ndarray,
    label_idx: int,
    original_label_type: str,
    overlapping_labels: bool,
    rng: np.random.Generator,
) -> np.ndarray:
    """Select a binary label from a segmentation volume."""
    if original_label_type == 'instance-hard':
        seg_ch = seg[label_idx]
        instance_labels = np.delete(
            np.unique(seg_ch).astype(int), [0])
        if len(instance_labels) > 0:
            idx = rng.choice(instance_labels, 1)[0]
            return (seg_ch == idx).astype(np.uint8)
        return np.zeros_like(seg_ch, dtype=np.uint8)
    if original_label_type == 'instance-soft':
        raise NotImplementedError(
            "instance-soft label type not supported")
    if overlapping_labels or original_label_type == 'multi-annotator':
        return seg[label_idx].astype(np.uint8)
    return (seg == label_idx + 1).astype(np.uint8)


def set_percentile_cal(
    nii: nib.Nifti1Image,
    lower: float = 3.0,
    upper: float = 97.0,
) -> nib.Nifti1Image:
    """Set cal_min/cal_max to intensity percentiles."""
    data = nii.get_fdata(dtype=np.float32)
    nii.header['cal_min'] = float(np.percentile(data, lower))
    nii.header['cal_max'] = float(np.percentile(data, upper))
    return nii


def read_mm5_qa_sample(
    task: MM5QaTask,
    sample_key: str,
) -> tuple[str, str, dict]:
    """Read vol+seg from LMDB and return as base64 gzipped NIfTI."""
    reader = ThunderReader(task.db_path)
    try:
        vol = reader[f"{sample_key}/vol"].astype(np.float32)
        seg = reader[f"{sample_key}/seg"]
        affine = reader[f"{sample_key}/affine"]
    finally:
        if hasattr(reader, 'close'):
            try:
                reader.close()
            except Exception:
                pass

    rng = np.random.default_rng(hash(sample_key) % (2**32))
    seg_binary = _select_label_for_mm5_qa(
        seg, task.label_idx, task.original_label_type,
        task.overlapping_labels, rng,
    )

    vol_nii = set_percentile_cal(nib.Nifti1Image(vol, affine))
    seg_nii = nib.Nifti1Image(seg_binary, affine)

    zooms = vol_nii.header.get_zooms()[:3]
    metadata = {
        "dataset": task.dataset,
        "modality": task.modality,
        "task": task.task_name,
        "sample": sample_key,
        "label_index": task.label_idx,
        "label_name": task.label_name,
        "voxel_spacing": [float(z) for z in zooms],
    }

    return encode_nifti(vol_nii), encode_nifti(seg_nii), metadata


def get_mm5_qa_dir() -> Path:
    mm5_qa_dir = Path(data_dir) / "mm5_qa_sessions"
    mm5_qa_dir.mkdir(parents=True, exist_ok=True)
    return mm5_qa_dir


def _get_session_lock(session_id: str) -> threading.Lock:
    with _session_locks_lock:
        if session_id not in _session_locks:
            _session_locks[session_id] = threading.Lock()
        return _session_locks[session_id]


def _serialize_rng_state(state: tuple) -> list:
    """Convert random.Random.getstate() to JSON-serializable list."""
    version, internalstate, gauss = state
    return [version, list(internalstate), gauss]


def _deserialize_rng_state(data: list) -> tuple:
    """Convert JSON list back to random.Random.setstate() format."""
    version, internalstate, gauss = data
    return (version, tuple(internalstate), gauss)


def make_mm5_qa_session_id(name: str, seed: int) -> str:
    safe_name = name.strip().lower().replace(" ", "_")
    return f"mm5_qa_{safe_name}_{seed}"


def save_mm5_qa_session(session_id: str, session: MM5QaSession) -> None:
    path = get_mm5_qa_dir() / f"{session_id}.json"
    with open(path, "w") as f:
        json.dump({
            "name": session.name,
            "seed": session.seed,
            "current_index": session.current_index,
            "current_metadata": session.current_metadata,
            "rng_state": session.rng_state,
        }, f)


def load_mm5_qa_session(session_id: str) -> MM5QaSession | None:
    path = get_mm5_qa_dir() / f"{session_id}.json"
    if not path.exists():
        return None
    with open(path, "r") as f:
        data = json.load(f)
    return MM5QaSession(**data)


def append_mm5_qa_rating_to_csv(
    session_id: str,
    metadata: dict,
    rating: int,
) -> None:
    csv_path = get_mm5_qa_dir() / f"{session_id}_ratings.csv"
    file_exists = csv_path.exists()
    with open(csv_path, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow([
                "timestamp", "dataset", "modality", "task",
                "sample", "label_index", "label_name", "rating",
            ])
        writer.writerow([
            datetime.now(timezone.utc).isoformat(),
            metadata.get("dataset", ""),
            metadata.get("modality", ""),
            metadata.get("task", ""),
            metadata.get("sample", ""),
            metadata.get("label_index", ""),
            metadata.get("label_name", ""),
            False if rating == 0 else rating,
        ])





@router.post("/elucid-qa/init")
def elucid_qa_init(request: ElucidQaInitRequest):
    """Initialize or resume an Elucid QA session."""
    if not master_json or not Path(master_json).exists():
        raise HTTPException(
            status_code=500,
            detail="MASTER_JSON not configured or file not found",
        )

    session_id = make_elucid_qa_session_id(request.name, request.seed)
    existing = load_elucid_qa_session(session_id)

    if existing is not None:
        logger.info(
            f"Resuming Elucid QA session: {session_id} at index "
            f"{existing.current_index}"
        )
        return {
            "session_id": session_id,
            "current_index": existing.current_index,
            "total_volumes": existing.total_volumes,
        }

    paths = load_shuffled_paths(request.seed)
    session = ElucidQaSession(
        name=request.name,
        seed=request.seed,
        current_index=0,
        total_volumes=len(paths),
    )

    save_elucid_qa_session(session_id, session)
    logger.info(
        f"Created Elucid QA session: {session_id} with "
        f"{len(paths)} volumes"
    )

    return {
        "session_id": session_id,
        "current_index": 0,
        "total_volumes": len(paths),
    }


@router.get("/elucid-qa/volume")
def elucid_qa_volume(session_id: str, index: int | None = None):
    """Return a volume as base64-encoded gzipped NIfTI.

    Parameters
    ----------
    session_id : str
        The Elucid QA session ID.
    index : int | None
        Volume index to fetch. Defaults to session's current_index.
        Allows frontend to prefetch upcoming volumes without advancing
        the session pointer.
    """
    session = load_elucid_qa_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    paths = load_shuffled_paths(session.seed)
    vol_index = index if index is not None else session.current_index

    if vol_index < 0 or vol_index >= len(paths):
        raise HTTPException(
            status_code=400, detail="Volume index out of range",
        )

    nifti_path = paths[vol_index]
    if not Path(nifti_path).exists():
        raise HTTPException(
            status_code=404,
            detail=f"NIfTI file not found: {nifti_path}",
        )

    raw_bytes = Path(nifti_path).read_bytes()
    return {
        "volume_nifti": base64.b64encode(raw_bytes).decode("utf-8"),
        "path": nifti_path,
        "current_index": vol_index,
        "total_volumes": session.total_volumes,
    }


@router.post("/elucid-qa/rate")
def elucid_qa_rate(request: ElucidQaSubmitRequest):
    """Record a rating for the current volume. Every click is recorded."""
    session = load_elucid_qa_session(request.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if request.rating < 1 or request.rating > 5:
        raise HTTPException(
            status_code=400, detail="Rating must be between 1 and 5",
        )

    paths = load_shuffled_paths(session.seed)
    if session.current_index >= len(paths):
        raise HTTPException(
            status_code=400, detail="No current volume to rate",
        )

    current_path = paths[session.current_index]
    append_elucid_qa_rating_to_csv(
        request.session_id, current_path, request.rating,
    )
    logger.info(
        f"Rating recorded: session={request.session_id}, "
        f"path={current_path}, rating={request.rating}"
    )
    return {"success": True}


@router.post("/elucid-qa/next")
def elucid_qa_next(request: ElucidQaNextRequest):
    """Advance to the next volume. Does not return volume data.

    Volume data is fetched separately via GET /elucid-qa/volume. This keeps
    mutation (advancing) separate from reading (fetching NIfTI data), so
    the client has a single code path for loading volumes.
    """
    session = load_elucid_qa_session(request.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    session.current_index += 1
    save_elucid_qa_session(request.session_id, session)

    return {
        "done": session.current_index >= session.total_volumes,
        "current_index": session.current_index,
        "total_volumes": session.total_volumes,
    }





@router.post("/mm5-qa/init")
def mm5_qa_init(request: MM5QaInitRequest):
    """Initialize or resume an MM5 QA session."""
    if not megamedical_base_dir:
        raise HTTPException(
            status_code=500,
            detail="MEGAMEDICAL_BASE_DIR not configured",
        )

    session_id = make_mm5_qa_session_id(request.name, request.seed)
    existing = load_mm5_qa_session(session_id)

    if existing is not None:
        if existing.rng_state is None:
            mm5_qa_index = build_mm5_qa_index()
            rng = random.Random(existing.seed)
            for _ in range(existing.current_index):
                sample_mm5_qa_item(mm5_qa_index, rng)
            existing.rng_state = _serialize_rng_state(rng.getstate())
            save_mm5_qa_session(session_id, existing)
        logger.info(
            f"Resuming MM5 QA session: {session_id} at index "
            f"{existing.current_index}"
        )
        return {
            "session_id": session_id,
            "current_index": existing.current_index,
            "blinded": blind_rating,
        }

    build_mm5_qa_index()

    rng = random.Random(request.seed)
    session = MM5QaSession(
        name=request.name,
        seed=request.seed,
        current_index=0,
        rng_state=_serialize_rng_state(rng.getstate()),
    )
    save_mm5_qa_session(session_id, session)
    logger.info(f"Created MM5 QA session: {session_id}")

    return {
        "session_id": session_id,
        "current_index": 0,
        "blinded": blind_rating,
    }


@router.get("/mm5-qa/sample")
def mm5_qa_sample(session_id: str, index: int | None = None):
    """Return vol + seg as base64 gzipped NIfTI + metadata."""
    session = load_mm5_qa_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    mm5_qa_index = build_mm5_qa_index()
    if not mm5_qa_index:
        raise HTTPException(
            status_code=500, detail="No MM5 QA databases found",
        )

    target_index = index if index is not None else session.current_index

    if target_index < 0:
        raise HTTPException(
            status_code=400, detail="index must be non-negative",
        )

    if session.rng_state and target_index >= session.current_index:
        rng = random.Random()
        rng.setstate(_deserialize_rng_state(session.rng_state))
        k = target_index - session.current_index
        for _ in range(k):
            sample_mm5_qa_item(mm5_qa_index, rng)
        task, sample_key = sample_mm5_qa_item(mm5_qa_index, rng)
    else:
        rng = random.Random(session.seed)
        for _ in range(target_index):
            sample_mm5_qa_item(mm5_qa_index, rng)
        task, sample_key = sample_mm5_qa_item(mm5_qa_index, rng)

    vol_b64, seg_b64, metadata = read_mm5_qa_sample(task, sample_key)

    if target_index == session.current_index:
        with _get_session_lock(session_id):
            session = load_mm5_qa_session(session_id)
            session.current_metadata = metadata
            save_mm5_qa_session(session_id, session)

    return {
        "volume_nifti": vol_b64,
        "seg_nifti": seg_b64,
        "metadata": None if blind_rating else metadata,
        "current_index": target_index,
    }


@router.post("/mm5-qa/rate")
def mm5_qa_rate(request: MM5QaRateRequest):
    """Record an MM5 QA rating for the current sample."""
    with _get_session_lock(request.session_id):
        session = load_mm5_qa_session(request.session_id)
        if session is None:
            raise HTTPException(
                status_code=404, detail="Session not found",
            )

        if request.rating < 0 or request.rating > 5:
            raise HTTPException(
                status_code=400,
                detail="Rating must be 0 (N/A) or between 1 and 5",
            )

        if session.current_metadata is None:
            raise HTTPException(
                status_code=400, detail="No current sample to rate",
            )

        append_mm5_qa_rating_to_csv(
            request.session_id, session.current_metadata, request.rating,
        )
    logger.info(
        f"MM5 QA rating recorded: session={request.session_id}, "
        f"rating={request.rating}"
    )
    return {"success": True}


@router.post("/mm5-qa/next")
def mm5_qa_next(request: MM5QaNextRequest):
    """Advance to next MM5 QA sample."""
    with _get_session_lock(request.session_id):
        session = load_mm5_qa_session(request.session_id)
        if session is None:
            raise HTTPException(
                status_code=404, detail="Session not found",
            )

        mm5_qa_index = build_mm5_qa_index()

        rng = random.Random()
        if session.rng_state:
            rng.setstate(_deserialize_rng_state(session.rng_state))
            sample_mm5_qa_item(mm5_qa_index, rng)
        else:
            rng = random.Random(session.seed)
            for _ in range(session.current_index + 1):
                sample_mm5_qa_item(mm5_qa_index, rng)

        new_rng_state = _serialize_rng_state(rng.getstate())
        task, sample_key = sample_mm5_qa_item(mm5_qa_index, rng)

        metadata = {
            "dataset": task.dataset,
            "modality": task.modality,
            "task": task.task_name,
            "sample": sample_key,
            "label_index": task.label_idx,
            "label_name": task.label_name,
        }

        session.current_index += 1
        session.rng_state = new_rng_state
        session.current_metadata = metadata
        save_mm5_qa_session(request.session_id, session)

    return {"current_index": session.current_index}
