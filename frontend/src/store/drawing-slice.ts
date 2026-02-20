import type { StateCreator } from "zustand";
import type { DrawingOptions } from "./types";

export interface DrawingSlice {
  drawingOptions: DrawingOptions;
  setDrawingOptions: (options: DrawingOptions | ((prev: DrawingOptions) => DrawingOptions)) => void;
}

export const createDrawingSlice: StateCreator<DrawingSlice> = (set) => ({
  drawingOptions: {
    enabled: false,
    mode: "none",
    penValue: 1,
    penFill: true,
    penErases: false,
    opacity: 1.0,
    magicWand2dOnly: true,
    magicWandMaxDistanceMM: 15,
    magicWandThresholdPercent: 0.05,
    filename: "drawing.nii.gz",
  },
  setDrawingOptions: (options) =>
    set((state) => ({
      drawingOptions:
        typeof options === "function" ? options(state.drawingOptions) : options,
    })),
});
