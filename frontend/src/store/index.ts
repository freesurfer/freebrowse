import { createContext, useContext } from "react";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import {
  getFreeBrowseConfig,
  type FreeBrowseConfig,
} from "@/lib/deployment-config";
import { createVolumeSlice, type VolumeSlice } from "./volume-slice";
import { createSurfaceSlice, type SurfaceSlice } from "./surface-slice";
import { createDrawingSlice, type DrawingSlice } from "./drawing-slice";
import { createViewerSlice, type ViewerSlice } from "./viewer-slice";
import { createSaveSlice, type SaveSlice } from "./save-slice";
import { createLocationSlice, type LocationSlice } from "./location-slice";
import { createAiSlice, type AiSlice } from "./ai-slice";

export type FreeBrowseStore = VolumeSlice &
  SurfaceSlice &
  DrawingSlice &
  ViewerSlice &
  SaveSlice &
  LocationSlice &
  AiSlice;

/**
 * Persistence target resolved on every call, not at store creation: the key is
 * `config.persist` (default `freebrowse-user-settings`), and `persist: false`
 * routes everything to an in-memory map so an embedding host can opt out of
 * writing to the origin's localStorage.
 */
function createConfiguredStorage(
  getConfig: () => Readonly<FreeBrowseConfig>,
): StateStorage {
  const memoryStorage = new Map<string, string>();
  return {
    getItem: (_name) => {
      const key = getConfig().persist;
      if (key === false) return memoryStorage.get("prefs") ?? null;
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (_name, value) => {
      const key = getConfig().persist;
      if (key === false) {
        memoryStorage.set("prefs", value);
        return;
      }
      try {
        localStorage.setItem(key, value);
      } catch {
        /* storage unavailable (private mode, quota) — preferences stay in memory */
      }
    },
    removeItem: (_name) => {
      const key = getConfig().persist;
      if (key === false) {
        memoryStorage.delete("prefs");
        return;
      }
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

/** Create an isolated per-instance FreeBrowse Zustand store. */
export function createFreeBrowseStore(
  getConfig: () => Readonly<FreeBrowseConfig> = getFreeBrowseConfig,
) {
  const configuredStorage = createConfiguredStorage(getConfig);
  return createStore<FreeBrowseStore>()(
    persist(
      (...a) => ({
        ...createVolumeSlice(...a),
        ...createSurfaceSlice(...a),
        ...createDrawingSlice(...a),
        ...createViewerSlice(...a),
        ...createSaveSlice(...a),
        ...createLocationSlice(...a),
        ...createAiSlice(...a),
      }),
      {
        name: "freebrowse-user-settings", // label only; the key comes from config
        storage: createJSONStorage(() => configuredStorage),
        version: 1, // bump + add migrate() on future schema changes
        // Persist ONLY user preferences. Everything else — niivue viewerOptions,
        // loaded volumes/surfaces, dialog-open flags, crosshair location, AI
        // sessions, save state, version counters — is intentionally excluded so
        // that e.g. a loaded document cannot hijack the user's defaults.
        partialize: (state) => ({
          skipRemoveConfirmation: state.skipRemoveConfirmation,
          skipImagingUploadConfirmation: state.skipImagingUploadConfirmation,
          skipSessionDeleteConfirmation: state.skipSessionDeleteConfirmation,
          darkMode: state.darkMode,
          sidebarOpen: state.sidebarOpen,
          footerOpen: state.footerOpen,
        }),
      },
    ),
  );
}

export type FreeBrowseStoreApi = ReturnType<typeof createFreeBrowseStore>;

let _defaultStore: FreeBrowseStoreApi | null = null;

/**
 * Lazily allocate the fallback singleton store so importing the library in an
 * embedding host (where every mount supplies its own store via Context) never
 * touches `localStorage` at module evaluation time.
 */
export function getDefaultFreeBrowseStore(): FreeBrowseStoreApi {
  if (!_defaultStore) {
    _defaultStore = createFreeBrowseStore();
  }
  return _defaultStore;
}

export const FreeBrowseStoreContext = createContext<FreeBrowseStoreApi | null>(
  null,
);

export function useFreeBrowseStoreApi(): FreeBrowseStoreApi {
  return useContext(FreeBrowseStoreContext) ?? getDefaultFreeBrowseStore();
}

type UseFreeBrowseStore = {
  (): FreeBrowseStore;
  <T>(selector: (state: FreeBrowseStore) => T): T;
} & FreeBrowseStoreApi;

function useFreeBrowseStoreImpl(): FreeBrowseStore;
function useFreeBrowseStoreImpl<T>(selector: (state: FreeBrowseStore) => T): T;
function useFreeBrowseStoreImpl<T>(
  selector?: (state: FreeBrowseStore) => T,
) {
  const store = useFreeBrowseStoreApi();
  return useStore(
    store,
    selector ?? ((state: FreeBrowseStore) => state as unknown as T),
  );
}

export const useFreeBrowseStore: UseFreeBrowseStore = Object.assign(
  useFreeBrowseStoreImpl,
  {
    getState: () => getDefaultFreeBrowseStore().getState(),
    getInitialState: () => getDefaultFreeBrowseStore().getInitialState(),
    setState: ((
      partial: Parameters<FreeBrowseStoreApi["setState"]>[0],
      replace?: boolean,
    ) =>
      getDefaultFreeBrowseStore().setState(
        partial as never,
        replace as never,
      )) as FreeBrowseStoreApi["setState"],
    subscribe: (...args: Parameters<FreeBrowseStoreApi["subscribe"]>) =>
      getDefaultFreeBrowseStore().subscribe(...args),
    get persist() {
      return getDefaultFreeBrowseStore().persist;
    },
  },
);
