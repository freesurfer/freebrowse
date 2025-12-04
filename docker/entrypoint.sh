#!/bin/bash
set -e

# Function to handle shutdown gracefully
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# For Singularity: Create writable directories in /tmp for Vite and Node
# Singularity mounts the container image as read-only
if [ -n "$SINGULARITY_NAME" ]; then
    echo "Detected Singularity environment, setting up writable directories..."

    # Create a writable temp directory for this session
    TMPDIR_SESSION="/tmp/freebrowse-$$"
    mkdir -p "$TMPDIR_SESSION"
    export TMPDIR="$TMPDIR_SESSION"
    export TEMP="$TMPDIR_SESSION"
    export TMP="$TMPDIR_SESSION"

    # Set cache directories
    export VITE_CACHE_DIR="$TMPDIR_SESSION/vite-cache"
    mkdir -p "$VITE_CACHE_DIR"
    export XDG_CACHE_HOME="$TMPDIR_SESSION/cache"
    mkdir -p "$XDG_CACHE_HOME"

    # Node.js and npm cache
    export npm_config_cache="$TMPDIR_SESSION/npm-cache"
    mkdir -p "$npm_config_cache"

    # Copy frontend to writable location since Vite needs to write temp files
    echo "Copying frontend to writable location..."
    WRITABLE_FRONTEND="$TMPDIR_SESSION/frontend"
    cp -r /app/frontend "$WRITABLE_FRONTEND"

    # Override the frontend working directory
    FRONTEND_DIR="$WRITABLE_FRONTEND"

    echo "Using temporary directory: $TMPDIR_SESSION"
else
    # Docker has writable filesystem
    FRONTEND_DIR="/app/frontend"
fi

# Parse arguments for network settings and port configuration
FRONTEND_NETWORK_MODE="network"  # default: --host 0.0.0.0
# FRONTEND_PORT defaults to env var if not set via argument

while [[ $# -gt 0 ]]; do
    case $1 in
        localhostonly)
            FRONTEND_NETWORK_MODE="localhost"
            shift
            ;;
        --frontend-port|--port)
            if [ -n "$2" ] && [ "${2:0:1}" != "-" ]; then
                FRONTEND_PORT=$2
                shift 2
            else
                echo "ERROR: --frontend-port requires a port number"
                exit 1
            fi
            ;;
        --backend-port)
            if [ -n "$2" ] && [ "${2:0:1}" != "-" ]; then
                BACKEND_PORT=$2
                shift 2
            else
                echo "ERROR: --backend-port requires a port number"
                exit 1
            fi
            ;;
        *)
            echo "Unknown argument: $1"
            echo "Usage: entrypoint.sh [localhostonly] [--frontend-port PORT] [--backend-port PORT]"
            exit 1
            ;;
    esac
done

# Determine mode from build-time VITE_SERVERLESS setting
if [ "$VITE_SERVERLESS" = "true" ]; then
    MODE="serverless"
    echo "Starting FreeBrowse in SERVERLESS mode (built without backend support)..."
else
    MODE="server"
    echo "Starting FreeBrowse in SERVER mode..."
fi

# Check if backend port is already in use
if command -v ss >/dev/null 2>&1; then
    if ss -ltn | grep -q ":${BACKEND_PORT} "; then
        echo "ERROR: Port ${BACKEND_PORT} is already in use!"
        echo "Please stop the other service or set a different port with:"
        echo "  export BACKEND_PORT=8001"
        echo "  singularity run ... (or docker run -e BACKEND_PORT=8001 ...)"
        exit 1
    fi
fi

# Check if frontend port is already in use
if command -v ss >/dev/null 2>&1; then
    if ss -ltn | grep -q ":${FRONTEND_PORT} "; then
        echo "ERROR: Port ${FRONTEND_PORT} is already in use!"
        echo "Please stop the other service or set a different port with:"
        echo "  export FRONTEND_PORT=5174"
        echo "  singularity run ... (or docker run -e FRONTEND_PORT=5174 ...)"
        exit 1
    fi
fi

# Start the backend (FastAPI)
echo "Starting backend on ${BACKEND_HOST}:${BACKEND_PORT}..."
cd /app/backend
uvicorn src.server:app --host ${BACKEND_HOST} --port ${BACKEND_PORT} &
BACKEND_PID=$!

# Give backend time to start
sleep 2

# Start the frontend (Vite dev server)
if [ "$FRONTEND_NETWORK_MODE" = "localhost" ]; then
    echo "Starting frontend dev server on localhost:${FRONTEND_PORT} only"
    cd "$FRONTEND_DIR"
    npm run dev -- --port ${FRONTEND_PORT} &
    FRONTEND_PID=$!
    echo "  Frontend: http://localhost:${FRONTEND_PORT} (localhost only)"
else
    echo "Starting frontend dev server on 0.0.0.0:${FRONTEND_PORT}..."
    cd "$FRONTEND_DIR"
    npm run dev -- --host 0.0.0.0 --port ${FRONTEND_PORT} &
    FRONTEND_PID=$!
    echo "  Frontend: http://0.0.0.0:${FRONTEND_PORT} (accessible from network)"
fi

echo ""
echo "FreeBrowse is running!"
echo "  Backend:  http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "  Mode:     $MODE"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
