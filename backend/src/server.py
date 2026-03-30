import os
import sys
import importlib
import json
import csv
import random
import mimetypes
import logging
import tempfile
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Union, List, Tuple, Any
import uuid
import base64
import gzip
import torch
import yaml
import utils
import numpy as np
from pathlib import Path


from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import nibabel as nib
from pydantic import BaseModel
from thunderpack import ThunderReader

# Configure logging.  Possible logging levels are:
#   - logging.DEBUG
#   - logging.INFO
#   - logging.WARNING
#   - logging.ERROR
#   - logging.CRITICAL
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

static_dir = os.getenv('NIIVUE_BUILD_DIR')
data_dir = os.getenv('DATA_DIR')
scene_schema_id = os.getenv('SCENE_SCHEMA_ID')
models_dir = os.getenv('MODELS_DIR')  # Contains trained PyTorch models
imaging_extensions_str = os.getenv('IMAGING_EXTENSIONS', '["*.nii", "*.nii.gz"]')
imaging_extensions = json.loads(imaging_extensions_str)
serverless_mode = os.getenv('SERVERLESS_MODE', 'false').lower() == 'true'
master_json = os.getenv('MASTER_JSON')
megamedical_base_dir = os.getenv('MEGAMEDICAL_BASE_DIR')

logger.info(f"NIIVUE_BUILD_DIR: {static_dir}")
logger.info(f"DATA_DIR: {data_dir}")
logger.info(f"SCENE_SCHEMA_ID: {scene_schema_id}")
logger.info(f"MODELS_DIR: {models_dir}")
logger.info(f"IMAGING_EXTENSIONS: {imaging_extensions}")
logger.info(f"SERVERLESS_MODE: {serverless_mode}")
logger.info(f"MASTER_JSON: {master_json}")
logger.info(f"MEGAMEDICAL_BASE_DIR: {megamedical_base_dir}")

# Register the MIME type so that .gz files (or .nii.gz files) are served correctly.
mimetypes.add_type("application/gzip", ".nii.gz", strict=True)

class SaveSceneRequest(BaseModel):
    filename: str
    data: dict

class SaveVolumeRequest(BaseModel):
    filename: str
    data: str  # base64 encoded NIfTI data

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
    positive_clicks: List[int]
    negative_clicks: List[int]
    previous_logits: Union[str, None] = None
    niivue_dims: List[int]
    volume_data: Union[str, None] = None
    affine: Union[List[float], None] = None

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


app = FastAPI()


@dataclass
class SessionState:
    """State for an active segmentation session."""
    volume_tensor: torch.Tensor
    affine_ras: np.ndarray
    ras_dims: Tuple[int, int, int]
    shape_before_pad: Tuple[int, int, int]
    positive_clicks: list[int] = field(default_factory=list)
    negative_clicks: list[int] = field(default_factory=list)


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


# Active sessions keyed by session_id
sessions: dict[str, SessionState] = {}

# Cached models keyed by model_name -> (model, config)
_model_cache: dict[str, tuple[torch.nn.Module, dict]] = {}

_MM5_QC_CONFIG_FILE = Path(__file__).parent.parent.parent / "data" / "megamedical5-qc.yml"
_mm5_qc_config: dict = yaml.safe_load(_MM5_QC_CONFIG_FILE.read_text())
MM5_QA_DATASETS: list[str] = _mm5_qc_config["datasets"]
MIN_LABEL_DENSITY: float = _mm5_qc_config["min_label_density"]
blind_rating: bool = _mm5_qc_config["blind_rating"]
_MM5_QA_HIERARCHY: tuple[str, ...] = tuple(_mm5_qc_config["hierarchy"])
_mm5_qa_index: list[MM5QaTask] | None = None
_mm5_qa_index_lock = threading.Lock()
_session_locks: dict[str, threading.Lock] = {}
_session_locks_lock = threading.Lock()

