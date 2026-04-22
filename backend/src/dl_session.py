"""Deep-learning session router.

Persistent, server-keyed sessions backed by a folder under DL_DIR. Each session
carries a reference to a volume and (optionally) an annotation mask and a result
mask. A RAM cache with a TTL keeps the preprocessed volume tensor and last
inference logits available across rapid successive calls; the manifest on disk
is the source of truth.
"""
import json
import logging
import os
import re
import shutil
import threading
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

_SESSION_NAME_RE = re.compile(r"^[A-Za-z0-9_-]+$")
_MANIFEST_FILENAME = "session.json"
_VOLUME_ROOT_DATA = "data"
_VOLUME_ROOT_SESSION = "session"


class NewSessionRequest(BaseModel):
    session_name: str


class SetVolumeRequest(BaseModel):
    volume_path: str


class SetAnnotsRequest(BaseModel):
    annotation_path: str


class InferRequest(BaseModel):
    label_value: int = 1


@dataclass
class _SessionCacheEntry:
    last_touched: float = field(default_factory=time.monotonic)
    volume_tensor: Any = None
    affine_ras: Any = None
    ras_dims: tuple[int, int, int] | None = None
    shape_before_pad: tuple[int, int, int] | None = None
    previous_logits: Any = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class SessionManager:
    """Owns session manifests on disk and the RAM cache with lazy TTL eviction.

    Filesystem is authoritative. The RAM cache exists only to avoid repeated
    disk I/O and preprocessing inside an active editing session.
    """

    def __init__(
        self,
        dl_dir: Path,
        data_dir: Path,
        ttl_seconds: int,
        enable_history: bool = False,
    ):
        self.dl_dir = dl_dir
        self.data_dir = data_dir
        self.ttl_seconds = ttl_seconds
        self.enable_history = enable_history
        self._cache: dict[str, _SessionCacheEntry] = {}
        self._lock = threading.Lock()

    # ----- cache -----
    def _sweep_expired(self) -> None:
        now = time.monotonic()
        stale = [sid for sid, e in self._cache.items()
                 if now - e.last_touched > self.ttl_seconds]
        for sid in stale:
            self._cache.pop(sid, None)
            logger.info(f"DL session cache: evicted {sid} (TTL)")

    def touch(self, session_id: str) -> _SessionCacheEntry:
        with self._lock:
            self._sweep_expired()
            entry = self._cache.get(session_id)
            if entry is None:
                entry = _SessionCacheEntry()
                self._cache[session_id] = entry
            entry.last_touched = time.monotonic()
            return entry

    def invalidate_all(self, session_id: str) -> None:
        with self._lock:
            self._cache.pop(session_id, None)

    def invalidate_logits(self, session_id: str) -> None:
        with self._lock:
            entry = self._cache.get(session_id)
            if entry is not None:
                entry.previous_logits = None
                entry.last_touched = time.monotonic()

    # ----- manifest I/O -----
    def _session_dir_by_name(self, session_name: str) -> Path:
        return self.dl_dir / session_name

    def _read_manifest(self, manifest_path: Path) -> dict[str, Any]:
        with open(manifest_path, "r") as f:
            return json.load(f)

    def _write_manifest(self, manifest_path: Path, manifest: dict[str, Any]) -> None:
        tmp = manifest_path.with_suffix(manifest_path.suffix + ".tmp")
        with open(tmp, "w") as f:
            json.dump(manifest, f, indent=2)
        os.replace(tmp, manifest_path)

    def _iter_session_manifests(self):
        if not self.dl_dir.exists():
            return
        for entry in sorted(self.dl_dir.iterdir()):
            if not entry.is_dir():
                continue
            manifest = entry / _MANIFEST_FILENAME
            if not manifest.exists():
                continue
            try:
                yield entry, self._read_manifest(manifest)
            except (OSError, json.JSONDecodeError) as exc:
                logger.warning(f"Skipping unreadable session {entry.name}: {exc}")

    def list_sessions(self) -> list[dict[str, Any]]:
        sessions = [m for _dir, m in self._iter_session_manifests()]
        return sorted(sessions, key=lambda m: m.get("created_at", ""))

    def find_by_id(self, session_id: str) -> tuple[Path, dict[str, Any]]:
        for session_dir, manifest in self._iter_session_manifests():
            if manifest.get("session_id") == session_id:
                return session_dir, manifest
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")

    def create(self, session_name: str) -> dict[str, Any]:
        if not _SESSION_NAME_RE.match(session_name):
            raise HTTPException(
                status_code=400,
                detail="session_name must match [A-Za-z0-9_-]+",
            )
        session_dir = self._session_dir_by_name(session_name)
        if session_dir.exists():
            raise HTTPException(
                status_code=409,
                detail=f"Session '{session_name}' already exists",
            )
        self.dl_dir.mkdir(parents=True, exist_ok=True)
        session_dir.mkdir(parents=True, exist_ok=False)
        manifest: dict[str, Any] = {
            "session_id": uuid.uuid4().hex,
            "session_name": session_name,
            "created_at": _now_iso(),
            "volume_path": None,
            "volume_path_root": None,
            "annotation_path": None,
            "result_path": None,
            "last_inference_ml_id": None,
            "last_inference_at": None,
        }
        if self.enable_history:
            manifest["iteration_count"] = 0
            manifest["iterations"] = []
        self._write_manifest(session_dir / _MANIFEST_FILENAME, manifest)
        logger.info(f"DL session created: {session_name} ({manifest['session_id']})")
        return manifest

    def delete(self, session_id: str) -> None:
        session_dir, _manifest = self.find_by_id(session_id)
        shutil.rmtree(session_dir)
        self.invalidate_all(session_id)
        logger.info(f"DL session deleted: {session_id}")

    # ----- path resolution -----
    def _resolve_under(self, root: Path, rel: str) -> Path | None:
        try:
            candidate = (root / rel).resolve()
        except (OSError, ValueError):
            return None
        root_resolved = root.resolve()
        try:
            candidate.relative_to(root_resolved)
        except ValueError:
            return None
        if not candidate.exists():
            return None
        return candidate

    def resolve_path_for_session(
        self,
        rel: str,
        session_dir: Path,
        allow_data_root: bool,
    ) -> tuple[Path, str]:
        if allow_data_root:
            resolved = self._resolve_under(self.data_dir, rel)
            if resolved is not None:
                return resolved, _VOLUME_ROOT_DATA
        resolved = self._resolve_under(session_dir, rel)
        if resolved is not None:
            return resolved, _VOLUME_ROOT_SESSION
        raise HTTPException(
            status_code=400,
            detail=f"Path does not resolve to an existing file: {rel}",
        )

    # ----- mutations -----
    def set_volume(self, session_id: str, rel: str) -> dict[str, Any]:
        session_dir, manifest = self.find_by_id(session_id)
        _abs, root_tag = self.resolve_path_for_session(
            rel=rel, session_dir=session_dir, allow_data_root=True,
        )
        manifest["volume_path"] = rel
        manifest["volume_path_root"] = root_tag
        self._write_manifest(session_dir / _MANIFEST_FILENAME, manifest)
        self.invalidate_all(session_id)
        return manifest

    def set_annots(self, session_id: str, rel: str) -> dict[str, Any]:
        session_dir, manifest = self.find_by_id(session_id)
        self.resolve_path_for_session(
            rel=rel, session_dir=session_dir, allow_data_root=False,
        )
        manifest["annotation_path"] = rel
        self._write_manifest(session_dir / _MANIFEST_FILENAME, manifest)
        self.invalidate_logits(session_id)
        return manifest

    def record_inference(
        self,
        session_id: str,
        ml_id: str,
        result_rel_path: str,
    ) -> dict[str, Any]:
        session_dir, manifest = self.find_by_id(session_id)
        manifest["result_path"] = result_rel_path
        manifest["last_inference_ml_id"] = ml_id
        manifest["last_inference_at"] = _now_iso()
        self._write_manifest(session_dir / _MANIFEST_FILENAME, manifest)
        return manifest

    def record_iteration(
        self,
        session_id: str,
        ml_id: str,
        result_rel_path: str,
        iteration_entry: dict[str, Any],
    ) -> dict[str, Any]:
        session_dir, manifest = self.find_by_id(session_id)
        manifest["result_path"] = result_rel_path
        manifest["last_inference_ml_id"] = ml_id
        manifest["last_inference_at"] = _now_iso()
        iterations = manifest.get("iterations") or []
        iterations.append(iteration_entry)
        manifest["iterations"] = iterations
        manifest["iteration_count"] = manifest.get("iteration_count", 0) + 1
        self._write_manifest(session_dir / _MANIFEST_FILENAME, manifest)
        return manifest


