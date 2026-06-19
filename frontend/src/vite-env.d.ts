/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** Build serverless (file:// protocol, no backend). Set by build:serverless. */
  readonly VITE_SERVERLESS?: string;
  /** Base path for routing/assets (e.g. "/freebrowse/" for GitHub Pages). */
  readonly VITE_BASE_PATH?: string;
  /** When "true", disable the Download button and niivue save-to-disk (secure deployments). */
  readonly VITE_DISABLE_DOWNLOAD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
