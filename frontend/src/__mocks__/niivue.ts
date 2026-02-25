import { vi } from "vitest";

export const SLICE_TYPE = {
  AXIAL: 0,
  CORONAL: 1,
  SAGITTAL: 2,
  MULTIPLANAR: 3,
  RENDER: 4,
} as const;

export const DRAG_MODE = {
  none: 0,
  contrast: 1,
  measurement: 2,
  pan: 3,
  slicer3D: 4,
  callbackOnly: 5,
  roiSelection: 6,
  angle: 7,
  crosshair: 8,
  windowing: 9,
} as const;

export const SHOW_RENDER = {
  NEVER: 0,
  ALWAYS: 1,
  AUTO: 2,
} as const;

export function createMockNiivue() {
  return {
    attachToCanvas: vi.fn(() => Promise.resolve()),
    addVolumeFromUrl: vi.fn((opts: { url: string }) =>
      Promise.resolve({ url: opts.url, name: opts.url }),
    ),
    broadcastTo: vi.fn(),
    setSliceType: vi.fn(),
    setCustomLayout: vi.fn(),
    clearCustomLayout: vi.fn(),
    setMouseEventConfig: vi.fn(),
    resizeListener: vi.fn(),
    removeVolume: vi.fn(),
    removeVolumeByIndex: vi.fn(),
    removeMesh: vi.fn(),
    updateGLVolume: vi.fn(),
    setOpacity: vi.fn(),
    setCrosshairColor: vi.fn(),
    setInterpolation: vi.fn(),
    setDrawingEnabled: vi.fn(),
    drawUndo: vi.fn(),
    saveImage: vi.fn(),
    loadVolumes: vi.fn(() => Promise.resolve()),
    loadMeshes: vi.fn(() => Promise.resolve()),
    loadDocument: vi.fn(() => Promise.resolve()),
    addVolume: vi.fn(),
    meshShaderNames: vi.fn(() => ["Phong"]),
    setDefaults: vi.fn(),
    onLocationChange: null as ((data: unknown) => void) | null,
    onImageLoaded: null as ((vol: unknown) => void) | null,
    onDragRelease: null as (() => void) | null,
    onOptsChange: null as (() => void) | null,
    volumes: [] as unknown[],
    meshes: [] as unknown[],
    drawBitmap: null as unknown,
    overlayOutlineWidth: 0,
    canvas: null as HTMLCanvasElement | null,
    opts: {
      dragAndDropEnabled: true,
      crosshairWidth: 1,
      crosshairGap: 0,
      crosshairColor: [1.0, 0.0, 0.0, 0.5],
      rulerWidth: 1.0,
      isRuler: false,
      isNearestInterpolation: false,
      dragMode: DRAG_MODE.contrast,
      sliceType: SLICE_TYPE.MULTIPLANAR,
      multiplanarShowRender: SHOW_RENDER.NEVER,
      multiplanarForceRender: false,
      clickToSegmentPercent: 0.05,
      clickToSegmentMaxDistanceMM: 15,
    },
    _gl: {
      getExtension: vi.fn(() => ({ loseContext: vi.fn() })),
    },
  };
}

export const mockInstances: ReturnType<typeof createMockNiivue>[] = [];

export function clearMockInstances(): void {
  mockInstances.length = 0;
}

export class Niivue {
  [key: string]: unknown;

  constructor(_opts?: unknown) {
    const instance = createMockNiivue();
    Object.assign(this, instance);
    mockInstances.push(instance);
  }
}

export class NVImage {
  static loadFromBase64 = vi.fn(() => Promise.resolve(new NVImage()));
}

export class NVDocument {
  static loadFromJSON = vi.fn(() => {
    const doc = new NVDocument();
    (doc as any).fetchLinkedData = vi.fn(() => Promise.resolve());
    return Promise.resolve(doc);
  });
  volumes: unknown[] = [];
}

export const cmapper = {
  colorMaps: () => ["gray", "hot", "cool", "winter"],
};

export type DocumentData = Record<string, unknown>;