# Define API routes BEFORE static file mounts to prevent catch-all behavior
@app.get("/nvd")
def list_niivue_documents():
    if serverless_mode:
        raise HTTPException(status_code=404, detail="Endpoint not available in serverless mode")
    nvd_dir = os.path.join(data_dir)
    logger.debug(f"Looking for niivue documents (.nvd) files recursivly in {nvd_dir}")
    nvd_files = []
    try:
      for filepath in Path(nvd_dir).rglob('*.nvd'):
        rel_filepath = str(filepath.relative_to(nvd_dir))
        nvd_file = {
            "filename": rel_filepath,
            "url": "data/" + rel_filepath
        }
        nvd_files.append(nvd_file)
    except Exception as e:
        return {"error": str(e)}
    return sorted(nvd_files, key=lambda x: x["url"])

@app.get("/imaging")
def list_imaging_files():
    if serverless_mode:
        raise HTTPException(status_code=404, detail="Endpoint not available in serverless mode")
    imaging_dir = os.path.join(data_dir)
    logger.debug(f"Looking for imaging files {imaging_extensions} recursively in {imaging_dir}")
    imaging_files = []
    try:
        for pattern in imaging_extensions:
            for filepath in Path(imaging_dir).rglob(pattern):
                rel_filepath = str(filepath.relative_to(imaging_dir))
                imaging_file = {
                    "filename": rel_filepath,
                    "url": "data/" + rel_filepath
                }
                imaging_files.append(imaging_file)
    except Exception as e:
        return {"error": str(e)}
    return sorted(imaging_files, key=lambda x: x["url"])

@app.get('/available_seg_models')
def list_models():
    """
    List available PyTorch models in `MODELS_DIR`.

    Each model is represented by a subdirectory containing:
        - model.py: Model class definition (must have `SegModel` class)
        - weights.pt: PyTorch state_dict checkpoint
        - config.yml: (optional) Model configuration

    Returns
    -------
    list[dict]
        List of model metadata dicts with keys: name, model_module_path, checkpoint_path,
        config_path (if exists), config (parsed yaml if exists).
    """
    models_path = Path(models_dir)
    models = []

    for model_dir in models_path.iterdir():
        if not model_dir.is_dir():
            continue

        model_file = model_dir / 'model.py'
        weights_file = model_dir / 'weights.pt'

        # Model must have both!
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



@app.post("/nvd")
def save_scene(request: SaveSceneRequest):
    """
    Save scene data to a file in the DATA_DIR directory.

    Args:
        request: Contains filename and scene data

    Returns:
        Success message or error
    """
    if serverless_mode:
        raise HTTPException(status_code=404, detail="Endpoint not available in serverless mode")
    try:
        # Validate filename
        if not request.filename:
            raise HTTPException(status_code=400, detail="Filename is required")
        
        # Ensure filename ends with .nvd
        if not request.filename.endswith('.nvd'):
            filename = request.filename + '.nvd'
        else:
            filename = request.filename
        
        # Create full file path
        file_path = Path(data_dir) / filename
        
        # Create directory if it doesn't exist
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write the JSON data to file
        with open(file_path, 'w') as f:
            json.dump(request.data, f, indent=2)
        
        logger.info(f"Scene saved successfully to {file_path}")
        
        return {
            "success": True,
            "message": f"Scene saved successfully to {filename}",
            "file_path": str(file_path.relative_to(data_dir))
        }
        
    except Exception as e:
        logger.error(f"Error saving scene: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save scene: {str(e)}")


@app.post("/nii")
def save_volume(request: SaveVolumeRequest):
    """
    Save volume data to a file in the DATA_DIR directory.

    Args:
        request: Contains filename and base64 encoded NIfTI data

    Returns:
        Success message or error
    """
    if serverless_mode:
        raise HTTPException(status_code=404, detail="Endpoint not available in serverless mode")
    try:
        # Validate filename
        if not request.filename:
            raise HTTPException(status_code=400, detail="Filename is required")
        
        # Remove 'data/' prefix if present (frontend URLs vs backend paths)
        filename = request.filename
        if filename.startswith('data/'):
            filename = filename[5:]  # Remove 'data/' prefix
        
        # Ensure filename has .nii or .nii.gz extension
        if not filename.endswith('.nii') and not filename.endswith('.nii.gz'):
            filename = filename + '.nii.gz'  # Default to compressed
        
        # Decode base64 data
        try:
            volume_data = base64.b64decode(request.data)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 data: {str(e)}")
        
        # Create full file path
        file_path = Path(data_dir) / filename
        
        # Create directory if it doesn't exist
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write the binary data to file
        with open(file_path, 'wb') as f:
            f.write(volume_data)
        
        logger.info(f"Volume saved successfully to {file_path}")
        
        return {
            "success": True,
            "message": f"Volume saved successfully to {filename}",
            "file_path": str(file_path.relative_to(data_dir))
        }
        
    except Exception as e:
        logger.error(f"Error saving volume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save volume: {str(e)}")