def _load_yaml(path: Path) -> dict[str, Any] | None:
    try:
        with open(path, "r") as f:
            return yaml.safe_load(f)
    except (OSError, yaml.YAMLError) as exc:
        logger.warning(f"Could not parse {path}: {exc}")
        return None


def _list_models(models_dir: Path) -> list[dict[str, Any]]:
    if not models_dir.exists():
        return []
    out: list[dict[str, Any]] = []
    for model_dir in sorted(models_dir.iterdir()):
        if not model_dir.is_dir():
            continue
        model_file = model_dir / "model.py"
        weights_file = model_dir / "weights.pt"
        if not (model_file.exists() and weights_file.exists()):
            continue
        info: dict[str, Any] = {
            "ml_id": model_dir.name,
            "name": model_dir.name,
            "model_module_path": str(model_file),
            "checkpoint_path": str(weights_file),
            "config_path": None,
            "config": None,
        }
        config_file = model_dir / "config.yml"
        if config_file.exists():
            info["config_path"] = str(config_file)
            info["config"] = _load_yaml(config_file)
        out.append(info)
    return out


def build_router(
    *,
    dl_dir: Path,
    data_dir: Path,
    models_dir: Path,
    ttl_seconds: int,
    enabled: bool,
    enable_history: bool = False,
) -> APIRouter:
    """Build the /dl/* router. When `enabled` is False, every route returns 404."""
    router = APIRouter(prefix="/dl")
    manager = SessionManager(
        dl_dir=dl_dir,
        data_dir=data_dir,
        ttl_seconds=ttl_seconds,
        enable_history=enable_history,
    )

    def _require_enabled() -> None:
        if not enabled:
            raise HTTPException(status_code=404, detail="DL endpoints disabled")

    def _require_ml_id(ml_id: str) -> dict[str, Any]:
        for m in _list_models(models_dir):
            if m["ml_id"] == ml_id:
                return m
        raise HTTPException(status_code=404, detail=f"Unknown ml_id: {ml_id}")

    @router.get("/model/list")
    def model_list():
        _require_enabled()
        return _list_models(models_dir)

    @router.get("/session/list")
    def session_list():
        _require_enabled()
        return manager.list_sessions()

    @router.post("/session/new")
    def session_new(request: NewSessionRequest):
        _require_enabled()
        manifest = manager.create(request.session_name)
        return {
            "session_id": manifest["session_id"],
            "session_name": manifest["session_name"],
        }

    @router.delete("/session/{session_id}")
    def session_delete(session_id: str):
        _require_enabled()
        manager.delete(session_id)
        return {"success": True}

    @router.post("/session/{session_id}/set_volume")
    def session_set_volume(session_id: str, request: SetVolumeRequest):
        _require_enabled()
        manifest = manager.set_volume(session_id, request.volume_path)
        return {
            "success": True,
            "volume_path": manifest["volume_path"],
            "volume_path_root": manifest["volume_path_root"],
        }

    @router.post("/session/{session_id}/set_annots")
    def session_set_annots(session_id: str, request: SetAnnotsRequest):
        _require_enabled()
        manifest = manager.set_annots(session_id, request.annotation_path)
        return {"success": True, "annotation_path": manifest["annotation_path"]}

    @router.post("/session/{session_id}/infer/{ml_id}")
    def session_infer(
        session_id: str,
        ml_id: str,
        request: InferRequest | None = None,
    ):
        _require_enabled()
        session_dir, manifest = manager.find_by_id(session_id)
        _require_ml_id(ml_id)
        if not manifest.get("volume_path"):
            raise HTTPException(status_code=400, detail="Session has no volume set")
        if not manifest.get("annotation_path"):
            raise HTTPException(status_code=400, detail="Session has no annotations set")
        label_value = 1 if request is None else max(0, min(255, request.label_value))

        from ml_inference import run_inference  # lazy; only when DL is enabled
        import nibabel as nib

        cache_entry = manager.touch(session_id)
        nii, _affine = run_inference(
            session_id=session_id,
            ml_id=ml_id,
            label_value=label_value,
            cache_entry=cache_entry,
            session_dir=session_dir,
            manifest=manifest,
            data_dir=manager.data_dir,
            models_dir=models_dir,
        )

        result_rel = "result.nii.gz"
        result_abs = session_dir / result_rel
        nib.save(nii, str(result_abs))

        if manager.enable_history:
            n = manifest.get("iteration_count", 0)
            numbered_result = f"result_{n:03d}.nii.gz"
            numbered_annot = f"annotations_{n:03d}.nii.gz"

            annot_rel = manifest["annotation_path"]
            annot_abs, _root = manager.resolve_path_for_session(
                rel=annot_rel, session_dir=session_dir, allow_data_root=False,
            )
            annotated_at = datetime.fromtimestamp(
                annot_abs.stat().st_mtime, tz=timezone.utc,
            ).strftime("%Y-%m-%dT%H:%M:%SZ")

            shutil.copy2(result_abs, session_dir / numbered_result)
            shutil.copy2(annot_abs, session_dir / numbered_annot)

            iteration_entry = {
                "iteration": n,
                "annotation_path": numbered_annot,
                "result_path": numbered_result,
                "ml_id": ml_id,
                "label_value": label_value,
                "annotated_at": annotated_at,
                "inferred_at": _now_iso(),
            }
            manager.record_iteration(session_id, ml_id, result_rel, iteration_entry)
        else:
            manager.record_inference(session_id, ml_id, result_rel)

        return {
            "success": True,
            "ml_id": ml_id,
            "result_path": result_rel,
            "label_value": label_value,
        }

    return router
