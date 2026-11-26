import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import packageJson from "./package.json";
import { scopeCssPlugin } from "./scope-css";

/**
 * Self-contained ES module + scoped CSS build for in-DOM mounting inside
 * `jupyterlab-freebrowse`. Bundles React 19, `@niivue/niivue`, and
 * `@niivue/nv-ext-drawing` (with its inline Blob worker) with zero external
 * peer dependencies so JupyterLab 4's Webpack build can lazy-load it as an
 * async chunk without colliding with JupyterLab's own React 18 or adding
 * dependencies to `jupyter/yarn.lock`.
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), scopeCssPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  publicDir: false,
  build: {
    outDir: "dist-jupyter-embed",
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, "src/lib.ts"),
      formats: ["es"],
      fileName: () => "freebrowse-embed.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css")
            ? "freebrowse-embed.css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
});
