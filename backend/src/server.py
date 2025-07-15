import os
import json
import mimetypes
import logging
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
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

logger.info(f"NIIVUE_BUILD_DIR: {static_dir}")
logger.info(f"DATA_DIR: {data_dir}")
logger.info(f"SCENE_SCHEMA_ID: {scene_schema_id}")

# Register the MIME type so that .gz files (or .nii.gz files) are served correctly.
mimetypes.add_type("application/gzip", ".nii.gz", strict=True)

class SaveSceneRequest(BaseModel):
    filename: str
    data: dict

app = FastAPI()

app.mount("/static", StaticFiles(directory=static_dir, html=True), name="static")
app.mount("/data", StaticFiles(directory=data_dir, html=False), name="data")

# Endpoint to get scene file for processing result.  Files must:
#  - end with `.nvd`
@app.get("/scene")
def list_scenes():
    scenes_dir = os.path.join(data_dir)
    logger.debug(f"Looking for scene .json files recursivly in {scenes_dir}")
    # scene_files = []
    document = {
      "title": str(uuid.uuid4()),
      "imageOptionsArray": [],
    }
    try:
      url = 'https://niivue.github.io/niivue-demo-images/pcasl.nii.gz'
      filename = url.split('/')[-1]
      print(f"Checking url {url}, filename {filename}")
      image = {
        "url": url,
        "name": filename,
        "colormap": "gray",
        "opacity": 1.0,
      }

      document["imageOptionsArray"].append(image)
    except Exception as e:
        return {"error": str(e)}
    print("document", document)
    return document

@app.get("/nvd")
def list_niivue_documents():
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
    return nvd_files

@app.post("/nvd")
def save_scene(request: SaveSceneRequest):
    """
    Save scene data to a file in the DATA_DIR directory.
    
    Args:
        request: Contains filename and scene data
    
    Returns:
        Success message or error
    """
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
