# FreeBrowse embedded in a plain (vanilla JS) page

The host page owns a NiiVue instance, mounts FreeBrowse around it with
`mountFreeBrowse`, and drives the instance directly with niivue's API; the
FreeBrowse UI follows. The page also has its own styles, canvas and footer so
that any style leaking out of FreeBrowse would be visible.

The example installs `freebrowse@next` from npm — exactly what a collaborator
gets — plus `@niivue/niivue` as the peer dependency:

```bash
cd frontend/examples/vanilla
npm install
npm run dev                  # http://localhost:5173/
```

Append `?nomount` to the URL to see the host page without FreeBrowse (used by the
CSS-bleed check).

To test an **unpublished** build of the package instead, pack it and point the
example at the tarball (don't commit the resulting `package.json` change):

```bash
cd frontend && npm run examples:pack        # -> examples/freebrowse.tgz
cd examples/vanilla && npm install ../freebrowse.tgz && npm run dev
```
