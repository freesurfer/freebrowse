"""Make ``jupyterlab_freebrowse`` importable from the checkout, installed or not."""

import sys
from pathlib import Path

JUPYTER_DIR = str(Path(__file__).resolve().parents[1])
if JUPYTER_DIR not in sys.path:
    sys.path.insert(0, JUPYTER_DIR)
