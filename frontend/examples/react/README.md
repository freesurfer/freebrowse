# FreeBrowse in a React host

Uses the `freebrowse/react` entry (React is a peer dependency there, so the host
and FreeBrowse share one React). The host owns the NiiVue instance and drives it
with niivue's API; the FreeBrowse UI follows.

Installs `freebrowse@next` from npm (see `../vanilla/README.md` for testing an
unpublished build from a local tarball instead):

```bash
cd frontend/examples/react
npm install
npm run dev
```
