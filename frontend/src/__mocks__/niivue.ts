/**
 * niivue-mono (`@niivue/niivue` 1.0.0-rc.*) test double — THE mock.
 *
 * Models the `NiiVue` controller: an `EventTarget` whose flat setters and
 * mutating methods dispatch the same `CustomEvent`s the real controller emits
 * (`change`, `volumeUpdated`, `meshUpdated`, `volumeRemoved`, `drawingChanged`,
 * ...). This is what makes `registerNiiVueEvents` testable without a GPU.
 *
 * Use it in a test with `vi.mock("@niivue/niivue", () => import("@/__mocks__/niivue"))`,
 * or import it directly to drive the event adapter. (The pre-migration mock of
 * classic niivue was retired in Step 7 of the migration plan.)
 */

export const SLICE_TYPE = {
  AXIAL: 0,
  CORONAL: 1,
  SAGITTAL: 2,
  MULTIPLANAR: 3,
  RENDER: 4,
  NONE: 5,
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
  crosshairPan: 10,
} as const;

export const SHOW_RENDER = {
  NEVER: 0,
  ALWAYS: 1,
  AUTO: 2,
} as const;

type MockVolume = Record<string, unknown> & { id?: string; url?: string };
type MockMesh = Record<string, unknown> & { id?: string; url?: string };

/** Flat scalar properties: every set emits a generic `change {property, value}`. */
const CHANGE_PROPS = [
  "showRender",
  "isColorbarVisible",
  "isRadiological",
  "crosshairColor",
  "crosshairWidth",
  "crosshairGap",
  "rulerWidth",
  "isRulerVisible",
  "volumeIsNearestInterpolation",
  "volumeOutlineWidth",
  "secondaryDragMode",
  "scaleMultiplier",
  "isDragDropEnabled",
  "drawOpacity",
  "drawColormap",
  "drawIsFillOverwriting",
] as const;

export class NiiVue extends EventTarget {
  volumes: MockVolume[] = [];
  meshes: MockMesh[] = [];
  drawingVolume: unknown = null;
  drawPenFilled = false; // plain field on the real controller (no event)
  canvas: HTMLCanvasElement | null = null;
  model: { removeVolume: (index: number) => void };

  // Declared (not initialized) so TS sees them; defined via Object.defineProperty
  // in the constructor so each assignment emits a `change` event.
  declare showRender: number;
  declare isColorbarVisible: boolean;
  declare isRadiological: boolean;
  declare crosshairColor: [number, number, number, number];
  declare crosshairWidth: number;
  declare crosshairGap: number;
  declare rulerWidth: number;
  declare isRulerVisible: boolean;
  declare volumeIsNearestInterpolation: boolean;
  declare volumeOutlineWidth: number;
  declare secondaryDragMode: number;
  declare scaleMultiplier: number;
  declare isDragDropEnabled: boolean;
  declare drawOpacity: number;
  declare drawColormap: string;
  declare drawIsFillOverwriting: boolean;

  private _props: Record<string, unknown> = {};

  constructor(opts?: Record<string, unknown>) {
    super();
    void opts;
    // Define generic change-emitting scalar properties.
    for (const prop of CHANGE_PROPS) {
      Object.defineProperty(this, prop, {
        enumerable: true,
        get: () => this._props[prop],
        set: (value: unknown) => {
          this._props[prop] = value;
          this.emit("change", { property: prop, value });
        },
      });
    }
    // model.removeVolume mirrors the (currently) controller-less removal path.
    this.model = {
      removeVolume: (index: number) => {
        this.volumes.splice(index, 1);
      },
    };
  }

