import type { StateCreator } from "zustand";

export interface VolumeSlice {
  currentImageIndex: number | null;
  showUploader: boolean;
  volumeVersion: number;
  setCurrentImageIndex: (index: number | null) => void;
  setShowUploader: (show: boolean) => void;
  incrementVolumeVersion: () => void;
}

export const createVolumeSlice: StateCreator<VolumeSlice> = (set) => ({
  currentImageIndex: null,
  showUploader: true,
  volumeVersion: 0,
  setCurrentImageIndex: (currentImageIndex) => set({ currentImageIndex }),
  setShowUploader: (showUploader) => set({ showUploader }),
  incrementVolumeVersion: () => set((state) => ({ volumeVersion: state.volumeVersion + 1 })),
});
