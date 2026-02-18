import type { StateCreator } from "zustand";
import type { ViewerOptions } from "./types";

export interface ViewerSlice {
  viewerOptions: ViewerOptions;
  darkMode: boolean;
  sidebarOpen: boolean;
  footerOpen: boolean;
  activeTab: string;
  settingsDialogOpen: boolean;
  removeDialogOpen: boolean;
  volumeToRemove: number | null;
  skipRemoveConfirmation: boolean;
  setViewerOptions: (options: ViewerOptions | ((prev: ViewerOptions) => ViewerOptions)) => void;
  setDarkMode: (dark: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setFooterOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  setSettingsDialogOpen: (open: boolean) => void;
  setRemoveDialogOpen: (open: boolean) => void;
  setVolumeToRemove: (index: number | null) => void;
  setSkipRemoveConfirmation: (skip: boolean) => void;
}

export const createViewerSlice: StateCreator<ViewerSlice> = (set) => ({
  viewerOptions: {
    viewMode: "ACS",
    crosshairWidth: 1,
    crosshairGap: 0,
    crosshairVisible: true,
    crosshairColor: [1.0, 0.0, 0.0, 0.5],
    rulerWidth: 1.0,
    rulerVisible: false,
    interpolateVoxels: false,
    dragMode: "contrast",
    overlayOutlineWidth: 0.0,
  },
  darkMode: true,
  sidebarOpen: true,
  footerOpen: true,
  activeTab: "nvds",
  settingsDialogOpen: false,
  removeDialogOpen: false,
  volumeToRemove: null,
  skipRemoveConfirmation: false,
  setViewerOptions: (options) =>
    set((state) => ({
      viewerOptions:
        typeof options === "function" ? options(state.viewerOptions) : options,
    })),
  setDarkMode: (darkMode) => set({ darkMode }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setFooterOpen: (footerOpen) => set({ footerOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSettingsDialogOpen: (settingsDialogOpen) => set({ settingsDialogOpen }),
  setRemoveDialogOpen: (removeDialogOpen) => set({ removeDialogOpen }),
  setVolumeToRemove: (volumeToRemove) => set({ volumeToRemove }),
  setSkipRemoveConfirmation: (skipRemoveConfirmation) =>
    set({ skipRemoveConfirmation }),
});
