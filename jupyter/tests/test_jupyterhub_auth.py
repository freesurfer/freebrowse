"""Exercise static assets with JupyterHub's real cookie/XSRF code and CSP headers."""

import logging
from pathlib import Path
import tempfile

from jupyter_server.auth import IdentityProvider, User
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.serverapp import ServerApp
from jupyterhub.services.auth import HubOAuth
from tornado.testing import AsyncHTTPTestCase
from tornado.web import Application, authenticated, create_signed_value
from traitlets.config import Config

from jupyterlab_freebrowse import _load_jupyter_server_extension, handlers


SECRET = "freebrowse-test-cookie-secret"
TOKEN = "test-session-token"
_XSRF_ATTRS = ("_xsrf_token_id", "xsrf_token", "check_xsrf_cookie")


def _snapshot_xsrf_attrs():
    return {name: JupyterHandler.__dict__.get(name) for name in _XSRF_ATTRS}


def _restore_xsrf_attrs(snapshot):
    for name, value in snapshot.items():
        if value is None:
            if name in JupyterHandler.__dict__:
                delattr(JupyterHandler, name)
        else:
            setattr(JupyterHandler, name, value)


class LocalHubOAuth(HubOAuth):
    async def user_for_token(self, token, **kwargs):
        # Only the Hub API lookup is replaced. Cookie verification and XSRF
        # decisions execute the installed JupyterHub implementation.
        return {"name": "alice"} if token == TOKEN else None


class HubIdentity(IdentityProvider):
    def __init__(self, base_url):
        super().__init__()
        self.hub = LocalHubOAuth(base_url=base_url, oauth_client_id="freebrowse-test", api_token="test-api-token")

    async def get_user(self, handler):
        self.hub._patch_xsrf(handler)
        user = await self.hub._get_user_cookie(handler)
        return User(username=user["name"]) if user else None


class SiblingJupyterHandler(JupyterHandler):
    """A normal Jupyter handler on the same single-user server (e.g. /lab)."""

    @authenticated
    def get(self):
        self.finish("lab")