  /** Dispatch a CustomEvent — also used by tests to simulate interaction events. */
  emit(name: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  // --- properties with a specific event in addition to `change` ---
  get sliceType(): number {
    return (this._props.sliceType as number) ?? SLICE_TYPE.MULTIPLANAR;
  }
  set sliceType(value: number) {
    this._props.sliceType = value;
    this.emit("change", { property: "sliceType", value });
    this.emit("sliceTypeChange", { sliceType: value });
  }

  get azimuth(): number {
    return (this._props.azimuth as number) ?? 0;
  }
  set azimuth(value: number) {
    this._props.azimuth = value;
    this.emit("change", { property: "azimuth", value });
    this.emit("azimuthElevationChange", {
      azimuth: value,
      elevation: this.elevation,
    });
  }

  get elevation(): number {
    return (this._props.elevation as number) ?? 0;
  }
  set elevation(value: number) {
    this._props.elevation = value;
    this.emit("change", { property: "elevation", value });
    this.emit("azimuthElevationChange", {
      azimuth: this.azimuth,
      elevation: value,
    });
  }

  get drawIsEnabled(): boolean {
    return (this._props.drawIsEnabled as boolean) ?? false;
  }
  set drawIsEnabled(value: boolean) {
    this._props.drawIsEnabled = value;
    this.emit("change", { property: "drawIsEnabled", value });
    this.emit("drawingEnabled", { isEnabled: value });
  }

  get drawPenValue(): number {
    return (this._props.drawPenValue as number) ?? 1;
  }
  set drawPenValue(value: number) {
    this._props.drawPenValue = value;
    this.emit("change", { property: "drawPenValue", value });
    this.emit("penValueChanged", { penValue: value });
  }

  // --- lifecycle ---
  async attachToCanvas(canvas: HTMLCanvasElement): Promise<this> {
    this.canvas = canvas;
    this.emit("viewAttached", { canvas, backend: "webgl2" });
    return this;
  }

  async updateGLVolume(): Promise<void> {}
  drawScene(): void {}

  // --- volumes ---
  async addVolume(opts: { url?: string; name?: string }): Promise<void> {
    const volume: MockVolume = {
      id: `vol-${this.volumes.length}`,
      url: opts.url,
      name: opts.name ?? opts.url,
    };
    this.volumes.push(volume);
    this.emit("volumeLoaded", { volume });
  }

  async loadVolumes(list: { url?: string; name?: string }[]): Promise<void> {
    for (const opts of list) await this.addVolume(opts);
  }

  removeVolume(index: number): void {
    // Emit BEFORE removal, matching real niivue-mono (item present at emit time).
    const volume = this.volumes[index];
    this.emit("volumeRemoved", { volume, index });
    this.volumes.splice(index, 1);
  }

  async setVolume(
    index: number,
    changes: Record<string, unknown>,
  ): Promise<void> {
    const volume = this.volumes[index];
    if (!volume) return;
    Object.assign(volume, changes);
    this.emit("volumeUpdated", { volumeIndex: index, volume, changes });
  }

  async setFrame4D(id: string, frame: number): Promise<void> {
    const volume = this.volumes.find((v) => v.id === id);
    if (!volume) return;
    volume.frame4D = frame;
    this.emit("frameChange", { volume, frame });
  }

  async saveVolume(_options?: Record<string, unknown>): Promise<Uint8Array> {
    // Returns raw NIfTI-ish bytes (filename '' path). Enough for command tests.
    return new Uint8Array([1, 2, 3, 4]);
  }

  async setColormapLabel(index: number, cmap: unknown): Promise<void> {
    const volume = this.volumes[index];
    if (!volume) return;
    volume.colormapLabel = cmap;
    this.emit("volumeUpdated", {
      volumeIndex: index,
      volume,
      changes: { colormapLabel: cmap },
    });
  }

  private emitOrder(): void {
    this.emit("volumeOrderChanged", { volumes: this.volumes });
  }
  async moveVolumeUp(index: number): Promise<void> {
    if (index <= 0) return;
    const [v] = this.volumes.splice(index, 1);
    this.volumes.splice(index - 1, 0, v);
    this.emitOrder();
  }
  async moveVolumeToTop(index: number): Promise<void> {
    const [v] = this.volumes.splice(index, 1);
    this.volumes.unshift(v);
    this.emitOrder();
  }

  // --- meshes & layers ---
  async loadMeshes(list: Record<string, unknown>[]): Promise<void> {
    for (const opts of list) await this.addMesh(opts);
  }

  async addMesh(opts: Record<string, unknown>): Promise<void> {
    // Real niivue-mono meshes have NO id (unlike volumes); don't fake one, so
    // tests can't rely on it.
    const mesh: MockMesh = { ...opts };
    if (!mesh.layers) mesh.layers = [];
    this.meshes.push(mesh);
    this.emit("meshLoaded", { mesh });
  }

  removeMesh(index: number): void {
    // Emit BEFORE removal, matching real niivue-mono.
    const mesh = this.meshes[index];
    this.emit("meshRemoved", { mesh, index });
    this.meshes.splice(index, 1);
  }

  async setMesh(
    index: number,
    changes: Record<string, unknown>,
  ): Promise<void> {
    const mesh = this.meshes[index];
    if (!mesh) return;
    Object.assign(mesh, changes);
    this.emit("meshUpdated", { meshIndex: index, mesh, changes });
  }

  // Layer ops emit meshUpdated (per the planned event-coverage PR).
  async addMeshLayer(
    index: number,
    layer: Record<string, unknown>,
  ): Promise<void> {
    const mesh = this.meshes[index];
    if (!mesh) return;
    const layers = (mesh.layers as Record<string, unknown>[]) ?? [];
    layers.push(layer);
    mesh.layers = layers;
    this.emit("meshUpdated", {
      meshIndex: index,
      mesh,
      changes: { layers },
    });
  }

  async removeMeshLayer(index: number, layerIndex: number): Promise<void> {
    const mesh = this.meshes[index];
    if (!mesh) return;
    const layers = (mesh.layers as Record<string, unknown>[]) ?? [];
    layers.splice(layerIndex, 1);
    this.emit("meshUpdated", { meshIndex: index, mesh, changes: { layers } });
  }

  async setMeshLayerProperty(
    index: number,
    layerIndex: number,
    changes: Record<string, unknown>,
  ): Promise<void> {
    const mesh = this.meshes[index];
    if (!mesh) return;
    const layers = (mesh.layers as Record<string, unknown>[]) ?? [];
    if (layers[layerIndex]) Object.assign(layers[layerIndex], changes);
    this.emit("meshUpdated", { meshIndex: index, mesh, changes: { layers } });
  }

  // --- drawing ---
  createEmptyDrawing(): void {
    this.drawingVolume = { id: "drawing" };
    this.emit("drawingChanged", { action: "create" });
  }
  closeDrawing(): void {
    this.drawingVolume = null;
    this.emit("drawingChanged", { action: "close" });
  }
  /** Undo snapshots pushed (by pushUndo / drawAddUndoBitmap) — asserted by tests. */
  undoPushes = 0;
  drawAddUndoBitmap(): void {
    if (!this.drawingVolume) return;
    this.undoPushes++;
  }

  drawUndo(): void {
    this.emit("drawingChanged", { action: "undo" });
  }
  async loadDrawing(source: unknown): Promise<boolean> {
    void source;
    this.drawingVolume = { id: "drawing" };
    // Extended action from the planned event-coverage PR.
    this.emit("drawingChanged", { action: "load" });
    return true;
  }

  // --- documents & colormaps ---
  async loadDocument(
    source: unknown,
    options?: { fill?: unknown },
  ): Promise<void> {
    void source;
    this.lastLoadDocumentOptions = options;
    this.emit("documentLoaded");
  }
  /** Last options passed to `loadDocument`, for test assertions. */
  lastLoadDocumentOptions?: { fill?: unknown };
  serializeDocument(options?: {
    format?: "cbor" | "json";
    linkData?: boolean;
    settings?: unknown;
  }): Uint8Array {
    this.lastSerializeOptions = options;
    if (options?.format === "json") {
      // Minimal but real JSON document, so callers that decode/parse the
      // result (the backend save path) exercise their actual code.
      return new TextEncoder().encode(
        JSON.stringify({ version: 9, volumes: [], meshes: [] }),
      );
    }
    return new Uint8Array();
  }

  /** Last options passed to `serializeDocument`, for test assertions. */
  lastSerializeOptions?: {
    format?: "cbor" | "json";
    linkData?: boolean;
    settings?: unknown;
  };
  addColormap(name: string, cmap: unknown): string {
    void cmap;
    this.emit("colormapAdded", { name });
    return name;
  }

  get colormaps(): string[] {
    return ["gray", "hot", "cool", "winter"];
  }
  get meshShaders(): string[] {
    return ["phong", "matcap", "outline"];
  }

  get drawingColormaps(): string[] {
    return ["_draw", "_itksnap", "_slicer3d"];
  }

  // --- extension context (nv-ext-drawing / magic wand) ---
  createExtensionContext(): MockExtensionContext {
    return new MockExtensionContext(this);
  }
}

/**
 * Minimal stand-in for niivue-mono's NVExtensionContext. `drawing` /
 * `backgroundVolume` are live getters (null until a drawing layer / volume
 * exists, matching the real getters); `on`/`off`/`dispose` subscribe to the
 * controller's EventTarget (tests fire `nv.emit('slicePointerUp', ...)`).
 * `drawing.update` records the last bitmap and emits `drawingChanged` like the
 * real context.
 */
export class MockExtensionContext {
  private _listeners = new Map<string, EventListener>();
  /** Last bitmap passed to drawing.update — asserted by tests. */
  lastUpdate: Uint8Array | null = null;

