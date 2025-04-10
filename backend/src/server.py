import os
import json
import mimetypes
import logging

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

# Configure logging
logging.basicConfig(level=logging.DEBUG, 
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

app = FastAPI()

app.mount("/static", StaticFiles(directory=static_dir, html=True), name="static")
app.mount("/data", StaticFiles(directory=data_dir, html=False), name="data")

# Endpoint to list scene files.  Files must:
#  - end with `.json`
#  - Have a top-level entry "schemaId" set to `scene_schema_id`
@app.get("/scenes")
def list_scenes():
    scenes_dir = os.path.join(data_dir)
    logger.debug(f"Looking for scene .json files recursivly in {scenes_dir}")
    scene_files = []
    try:
      for filepath in Path(scenes_dir).rglob('*.json'):
        try:
          with open(filepath, 'r') as file:
            content = json.load(file)
            if content.get("schemaId") == scene_schema_id:
              rel_filepath = str(filepath.relative_to(scenes_dir))
              scene_file = {
                "filename": rel_filepath,
                "url": "data/" + rel_filepath
              }
              scene_files.append(scene_file)
        except json.JSONDecodeError:
          # Skip files that aren't valid JSON or don't have the proper schemaId
          pass
    except Exception as e:
        return {"error": str(e)}
    return scene_files
