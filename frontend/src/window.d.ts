import type { NiiVue } from "@niivue/niivue";

// Globals FreeBrowse reads or writes on `window`.
declare global {
  interface Window {
    /** Parsed .nvd JSON injected by scripts/nvd-embed.py into a single-file build. */
    __EMBEDDED_NVD_DATA__?: Record<string, unknown>;
    /** Set once the embedded document has been loaded (guards double loads). */
    __EMBEDDED_NVD_LOADED__?: boolean;
    /** The live NiiVue instance, for external callers (see README, adoption). */
    freebrowse?: { nv: NiiVue };
  }
}

export {};
