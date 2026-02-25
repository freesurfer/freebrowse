import type { StateCreator } from "zustand";
import type { ImageDetails } from "./types";

export interface VolumeSlice {
  images: ImageDetails[];
  currentImageIndex: number | null;
  showUploader: boolean;
  loadViaNvd: boolean;
  setImages: (images: ImageDetails[] | ((prev: ImageDetails[]) => ImageDetails[])) => void;
  setCurrentImageIndex: (index: number | null) => void;
  setShowUploader: (show: boolean) => void;
  setLoadViaNvd: (load: boolean) => void;
}

export const createVolumeSlice: StateCreator<VolumeSlice> = (set) => ({
  images: [],
  currentImageIndex: null,
  showUploader: true,
  loadViaNvd: true,
  setImages: (images) =>
    set((state) => ({
      images: typeof images === "function" ? images(state.images) : images,
    })),
  setCurrentImageIndex: (currentImageIndex) => set({ currentImageIndex }),
  setShowUploader: (showUploader) => set({ showUploader }),
  setLoadViaNvd: (loadViaNvd) => set({ loadViaNvd }),
});
