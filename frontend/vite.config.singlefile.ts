import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { viteSingleFile } from "vite-plugin-singlefile"
import packageJson from "./package.json"

// Single-file build configuration for file:// protocol distribution
// Creates a self-contained HTML file that can be opened directly in a browser
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  base: './',  // Relative paths for file:// compatibility
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    'import.meta.env.VITE_SERVERLESS': JSON.stringify('true'),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist-singlefile',
    // Inline all assets as data URLs
    assetsInlineLimit: 10000000,
    rollupOptions: {
      output: {
        // Bundle all code into a single chunk
        inlineDynamicImports: true,
      },
    },
  },
})
