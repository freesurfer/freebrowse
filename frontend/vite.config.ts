import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import packageJson from "./package.json"

// Read backend port from environment variable, default to 8000
const backendPort = process.env.BACKEND_PORT || '8000'
const backendUrl = `http://127.0.0.1:${backendPort}`

// Base path for GitHub Pages deployment (e.g., /freebrowse/)
// Set via VITE_BASE_PATH environment variable, defaults to '/' for local dev
const basePath = process.env.VITE_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: basePath,
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/scene': backendUrl,
      '/data': backendUrl,
      '/nvd': backendUrl,
      '/nii': backendUrl,
      '/imaging': backendUrl,
      '/available_seg_models': backendUrl,
      '/scribbleprompt3d_inference': backendUrl
    }
  }
})
