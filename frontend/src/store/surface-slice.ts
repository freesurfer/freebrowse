import type { StateCreator } from "zustand";
import type { SurfaceDetails } from "./types";

export interface SurfaceSlice {
  surfaces: SurfaceDetails[];
  currentSurfaceIndex: number | null;
  surfaceToRemove: number | null;
  selectedLayerIndex: number | null;
  layerVersion: number;
  setSurfaces: (surfaces: SurfaceDetails[] | ((prev: SurfaceDetails[]) => SurfaceDetails[])) => void;
  setCurrentSurfaceIndex: (index: number | null) => void;
  setSurfaceToRemove: (index: number | null) => void;
  setSelectedLayerIndex: (index: number | null) => void;
  incrementLayerVersion: () => void;
}

export const createSurfaceSlice: StateCreator<SurfaceSlice> = (set) => ({
  surfaces: [],
  currentSurfaceIndex: null,
  surfaceToRemove: null,
  selectedLayerIndex: null,
  layerVersion: 0,
  setSurfaces: (surfaces) =>
    set((state) => ({
      surfaces: typeof surfaces === "function" ? surfaces(state.surfaces) : surfaces,
    })),
  setCurrentSurfaceIndex: (currentSurfaceIndex) => set({ currentSurfaceIndex }),
  setSurfaceToRemove: (surfaceToRemove) => set({ surfaceToRemove }),
  setSelectedLayerIndex: (selectedLayerIndex) => set({ selectedLayerIndex }),
  incrementLayerVersion: () => set((state) => ({ layerVersion: state.layerVersion + 1 })),
});
