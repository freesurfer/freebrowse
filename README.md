# FreeBrowse v2

🚧 Work in progress 🚧

FreeBrowse is a full-stack, web-based neuroimaging viewer and editor.  It
aspires to be a web-based version of the
[FreeSurfer](surfer.nmr.mgh.harvard.edu) tool
[FreeView](surfer.nmr.mgh.harvard.edu/fswiki/FreeviewGuide).

**Frontend:**
- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) (build tool)
- [Tailwind CSS](https://tailwindcss.com) 4 + [Radix UI](https://www.radix-ui.com) components
- [NiiVue](https://github.com/niivue/niivue) (neuroimaging viewer)

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com) (Python web framework)
- [Pixi](https://pixi.sh) (package manager)

This is a re-write of the initial FreeBrowse implementation, based off of the
[niivue fullstack demo](https://github.com/niivue/fullstack-niivue-demo/).

Are you looking for the original FreeBrowse codebase?  That now lives on the
branch [`v1`](https://github.com/freesurfer/freebrowse/tree/v1).

## Install

### Pre-requisites

Requirements:
- [Node.js](https://nodejs.org) (for frontend environment)
- [npm](https://www.npmjs.com) (for frontend environment)
- [pixi](https://pixi.sh) (for backend environment)
- [git](https://git-scm.com/)

This should install all dependencies on an Ubuntu 24.04 system:

```
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm git -y
curl -fsSL https://pixi.sh/install.sh | sh
```

Then clone the repo:

```
git clone git@github.com:freesurfer/freebrowse.git
```

If you want to use the example data, run `get-example-volumes.sh` in the `data/` folder:

```bash
cd freebrowse/data
./get-example-volumes.sh
```

### Frontend Setup

```bash
cd frontend
npm install
```

### Backend Setup

```bash
cd backend
pixi install
```

## Build

To build a fully serverless frontend (no backend required at all), use the
`VITE_SERVERLESS` environment variable:

```bash
cd frontend
VITE_SERVERLESS=true npm run build
```

This creates a static build in `frontend/dist/` that can be deployed to GitHub
Pages or any static file host.

## Dev

### Run the backend in development mode

This hot reloads the backend when changes are made to the code.

```bash
cd backend
pixi run dev
```

### Run the frontend in development mode

```bash
cd frontend
npm run dev
```

or

```bash
cd frontend
VITE_SERVERLESS=true npm run dev
```

Then navigate to [http://localhost:5173/](http://localhost:5173/)

## Production

## Build the frontend for production

```bash
cd frontend
npm run build
```

## Acknowledgements

FreeBrowse was generously funded by
[Gates Ventures](https://en.wikipedia.org/wiki/Gates_Ventures).  The [original
implementation](https://github.com/freesurfer/freebrowse/tree/v1) was performed
by [zuehlke](https://www.zuehlke.com).

Version 2 is based off of the
[niivue fullstack demo](https://github.com/niivue/fullstack-niivue-demo/) which
was developed during a
[Google Summer of Code Project](https://summerofcode.withgoogle.com/programs/2025/projects/h9cDmi0E)
in close collaboration with the [niivue](https://niivue.com) team.
