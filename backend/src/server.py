from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
static_dir = os.getenv('NIIVUE_BUILD_DIR')

app = FastAPI()

app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")