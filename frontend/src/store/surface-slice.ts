import type { StateCreator } from "zustand";
import type { SurfaceDetails } from "./types";

export interface SurfaceSlice {
  surfaces: SurfaceDetails[];
  currentSurfaceIndex: number | null;
  surfaceToRemove: number | null;
  setSurfaces: (surfaces: SurfaceDetails[]) => void;
  setCurrentSurfaceIndex: (index: number | null) => void;
  setSurfaceToRemove: (index: number | null) => void;
}

export const createSurfaceSlice: StateCreator<SurfaceSlice> = (set) => ({
  surfaces: [],
  currentSurfaceIndex: null,
  surfaceToRemove: null,
  setSurfaces: (surfaces) => set({ surfaces }),
  setCurrentSurfaceIndex: (currentSurfaceIndex) => set({ currentSurfaceIndex }),
  setSurfaceToRemove: (surfaceToRemove) => set({ surfaceToRemove }),
});
