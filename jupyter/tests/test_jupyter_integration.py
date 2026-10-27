"""Exercise FreeBrowse documents and authenticated JupyterHub routes."""

import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time

import httpx
import pytest

ROOT = Path(__file__).resolve().parents[2]
TOKEN = "freebrowse-test-token"


def copy_integration(root):
    (root / "src").mkdir(parents=True)
    package = root / "jupyterlab_freebrowse"
    package.mkdir()
    shutil.copy(ROOT / "jupyter/src/index.ts", root / "src/index.ts")
    shutil.copy(ROOT / "jupyter/jupyterlab_freebrowse/handlers.py", package / "handlers.py")


HARNESS = Path(__file__).with_name("lab_extension_harness.js")

# (open_in, file_access) as the server publishes them ("" = unset), plus one
# Notebook 7 page, which is always document mode whatever open_in says.
MODES = [(open_in, file_access, "") for open_in in ["", "document", "browser"]
         for file_access in ["", "blob", "url"]] + [("browser", "url", "notebook")]


@pytest.mark.parametrize("open_in, file_access, page", MODES, ids=lambda v: v or "unset")
def test_lab_extension_opens_files_in_every_mode(tmp_path, open_in, file_access, page):
    """Run tests/lab_extension_harness.js against src/index.ts for one mode.

    Document mode: the PR 47 assertions (iframe, encoded paths, rename and
    disposal races, auth failures). Browser mode: synchronous window.open,
    hand-off, placeholder close, pop-up blocked, blob revoked on tab close.
    url mode: no download from the Lab page and no _xsrf in the viewer URL.
    All modes: the no-content model factory is registered and used.
    """
    copy_integration(tmp_path)
    environment = dict(os.environ, NODE_PATH=str(ROOT / "jupyter/node_modules"))
    result = subprocess.run(
        ["node", str(HARNESS), str(tmp_path / "src/index.ts"), open_in, file_access, page],
        env=environment, capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_frontend_preserves_filename_when_loading_a_blob(tmp_path):
    frontend = tmp_path / "frontend"
    loader = frontend / "src/hooks/use-file-loading.ts"
    loader.parent.mkdir(parents=True)
    shutil.copy(ROOT / "frontend/src/hooks/use-file-loading.ts", loader)
    script = r'''
const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(process.argv[1], 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018}
}).outputText;
(async () => {
  for (const filename of ['tof_sub004.nii', 'brain # & ü.nii.gz', undefined]) {
    const effects = [], volumes = [];
    const noop = () => {};
    const state = {showUploader: true, setShowUploader: noop, setCurrentImageIndex: noop,
      incrementVolumeVersion: noop, setCurrentSurfaceIndex: noop, setActiveTab: noop};
    const query = new URLSearchParams({vol: filename ? 'blob:https://hub.example/local-bytes' : 'https://example.org/legacy.nii'});
    if (filename) query.set('filename', filename);
    const modules = {
      react: {useCallback: f => f, useRef: value => ({current: value}), useEffect: f => effects.push(f)},
      '@/store': {useFreeBrowseStore: selector => selector(state)},
      '@/lib/deployment-config': {deploymentConfig: {serverless: true}, getFreeBrowseConfig: () => ({readUrlParams: true})},
      '@/hooks/use-volumes': {applyLabelColormapsAfterLoad: async () => {}},
      '@niivue/niivue': {}
    };
    const sandbox = {exports: {}, require: name => modules[name], console, URLSearchParams,
      window: {location: {search: '?' + query}, addEventListener: noop, removeEventListener: noop}};
    vm.runInNewContext(source, sandbox);
    sandbox.exports.useFileLoading({current: {canvas: {}, opts: {}, volumes: [], addVolume: async volume => volumes.push(volume), addEventListener: noop, removeEventListener: noop}}, noop, noop, noop, noop, noop);
    effects.forEach(effect => effect());
    for (let i=0; i<10; i++) await new Promise(resolve => setImmediate(resolve));
    assert.equal(volumes.length, 1);
    assert.equal(volumes[0].name, filename || 'legacy.nii');
    assert.equal(volumes[0].url, query.get('vol'));
  }
})().catch(error => {console.error(error); process.exitCode=1;});
'''
    environment = dict(os.environ, NODE_PATH=str(ROOT / "jupyter/node_modules"))
    result = subprocess.run(["node", "-e", script, str(loader)],
                            env=environment, capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + result.stderr


@pytest.fixture(scope="module", params=["/", "/user/alice/", "/user/a.b/"])
def viewer_http(request, tmp_path_factory):
    root = tmp_path_factory.mktemp("freebrowse-http")
    copy_integration(root)
    package = root / "jupyterlab_freebrowse"
    (package / "__init__.py").write_text(
        "from .handlers import setup_handlers\n"
        "def _jupyter_server_extension_points():\n"
        "    return [{'module': 'jupyterlab_freebrowse'}]\n"
        "def _load_jupyter_server_extension(app):\n"
        "    setup_handlers(app.web_app)\n"
    )
    assets = package / "static/freebrowse"
    assets.mkdir(parents=True)
    (assets / "index.html").write_text("<html>FreeBrowse test viewer</html>")
    (assets / "app.js").write_text("// FreeBrowse test asset")
    (root / "secret").write_text("private outside file")
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    settings = {
        "ip": "127.0.0.1", "port": port, "port_retries": 0,
        "open_browser": False, "allow_root": True,
        "root_dir": str(root), "base_url": request.param,
        "jpserver_extensions": {"jupyterlab_freebrowse": True},
    }
    script = (
        "import json, sys\n"
        "from jupyter_server.serverapp import ServerApp\n"
        "from traitlets.config import Config\n"
        "app = ServerApp(config=Config({'IdentityProvider': {'token': sys.argv[2]}}), **json.loads(sys.argv[1]))\n"
        "app.initialize([])\napp.start()\n"
    )
    environment = dict(os.environ, PYTHONPATH=str(root),
                       JUPYTER_CONFIG_DIR=str(root / "config"),
                       JUPYTER_RUNTIME_DIR=str(root / "runtime"))
    log_path = root / "server.log"
    with log_path.open("w") as log:
        process = subprocess.Popen(
            [sys.executable, "-c", script, json.dumps(settings), TOKEN],
            env=environment, stdout=log, stderr=subprocess.STDOUT,
            # From jupyter/ the real package would shadow the temp copy (cwd precedes PYTHONPATH).
            cwd=str(root),
        )
        try:
            with httpx.Client(base_url=f"http://127.0.0.1:{port}{request.param}", timeout=5, trust_env=False) as client:
                deadline = time.monotonic() + 30
                while time.monotonic() < deadline:
                    assert process.poll() is None, log_path.read_text()
                    try:
                        if client.get("api/status", headers={"Authorization": f"token {TOKEN}"}).status_code == 200:
                            break
                    except httpx.TransportError:
                        pass
                    time.sleep(0.1)
                else:
                    pytest.fail(log_path.read_text())
                yield client
        finally:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


@pytest.mark.parametrize("credential", [None, "wrong-token"])
@pytest.mark.parametrize("method", ["GET", "HEAD"])
@pytest.mark.parametrize("endpoint", ["freebrowse/", "freebrowse/app.js"])
def test_assets_require_jupyter_authentication(viewer_http, method, endpoint, credential):
    viewer_http.cookies.clear()
    headers = {"Authorization": f"token {credential}"} if credential else {}
    response = viewer_http.request(method, endpoint, headers=headers)
    assert response.status_code in {302, 403}
    response = viewer_http.request(method, endpoint, headers={"Authorization": f"token {TOKEN}"})
    assert response.status_code == 200
    if method == "GET":
        assert "FreeBrowse test" in response.text


def test_static_route_rejects_traversal(viewer_http):
    response = viewer_http.get("freebrowse/%2e%2e/%2e%2e/secret", headers={"Authorization": f"token {TOKEN}"})
    assert response.status_code in {403, 404}
    assert "private outside file" not in response.text

