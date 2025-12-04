FROM python:3.11-slim

# Install Node.js for running Vite dev server
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY backend/src ./backend/src
RUN pip install --no-cache-dir fastapi uvicorn[standard]

# Copy and install frontend dependencies
COPY frontend/package*.json ./frontend/
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm ci

# Build argument to control serverless mode (set at build time)
# Usage: docker build --build-arg SERVERLESS=true ...
ARG SERVERLESS=false
ENV VITE_SERVERLESS=${SERVERLESS}
RUN npm run build

# Create data directory
WORKDIR /app
RUN mkdir -p data

# Copy entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Environment variables with defaults
ENV NIIVUE_BUILD_DIR=/app/frontend/dist
ENV DATA_DIR=/app/data
ENV SCENE_SCHEMA_ID=freebrowse
ENV IMAGING_EXTENSIONS='["*.nii", "*.nii.gz"]'
ENV BACKEND_HOST=0.0.0.0
ENV BACKEND_PORT=8000
ENV FRONTEND_PORT=5173

# Expose default ports (can be overridden with BACKEND_PORT and FRONTEND_PORT env vars)
# Port 8000: FastAPI backend (default)
# Port 5173: Vite dev server (default)
EXPOSE 8000 5173

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD []
