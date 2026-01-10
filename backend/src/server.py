import os
import sys
import importlib
import json
import mimetypes
import logging
import tempfile
from typing import Union, List, Tuple
import uuid
import base64
import gzip
import torch
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
    """
    session_id: str
    model_name: str
    positive_clicks: List[int]
    negative_clicks: List[int]
    previous_logits: Union[str, None] = None
    niivue_dims: List[int]
    volume_nifti: Union[str, None] = None

app = FastAPI()

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

@app.get('/models')
def list_models():
    """
    List available trained PyTorch models in `MODELS_DIR`

    A valid model consists of:
        1. A `.py` file containing the model class/definition
        2. A `.pt` file containing the `state_dict`

    Returns
    -------
    List[str]
        List of model names (without extensions) that have both `.py` and `.pt` files.
    """
    models_path = Path(models_dir)
    models = []

    # Find python files/model definitions that also have checkpoints
    for py_path in models_path.glob('*.py'):
        model_name = py_path.stem
        pt_path = models_path / f'{model_name}.pt'

        if pt_path.exists():
            models.append({
                'name': model_name,
                'model_module_path': str(py_path),
                'checkpoint_path': str(pt_path)
            })

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
    Convert flat indices from NiiVue's `drawBitmap` (uses fortran ordering) to 3D coordinates.

    Notes
    -----
    Convert Fortran-order flat indices (idx = x + y*nx + z*nx*ny) to 3D mask.
    """
    nx, ny, nz = original_shape
    mask = torch.zeros((nz, ny, nx), dtype=torch.float32)
    valid = [i for i in clicks if 0 <= i < nx * ny * nz]

    if valid:
        idx = torch.tensor(valid)
        z = idx // (nx * ny)
        y = (idx // nx) % ny
        x = idx % nx
        mask[z, y, x] = 1.0

    return mask


def decode_previous_mask(
    logits_b64: Union[str, None],
    shape: Tuple[int, int, int]
) -> Union[torch.Tensor, None]:
    """
    Decode base64 logits and apply sigmoid to get previous mask.
    """
    if not logits_b64:
        return None
    try:
        logits_bytes = base64.b64decode(logits_b64)
        if len(logits_bytes) // 4 != shape[0] * shape[1] * shape[2]:
            return None
        logits = torch.from_numpy(
            np.frombuffer(logits_bytes, dtype=np.float32).copy().reshape(shape)
        )
        return torch.sigmoid(logits)
    except Exception:
        return None


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

    return model.load_state_dict(state_dict).to(device).eval()


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

    Notes
    -----
    - `drawBitmap` indices are RAS (NiiVue's internal display orientation)
    - `saveToUint8Array` exports in original file orientation (e.g., LIA)
    """
    # Resolve model paths
    models_path = Path(models_dir)
    module_file = models_path / f"{request.model_name}.py"
    checkpoint_file = models_path / f"{request.model_name}.pt"

    if request.volume_nifti is None:
        raise HTTPException(status_code=400, detail='Inference requires volume')

    # Decode NIfTI bytes from request string and load with nibabel
    nifti_bytes = gzip.decompress(base64.b64decode(request.volume_nifti))
    nifti = nib.Nifti1Image.from_bytes(nifti_bytes)

    # Load and reorient to RAS (Niivue's representation)
    nifti_ras = nib.as_closest_canonical(nifti)
    affine = nifti_ras.affine.copy()
    header = nifti_ras.header.copy()

    volume_tensor = torch.from_numpy(nifti_ras.get_fdata()).float()
    original_shape = volume_tensor.shape
    volume_tensor = volume_tensor.permute(2, 1, 0)

    niivue_dims = tuple(request.niivue_dims)

    # Preprocess the data for inference
    vmin, vmax = volume_tensor.min(), volume_tensor.max()
    volume_tensor = (volume_tensor - vmin) / (vmax - vmin)

    volume_tensor = pad_to_multiple(tensor=volume_tensor, multiple=16)

    transposed_shape = tuple(reversed(original_shape))

    pos_mask = clicks_to_mask(clicks=request.positive_clicks, original_shape=transposed_shape)
    pos_mask = pad_to_multiple(tensor=pos_mask, multiple=16)

    neg_mask = clicks_to_mask(clicks=request.negative_clicks, original_shape=transposed_shape)
    neg_mask = pad_to_multiple(tensor=neg_mask, multiple=16)

    input_tensor = torch.zeros((1, 5, *volume_tensor.shape), dtype=torch.float32)
    input_tensor[0, 0] = volume_tensor
    input_tensor[0, 2] = pos_mask
    input_tensor[0, 3] = neg_mask

    prev_mask = decode_previous_mask(logits_b64=request.previous_logits, shape=volume_tensor.shape)
    if prev_mask is not None:
        input_tensor[0, 4] = prev_mask

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = load_model(module_file, checkpoint_file, device)

    with torch.no_grad():
        output = model(input_tensor.to(device))
        logits = output.squeeze().cpu()

    logits = logits[:transposed_shape[0], :transposed_shape[1], :transposed_shape[2]]
    mask = (logits.sigmoid() > 0.5)
    mask = mask.permute(2, 1, 0).cpu().numpy()

    return {
        "success": True,
        "mask_nifti": encode_nifti(create_mask_nifti(mask, affine)),
        "logits": base64.b64encode(logits.astype(np.float32).tobytes()).decode("utf-8"),
        "logits_shape": list(volume_tensor.shape),
    }

# Mount static directories AFTER all API routes
app.mount("/static", StaticFiles(directory=static_dir, html=True), name="static")

# Only mount data directory if not in serverless mode
if not serverless_mode:
    app.mount("/data", StaticFiles(directory=data_dir, html=False), name="data")
