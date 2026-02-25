import type { StateCreator } from "zustand";
import type { SaveState } from "./types";

export interface SaveSlice {
  saveDialogOpen: boolean;
  saveState: SaveState;
  setSaveDialogOpen: (open: boolean) => void;
  setSaveState: (state: SaveState | ((prev: SaveState) => SaveState)) => void;
}

export const createSaveSlice: StateCreator<SaveSlice> = (set) => ({
  saveDialogOpen: false,
  saveState: {
    isDownloadMode: false,
    document: {
      enabled: false,
      location: "",
    },
    volumes: [],
  },
  setSaveDialogOpen: (saveDialogOpen) => set({ saveDialogOpen }),
  setSaveState: (state) =>
    set((prev) => ({
      saveState:
        typeof state === "function" ? state(prev.saveState) : state,
    })),
});
