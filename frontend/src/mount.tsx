import { createRoot } from "react-dom/client";
import type { NiiVue } from "@niivue/niivue";
import FreeBrowse from "@/components/freebrowse";
import { createFreeBrowseInstance } from "@/lib/default-niivue-options";
import {
  defaultsFromEnv,
  resolveFreeBrowseConfig,
  type FreeBrowseBackend,
  type FreeBrowseConfig,
} from "@/lib/deployment-config";
import { FreeBrowseConfigContext } from "@/lib/config-context";
import { applyExportLockdownToInstance } from "@/lib/disable-export";
import { clearPendingConfirmations } from "@/lib/confirmations";
import { loadFreeBrowseFile } from "@/lib/load-file";
import {
  createFreeBrowseStore,
  FreeBrowseStoreContext,
} from "@/store";

export interface MountOptions {
  /**
   * The NiiVue instance to show. When given, the host owns it: FreeBrowse
   * seeds its UI from the instance's current settings and never pushes its
   * own defaults onto it. When omitted, FreeBrowse creates one with
   * `createFreeBrowseInstance()` and applies its defaults.
   */
  nv?: NiiVue;
  /**
   * Backend endpoints for Save-to-server, the Data/NVD tabs and AI sessions.
   * Omitted (or `null`): no backend — those features are hidden.
   */
  backend?: FreeBrowseBackend | null;
  /** localStorage key for user preferences (default `freebrowse-user-settings`), or `false` to keep them in memory. */
  persist?: string | false;
  /** Read `?nvd=` / `?vol=` from the host page URL on startup. Default false. */
  readUrlParams?: boolean;
  /** Also publish the instance as `window.freebrowse.nv`. Default false. */
  exposeGlobal?: boolean;
  /** Disable the Download button and niivue's save-to-disk methods. Defaults to build-time `VITE_DISABLE_DOWNLOAD` (false). */
  downloadDisabled?: boolean;
  /**
   * Allow `.nvd` documents to fetch linked external or same-origin URLs.
   * Set `false` when embedding inside an authenticated host (like JupyterLab)
   * to restrict `.nvd` loading to self-contained documents. Default true.
   */
  allowExternalDocumentUrls?: boolean;
  /**
   * Allow loading by drag-and-drop (niivue's canvas drop and FreeBrowse's
   * drop zone). `false` also skips the drop zone and shows the canvas from
   * the start, for hosts that load data themselves. Default true.
   */
  dragDrop?: boolean;
  /** Show the sidebar initially (the header button still toggles it). Default true. */
  sidebar?: boolean;
  /** Show the footer (coordinate readout) initially. Default true. */
  footer?: boolean;
}

export interface FreeBrowseHandle {
  /** The instance FreeBrowse is showing (the one passed in, or the one it created). */
  nv: NiiVue;
  /** Effective immutable configuration for this mounted instance. */
  config: Readonly<FreeBrowseConfig>;
  /**
   * Wait for the canvas to attach and load a volume (`.nii`, `.nii.gz`,
   * `.mgh`, `.mgz`) or NiiVue document (`.nvd`) `File` into this instance.
   */
  loadFile(file: File, signal?: AbortSignal): Promise<void>;
  /**
   * Wait for the canvas to attach and load a volume directly from a URL (used
   * when an embedding host explicitly opts into URL-backed volume loading).
   */
  loadVolumeUrl(url: string, filename: string, signal?: AbortSignal): Promise<void>;
  /** Unmount the UI, detach event listeners, and destroy any FreeBrowse-owned NiiVue instance. */
  destroy(): void;
}

const CANVAS_ATTACH_TIMEOUT_MS = 10_000;
const DESTROY_SETTLE_TIMEOUT_MS = 2_000;

function releaseWebGLContext(canvas: HTMLCanvasElement | null | undefined): void {
  if (!canvas) return;
  try {
    const gl =
      canvas.getContext("webgl2") ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    /* ignore in non-WebGL / jsdom environments */
  }
}

/**
 * Mount the FreeBrowse UI into `container` and return a handle.
 *
 * Each mount gets its own isolated Zustand store and runtime configuration, so
 * multiple viewers can be mounted simultaneously on the same page.
 *
 * Styles are not injected — import `freebrowse/style.css` once in the host.
 */
