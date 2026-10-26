import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { getFreeBrowseConfig } from "@/lib/deployment-config";
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
 * writing to the origin's localStorage. The zustand `name` below is therefore
 * only a label; the real key is read from the config.
 */
const memoryStorage = new Map<string, string>();
const configuredStorage: StateStorage = {
  getItem: (_name) => {
    const key = getFreeBrowseConfig().persist;
    if (key === false) return memoryStorage.get("prefs") ?? null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (_name, value) => {
    const key = getFreeBrowseConfig().persist;
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
    const key = getFreeBrowseConfig().persist;
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

export const useFreeBrowseStore = create<FreeBrowseStore>()(
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
      // The adapter is static; it resolves the key/target on every call.
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
    }
  )
);