  private readonly _dims = { dimX: 2, dimY: 2, dimZ: 2 };
  private readonly _drawing = {
    bitmap: new Uint8Array(8),
    dims: this._dims,
    voxelSizeMM: [1, 1, 1] as [number, number, number],
    update: (b: Uint8Array): void => {
      this.lastUpdate = b;
      this.nv.emit("drawingChanged", { action: "update" });
    },
    // Real: pushes the current bitmap onto the controller's undo ring.
    pushUndo: (): void => {
      this.nv.drawAddUndoBitmap();
    },
  };
  private readonly _bg = {
    imgRAS: new Float32Array(8) as Float32Array | null,
    calMin: 0,
    calMax: 100,
    robustMin: 0,
    robustMax: 100,
    dims: this._dims,
    voxelSizeMM: [1, 1, 1] as [number, number, number],
  };

  constructor(private nv: NiiVue) {}

  get drawing() {
    return this.nv.drawingVolume ? this._drawing : null;
  }
  get backgroundVolume() {
    return this.nv.volumes.length > 0 ? this._bg : null;
  }

  on(type: string, listener: (e: CustomEvent) => void): void {
    const l = listener as EventListener;
    this._listeners.set(type, l);
    this.nv.addEventListener(type, l);
  }
  off(type: string, listener?: (e: CustomEvent) => void): void {
    const l = (listener as EventListener) ?? this._listeners.get(type);
    if (l) this.nv.removeEventListener(type, l);
    this._listeners.delete(type);
  }
  dispose(): void {
    for (const [type, l] of this._listeners) {
      this.nv.removeEventListener(type, l);
    }
    this._listeners.clear();
  }
}

export default NiiVue;

// Minimal placeholder types the app imports as values in the new API.
export class NVImage {}
export class NVMesh {}
