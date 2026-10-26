/**
 * Runtime configuration for one FreeBrowse instance (app or embedded library).
 *
 * These are *deployment* (operator/host-controlled) settings, distinct from
 * per-user preferences, and must never be sourced from user-writable storage.
 *
 * Defaults come from Vite env vars so the app behaves exactly as before
 * (`VITE_SERVERLESS`, `VITE_DISABLE_DOWNLOAD`); an embedding host overrides
 * them at runtime through `configureFreeBrowse` (or the `mountFreeBrowse`
 * options), since a published package has one build and no env.
 *
 * Consumers read through `deploymentConfig` (getters, always current) and the
 * `dataUrl` / `aiUrl` helpers rather than caching values at import time.
 */

export interface FreeBrowseBackend {
  /** Base URL of the `/data` file API (listings, `.nvd` + `.nii` uploads). */
  dataUrl: string;
  /** Base URL of the `/ai` session API. */
  aiUrl: string;
}

export interface FreeBrowseConfig {
  /**
   * Backend endpoints, or `null` for a backend-less ("serverless") viewer: no
   * Save-to-server, no Data/NVD tabs, no AI capability probe.
   */
  backend: FreeBrowseBackend | null;
  /**
   * Lock down client-side data export for secure deployments: disables the
   * Download button and no-ops niivue's save-to-disk methods. Not a guarantee
   * against a determined/malicious user — it stops well-intentioned exports.
   */
  downloadDisabled: boolean;
  /** localStorage key for user preferences, or `false` to keep them in memory. */
  persist: string | false;
  /** Read `?nvd=` / `?vol=` from the page URL on startup (app: yes; library: no). */
  readUrlParams: boolean;
  /** Publish the instance as `window.freebrowse.nv` (app: yes; library: no). */
  exposeGlobal: boolean;
}

export const DEFAULT_BACKEND: FreeBrowseBackend = { dataUrl: "/data", aiUrl: "/ai" };
export const DEFAULT_PERSIST_KEY = "freebrowse-user-settings";

function defaultsFromEnv(): FreeBrowseConfig {
  return {
    backend: import.meta.env.VITE_SERVERLESS === "true" ? null : { ...DEFAULT_BACKEND },
    downloadDisabled: import.meta.env.VITE_DISABLE_DOWNLOAD === "true",
    persist: DEFAULT_PERSIST_KEY,
    readUrlParams: true,
    exposeGlobal: true,
  };
}

let config: FreeBrowseConfig = defaultsFromEnv();

/** Override part of the configuration; returns the effective config. */
export function configureFreeBrowse(
  partial: Partial<FreeBrowseConfig>,
): Readonly<FreeBrowseConfig> {
  config = { ...config, ...partial };
  return config;
}

/** Back to the env-derived defaults (tests). */
export function resetFreeBrowseConfig(): void {
  config = defaultsFromEnv();
}

/** The effective configuration (live view; do not mutate). */
export function getFreeBrowseConfig(): Readonly<FreeBrowseConfig> {
  return config;
}

/**
 * The two flags most of the UI keys off. Getters, so a value read inside a
 * render or effect is always the configured one.
 */
export const deploymentConfig = {
  /** No backend configured (file:// builds, or an embedding host without one). */
  get serverless(): boolean {
    return config.backend === null;
  },
  get downloadDisabled(): boolean {
    return config.downloadDisabled;
  },
};

function join(base: string, path: string): string {
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

function requireBackend(): FreeBrowseBackend {
  if (config.backend === null) {
    throw new Error(
      "FreeBrowse: no backend configured (serverless); this call should be unreachable",
    );
  }
  return config.backend;
}

/** `dataUrl("nvd")` → `<backend.dataUrl>/nvd`. Throws when no backend is configured. */
export function dataUrl(path = ""): string {
  return join(requireBackend().dataUrl, path);
}

/** `aiUrl("session/list")` → `<backend.aiUrl>/session/list`. Throws when no backend. */
export function aiUrl(path = ""): string {
  return join(requireBackend().aiUrl, path);
}

/**
 * Strip the configured data base from a URL, returning the path relative to
 * the data root (`"/data/x/y.nii.gz"` → `"x/y.nii.gz"`), or null if the URL is
 * not under it. Accepts the bare relative spelling too (`"data/x"`).
 */
export function relativeToDataRoot(url: string): string | null {
  const base = config.backend?.dataUrl ?? DEFAULT_BACKEND.dataUrl;
  const prefix = base.replace(/\/+$/, "") + "/";
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  const bare = prefix.replace(/^\/+/, "");
  if (bare && url.startsWith(bare)) return url.slice(bare.length);
  return null;
}
