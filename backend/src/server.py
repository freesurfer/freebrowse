import os
import json
import mimetypes

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

static_dir = os.getenv('NIIVUE_BUILD_DIR')
data_dir = os.getenv('DATA_DIR')
scene_schema_id = os.getenv('SCENE_SCHEMA_ID')
#data_dir = "../data"

print("NIIVUE_BUILD_DIR:", static_dir)
print("DATA_DIR", data_dir)

# Register the MIME type so that .gz files (or .nii.gz files) are served correctly.
mimetypes.add_type("application/gzip", ".nii.gz", strict=True)

app = FastAPI()

app.mount("/static", StaticFiles(directory=static_dir, html=True), name="static")
app.mount("/data", StaticFiles(directory=data_dir, html=False), name="data")

# New endpoint to list JSON scene files.
@app.get("/scenes")
def list_scenes():
    scenes_dir = os.path.join(data_dir)
    print(scenes_dir)
    try:
      files = os.listdir(scenes_dir)
      # Filter for files ending in .json
      json_files = [f for f in files if f.endswith(".json")]
      # Filter json files for scene files
      scene_files = []
      for f in json_files:
        try:
          with open(os.path.join(scenes_dir, f), 'r') as file:
            content = json.load(file)
            if content.get("schemaId") == scene_schema_id:
                scene_files.append(f)
        except json.JSONDecodeError:
          # Skip files that aren't valid JSON
          pass
      # convert to list of dicts
      scene_files_dict = [{"filename": f} for f in scene_files]
    except Exception as e:
        return {"error": str(e)}
    return scene_files_dict
