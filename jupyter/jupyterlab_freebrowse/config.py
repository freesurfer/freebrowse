"""Deployment settings for the FreeBrowse JupyterLab extension.

Both settings are read once, when the server extension loads, and pushed into
every JupyterLab page through Jupyter's ``page_config_data`` so the lab
extension can read them with ``PageConfig.getOption``.  They are server-side,
sysadmin-level configuration: a config file (``jupyter_server_config.py`` or
``jupyter_server_config.json`` in one of the directories ``jupyter --paths``
lists) or an environment variable, never a per-user JupyterLab setting.

Precedence: environment variable > config file > built-in default.  The
environment variables are applied *after* the config files so a Hub operator
can set them in ``c.Spawner.environment`` and users cannot undo them from
``~/.jupyter``.
"""

import os

from traitlets import Enum
from traitlets.config import Configurable

# trait name -> (page_config key, environment variable)
SETTINGS = {
    "open_in": ("freebrowseOpenIn", "FREEBROWSE_OPEN_IN"),
    "file_access": ("freebrowseFileAccess", "FREEBROWSE_FILE_ACCESS"),
}


class FreeBrowse(Configurable):
    """``c.FreeBrowse.*`` in ``jupyter_server_config.py``."""

    open_in = Enum(
        ["document", "browser"],
        default_value="document",
        config=True,
        help=(
            "Where a .nii/.nii.gz/.nvd opens from the file browser: 'document' "
            "(a FreeBrowse tab inside JupyterLab, default) or 'browser' (a new "
            "browser tab). Notebook 7 always uses 'document'. Set "
            "c.FreeBrowse.open_in in jupyter_server_config.py (or a "
            "{\"FreeBrowse\": {\"open_in\": ...}} block in "
            "jupyter_server_config.json), or override every config file with the "
            "FREEBROWSE_OPEN_IN environment variable. Any other value stops the "
            "server extension from loading."
        ),
    )

    file_access = Enum(
        ["blob", "url"],
        default_value="blob",
        config=True,
        help=(
            "How the viewer gets the file: 'blob' (JupyterLab downloads it through "
            "its authenticated connection and hands the viewer an in-memory copy, "
            "default) or 'url' (the viewer fetches it from Jupyter's /files/ "
            "endpoint itself, which needs the browser to carry the Jupyter cookie "
            "into the viewer tab or iframe). Set c.FreeBrowse.file_access in "
            "jupyter_server_config.py (or a {\"FreeBrowse\": {\"file_access\": "
            "...}} block in jupyter_server_config.json), or override every config "
            "file with the FREEBROWSE_FILE_ACCESS environment variable. Any other "
            "value stops the server extension from loading."
        ),
    )

    def apply_env_overrides(self, environ=None):
        """Let ``FREEBROWSE_*`` environment variables beat the config files.

        An unset or empty variable leaves the configured value alone.  An
        invalid value raises ``TraitError`` just like an invalid config value.
        """
        environ = os.environ if environ is None else environ
        for trait, (_, var) in SETTINGS.items():
            value = environ.get(var)
            if value:
                setattr(self, trait, value)
        return self

    def describe(self):
        """``open_in=document, file_access=blob`` for the startup log line."""
        return ", ".join(f"{trait}={getattr(self, trait)}" for trait in SETTINGS)


def load_settings(server_app, environ=None):
    """Build the settings from ``server_app.config``, then apply env overrides."""
    return FreeBrowse(parent=server_app).apply_env_overrides(environ)


def publish_page_config(web_app, settings):
    """Expose the settings to the lab extension via ``page_config_data``.

    jupyterlab_server merges ``web_app.settings["page_config_data"]`` into the
    ``jupyter-config-data`` block of every Lab page (and Notebook 7 does the
    same), so the lab extension reads them with ``PageConfig.getOption``.
    """
    data = web_app.settings.setdefault("page_config_data", {})
    for trait, (key, _) in SETTINGS.items():
        data[key] = getattr(settings, trait)
    return data
