import os
import sys
import importlib
import base64
import logging
from dataclasses import dataclass, field
from typing import Any
from pathlib import Path

import numpy as np
import nibabel as nib
import torch
import yaml
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import utils

logger = logging.getLogger(__name__)

data_dir = os.getenv('DATA_DIR')
models_dir = os.getenv('MODELS_DIR')

router = APIRouter()



class InferenceRequest(BaseModel):
    """
    Shared request fields for all inference endpoints.

    Attributes
    ----------
    positive_clicks
        Flat indices in RAS order using Fortran layout (idx = x + y*nx + z*nx*ny).
    negative_clicks
        Flat indices in RAS order using Fortran layout (idx = x + y*nx + z*nx*ny).
    volume_data
        Base64 encoded volume in voxel space.
    """
    session_id: str
    model_name: str
    positive_clicks: list[int]
    negative_clicks: list[int]
    previous_logits: str | None = None
    niivue_dims: list[int]
    volume_data: str | None = None
    affine: list[float] | None = None


class UploadVolumeRequest(BaseModel):
    session_id: str
    volume_data: str
    affine: list[float]
    niivue_dims: list[int]


class LoadVolumeFromPathRequest(BaseModel):
    session_id: str
    volume_path: str


class VoxelPromptRequest(InferenceRequest):
    text: str



@dataclass
class SessionState:
    """State for an active segmentation session."""
    volume_tensor: torch.Tensor
    affine_ras: np.ndarray
    ras_dims: tuple[int, int, int]
    shape_before_pad: tuple[int, int, int]
    positive_clicks: list[int] = field(default_factory=list)
    negative_clicks: list[int] = field(default_factory=list)


sessions: dict[str, SessionState] = {}
_model_cache: dict[str, tuple[torch.nn.Module, dict]] = {}



def pad_to_multiple(tensor: torch.Tensor, multiple: int = 16) -> torch.Tensor:
    """Pad 3d tensor so each dimension is divisible by `multiple`."""
    d, h, w = tensor.shape
    pd = (multiple - d % multiple) % multiple
    ph = (multiple - h % multiple) % multiple
    pw = (multiple - w % multiple) % multiple
    if pd == 0 and ph == 0 and pw == 0:
        return tensor
    return torch.nn.functional.pad(tensor, (0, pw, 0, ph, 0, pd))


def clicks_to_mask(clicks: list[int], original_shape: tuple[int, int, int]) -> torch.Tensor:
    """Convert flat click indices from NiiVue's drawBitmap to 3d mask.

    Parameters
    ----------
    clicks
        Flat indices in RAS order using Fortran layout (idx = x + y*nx + z*nx*ny).
    original_shape
        Volume shape in RAS order (nx_ras, ny_ras, nz_ras).

    Returns
    -------
    torch.Tensor
        Binary mask with shape matching original_shape.

    Notes
    -----
    The annotations from drawBitmap are indexed using RAS-oriented coordinates.
    """
    nx, ny, nz = original_shape
    mask = torch.zeros((nx, ny, nz), dtype=torch.float32)
    valid = [i for i in clicks if 0 <= i < nx * ny * nz]
    if valid:
        idx = torch.tensor(valid)
        z = idx // (nx * ny)
        y = (idx // nx) % ny
        x = idx % nx
        mask[x, y, z] = 1.0
    return mask


def decode_previous_prediction(
    logits_b64: str | None,
    shape: tuple[int, int, int],
    include_previous_prediction: bool,
    include_previous_logits: bool,
) -> torch.Tensor | None:
    """Decode previous logits and transform based on config flags.

    Parameters
    ----------
    logits_b64
        Base64-encoded raw logits from previous inference.
    shape
        Expected tensor shape.
    include_previous_prediction
        If True, return binary mask (sigmoid > 0.5).
    include_previous_logits
        If True, return raw logits.

    Returns
    -------
    torch.Tensor | None
        Transformed tensor for channel 1, or None if both flags are False.
    """
    if not logits_b64 or not (include_previous_prediction or include_previous_logits):
        return None

    logits_bytes = base64.b64decode(logits_b64)
    if len(logits_bytes) // 4 != np.prod(shape):
        return None

    logits = torch.from_numpy(
        np.frombuffer(logits_bytes, dtype=np.float32).copy().reshape(shape)
    )

    if include_previous_logits:
        return logits
    elif include_previous_prediction:
        return (torch.sigmoid(logits) > 0.5).float()


def load_model_config(config_path: Path) -> dict[str, Any]:
    """Load model configuration from a YAML file.

    Parameters
    ----------
    config_path
        Path to the config.yml file.

    Returns
    -------
    dict[str, Any]
        Parsed configuration dictionary.
    """
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


def load_model_class(module_path: Path):
    """Load the model class definition from its python file."""
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
    """Load the segmentation model from the module file and `.pt` checkpoint."""
    model = load_model_class(module_path=module_path)()
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)

    if isinstance(checkpoint, dict) and "model" in checkpoint:
        state_dict = checkpoint['model']
    else:
        state_dict = checkpoint

    model.load_state_dict(state_dict)
    return model.to(device).eval()


