import type { StateCreator } from "zustand";
import type { SurfaceDetails } from "./types";

export interface SurfaceSlice {
  surfaces: SurfaceDetails[];
  currentSurfaceIndex: number | null;
  surfaceToRemove: number | null;
  setSurfaces: (surfaces: SurfaceDetails[] | ((prev: SurfaceDetails[]) => SurfaceDetails[])) => void;
  setCurrentSurfaceIndex: (index: number | null) => void;
  setSurfaceToRemove: (index: number | null) => void;
}

export const createSurfaceSlice: StateCreator<SurfaceSlice> = (set) => ({
  surfaces: [],
  currentSurfaceIndex: null,
  surfaceToRemove: null,
  setSurfaces: (surfaces) =>
    set((state) => ({
      surfaces: typeof surfaces === "function" ? surfaces(state.surfaces) : surfaces,
    })),
  setCurrentSurfaceIndex: (currentSurfaceIndex) => set({ currentSurfaceIndex }),
  setSurfaceToRemove: (surfaceToRemove) => set({ surfaceToRemove }),
});
