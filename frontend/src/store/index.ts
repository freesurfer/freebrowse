import { create } from "zustand";
import { createVolumeSlice, type VolumeSlice } from "./volume-slice";
import { createSurfaceSlice, type SurfaceSlice } from "./surface-slice";
import { createDrawingSlice, type DrawingSlice } from "./drawing-slice";
import { createViewerSlice, type ViewerSlice } from "./viewer-slice";
import { createSaveSlice, type SaveSlice } from "./save-slice";
import { createLocationSlice, type LocationSlice } from "./location-slice";
import { createDlSlice, type DlSlice } from "./dl-slice";

export type FreeBrowseStore = VolumeSlice &
  SurfaceSlice &
  DrawingSlice &
  ViewerSlice &
  SaveSlice &
  LocationSlice &
  DlSlice;

export const useFreeBrowseStore = create<FreeBrowseStore>()((...a) => ({
  ...createVolumeSlice(...a),
  ...createSurfaceSlice(...a),
  ...createDrawingSlice(...a),
  ...createViewerSlice(...a),
  ...createSaveSlice(...a),
  ...createLocationSlice(...a),
  ...createDlSlice(...a),
}));