def get_model(
    model_name: str,
    device: torch.device,
) -> tuple[torch.nn.Module, dict]:
    """Return cached model and config, loading from disk on first access.

    Parameters
    ----------
    model_name
        Directory name under MODELS_DIR.
    device
        Target device for the model.

    Returns
    -------
    tuple[torch.nn.Module, dict]
        The model (on device, in eval mode) and its parsed config.
    """
    if model_name in _model_cache:
        return _model_cache[model_name]

    models_path = Path(models_dir)
    model_dir = models_path / model_name
    module_file = model_dir / 'model.py'
    checkpoint_file = model_dir / 'weights.pt'
    config_file = model_dir / 'config.yml'

    model = load_model(module_file, checkpoint_file, device)
    config = load_model_config(config_file) if config_file.exists() else {}

    _model_cache[model_name] = (model, config)
    logger.info(f"Cached model '{model_name}' on {device}")
    return model, config


def create_mask_nifti(mask: np.ndarray, affine: np.ndarray) -> nib.Nifti1Image:
    """Create NIfTI image from binary mask."""
    nii = nib.Nifti1Image(mask, affine)
    nii.header.set_slope_inter(1.0, 0.0)
    nii.header['cal_min'] = 0.0
    nii.header['cal_max'] = 1.0
    return nii


def _decode_and_store_volume(
    session_id: str,
    volume_data: str,
    affine: list[float],
    niivue_dims: list[int],
) -> SessionState:
    """Decode base64 volume, reorient to RAS, normalize, pad, and cache.

    Parameters
    ----------
    session_id
        Key for the session store.
    volume_data
        Base64-encoded float32 voxel data in file order.
    affine
        Flat 16-element row-major affine matrix.
    niivue_dims
        Volume dimensions [nx, ny, nz] in file order.

    Returns
    -------
    SessionState
        The newly created and cached session.
    """
    volume_bytes = base64.b64decode(volume_data)
    volume_array = np.frombuffer(volume_bytes, dtype=np.float32)
    volume_file_order = volume_array.copy().reshape(tuple(niivue_dims), order='F')

    file_affine = np.array(affine).reshape(4, 4)
    img_file_order = nib.Nifti1Image(volume_file_order, file_affine)
    img_ras = nib.as_closest_canonical(img_file_order)
    volume_ras = img_ras.get_fdata().astype(np.float32)
    affine_ras = img_ras.affine

    ras_dims = volume_ras.shape
    volume_tensor = torch.from_numpy(volume_ras).float()

    volume_tensor = utils.clip_volume(volume_tensor, "percentile", [0.5, 99.5])
    volume_tensor = utils.relative_norm(volume_tensor)

    shape_before_pad = volume_tensor.shape
    volume_tensor = pad_to_multiple(tensor=volume_tensor, multiple=16)

    session = SessionState(
        volume_tensor=volume_tensor,
        affine_ras=affine_ras,
        ras_dims=ras_dims,
        shape_before_pad=shape_before_pad,
    )
    sessions[session_id] = session
    return session


