# FreeBrowse v2

🚧 Work in progress 🚧

FreeBrowse is a full-stack, web-based neuroimaging viewer and editor.  It
aspires to be a web-based version of the
[FreeSurfer](surfer.nmr.mgh.harvard.edu) tool
[FreeView](surfer.nmr.mgh.harvard.edu/fswiki/FreeviewGuide).

Try out the 'serverless' version: [https://freesurfer.github.io/freebrowse/](https://freesurfer.github.io/freebrowse/)

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

The frontend has several build targets:

### Serverless (static deployment)

Builds a fully serverless frontend (no backend required) that can be deployed to
any static file host:

```bash
cd frontend
npm run build:serverless
```

This creates a static build in `frontend/dist/`. You can set `VITE_BASE_PATH` to
control the base URL path (defaults to `/`).

### GitHub Pages

Builds the serverless version configured for GitHub Pages deployment:

```bash
cd frontend
npm run build:github
```

Output is in `frontend/dist-github/`.

### JupyterLab

Builds the serverless version configured for embedding inside JupyterLab:

```bash
cd frontend
npm run build:jupyter
```

Output is in `frontend/dist-jupyter/`. See the [JupyterLab Integration](#jupyterlab-integration)
section for full setup instructions.

### Single HTML file

Builds a single standalone HTML file that can be distributed alongside output of
processing pipelines:

```bash
cd frontend
npm run build:singlefile
```

This creates a single standalone HTML file in `frontend/dist-singlefile/` that
is compatible with the `file://` protocol. Users can use this to view local
imaging data or self-contained NiiVue documents. The latest version of the
standalone HTML file is available at

`https://freesurfer.github.io/freebrowse/downloads/freebrowse-<version>.html`

Where `<version>` is the [current version of freebrowse](https://github.com/freesurfer/freebrowse/blob/main/frontend/package.json#L4)

### Full stack (with backend)

Builds the frontend for use with the FastAPI backend:

```bash
cd frontend
npm run build
```

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

### Github Pages

To enable GitHub Pages:

1. Go to your repo on GitHub: Settings --> Pages
2. Under "Build and deployment", set Source to "GitHub Actions"
3. Push changes to main

You should then be able to view the 'serverless' version of your changes at https://{github-username.github.io/freebrowse/

## Production

## Build the frontend for production

```bash
cd frontend
npm run build
```

## JupyterLab Integration

FreeBrowse can be used as a NIfTI file viewer inside JupyterLab. Clicking a
`.nii` or `.nii.gz` file in JupyterLab's file browser opens it in FreeBrowse in
a new browser tab.

### Setup

Create and activate a conda environment:

```bash
conda create -n freebrowse-jupyter python=3.11 jupyterlab nodejs -c conda-forge
conda activate freebrowse-jupyter
```

Build the FreeBrowse frontend for JupyterLab (this also copies the built files
into the extension's static directory):

```bash
cd frontend
npm install
npm run build:jupyter
```

Install the JupyterLab extension (from the `jupyter/` directory):

```bash
cd ../jupyter
jlpm install
jlpm build
pip install -e .
```

### Usage

Start JupyterLab:

```bash
jupyter lab
```

Navigate to a directory containing `.nii` or `.nii.gz` files, then either:
- **Double-click** a file to open it in FreeBrowse in a new browser tab
- **Right-click** a file and select **Open in FreeBrowse**

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