class HubAssetTests(AsyncHTTPTestCase):
    base_url = "/user/alice/"
    csp_header = "frame-ancestors 'none'"

    def get_app(self):
        # HubOAuth._patch_xsrf mutates JupyterHandler with the current base_url;
        # restore it in tearDown so each test class runs with its own patch.
        self.original_xsrf = _snapshot_xsrf_attrs()
        self.files = tempfile.TemporaryDirectory()
        root = Path(self.files.name)
        (root / "index.html").write_text("<html>FreeBrowse viewer</html>")
        (root / "app.js").write_text("export const ready = true;")
        (root / "app.css").write_text("body { margin: 0; }")
        self.original_static_dir = handlers.STATIC_DIR
        handlers.STATIC_DIR = str(root)
        identity = HubIdentity(self.base_url)
        self.cookie = "freebrowse-test=" + create_signed_value(SECRET, "freebrowse-test", TOKEN).decode()
        settings = dict(
            cookie_secret=SECRET,
            xsrf_cookies=True,
            base_url=self.base_url,
            login_url=self.base_url + "login",
            identity_provider=identity,
            log=logging.getLogger("freebrowse-test"),
            allow_remote_access=True,
        )
        if self.csp_header is not None:
            settings["headers"] = {"Content-Security-Policy": self.csp_header}
        app = Application([(self.base_url + "lab", SiblingJupyterHandler)], **settings)
        handlers.setup_handlers(app)
        return app

    def tearDown(self):
        try:
            super().tearDown()
        finally:
            _restore_xsrf_attrs(self.original_xsrf)
            handlers.STATIC_DIR = self.original_static_dir
            self.files.cleanup()

    def headers(self, site="same-origin", mode="cors", cookie=True):
        result = {"Sec-Fetch-Site": site, "Sec-Fetch-Mode": mode}
        if cookie:
            result["Cookie"] = self.cookie
        return result

    def test_cookie_authenticated_modules_and_styles(self):
        for name in ("", "app.js", "app.css"):
            for method in ("GET", "HEAD"):
                with self.subTest(name=name, method=method):
                    response = self.fetch(self.base_url + "freebrowse/" + name,
                                          method=method, headers=self.headers(), follow_redirects=False)
                    assert response.code == 200, (response.code, response.body)
                    if method == "GET":
                        assert response.body

    def test_anonymous_and_invalid_cookie_are_rejected(self):
        for cookie in (None, "freebrowse-test=invalid"):
            for method in ("GET", "HEAD"):
                headers = self.headers(cookie=False)
                if cookie:
                    headers["Cookie"] = cookie
                response = self.fetch(self.base_url + "freebrowse/app.js", method=method,
                                      headers=headers, follow_redirects=False)
                assert response.code in (302, 403)

    def test_cross_site_and_missing_fetch_metadata_require_xsrf(self):
        for site in ("cross-site", "same-site", "none", ""):
            for method in ("GET", "HEAD"):
                response = self.fetch(self.base_url + "freebrowse/app.js", method=method,
                                      headers=self.headers(site=site), follow_redirects=False)
                assert response.code in (302, 403)

    def test_navigation_still_authenticates(self):
        response = self.fetch(self.base_url + "freebrowse/",
                              headers=self.headers(mode="navigate"), follow_redirects=False)
        assert response.code == 200

    def test_jupyterhub_csp_allows_same_origin_framing_only_on_freebrowse(self):
        viewer = self.fetch(self.base_url + "freebrowse/",
                            headers=self.headers(mode="navigate"), follow_redirects=False)
        assert viewer.code == 200
        assert viewer.headers["Content-Security-Policy"] == "frame-ancestors 'self'"

        head = self.fetch(self.base_url + "freebrowse/", method="HEAD",
                          headers=self.headers(mode="navigate"), follow_redirects=False)
        assert head.code == 200
        assert head.headers["Content-Security-Policy"] == "frame-ancestors 'self'"

        etag = viewer.headers.get("Etag")
        assert etag
        conditional = self.fetch(
            self.base_url + "freebrowse/",
            headers={**self.headers(mode="navigate"), "If-None-Match": etag},
            follow_redirects=False,
        )
        assert conditional.code == 304
        assert conditional.headers["Content-Security-Policy"] == "frame-ancestors 'self'"

        lab = self.fetch(self.base_url + "lab",
                         headers=self.headers(mode="navigate"), follow_redirects=False)
        assert lab.code == 200
        assert lab.headers["Content-Security-Policy"] == "frame-ancestors 'none'"

    def test_mutation_is_not_exempt_from_xsrf(self):
        response = self.fetch(self.base_url + "freebrowse/app.js", method="POST", body="",
                              headers=self.headers(), follow_redirects=False)
        assert response.code == 403

    def test_static_directory_cannot_escape(self):
        response = self.fetch(self.base_url + "freebrowse/%2e%2e/secret",
                              headers=self.headers(), follow_redirects=False)
        assert response.code in (403, 404)


class RootHubAssetTests(HubAssetTests):
    base_url = "/"


class DottedHubAssetTests(HubAssetTests):
    base_url = "/user/a.b/"


