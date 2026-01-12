import os
import sys
import importlib
import json
import mimetypes
import logging
import tempfile
from dataclasses import dataclass, field
from typing import Union, List, Tuple, Any
import uuid
import base64
import gzip
import torch
import yaml
import numpy as np
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
import nibabel as nib
from pydantic import BaseModel

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

logger.info(f"NIIVUE_BUILD_DIR: {static_dir}")
logger.info(f"DATA_DIR: {data_dir}")
logger.info(f"SCENE_SCHEMA_ID: {scene_schema_id}")
logger.info(f"MODELS_DIR: {models_dir}")
logger.info(f"IMAGING_EXTENSIONS: {imaging_extensions}")
logger.info(f"SERVERLESS_MODE: {serverless_mode}")

# Register the MIME type so that .gz files (or .nii.gz files) are served correctly.
mimetypes.add_type("application/gzip", ".nii.gz", strict=True)

class SaveSceneRequest(BaseModel):
    filename: str
    data: dict

class SaveVolumeRequest(BaseModel):
    filename: str
    data: str  # base64 encoded NIfTI data

class ScribblePrompt3dInferenceRequest(BaseModel):
    """
    Request a ScribblePrompt3d model for inference

    Attributes
    ----------
    positive_clicks: str
        Flat indices in RAS order using Fortran layout (idx = x + y*nx + z*nx*ny).   
    negative_clicks: str
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


# Active sessions keyed by session_id
sessions: dict[str, SessionState] = {}

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
    spec = importlib.util.spec_from_file_location(module_path.stem, module_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_path.stem] = module
    spec.loader.exec_module(module)

    # Convention: The segmentation model in the .py must have class name SegModel
    model_class = getattr(module, "SegModel", None)
    if model_class is None:
        raise ValueError(f"No SegModel class found in {module_path}")

    return model_class


def load_model(module_path: Path, checkpoint_path: Path, device: torch.device) -> torch.nn.Module:
    """
    Load the segmentation model from the module file and `.pt` checkpoint
    """
    model = load_model_class(module_path=module_path)()
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)

    if isinstance(checkpoint, dict) and "model" in checkpoint:
        state_dict = checkpoint['model']
    else:
        state_dict = checkpoint

    model.load_state_dict(state_dict)
    return model.to(device).eval()


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
    return base64.b64encode(gzip.compress(nii.to_bytes())).decode("utf-8")


@app.post('/scribbleprompt3d_inference')
def run_scribbleprompt3d_inference(request: ScribblePrompt3dInferenceRequest):
    """
    Run 3d interactive segmentation with a trained ScribblePrompt3d model.

    Parameters
    ----------
    request: ScribblePrompt3dInferenceRequest
        - volume_data: raw voxels in file order (required on first call, optional after)
        - niivue_dims: dimensions in file order
        - affine: file-order affine from NIfTI header (required on first call)
        - clicks: flat indices in RAS order (from NiiVue's drawBitmap)
        - session_id: used to store preprocessed volume data for iterative prompting

    Notes
    -----
    On first call, volume_data and affine are required. The preprocessed volume is stored in RAM
    by session_id. On subsequent calls with the same session_id, volume_data can be omitted
    to reuse the stored volume data.
    """
    models_path = Path(models_dir)
    model_dir = models_path / request.model_name
    module_file = model_dir / 'model.py'
    checkpoint_file = model_dir / 'weights.pt'

    session = sessions.get(request.session_id)

    if request.volume_data is not None:
        if request.affine is None:
            raise HTTPException(status_code=400, detail='Inference requires affine with volume_data')

        # Decode raw float 32, file order voxel data from base64
        volume_bytes = base64.b64decode(request.volume_data)
        volume_array = np.frombuffer(volume_bytes, dtype=np.float32)

        # Use Fortran order b/c of Niivue's internal convention of `x + y*nx + z*nx*ny` indexing
        volume_file_order = volume_array.copy().reshape(tuple(request.niivue_dims), order='F')

        # 16 floats row-major -> 4x4 matrix
        file_affine = np.array(request.affine).reshape(4, 4)

        # Reorient volume to RAS with nib (matches NiiVue display and click indexing orientation)
        img_file_order = nib.Nifti1Image(volume_file_order, file_affine)
        img_ras = nib.as_closest_canonical(img_file_order)
        volume_ras = img_ras.get_fdata().astype(np.float32)
        affine_ras = img_ras.affine

        # Now volume_ras and clicks are both in RAS order
        ras_dims = volume_ras.shape
        volume_tensor = torch.from_numpy(volume_ras).float()

        # Preprocess the data for inference
        vmin, vmax = volume_tensor.min(), volume_tensor.max()
        volume_tensor = (volume_tensor - vmin) / (vmax - vmin)

        # Save shape before padding for later cropping
        shape_before_pad = volume_tensor.shape
        volume_tensor = pad_to_multiple(tensor=volume_tensor, multiple=16)

        # Store session state
        session = SessionState(
            volume_tensor=volume_tensor,
            affine_ras=affine_ras,
            ras_dims=ras_dims,
            shape_before_pad=shape_before_pad,
        )
        sessions[request.session_id] = session

    elif session is not None:
        # Use stored volume data
        volume_tensor = session.volume_tensor
        affine_ras = session.affine_ras
        ras_dims = session.ras_dims
        shape_before_pad = session.shape_before_pad

    else:
        raise HTTPException(
            status_code=400,
            detail='First inference request requires volume_data and affine'
        )

    # Accumulate clicks from this request
    session.positive_clicks.extend(request.positive_clicks)
    session.negative_clicks.extend(request.negative_clicks)

    # Use accumulated clicks for masks
    pos_mask = clicks_to_mask(clicks=session.positive_clicks, original_shape=ras_dims)
    pos_mask = pad_to_multiple(tensor=pos_mask, multiple=16)

    neg_mask = clicks_to_mask(clicks=session.negative_clicks, original_shape=ras_dims)
    neg_mask = pad_to_multiple(tensor=neg_mask, multiple=16)

    input_tensor = torch.zeros((1, 5, *volume_tensor.shape), dtype=torch.float32)
    input_tensor[0, 0] = volume_tensor
    input_tensor[0, 2] = pos_mask
    input_tensor[0, 3] = neg_mask

    # Load config to determine how to handle previous prediction
    config_file = model_dir / 'config.yml'
    config = load_model_config(config_file) if config_file.exists() else {}
    prompts_config = config.get('prompts', {})

    prev_pred = decode_previous_prediction(
        logits_b64=request.previous_logits,
        shape=volume_tensor.shape,
        include_previous_prediction=prompts_config.get('include_previous_prediction', False),
        include_previous_logits=prompts_config.get('include_previous_logits', False),
    )

    if prev_pred is not None:
        input_tensor[0, 1] = prev_pred

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = load_model(module_file, checkpoint_file, device)

    with torch.no_grad():
        output = model(input_tensor.to(device))
        logits = output.squeeze().cpu()

    logits = logits[:shape_before_pad[0], :shape_before_pad[1], :shape_before_pad[2]]

    mask = (logits.sigmoid() > 0.5).to(torch.uint8)
    mask = mask.cpu().numpy()

    return {
        "success": True,
        "mask_nifti": encode_nifti(create_mask_nifti(mask, affine_ras)),
        "logits": base64.b64encode(logits.numpy().astype(np.float32).tobytes()).decode("utf-8"),
        "logits_shape": list(volume_tensor.shape),
    }

# Only mount data directory if not in serverless mode
if not serverless_mode:
    app.mount("/data", StaticFiles(directory=data_dir, html=False), name="data")


# Mount frontend static files at root LAST (catch-all)
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
