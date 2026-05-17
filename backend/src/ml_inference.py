"""AI inference engine for the /ai/session/{id}/infer/{ml_id} endpoint.

Adapted from freebrowse-eti/backend/src/ml_inference.py:
- Sessions are on-disk (SessionManager-owned); inference reads paths from the
  session manifest rather than accepting base64-encoded bodies.
- Annotations arrive as a uint8 NIfTI label mask (1 = positive, 2 = negative)
  rather than flat click-index lists.
- Model cache is guarded by a threading.Lock since FastAPI runs sync endpoints
  on a threadpool.
"""
from __future__ import annotations

import importlib.util
import logging
import sys
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import nibabel as nib
import numpy as np
import torch
import yaml
from fastapi import HTTPException

import utils

logger = logging.getLogger(__name__)

if not torch.cuda.is_available():
    logger.warning(
        "CUDA not available \u2014 ML inference will run on CPU "
        "(install CUDA-enabled pytorch for GPU acceleration)"
    )


_model_cache: dict[str, tuple[torch.nn.Module, dict]] = {}
_model_cache_lock = threading.Lock()


@dataclass
class InferenceArtifacts:
    """Populated lazily by run_inference and stashed on the session cache entry."""
    volume_tensor: torch.Tensor
    affine_ras: np.ndarray
    ras_dims: tuple[int, int, int]
    shape_before_pad: tuple[int, int, int]


def pad_to_multiple(tensor: torch.Tensor, multiple: int = 16) -> torch.Tensor:
    """Pad 3d tensor so each dimension is divisible by `multiple`."""
    d, h, w = tensor.shape
    pd = (multiple - d % multiple) % multiple
    ph = (multiple - h % multiple) % multiple
    pw = (multiple - w % multiple) % multiple
    if pd == 0 and ph == 0 and pw == 0:
        return tensor
    return torch.nn.functional.pad(tensor, (0, pw, 0, ph, 0, pd))


def load_model_config(config_path: Path) -> dict[str, Any]:
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def load_model_class(module_path: Path):
    """Dynamic import of SegModel from the model.py next to weights.pt."""
    spec = importlib.util.spec_from_file_location(module_path.stem, module_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_path.stem] = module
    spec.loader.exec_module(module)

    model_class = getattr(module, "SegModel", None)
    if model_class is None:
        raise ValueError(f"No SegModel class found in {module_path}")
    return model_class


def load_model(
    module_path: Path,
    checkpoint_path: Path,
    device: torch.device,
) -> torch.nn.Module:
    """Instantiate, load state_dict, move to device, eval()."""
    model = load_model_class(module_path=module_path)()
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
    state_dict = checkpoint["model"] if isinstance(checkpoint, dict) and "model" in checkpoint else checkpoint
    model.load_state_dict(state_dict)
    return model.to(device).eval()


def get_model(
    ml_id: str,
    models_dir: Path,
    device: torch.device,
) -> tuple[torch.nn.Module, dict]:
    """Lazy cached model loader. Thread-safe."""
    with _model_cache_lock:
        cached = _model_cache.get(ml_id)
        if cached is not None:
            return cached

        model_dir = models_dir / ml_id
        module_file = model_dir / "model.py"
        checkpoint_file = model_dir / "weights.pt"
        config_file = model_dir / "config.yml"

        if not module_file.exists() or not checkpoint_file.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Model '{ml_id}' is missing model.py or weights.pt",
            )

        model = load_model(module_file, checkpoint_file, device)
        config = load_model_config(config_file) if config_file.exists() else {}

        _model_cache[ml_id] = (model, config)
        logger.info(f"Cached model '{ml_id}' on {device}")
        return model, config


def create_mask_nifti(
    mask: np.ndarray,
    affine: np.ndarray,
    label_value: int = 1,
) -> nib.Nifti1Image:
    """Build a uint8 NIfTI where foreground voxels carry `label_value`."""
    arr = np.where(mask > 0, np.uint8(label_value), np.uint8(0))
    nii = nib.Nifti1Image(arr, affine)
    nii.header.set_data_dtype(np.uint8)
    nii.header["scl_slope"] = 1.0
    nii.header["scl_inter"] = 0.0
    nii.header["cal_min"] = 0.0
    nii.header["cal_max"] = float(label_value)
    return nii


def _resolve_volume_path(manifest: dict, session_dir: Path, data_dir: Path) -> Path:
    """Resolve manifest.volume_path against DATA_DIR or session dir, guard traversal."""
    rel = manifest.get("volume_path")
    if not rel:
        raise HTTPException(status_code=400, detail="Session has no volume_path")
    root = data_dir if manifest.get("volume_path_root") == "data" else session_dir
    full = (root / rel).resolve()
    root_resolved = root.resolve()
    try:
        full.relative_to(root_resolved)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid volume_path: {rel}")
    if not full.exists():
        raise HTTPException(status_code=404, detail=f"Volume not found: {rel}")
    return full


