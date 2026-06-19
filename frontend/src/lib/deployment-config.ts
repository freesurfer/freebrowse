/**
 * Per-deployment configuration, resolved once at build time from Vite env vars.
 *
 * These are *deployment* (operator-controlled) settings, distinct from per-user
 * preferences. They are read-only at runtime and must never be sourced from
 * user-writable storage (localStorage, etc.).
 *
 * This module is the seed of the broader configuration framework (issue #34);
 * a runtime config.json / backend override layer can be merged in here later.
 */
export const deploymentConfig = {
  /** Serverless build (file:// protocol, no backend). */
  serverless: import.meta.env.VITE_SERVERLESS === "true",
  /**
   * Lock down client-side data export for secure deployments: disables the
   * Download button and no-ops niivue's save-to-disk methods. Not a guarantee
   * against a determined/malicious user — it stops well-intentioned exports.
   */
  downloadDisabled: import.meta.env.VITE_DISABLE_DOWNLOAD === "true",
} as const;