def pad_to_multiple(tensor: torch.Tensor, multiple: int = 16) -> torch.Tensor:
    """
    Pad 3D tensor so each dimension is divisible by `multiple`.
    """
    d, h, w = tensor.shape

    pd = (multiple - d % multiple) % multiple
    ph = (multiple - h % multiple) % multiple
    pw = (multiple - w % multiple) % multiple

    if pd == 0 and ph == 0 and pw == 0:
        return tensor

    return torch.nn.functional.pad(tensor, (0, pw, 0, ph, 0, pd))


def clicks_to_mask(clicks: list[int], original_shape: Tuple[int, int, int]) -> torch.Tensor:
    """
    Convert flat click indices from NiiVue's drawBitmap to 3D mask.

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
    - The annotations from drawBitmap are indexed using RAS-oriented coordinates.
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
    shape: Tuple[int, int, int],
    include_previous_prediction: bool,
    include_previous_logits: bool,
) -> torch.Tensor | None:
    """
    Decode previous logits and transform based on config flags.

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

    logits = torch.from_numpy(np.frombuffer(logits_bytes, dtype=np.float32).copy().reshape(shape))

    if include_previous_logits:
        return logits
    elif include_previous_prediction:
        return (torch.sigmoid(logits) > 0.5).float()


def load_model_config(config_path: Path) -> dict[str, Any]:
    """
    Load model configuration from a YAML file.

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
    """
    Load the model class definition from its python file.
    """
    spec = importlib.util.spec_from_file_location(
        module_path.stem,
        module_path
    )

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_path.stem] = module
    spec.loader.exec_module(module)

    # Convention: The segmentation model in the .py must have cls name SegModel
    model_class = getattr(module, "SegModel", None)
    if model_class is None:
        raise ValueError(f"No SegModel class found in {module_path}")

    return model_class


def load_model(
    module_path: Path,
    checkpoint_path: Path,
    device: torch.device
) -> torch.nn.Module:
    """
    Load the segmentation model from the module file and `.pt` checkpoint
    """
    model = load_model_class(module_path=module_path)()
    checkpoint = torch.load(
        checkpoint_path,
        map_location=device,
        weights_only=False
    )

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
    """
    Return cached model and config, loading from disk on first access.

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
    """
    Create NIfTI image from binary mask.
    """
    nii = nib.Nifti1Image(mask, affine)
    nii.header.set_slope_inter(1.0, 0.0)
    nii.header['cal_min'] = 0.0
    nii.header['cal_max'] = 1.0
    return nii


def encode_nifti(nii: nib.Nifti1Image) -> str:
    """
    Encode NIfTI as gzipped base64 string.
    """
    return base64.b64encode(gzip.compress(nii.to_bytes(), compresslevel=1)).decode("utf-8")


def get_elucid_qa_dir() -> Path:
    """Return the Elucid QA sessions directory, creating it if needed."""
    elucid_qa_dir = Path(data_dir) / "elucid_qa_sessions"
    elucid_qa_dir.mkdir(parents=True, exist_ok=True)
    return elucid_qa_dir


def make_elucid_qa_session_id(name: str, seed: int) -> str:
    """
    Deterministic session ID from name + seed. Same inputs = same session.
    """
    safe_name = name.strip().lower().replace(" ", "_")
    return f"elucid_qa_{safe_name}_{seed}"


def load_shuffled_paths(seed: int) -> list[str]:
    """
    Load master path list and shuffle deterministically with seed.
    """
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


