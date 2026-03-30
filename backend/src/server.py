import os
import json
import base64
import mimetypes
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ml_inference import router as ml_inference_router
from qa import router as qa_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

static_dir = os.getenv('NIIVUE_BUILD_DIR')
data_dir = os.getenv('DATA_DIR')
scene_schema_id = os.getenv('SCENE_SCHEMA_ID')
models_dir = os.getenv('MODELS_DIR')
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

mimetypes.add_type("application/gzip", ".nii.gz", strict=True)


class SaveSceneRequest(BaseModel):
    filename: str
    data: dict


class SaveVolumeRequest(BaseModel):
    filename: str
    data: str  # base64 encoded NIfTI data


app = FastAPI()
app.include_router(ml_inference_router)
app.include_router(qa_router)


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
        raise HTTPException(
            status_code=404,
            detail="Endpoint not available in serverless mode",
        )
    imaging_dir = os.path.join(data_dir)
    logger.debug(
        f"Looking for imaging files {imaging_extensions} "
        f"recursively in {imaging_dir}"
    )
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


@app.post("/nvd")
def save_scene(request: SaveSceneRequest):
    """Save scene data to a file in the DATA_DIR directory."""
    if serverless_mode:
        raise HTTPException(
            status_code=404,
            detail="Endpoint not available in serverless mode",
        )
    try:
        if not request.filename:
            raise HTTPException(
                status_code=400, detail="Filename is required",
            )

        if not request.filename.endswith('.nvd'):
            filename = request.filename + '.nvd'
        else:
            filename = request.filename

        file_path = Path(data_dir) / filename
        file_path.parent.mkdir(parents=True, exist_ok=True)

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
        raise HTTPException(
            status_code=500, detail=f"Failed to save scene: {str(e)}",
        )


@app.post("/nii")
def save_volume(request: SaveVolumeRequest):
    """Save volume data to a file in the DATA_DIR directory."""
    if serverless_mode:
        raise HTTPException(
            status_code=404,
            detail="Endpoint not available in serverless mode",
        )
    try:
        if not request.filename:
            raise HTTPException(
                status_code=400, detail="Filename is required",
            )

        filename = request.filename
        if filename.startswith('data/'):
            filename = filename[5:]

        if not filename.endswith('.nii') and not filename.endswith('.nii.gz'):
            filename = filename + '.nii.gz'

        try:
            volume_data = base64.b64decode(request.data)
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid base64 data: {str(e)}",
            )

        file_path = Path(data_dir) / filename
        file_path.parent.mkdir(parents=True, exist_ok=True)

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
        raise HTTPException(
            status_code=500, detail=f"Failed to save volume: {str(e)}",
        )


if not serverless_mode:
    app.mount(
        "/data", StaticFiles(directory=data_dir, html=False), name="data",
    )


@app.get("/elucid-qa")
async def serve_elucid_qa():
    return FileResponse(os.path.join(static_dir, "index.html"))


@app.get("/mm5-qa")
async def serve_mm5_qa():
    return FileResponse(os.path.join(static_dir, "index.html"))


# Mount frontend static files at root LAST (catch-all)
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
