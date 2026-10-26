# Examples

Two host applications that embed FreeBrowse from the built npm package:

- [`vanilla/`](vanilla/) — plain JavaScript + Vite, `mountFreeBrowse` (React bundled). The
  shape of a Neurodesk web app. Doubles as the CSS-bleed check: the host page has its own
  styles, canvas and footer.
- [`react/`](react/) — React 19 + Vite, the `freebrowse/react` component.

Both install `freebrowse@next` from npm, exactly as a consumer would. To try an
unpublished build, `npm run examples:pack` in `frontend/` produces `examples/freebrowse.tgz`
and `npm install ../freebrowse.tgz` inside an example points it at that tarball (see the
vanilla README).
