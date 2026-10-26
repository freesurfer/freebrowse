import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import packageJson from "./package.json";

// Library build (npm package). Two entries, selected with FREEBROWSE_LIB_ENTRY:
//   index -> dist/index.js   framework-agnostic `mountFreeBrowse`; React bundled
//   react -> dist/react.js   the component; react / react-dom external (peers)
// Both keep `@niivue/niivue` external (peer dependency) and emit the scoped
// stylesheet as dist/style.css. `@niivue/nv-ext-drawing` is bundled: it builds
// its worker from an inlined Blob, so nothing needs resolving at the host.
const entry = process.env.FREEBROWSE_LIB_ENTRY === "react" ? "react" : "index";
const reactExternal = (id: string): boolean =>
  /^react($|\/)|^react-dom($|\/)/.test(id);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    // Bundled React reads this; a host page has no `process`.
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  publicDir: false, // favicon etc. belong to the app, not the package
  build: {
    outDir: "dist-lib", // the app build owns dist/
    emptyOutDir: entry === "index",
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, entry === "react" ? "src/react.ts" : "src/lib.ts"),
      formats: ["es"],
      fileName: () => `${entry}.js`,
    },
    rollupOptions: {
      external: (id) =>
        id === "@niivue/niivue" ||
        id.startsWith("@niivue/niivue/") ||
        (entry === "react" && reactExternal(id)),
      output: { inlineDynamicImports: true },
    },
  },
});
