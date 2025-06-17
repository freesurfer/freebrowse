import os
import json
import mimetypes
import logging
import uuid
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

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