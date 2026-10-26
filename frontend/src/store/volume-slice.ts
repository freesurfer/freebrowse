import type { StateCreator } from "zustand";

export interface VolumeSlice {
  currentImageIndex: number | null;
  showUploader: boolean;
  /** Master switch for drag-and-drop loading (niivue canvas drop + the drop zone). */
  dragDropEnabled: boolean;
  volumeVersion: number;
  setCurrentImageIndex: (index: number | null) => void;
  setShowUploader: (show: boolean) => void;
  setDragDropEnabled: (enabled: boolean) => void;
  incrementVolumeVersion: () => void;
}

export const createVolumeSlice: StateCreator<VolumeSlice> = (set) => ({
  currentImageIndex: null,
  showUploader: true,
  dragDropEnabled: true,
  volumeVersion: 0,
  setCurrentImageIndex: (currentImageIndex) => set({ currentImageIndex }),
  setShowUploader: (showUploader) => set({ showUploader }),
  setDragDropEnabled: (dragDropEnabled) => set({ dragDropEnabled }),
  incrementVolumeVersion: () => set((state) => ({ volumeVersion: state.volumeVersion + 1 })),
});
