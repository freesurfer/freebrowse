"""Tornado handlers for serving FreeBrowse static files."""

import os
import re

from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.utils import url_path_join
from tornado.web import StaticFileHandler, authenticated


class FreeBrowseStaticHandler(JupyterHandler, StaticFileHandler):
    """Serve viewer assets using Jupyter authentication and security headers."""

    @authenticated
    async def get(self, path, include_body=True):
        await super().get(path, include_body)

    @authenticated
    async def head(self, path):
        await self.get(path, include_body=False)


HERE = os.path.dirname(__file__)
STATIC_DIR = os.path.join(HERE, "static", "freebrowse")


def setup_handlers(web_app):
    """Register the /freebrowse/ static file handler."""
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