def _load_and_store_volume_from_path(
    session_id: str,
    volume_path: str,
) -> SessionState:
    """Load a server-resident NIfTI, reorient to RAS, normalize, pad, and cache.

    Parameters
    ----------
    session_id
        Key for the session store.
    volume_path
        Path relative to DATA_DIR.
    """
    full_path = (Path(data_dir) / volume_path).resolve()
    if not str(full_path).startswith(str(Path(data_dir).resolve())):
        raise HTTPException(status_code=400, detail="Invalid volume path")
    if not full_path.exists():
        raise HTTPException(status_code=404, detail=f"Volume not found: {volume_path}")

    img = nib.load(str(full_path))
    img_ras = nib.as_closest_canonical(img)
    volume_ras = img_ras.get_fdata().astype(np.float32)
    affine_ras = img_ras.affine

    ras_dims = volume_ras.shape
    volume_tensor = torch.from_numpy(volume_ras).float()

    volume_tensor = utils.clip_volume(volume_tensor, "percentile", [0.5, 99.5])
    volume_tensor = utils.relative_norm(volume_tensor)

    shape_before_pad = volume_tensor.shape
    volume_tensor = pad_to_multiple(tensor=volume_tensor, multiple=16)

    session = SessionState(
        volume_tensor=volume_tensor,
        affine_ras=affine_ras,
        ras_dims=ras_dims,
        shape_before_pad=shape_before_pad,
    )
    sessions[session_id] = session
    return session


def prepare_inference_input(
    request: InferenceRequest,
) -> tuple[torch.Tensor, SessionState]:
    """Decode volume, manage session, and build the 5-channel input tensor.

    Shared by all inference endpoints. Handles:
    - First-call volume decoding + RAS reorientation + session creation
    - Subsequent-call session reuse
    - Click replacement (frontend sends all clicks) and mask construction
    - Input tensor assembly (1, 5, D, H, W)

    Returns
    -------
    tuple[torch.Tensor, SessionState]
        The input tensor and the (new or existing) session.
    """
    session = sessions.get(request.session_id)

    if request.volume_data is not None:
        if request.affine is None:
            raise HTTPException(
                status_code=400,
                detail='Inference requires affine with volume_data',
            )
        session = _decode_and_store_volume(
            session_id=request.session_id,
            volume_data=request.volume_data,
            affine=request.affine,
            niivue_dims=request.niivue_dims,
        )
    elif session is None:
        raise HTTPException(
            status_code=400,
            detail='No session found. Upload volume via POST /session first.',
        )

    session.positive_clicks = request.positive_clicks
    session.negative_clicks = request.negative_clicks

    pos_mask = clicks_to_mask(clicks=session.positive_clicks, original_shape=session.ras_dims)
    pos_mask = pad_to_multiple(tensor=pos_mask, multiple=16)

    neg_mask = clicks_to_mask(clicks=session.negative_clicks, original_shape=session.ras_dims)
    neg_mask = pad_to_multiple(tensor=neg_mask, multiple=16)

    input_tensor = torch.zeros((1, 5, *session.volume_tensor.shape), dtype=torch.float32)
    input_tensor[0, 0] = session.volume_tensor
    input_tensor[0, 2] = pos_mask
    input_tensor[0, 3] = neg_mask

    return input_tensor, session



@router.get('/available_seg_models')
def list_models():
    """List available PyTorch models in `MODELS_DIR`.

    Each model is represented by a subdirectory containing:
        - model.py: Model class definition (must have `SegModel` class)
        - weights.pt: PyTorch state_dict checkpoint
        - config.yml: (optional) Model configuration

    Returns
    -------
    list[dict]
        List of model metadata dicts with keys: name, model_module_path,
        checkpoint_path, config_path (if exists), config (parsed yaml if exists).
    """
    models_path = Path(models_dir)
    models = []

    for model_dir in models_path.iterdir():
        if not model_dir.is_dir():
            continue

        model_file = model_dir / 'model.py'
        weights_file = model_dir / 'weights.pt'

        if not model_file.exists() or not weights_file.exists():
            continue

        model_info = {
            'name': model_dir.name,
            'model_module_path': str(model_file),
            'checkpoint_path': str(weights_file),
        }

        config_file = model_dir / 'config.yml'
        if config_file.exists():
            model_info['config_path'] = str(config_file)
            model_info['config'] = load_model_config(config_file)

        models.append(model_info)

    return sorted(models, key=lambda x: x['name'])


