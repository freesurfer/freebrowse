"""JupyterLab extension for FreeBrowse neuroimaging viewer."""

from .config import FreeBrowse, load_settings, publish_page_config
from .handlers import setup_handlers

__all__ = ["FreeBrowse", "load_settings", "publish_page_config", "setup_handlers"]


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "jupyterlab-freebrowse"}]


def _jupyter_server_extension_points():
    return [{"module": "jupyterlab_freebrowse"}]


def _load_jupyter_server_extension(server_app):
    """Publish the deployment settings and register the static file handler."""
    settings = load_settings(server_app)
    publish_page_config(server_app.web_app, settings)
    setup_handlers(server_app.web_app, server_app.log)
    server_app.log.info(
        "jupyterlab_freebrowse server extension loaded (%s).", settings.describe()
    )