def prepare_session_tensors(
    manifest: dict,
    session_dir: Path,
    data_dir: Path,
) -> InferenceArtifacts:
    """Load the session's volume from disk, run the preprocessing pipeline.

    Mirrors eti's _load_and_store_volume_from_path: reorient to RAS, clip
    [0.5, 99.5] percentile, normalize to [0, 1], pad to multiple of 32.
    """
    volume_path = _resolve_volume_path(manifest, session_dir, data_dir)

    img = nib.load(str(volume_path))
    img_ras = nib.as_closest_canonical(img)
    volume_ras = img_ras.get_fdata().astype(np.float32)
    affine_ras = img_ras.affine
    ras_dims = volume_ras.shape

    tensor = torch.from_numpy(volume_ras).float()
    tensor = utils.clip_volume(tensor, "percentile", [0.5, 99.5])
    tensor = utils.relative_norm(tensor)
    shape_before_pad = tuple(tensor.shape)
    tensor = pad_to_multiple(tensor=tensor, multiple=32)

    return InferenceArtifacts(
        volume_tensor=tensor,
        affine_ras=affine_ras,
        ras_dims=ras_dims,
        shape_before_pad=shape_before_pad,
    )


def annotation_mask_to_pos_neg(
    session_dir: Path,
    manifest: dict,
    ras_dims: tuple[int, int, int],
) -> tuple[torch.Tensor, torch.Tensor]:
    """Load annotations NIfTI, reorient to RAS, split by value (1=pos, 2=neg)."""
    rel = manifest.get("annotation_path")
    if not rel:
        raise HTTPException(status_code=400, detail="Session has no annotation_path")
    full = (session_dir / rel).resolve()
    session_resolved = session_dir.resolve()
    try:
        full.relative_to(session_resolved)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid annotation_path: {rel}")
    if not full.exists():
        raise HTTPException(status_code=404, detail=f"Annotations not found: {rel}")

    img = nib.load(str(full))
    img_ras = nib.as_closest_canonical(img)
    arr = np.asarray(img_ras.get_fdata())
    if arr.shape != ras_dims:
        raise HTTPException(
            status_code=400,
            detail=f"Annotation shape {arr.shape} != volume RAS dims {ras_dims}",
        )
    arr_int = arr.astype(np.int32)
    pos = torch.from_numpy((arr_int == 1).astype(np.float32))
    neg = torch.from_numpy((arr_int == 2).astype(np.float32))
    return pos, neg


def run_inference(
    *,
    session_id: str,
    ml_id: str,
    label_value: int,
    cache_entry: Any,  # SessionCacheEntry from ai_session
    session_dir: Path,
    manifest: dict,
    data_dir: Path,
    models_dir: Path,
) -> tuple[nib.Nifti1Image, np.ndarray]:
    """Run the model on the session's stored volume + annotation mask.

    Uses the SessionManager cache entry (from manager.touch) for iterative
    refinement: the preprocessed volume tensor and the previous logits are
    reused across calls until invalidated by set_volume/set_annots.
    """
    if cache_entry.volume_tensor is None:
        artifacts = prepare_session_tensors(manifest, session_dir, data_dir)
        cache_entry.volume_tensor = artifacts.volume_tensor
        cache_entry.affine_ras = artifacts.affine_ras
        cache_entry.ras_dims = artifacts.ras_dims
        cache_entry.shape_before_pad = artifacts.shape_before_pad

    volume_tensor: torch.Tensor = cache_entry.volume_tensor
    affine_ras: np.ndarray = cache_entry.affine_ras
    ras_dims = cache_entry.ras_dims
    shape_before_pad = cache_entry.shape_before_pad

    pos_mask, neg_mask = annotation_mask_to_pos_neg(session_dir, manifest, ras_dims)
    pos_mask = pad_to_multiple(pos_mask, multiple=32)
    neg_mask = pad_to_multiple(neg_mask, multiple=32)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, config = get_model(ml_id=ml_id, models_dir=models_dir, device=device)
    prompts_config = config.get("prompts", {}) if isinstance(config, dict) else {}

    input_tensor = torch.zeros((1, 5, *volume_tensor.shape), dtype=torch.float32)
    input_tensor[0, 0] = volume_tensor
    input_tensor[0, 2] = pos_mask
    input_tensor[0, 3] = neg_mask

    prev_logits = cache_entry.previous_logits
    if prev_logits is not None:
        include_pred = prompts_config.get("include_previous_prediction", False)
        include_logits = prompts_config.get("include_previous_logits", False)
        if include_logits:
            input_tensor[0, 1] = pad_to_multiple(prev_logits, multiple=32)
        elif include_pred:
            input_tensor[0, 1] = pad_to_multiple(
                (torch.sigmoid(prev_logits) > 0.5).float(), multiple=32,
            )

    with torch.no_grad():
        output = model(input_tensor.to(device))
        logits = output.squeeze().cpu()

    d, h, w = shape_before_pad
    logits = logits[:d, :h, :w]
    cache_entry.previous_logits = logits

    mask_np = (logits.sigmoid() > 0.5).to(torch.uint8).numpy()
    nii = create_mask_nifti(mask_np, affine_ras, label_value=label_value)
    return nii, affine_ras
