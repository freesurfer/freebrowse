import type { SerializeOptions } from "@niivue/niivue";

import type { DragMode } from "@/components/drag-mode-selector";

export type SurfaceDetails = {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  rgba255: [number, number, number, number];
  // niivue-mono identifies mesh shaders by name (e.g. 'phong'), not an index.
  shaderType: string;
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
  isColorbar: boolean;
  isRadiologicalConvention: boolean;
  sagittalNoseLeft: boolean;
};

export type DrawingOptions = {
  enabled: boolean;
  mode: "none" | "pen" | "wand";
  penValue: number;
  penFill: boolean;
  penErases: boolean;
  opacity: number;
  colormap: string;
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

/**
 * On-disk niivue Document encoding chosen at save time. Derived from niivue's
 * own option type so a future upstream format is a compile error at the save
 * dialog rather than a silent divergence.
 */
export type NvdFormat = NonNullable<SerializeOptions["format"]>;

export type SaveState = {
  isDownloadMode: boolean;
  document: {
    enabled: boolean;
    location: string;
    /** Both are native niivue encodings: JSON is portable and diffable,
     * CBOR is the compact binary default. */
    format: NvdFormat;
  };
  volumes: SaveVolumeState[];
};
