"""Tornado handlers for serving FreeBrowse static files."""

import os
import re

from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.utils import url_path_join
from tornado.web import StaticFileHandler, authenticated


_CSP_ASCII_WS = " \t\n\r\f"
_CSP_ASCII_WS_RE = re.compile(r"[ \t\n\r\f]+")


def _allow_same_origin_framing(csp: str) -> str:
    """Relax ``frame-ancestors 'none'`` so JupyterLab can embed the viewer.

    JupyterHub's single-user server defaults ``Content-Security-Policy`` to
    ``frame-ancestors 'none'`` (unlike standalone ``jupyter_server``, which
    defaults to ``'self'``), blocking FreeBrowse's embedded document iframe.
    Follows CSP3's ASCII whitespace and first-directive-wins rules while
    preserving other directives (such as ``report-uri``) and any non-``'none'``
    framing policy verbatim.
    """
    changed = False
    policies = []
    for policy in csp.split(","):
        policy_changed = False
        seen_frame_ancestors = False
        directives = []
        for raw_directive in policy.split(";"):
            stripped = raw_directive.strip(_CSP_ASCII_WS)
            if not stripped:
                continue
            tokens = _CSP_ASCII_WS_RE.split(stripped)
            if (
                not seen_frame_ancestors
                and tokens[0].isascii()
                and tokens[0].lower() == "frame-ancestors"
            ):
                seen_frame_ancestors = True
                if len(tokens) == 2 and tokens[1].isascii() and tokens[1].lower() == "'none'":
                    directives.append("frame-ancestors 'self'")
                    policy_changed = True
                    continue
            directives.append(stripped)
        if policy_changed:
            changed = True
            policies.append("; ".join(directives))
        else:
            policies.append(policy.strip(_CSP_ASCII_WS))
    return ", ".join(policies) if changed else csp


def has_configured_csp(server_app) -> bool:
    """Return True if deployment config explicitly set ``Content-Security-Policy``.

    JupyterHub injects its default ``frame-ancestors 'none'`` directly into
    ``web_app.settings["headers"]`` (or ``tornado_settings`` in the legacy
    mixin) without writing to ``server_app.config``. Inspecting ``config``
    therefore distinguishes an administrator's deliberate policy from
    JupyterHub's default regardless of extension load order.
    """
    config = getattr(server_app, "config", None)
    if not isinstance(config, dict):
        return False
    for section in config.values():
        if not isinstance(section, dict):
            continue
        tornado_settings = section.get("tornado_settings")
        if hasattr(tornado_settings, "get_value"):
            tornado_settings = tornado_settings.get_value({})
        if not isinstance(tornado_settings, dict):
            continue
        headers = tornado_settings.get("headers")
        if isinstance(headers, dict) and any(
            isinstance(name, str) and name.lower() == "content-security-policy"
            for name in headers
        ):
            return True
    return False


class FreeBrowseStaticHandler(JupyterHandler, StaticFileHandler):
    """Serve viewer assets using Jupyter authentication and security headers."""

    @property
    def content_security_policy(self):
        csp = super().content_security_policy
        for name, value in self.settings.get("headers", {}).items():
            if isinstance(name, str) and name.lower() == "content-security-policy":
                csp = value
        if not self.settings.get("freebrowse_relax_default_csp", True):
            return csp
        return _allow_same_origin_framing(csp)

    def set_default_headers(self):
        super().set_default_headers()
        self.set_header("Content-Security-Policy", self.content_security_policy)

    def check_xsrf_cookie(self):
        # Browsers fetch module scripts, and stylesheets marked crossorigin, in
        # CORS mode even from the same origin, and they cannot attach an
        # X-XSRFToken header to them. JupyterHub's HubOAuth therefore ignores
        # the session cookie on these requests and redirects them to login.
        # Sec-Fetch-Site is set by the browser and cannot be forged by a page,
        # so only same-origin, read-only requests for this packaged static
        # directory skip the token; @authenticated still requires a login.
        if (self.request.method in {"GET", "HEAD"}
                and self.request.headers.get("Sec-Fetch-Site") == "same-origin"):
            return
        return super().check_xsrf_cookie()

    @authenticated
    async def get(self, path, include_body=True):
        await super().get(path, include_body)

    @authenticated
    async def head(self, path):
        await self.get(path, include_body=False)


HERE = os.path.dirname(__file__)
STATIC_DIR = os.path.join(HERE, "static", "freebrowse")


def setup_handlers(web_app, log=None, relax_default_csp=True):
    """Register the /freebrowse/ static file handler.

    The bundle under ``static/freebrowse`` is generated by ``npm run build:jupyter``
    in ``../frontend`` and is not committed, so a fresh checkout has nothing to
    serve until that build has run. Say so at startup instead of answering 404s.
    """
    if not os.path.isfile(os.path.join(STATIC_DIR, "index.html")):
        msg = (
            f"jupyterlab_freebrowse: no FreeBrowse bundle at {STATIC_DIR}; "
            "run `npm run build:jupyter` in the frontend/ directory, then "
            "reinstall (pip install -e .) or restart the server."
        )
        if log is not None:
            log.warning(msg)
        else:
            print(msg)
    web_app.settings["freebrowse_relax_default_csp"] = bool(relax_default_csp)
    base_url = web_app.settings.get("base_url", "/")
    route_pattern = re.escape(url_path_join(base_url, "freebrowse")) + r"/(.*)"

    web_app.add_handlers(
        r".*",
        [
            (
                route_pattern,
                FreeBrowseStaticHandler,
                {"path": STATIC_DIR, "default_filename": "index.html"},
            )
        ],
    )
