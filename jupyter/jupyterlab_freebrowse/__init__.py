"""JupyterLab extension for FreeBrowse neuroimaging viewer."""

from .handlers import setup_handlers


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "jupyterlab-freebrowse"}]


def _jupyter_server_extension_points():
    return [{"module": "jupyterlab_freebrowse"}]


def _load_jupyter_server_extension(server_app):
    """Register the FreeBrowse static file handler."""
    setup_handlers(server_app.web_app)
    server_app.log.info("jupyterlab_freebrowse server extension loaded.")
