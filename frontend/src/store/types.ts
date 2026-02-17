import type { DragMode } from "@/components/drag-mode-selector";

export type ImageDetails = {
  id: string;
  name: string;
  visible: boolean;
  colormap: string;
  opacity: number;
  contrastMin: number;
  contrastMax: number;
  globalMin: number;
  globalMax: number;
  frame4D: number;
  nFrame4D: number;
};

export type SurfaceDetails = {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  rgba255: [number, number, number, number];
  meshShaderIndex: number;
};

export type ViewMode = "axial" | "coronal" | "sagittal" | "ACS" | "ACSR" | "render";

export type ViewerOptions = {
  viewMode: ViewMode;
  crosshairWidth: number;
  crosshairGap: number;
  crosshairVisible: boolean;
  crosshairColor: [number, number, number, number];
  rulerWidth: number;
  rulerVisible: boolean;
  interpolateVoxels: boolean;
  dragMode: DragMode;
  overlayOutlineWidth: number;
};

export type DrawingOptions = {
  enabled: boolean;
  mode: "none" | "pen" | "wand";
  penValue: number;
  penFill: boolean;
  penErases: boolean;
  opacity: number;
  magicWand2dOnly: boolean;
  magicWandMaxDistanceMM: number;
  magicWandThresholdPercent: number;
  filename: string;
};

export type LocationData = {
  mm: [number, number, number];
  voxels: Array<{
    name: string;
    voxel: [number, number, number];
    value: number;
  }>;
};

export type SaveVolumeState = {
  enabled: boolean;
  isExternal: boolean;
  url: string;
};

export type SaveState = {
  isDownloadMode: boolean;
  document: {
    enabled: boolean;
    location: string;
  };
  volumes: SaveVolumeState[];
};