@router.post('/session')
def upload_volume(request: UploadVolumeRequest):
    """Upload and preprocess a volume for later inference requests.

    Decodes the base64 volume, reorients to RAS, normalizes, pads,
    and caches the result by session_id.
    """
    _decode_and_store_volume(
        session_id=request.session_id,
        volume_data=request.volume_data,
        affine=request.affine,
        niivue_dims=request.niivue_dims,
    )
    return {"session_id": request.session_id, "success": True}


@router.post('/session/from_path')
def load_volume_from_path(request: LoadVolumeFromPathRequest):
    """Load a server-resident volume into a session without uploading."""
    _load_and_store_volume_from_path(
        session_id=request.session_id, volume_path=request.volume_path,
    )
    return {"session_id": request.session_id, "success": True}


@router.delete('/session/{session_id}')
def delete_session(session_id: str):
    """Remove a session and free its memory.

    Each session holds a volume tensor (50-200MB) in RAM. Called by the
    frontend before creating a new session so the old volume data doesn't
    accumulate on the server.
    """
    removed = sessions.pop(session_id, None)
    if removed is None:
        raise HTTPException(status_code=404, detail="Session not found")
    logger.info(f"Deleted session '{session_id}'")
    return {"success": True}


@router.post('/scribbleprompt3d_inference')
def run_scribbleprompt3d_inference(request: InferenceRequest):
    """Run 3d interactive segmentation with a trained ScribblePrompt3d model.

    Notes
    -----
    On first call, volume_data and affine are required. The preprocessed
    volume is stored in RAM by session_id. Subsequent calls with the same
    session_id reuse the cached volume.
    """
    input_tensor, session = prepare_inference_input(request)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, config = get_model(request.model_name, device)
    prompts_config = config.get('prompts', {})

    prev_pred = decode_previous_prediction(
        logits_b64=request.previous_logits,
        shape=session.volume_tensor.shape,
        include_previous_prediction=prompts_config.get(
            'include_previous_prediction', False,
        ),
        include_previous_logits=prompts_config.get(
            'include_previous_logits', False,
        ),
    )

    if prev_pred is not None:
        input_tensor[0, 1] = prev_pred

    with torch.no_grad():
        output = model(input_tensor.to(device))
        logits = output.squeeze().cpu()

    d, h, w = session.shape_before_pad
    logits = logits[:d, :h, :w]

    mask = (logits.sigmoid() > 0.5).to(torch.uint8).cpu().numpy()
    logit_bytes = logits.numpy().astype(np.float32).tobytes()

    return {
        "success": True,
        "mask_nifti": utils.encode_nifti(create_mask_nifti(mask, session.affine_ras)),
        "logits": base64.b64encode(logit_bytes).decode("utf-8"),
        "logits_shape": list(session.volume_tensor.shape),
    }


@router.post('/voxelprompt')
def voxelprompt(request: VoxelPromptRequest):
    """Run VoxelPrompt inference with text + clicks + volume."""
    input_tensor, session = prepare_inference_input(request)

    # TODO[Andrew]: Replace stuff below with VoxelPrompt model inference.
    print(f"VXP request: session_id={request.session_id}, text={request.text}")

    logits = torch.zeros(session.shape_before_pad, dtype=torch.float32)
    mask = (logits.sigmoid() > 0.5).to(torch.uint8).numpy()

    return {
        "success": True,
        "mask_nifti": utils.encode_nifti(create_mask_nifti(mask, session.affine_ras)),
    }