def append_elucid_qa_rating_to_csv(session_id: str, nifti_path: str, rating: int) -> None:
    """Append a single rating row to the session CSV."""
    csv_path = get_elucid_qa_dir() / f"{session_id}_ratings.csv"
    file_exists = csv_path.exists()
    with open(csv_path, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["timestamp", "path", "rating"])
        writer.writerow([datetime.now(timezone.utc).isoformat(), nifti_path, rating])


def _decode_and_store_volume(
    session_id: str,
    volume_data: str,
    affine: list[float],
    niivue_dims: list[int],
) -> SessionState:
    """
    Decode base64 volume, reorient to RAS, normalize, pad, and cache.

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


def prepare_inference_input(
    request: InferenceRequest,
) -> Tuple[torch.Tensor, SessionState]:
    """
    Decode volume, manage session, and build the 5-channel input tensor.

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
                detail='Inference requires affine with volume_data'
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
            detail='No session found. Upload volume via POST /session first.'
        )

    session.positive_clicks = request.positive_clicks
    session.negative_clicks = request.negative_clicks

    pos_mask = clicks_to_mask(
        clicks=session.positive_clicks,
        original_shape=session.ras_dims
    )
    pos_mask = pad_to_multiple(tensor=pos_mask, multiple=16)

    neg_mask = clicks_to_mask(
        clicks=session.negative_clicks,
        original_shape=session.ras_dims
    )
    neg_mask = pad_to_multiple(tensor=neg_mask, multiple=16)

    input_tensor = torch.zeros((1, 5, *session.volume_tensor.shape), dtype=torch.float32)
    input_tensor[0, 0] = session.volume_tensor
    input_tensor[0, 2] = pos_mask
    input_tensor[0, 3] = neg_mask

    return input_tensor, session


@app.post('/session')
def upload_volume(request: UploadVolumeRequest):
    """
    Upload and preprocess a volume for later inference requests.

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


def _load_and_store_volume_from_path(
    session_id: str,
    volume_path: str,
) -> SessionState:
    """
    Load a server-resident NIfTI, reorient to RAS, normalize, pad, and cache.

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


@app.post('/session/from_path')
def load_volume_from_path(request: LoadVolumeFromPathRequest):
    """Load a server-resident volume into a session without uploading."""
    _load_and_store_volume_from_path(session_id=request.session_id, volume_path=request.volume_path)
    return {"session_id": request.session_id, "success": True}


@app.delete('/session/{session_id}')
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


@app.post('/scribbleprompt3d_inference')
def run_scribbleprompt3d_inference(request: InferenceRequest):
    """
    Run 3d interactive segmentation with a trained ScribblePrompt3d model.

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
            'include_previous_prediction',
            False
        ),
        include_previous_logits=prompts_config.get(
            'include_previous_logits',
            False
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
        "mask_nifti": encode_nifti(create_mask_nifti(mask, session.affine_ras)),
        "logits": base64.b64encode(logit_bytes).decode("utf-8"),
        "logits_shape": list(session.volume_tensor.shape),
    }


@app.post('/voxelprompt')
def voxelprompt(request: VoxelPromptRequest):
    """Run VoxelPrompt inference with text + clicks + volume."""
    input_tensor, session = prepare_inference_input(request)

    # TODO[Andrew]: Replace stuff below with VoxelPrompt model inference.
    print(f"VXP request: session_id={request.session_id}, text={request.text}")

    logits = torch.zeros(session.shape_before_pad, dtype=torch.float32)
    mask = (logits.sigmoid() > 0.5).to(torch.uint8).numpy()

    return {
        "success": True,
        "mask_nifti": encode_nifti(create_mask_nifti(mask, session.affine_ras)),
    }


@app.post("/elucid-qa/init")
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


@app.get("/elucid-qa/volume")
def elucid_qa_volume(session_id: str, index: int | None = None):
    """
    Return a volume as base64-encoded gzipped NIfTI.

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
            status_code=400,
            detail="Volume index out of range"
        )

    nifti_path = paths[vol_index]
    if not Path(nifti_path).exists():
        raise HTTPException(
            status_code=404,
            detail=f"NIfTI file not found: {nifti_path}"
        )

    raw_bytes = Path(nifti_path).read_bytes()
    return {
        "volume_nifti": base64.b64encode(raw_bytes).decode("utf-8"),
        "path": nifti_path,
        "current_index": vol_index,
        "total_volumes": session.total_volumes,
    }