export function mountFreeBrowse(
  container: HTMLElement,
  options: MountOptions = {},
): FreeBrowseHandle {
  const hostInstance = options.nv !== undefined;
  const nv = options.nv ?? createFreeBrowseInstance();
  const envDefaults = defaultsFromEnv();

  const instanceConfig = resolveFreeBrowseConfig({
    backend: options.backend ?? null,
    persist: options.persist ?? "freebrowse-user-settings",
    readUrlParams: options.readUrlParams ?? false,
    exposeGlobal: options.exposeGlobal ?? false,
    downloadDisabled: options.downloadDisabled ?? envDefaults.downloadDisabled,
    allowExternalDocumentUrls: options.allowExternalDocumentUrls ?? true,
  });

  const restoreLockdown = instanceConfig.downloadDisabled
    ? applyExportLockdownToInstance(nv)
    : null;

  const store = createFreeBrowseStore(() => instanceConfig);
  const layout = { sidebar: options.sidebar, footer: options.footer };
  let destroyed = false;
  let finalized = false;
  const destroyController = new AbortController();

  // Deterministic canvas attachment lifecycle: ImageCanvas reports the actual
  // `nv.attachToCanvas(canvas)` promise so `loadFile` never races WebGL/view
  // initialization, and `destroy()` defers `nv.destroy()` until init settles.
  let attachPromise: Promise<unknown> | null = null;
  let resolveAttachStarted!: (p: Promise<unknown>) => void;
  const attachStarted = new Promise<Promise<unknown>>((resolve) => {
    resolveAttachStarted = resolve;
  });
  const inFlightLoads = new Set<Promise<unknown>>();

  const destroyOwnedNv = () => {
    if (hostInstance) return;
    const canvas = nv.canvas;
    if (typeof nv.destroy === "function") {
      nv.destroy();
    }
    releaseWebGLContext(canvas);
  };

  const finalizeOwnedNv = () => {
    if (finalized) return;
    finalized = true;
    restoreLockdown?.();
    destroyOwnedNv();
  };

  const onAttachCanvas = (promise: Promise<unknown>) => {
    if (!attachPromise) {
      attachPromise = promise;
      resolveAttachStarted(promise);
      // Prevent unhandled rejections AND run a follow-up teardown if a slow
      // attach settles after destroy()'s bounded timeout already ran finalizeOwnedNv().
      const cleanupLateAttach = () => {
        if (destroyed && finalized) {
          destroyOwnedNv();
        }
      };
      promise.then(cleanupLateAttach, cleanupLateAttach);
    }
  };

  async function awaitCanvasAttached(signal?: AbortSignal): Promise<void> {
    if (destroyed || signal?.aborted) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onExternalAbort: (() => void) | undefined;
    let onDestroyAbort: (() => void) | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error("FreeBrowse canvas failed to initialize in time"));
      }, CANVAS_ATTACH_TIMEOUT_MS);
    });
    const makeAbort = () =>
      Object.assign(new Error("Aborted"), { name: "AbortError" });
    const destroyAbort = new Promise<void>((resolve) => {
      if (destroyController.signal.aborted) {
        resolve();
        return;
      }
      onDestroyAbort = () => resolve();
      destroyController.signal.addEventListener("abort", onDestroyAbort, {
        once: true,
      });
    });
    const externalAbort = signal
      ? new Promise<never>((_, reject) => {
          if (signal.aborted) {
            reject(makeAbort());
            return;
          }
          onExternalAbort = () => reject(makeAbort());
          signal.addEventListener("abort", onExternalAbort, { once: true });
        })
      : null;

    try {
      const candidates: Promise<unknown>[] = [
        attachStarted.then((p) => p),
        destroyAbort,
        timeout,
      ];
      if (externalAbort) candidates.push(externalAbort);
      await Promise.race(candidates);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      if (signal && onExternalAbort) {
        signal.removeEventListener("abort", onExternalAbort);
      }
      if (onDestroyAbort) {
        destroyController.signal.removeEventListener("abort", onDestroyAbort);
      }
    }
  }

  function trackLoad<T>(work: () => Promise<T>): Promise<T> {
    const p = work();
    inFlightLoads.add(p);
    const cleanup = () => {
      inFlightLoads.delete(p);
    };
    // Attach both handlers so rejecting `p` does not produce an unhandled
    // derived rejection from `.finally()` while callers handle `p` itself.
    p.then(cleanup, cleanup);
    return p;
  }

  void store.persist.rehydrate()?.then(() => {
    if (destroyed) return;
    const patch: Partial<{ sidebarOpen: boolean; footerOpen: boolean }> = {};
    if (layout.sidebar !== undefined) patch.sidebarOpen = layout.sidebar;
    if (layout.footer !== undefined) patch.footerOpen = layout.footer;
    if (Object.keys(patch).length) store.setState(patch);
  });

  const root = createRoot(container);
  root.render(
    <FreeBrowseConfigContext.Provider value={instanceConfig}>
      <FreeBrowseStoreContext.Provider value={store}>
        <FreeBrowse
          nv={nv}
          hostInstance={hostInstance}
          dragDrop={options.dragDrop}
          sidebar={options.sidebar}
          footer={options.footer}
          onAttachCanvas={onAttachCanvas}
        />
      </FreeBrowseStoreContext.Provider>
    </FreeBrowseConfigContext.Provider>,
  );

  function createLoadSignal(externalSignal?: AbortSignal): {
    signal: AbortSignal;
    cleanup: () => void;
  } {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (destroyed || destroyController.signal.aborted || externalSignal?.aborted) {
      controller.abort();
      return { signal: controller.signal, cleanup: () => {} };
    }
    destroyController.signal.addEventListener("abort", abort, { once: true });
    externalSignal?.addEventListener("abort", abort, { once: true });
    return {
      signal: controller.signal,
      cleanup: () => {
        destroyController.signal.removeEventListener("abort", abort);
        externalSignal?.removeEventListener("abort", abort);
      },
    };
  }

  return {
    nv,
    config: instanceConfig,
    loadFile(file: File, signal?: AbortSignal): Promise<void> {
      return trackLoad(async () => {
        if (destroyed || signal?.aborted) return;
        store.setState({ showUploader: false });
        await awaitCanvasAttached(signal);
        if (destroyed || signal?.aborted) return;
        const combined = createLoadSignal(signal);
        try {
          await loadFreeBrowseFile(nv, file, {
            allowExternalDocumentUrls: instanceConfig.allowExternalDocumentUrls,
            signal: combined.signal,
          });
        } finally {
          combined.cleanup();
        }
        if (destroyed || signal?.aborted) return;
        const state = store.getState();
        if (state.currentImageIndex === null && nv.volumes.length > 0) {
          state.setCurrentImageIndex(0);
        }
        if (state.currentSurfaceIndex === null && nv.meshes.length > 0) {
          state.setCurrentSurfaceIndex(0);
        }
      });
    },
    loadVolumeUrl(
      url: string,
      filename: string,
      signal?: AbortSignal,
    ): Promise<void> {
      return trackLoad(async () => {
        if (destroyed || signal?.aborted) return;
        store.setState({ showUploader: false });
        await awaitCanvasAttached(signal);
        if (destroyed || signal?.aborted) return;
        await nv.addVolume({ url, name: filename });
        if (destroyed || signal?.aborted) return;
        const state = store.getState();
        if (state.currentImageIndex === null && nv.volumes.length > 0) {
          state.setCurrentImageIndex(0);
        }
      });
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      destroyController.abort();
      clearPendingConfirmations(store);
      root.unmount();
      const pending: Promise<unknown>[] = [...inFlightLoads];
      if (attachPromise) pending.push(attachPromise);
      if (pending.length > 0) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const settleTimeout = new Promise<void>((resolve) => {
          timer = setTimeout(resolve, DESTROY_SETTLE_TIMEOUT_MS);
        });
        Promise.race([Promise.allSettled(pending), settleTimeout]).then(
          () => {
            if (timer !== undefined) clearTimeout(timer);
            finalizeOwnedNv();
          },
          () => {
            if (timer !== undefined) clearTimeout(timer);
            finalizeOwnedNv();
          },
        );
      } else {
        finalizeOwnedNv();
      }
    },
  };
}
