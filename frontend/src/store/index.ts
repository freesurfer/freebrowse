import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
      name: "freebrowse-user-settings", // localStorage key
      storage: createJSONStorage(() => localStorage),
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