@app.post("/elucid-qa/rate")
def elucid_qa_rate(request: ElucidQaSubmitRequest):
    """Record a rating for the current volume. Every click is recorded."""
    session = load_elucid_qa_session(request.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if request.rating < 1 or request.rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5"
        )

    paths = load_shuffled_paths(session.seed)
    if session.current_index >= len(paths):
        raise HTTPException(
            status_code=400,
            detail="No current volume to rate"
        )

    current_path = paths[session.current_index]
    append_elucid_qa_rating_to_csv(request.session_id, current_path, request.rating)
    logger.info(
        f"Rating recorded: session={request.session_id}, "
        f"path={current_path}, rating={request.rating}"
    )
    return {"success": True}


@app.post("/elucid-qa/next")
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


def build_mm5_qa_index() -> list[MM5QaTask]:
    """
    Scan MegaMedical LMDB databases and build a flat task index.

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
                    f"Unrecognized task_prefix: {task_prefix!r} in {info['db_dir']}"
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
                        and MIN_LABEL_DENSITY > 0):
                    densities = label_densities[
                        :len(labelled_df), label_idx]
                    mask = densities >= MIN_LABEL_DENSITY
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

        logger.info(f"MM5 QA index built: {len(entries)} task-label combinations")
        _mm5_qa_index = entries
        return entries


def sample_mm5_qa_item(
    index: list[MM5QaTask],
    rng: random.Random,
) -> tuple[MM5QaTask, str]:
    """Draw one (task, sample_key) using hierarchical sampling.

    Gives equal probability to each dataset regardless of size.
    Consumes exactly 7 RNG calls per invocation (6 hierarchy + 1 sample).
    """
    candidates = index
    for attr in _MM5_QA_HIERARCHY:
        unique_vals = sorted(set(getattr(t, attr) for t in candidates))
        val = rng.choice(unique_vals)
        candidates = [t for t in candidates if getattr(t, attr) == val]

    task = candidates[0]
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

    metadata = {
        "dataset": task.dataset,
        "modality": task.modality,
        "task": task.task_name,
        "sample": sample_key,
        "label_index": task.label_idx,
        "label_name": task.label_name,
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


@app.post("/mm5-qa/init")
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

    return {"session_id": session_id, "current_index": 0, "blinded": blind_rating}


@app.get("/mm5-qa/sample")
def mm5_qa_sample(session_id: str, index: int | None = None):
    """Return vol + seg as base64 gzipped NIfTI + metadata."""
    session = load_mm5_qa_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    mm5_qa_index = build_mm5_qa_index()
    if not mm5_qa_index:
        raise HTTPException(status_code=500, detail="No MM5 QA databases found")

    target_index = index if index is not None else session.current_index

    if target_index < 0:
        raise HTTPException(status_code=400, detail="index must be non-negative")

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


@app.post("/mm5-qa/rate")
def mm5_qa_rate(request: MM5QaRateRequest):
    """Record an MM5 QA rating for the current sample."""
    with _get_session_lock(request.session_id):
        session = load_mm5_qa_session(request.session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found")

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


@app.post("/mm5-qa/next")
def mm5_qa_next(request: MM5QaNextRequest):
    """Advance to next MM5 QA sample."""
    with _get_session_lock(request.session_id):
        session = load_mm5_qa_session(request.session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found")

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


# Only mount data directory if not in serverless mode
if not serverless_mode:
    app.mount("/data", StaticFiles(directory=data_dir, html=False), name="data")


# SPA fallback: serve index.html for client-side routes so React Router handles them
@app.get("/elucid-qa")
async def serve_elucid_qa():
    return FileResponse(os.path.join(static_dir, "index.html"))


@app.get("/mm5-qa")
async def serve_mm5_qa():
    return FileResponse(os.path.join(static_dir, "index.html"))


# Mount frontend static files at root LAST (catch-all)
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
