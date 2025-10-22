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

**Mode Arguments:**
- `server` (default): Run with full backend (data endpoints enabled)
- `serverless`: Run without backend data endpoints
- `localhostonly`: Bind frontend to localhost only (requires SSH tunnel for remote access)

**Port Arguments:**
- `--frontend-port PORT` or `--port PORT`: Override the frontend port (default: 5173)
- `--backend-port PORT`: Override the backend port (default: 8000)

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

# Custom frontend port
docker run -p 127.0.0.1:5174:5174 -p 127.0.0.1:8000:8000 \
  freebrowse:latest server localhostonly --frontend-port 5174

# Custom frontend and backend ports
docker run -p 127.0.0.1:8080:8080 -p 127.0.0.1:8001:8001 \
  freebrowse:latest server --frontend-port 8080 --backend-port 8001
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

# Custom frontend port (useful when default port is in use)
singularity run freebrowse.sif server localhostonly --frontend-port 5174

# Custom frontend and backend ports
singularity run freebrowse.sif server --frontend-port 8080 --backend-port 8001
```

## Environment Variables

You can override default environment variables:

```bash
docker run -p 127.0.0.1:5173:5173 -p 127.0.0.1:8000:8000 \
  -e DATA_DIR=/app/data \
  -e FRONTEND_PORT=5173 \
  -e BACKEND_PORT=8000 \
  -e IMAGING_EXTENSIONS='["*.nii", "*.nii.gz", "*.mgz"]' \
  freebrowse:latest server localhostonly
```

Available variables:
- `DATA_DIR`: Directory for data files (default: `/app/data`)
- `BACKEND_HOST`: Backend bind address (default: `0.0.0.0`)
- `BACKEND_PORT`: Backend port (default: `8000`) - can also be set via `--backend-port` argument
- `FRONTEND_PORT`: Frontend port (default: `5173`) - can also be set via `--frontend-port` argument
- `SCENE_SCHEMA_ID`: Schema ID (default: `freebrowse`)
- `IMAGING_EXTENSIONS`: File extensions to scan (default: `["*.nii", "*.nii.gz"]`)
- `SERVERLESS_MODE`: Set automatically based on command argument

**Note:** Command-line arguments take precedence over environment variables for port configuration.

## Ports

Default ports (can be overridden via command-line arguments or environment variables):
- **5173**: Vite frontend dev server
- **8000**: FastAPI backend server
