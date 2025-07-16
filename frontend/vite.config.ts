import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/scene': 'http://127.0.0.1:8000',
      '/data': 'http://127.0.0.1:8000',
      '/nvd': 'http://127.0.0.1:8000',
      '/nii': 'http://127.0.0.1:8000'
    }
  }
})