class HubCspPolicyVariantsTests(AsyncHTTPTestCase):
    base_url = "/user/alice/"

    def get_app(self):
        self.original_xsrf = _snapshot_xsrf_attrs()
        self.files = tempfile.TemporaryDirectory()
        root = Path(self.files.name)
        (root / "index.html").write_text("<html>FreeBrowse viewer</html>")
        self.original_static_dir = handlers.STATIC_DIR
        handlers.STATIC_DIR = str(root)
        identity = HubIdentity(self.base_url)
        self.cookie = "freebrowse-test=" + create_signed_value(SECRET, "freebrowse-test", TOKEN).decode()
        self.app_headers = {}
        app = Application(
            cookie_secret=SECRET,
            xsrf_cookies=True,
            base_url=self.base_url,
            login_url=self.base_url + "login",
            identity_provider=identity,
            log=logging.getLogger("freebrowse-test"),
            allow_remote_access=True,
            headers=self.app_headers,
        )
        handlers.setup_handlers(app)
        return app

    def tearDown(self):
        try:
            super().tearDown()
        finally:
            _restore_xsrf_attrs(self.original_xsrf)
            handlers.STATIC_DIR = self.original_static_dir
            self.files.cleanup()

    def fetch_csp(self, configured_headers, relax_default_csp=True):
        self.app_headers.clear()
        self._app.settings["freebrowse_relax_default_csp"] = relax_default_csp
        if isinstance(configured_headers, str):
            self.app_headers["Content-Security-Policy"] = configured_headers
        elif isinstance(configured_headers, dict):
            self.app_headers.update(configured_headers)
        response = self.fetch(
            self.base_url + "freebrowse/",
            headers={"Sec-Fetch-Site": "same-origin", "Sec-Fetch-Mode": "navigate", "Cookie": self.cookie},
            follow_redirects=False,
        )
        assert response.code == 200
        return response.headers["Content-Security-Policy"]

    def test_legacy_jupyterhub_csp_preserves_report_uri(self):
        csp = self.fetch_csp("frame-ancestors 'none';report-uri /hub/security/csp-report")
        assert csp == "frame-ancestors 'self'; report-uri /hub/security/csp-report"

    def test_case_insensitive_directive_and_other_directives_preserved(self):
        csp = self.fetch_csp("default-src 'self'; FRAME-ANCESTORS 'NONE'; report-uri /csp")
        assert csp == "default-src 'self'; frame-ancestors 'self'; report-uri /csp"

    def test_comma_separated_policies_relax_none_only(self):
        csp = self.fetch_csp("frame-ancestors 'none', default-src 'self'")
        assert csp == "frame-ancestors 'self', default-src 'self'"

    def test_custom_framing_policy_is_preserved(self):
        configured = "frame-ancestors 'self' https://portal.example.org; report-uri /csp"
        assert self.fetch_csp(configured) == configured

    def test_standalone_jupyter_default_is_preserved(self):
        csp = self.fetch_csp(None)
        assert csp == "frame-ancestors 'self'; report-uri /user/alice/api/security/csp-report"

    def test_non_ascii_whitespace_does_not_shadow_later_directive(self):
        configured = "frame-ancestors\u00a0'none'; frame-ancestors https://portal.example.org"
        assert self.fetch_csp(configured) == configured

    def test_duplicate_frame_ancestors_only_evaluates_first_effective_directive(self):
        configured = "frame-ancestors https://portal.example.org; frame-ancestors 'none'"
        assert self.fetch_csp(configured) == configured

    def test_mixed_case_header_keys_follow_relax_flag(self):
        both = {
            "Content-Security-Policy": "frame-ancestors 'none'",
            "content-security-policy": "frame-ancestors 'none'",
        }
        lower = {"content-security-policy": "frame-ancestors 'none'"}
        assert self.fetch_csp(both, relax_default_csp=True) == "frame-ancestors 'self'"
        assert self.fetch_csp(lower, relax_default_csp=True) == "frame-ancestors 'self'"
        assert self.fetch_csp(both, relax_default_csp=False) == "frame-ancestors 'none'"
        assert self.fetch_csp(lower, relax_default_csp=False) == "frame-ancestors 'none'"


def test_extension_loader_honors_explicit_admin_csp_config():
    def load_with(config):
        app = ServerApp(config=config)
        app.web_app = Application(base_url="/user/alice/")
        _load_jupyter_server_extension(app)
        return app.web_app.settings["freebrowse_relax_default_csp"]

    # Stock JupyterHub: no CSP in server_app.config, so Hub's default is relaxed.
    assert load_with(Config()) is True

    # Non-CSP tornado_settings headers do not disable relaxing Hub's default.
    non_csp = Config()
    non_csp.ServerApp.tornado_settings = {"headers": {"X-Custom": "1"}}
    assert load_with(non_csp) is True

    # Explicit ServerApp / NotebookApp CSP (assignment or LazyConfigValue update)
    # disables the override so an administrator's framing denial is honored.
    explicit_server = Config()
    explicit_server.ServerApp.tornado_settings = {
        "headers": {"Content-Security-Policy": "frame-ancestors 'none'"}
    }
    assert load_with(explicit_server) is False

    lazy_update = Config()
    lazy_update.ServerApp.tornado_settings.update(
        {"headers": {"content-security-policy": "frame-ancestors 'none'"}}
    )
    assert load_with(lazy_update) is False

    explicit_notebook = Config()
    explicit_notebook.NotebookApp.tornado_settings = {
        "headers": {"Content-Security-Policy": "frame-ancestors 'none'"}
    }
    assert load_with(explicit_notebook) is False
