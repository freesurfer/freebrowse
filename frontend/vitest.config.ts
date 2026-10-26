import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Mirrors the `define` in vite.config.ts so components that render the app
  // version mount under vitest.
  define: {
    __APP_VERSION__: JSON.stringify("test"),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test-setup.ts"],
    globals: true,
  },
});
