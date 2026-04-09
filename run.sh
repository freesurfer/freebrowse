#!/bin/bash
# Build frontend and start backend server

cd "$(dirname "$0")"

# Build frontend
cd frontend && npm run build && cd ..

# Run backend with env file
cd backend && set -a && source .env && set +a && uv run fastapi dev src/server.py --host 0.0.0.0 --port 5990
