# FreeBrowse Docker Container

This directory contains the Docker configuration for running FreeBrowse as a monolith container with both frontend and backend.

## Building the Container

From the root of the FreeBrowse repository:

```bash
# Build the Docker image
docker build -f docker/Dockerfile -t freebrowse:latest .
```

## Running with Docker

### Option 1: Localhost Only (Recommended for Security)

This binds ports only to localhost on the host machine:

```bash
# Run in server mode (with backend data endpoints)
docker run -p 127.0.0.1:5173:5173 -p 127.0.0.1:8000:8000 \
  freebrowse:latest server localhostonly

# Run in serverless mode (no backend data endpoints)
docker run -p 127.0.0.1:5173:5173 -p 127.0.0.1:8000:8000 \
  freebrowse:latest serverless localhostonly
```

### Option 2: Network Accessible (Less Secure)

This allows direct network access without SSH tunnel:

```bash
# Run in server mode
docker run -p 5173:5173 -p 8000:8000 freebrowse:latest server

# Run in serverless mode
docker run -p 5173:5173 -p 8000:8000 freebrowse:latest serverless
```

Access directly at `http://<host-ip>:5173`

### With Data Volume

To persist data or provide existing data files:

```bash
# Mount a data directory
docker run -p 127.0.0.1:5173:5173 -p 127.0.0.1:8000:8000 \
  -v /path/to/your/data:/app/data \
  freebrowse:latest server localhostonly
```

## Command Line Arguments

The container accepts the following arguments:

- `server` (default): Run with full backend (data endpoints enabled)
- `serverless`: Run without backend data endpoints
- `localhostonly`: Bind frontend to localhost only (requires SSH tunnel for remote access)

**Examples:**
```bash
# Server mode, network accessible
docker run -p 5173:5173 -p 8000:8000 freebrowse:latest server

# Server mode, localhost only
docker run -p 127.0.0.1:5173:5173 -p 127.0.0.1:8000:8000 freebrowse:latest server localhostonly

# Serverless mode, network accessible
docker run -p 5173:5173 -p 8000:8000 freebrowse:latest serverless

# Serverless mode, localhost only
docker run -p 127.0.0.1:5173:5173 -p 127.0.0.1:8000:8000 freebrowse:latest serverless localhostonly
```

## Converting to Singularity

Singularity can directly convert Docker images:

```bash
# Pull from Docker and convert to Singularity
singularity build freebrowse.sif docker-daemon://freebrowse:latest

# Or if you push to Docker Hub:
singularity build freebrowse.sif docker://yourusername/freebrowse:latest
```

## Running with Singularity

Singularity uses the host's network by default, which simplifies SSH tunneling:

```bash
# Run in server mode with localhost only
singularity run freebrowse.sif server localhostonly

# Run in serverless mode with localhost only
singularity run freebrowse.sif serverless localhostonly

# With data directory
singularity run --bind /path/to/data:/app/data freebrowse.sif server localhostonly
```

## Environment Variables

You can override default environment variables:

```bash
docker run -p 127.0.0.1:5173:5173 -p 127.0.0.1:8000:8000 \
  -e DATA_DIR=/app/data \
  -e BACKEND_PORT=8000 \
  -e IMAGING_EXTENSIONS='["*.nii", "*.nii.gz", "*.mgz"]' \
  freebrowse:latest server localhostonly
```

Available variables:
- `DATA_DIR`: Directory for data files (default: `/app/data`)
- `BACKEND_HOST`: Backend bind address (default: `0.0.0.0`)
- `BACKEND_PORT`: Backend port (default: `8000`)
- `SCENE_SCHEMA_ID`: Schema ID (default: `freebrowse`)
- `IMAGING_EXTENSIONS`: File extensions to scan (default: `["*.nii", "*.nii.gz"]`)
- `SERVERLESS_MODE`: Set automatically based on command argument

## Ports

- **5173**: Vite frontend dev server
- **8000**: FastAPI backend server
