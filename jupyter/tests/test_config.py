"""``c.FreeBrowse.open_in`` / ``c.FreeBrowse.file_access`` reach the Lab page config."""

import pytest
import tornado.web
from jupyter_server.serverapp import ServerApp
from traitlets import TraitError
from traitlets.config import Config

from jupyterlab_freebrowse import _load_jupyter_server_extension
from jupyterlab_freebrowse.config import FreeBrowse, SETTINGS, load_settings

ENV_VARS = [var for _, var in SETTINGS.values()]


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    """Tests start from an environment without FREEBROWSE_* variables."""
    for var in ENV_VARS:
        monkeypatch.delenv(var, raising=False)


def make_app(**freebrowse):
    """A ServerApp carrying ``{"FreeBrowse": freebrowse}`` config, not initialized.

    Only ``config``, ``web_app`` and ``log`` are needed by the extension loader,
    so skip ``initialize()`` (it would bind a port and read the real config
    directories).
    """
    app = ServerApp(config=Config({"FreeBrowse": freebrowse}))
    app.web_app = tornado.web.Application(base_url="/")
    return app


def page_config(app):
    _load_jupyter_server_extension(app)
    data = app.web_app.settings["page_config_data"]
    return data["freebrowseOpenIn"], data["freebrowseFileAccess"]


def test_defaults():
    assert page_config(make_app()) == ("document", "blob")


def test_config_file_values():
    assert page_config(make_app(open_in="browser", file_access="url")) == ("browser", "url")


def test_partial_config_keeps_other_default():
    assert page_config(make_app(file_access="url")) == ("document", "url")


def test_env_only(monkeypatch):
    monkeypatch.setenv("FREEBROWSE_OPEN_IN", "browser")
    monkeypatch.setenv("FREEBROWSE_FILE_ACCESS", "url")
    assert page_config(make_app()) == ("browser", "url")


def test_env_beats_config(monkeypatch):
    monkeypatch.setenv("FREEBROWSE_OPEN_IN", "document")
    monkeypatch.setenv("FREEBROWSE_FILE_ACCESS", "blob")
    assert page_config(make_app(open_in="browser", file_access="url")) == ("document", "blob")


def test_empty_env_leaves_config_alone(monkeypatch):
    monkeypatch.setenv("FREEBROWSE_OPEN_IN", "")
    monkeypatch.setenv("FREEBROWSE_FILE_ACCESS", "")
    assert page_config(make_app(open_in="browser", file_access="url")) == ("browser", "url")


@pytest.mark.parametrize("bad", [{"open_in": "tab"}, {"file_access": "cookie"}])
def test_invalid_config_value_fails_at_load(bad):
    with pytest.raises(TraitError):
        _load_jupyter_server_extension(make_app(**bad))


@pytest.mark.parametrize("var, value", [("FREEBROWSE_OPEN_IN", "tab"), ("FREEBROWSE_FILE_ACCESS", "cookie")])
def test_invalid_env_value_fails_at_load(monkeypatch, var, value):
    monkeypatch.setenv(var, value)
    with pytest.raises(TraitError):
        _load_jupyter_server_extension(make_app())


def test_existing_page_config_is_extended_not_replaced():
    app = make_app(open_in="browser")
    app.web_app.settings["page_config_data"] = {"other": 1}
    _load_jupyter_server_extension(app)
    assert app.web_app.settings["page_config_data"] == {
        "other": 1,
        "freebrowseOpenIn": "browser",
        "freebrowseFileAccess": "blob",
    }


def test_load_settings_accepts_explicit_environ():
    settings = load_settings(make_app(open_in="browser"), environ={"FREEBROWSE_FILE_ACCESS": "url"})
    assert isinstance(settings, FreeBrowse)
    assert settings.describe() == "open_in=browser, file_access=url"


def test_startup_log_names_both_settings(caplog):
    app = make_app(open_in="browser", file_access="url")
    app.log.propagate = True
    with caplog.at_level("INFO", logger=app.log.name):
        _load_jupyter_server_extension(app)
    assert "open_in=browser, file_access=url" in caplog.text
