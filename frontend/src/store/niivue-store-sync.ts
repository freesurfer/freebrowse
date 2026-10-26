import { DRAG_MODE } from "@niivue/niivue";

import { sliceTypeMap } from "@/lib/niivue-helpers";
import { useFreeBrowseStore } from "@/store";
import type { DragMode } from "@/components/drag-mode-selector";
import type { ViewerOptions, ViewMode } from "@/store/types";
import type { NiiVueEventSource, NiiVueSyncTarget } from "./niivue-sync";

/**
 * Concrete NiiVueSyncTarget backed by the FreeBrowse Zustand store.
 *
 * This is the adapter that makes the store a *derived view* of niivue state:
 * `registerNiiVueEvents(nv, createStoreSyncTarget(nv))` routes every relevant
 * niivue event into the store, translating niivue-mono property names/values
 * into FreeBrowse's store shape. Because both FreeBrowse's own command wrappers
 * and external callers (e.g. `window.freebrowse.nv`) drive niivue through the
 * same events, the UI follows either path identically.
 *
 * The volume/surface UI reads live `nv.volumes`/`nv.meshes` and re-renders on a
 * version-counter bump, so those events bump the counter rather than mirroring
 * a list into the store. Viewer options and location are mirrored into store
 * slices.
 */

/** niivue reader surface this adapter needs beyond the event target. */
export type NiiVueReader = NiiVueEventSource & {
  sliceType: number;
  showRender: number;
  // Flat settings mirrored into viewerOptions (read back by readViewerFromNiiVue).
  crosshairWidth?: number;
  crosshairGap?: number;
  crosshairColor?: number[];
  rulerWidth?: number;
  isRulerVisible?: boolean;
  volumeIsNearestInterpolation?: boolean;
  volumeOutlineWidth?: number;
  isColorbarVisible?: boolean;
  isRadiological?: boolean;
  secondaryDragMode?: number;
};

/** Minimal mesh shape read when rebuilding the surfaces list. */
type MeshLike = {
  name?: string;
  opacity?: number;
  color?: [number, number, number, number];
  shaderType?: string;
};

/** niivue mesh color is 0-1 RGBA; the surface UI uses 0-255. */
function colorToRgba255(
  color?: [number, number, number, number],
): [number, number, number, number] {
  if (!color) return [255, 255, 0, 255];
  return [
    Math.round(color[0] * 255),
    Math.round(color[1] * 255),
    Math.round(color[2] * 255),
    Math.round(color[3] * 255),
  ];
}

function dragModeName(value: unknown): DragMode {
  const match = Object.entries(DRAG_MODE).find(([, v]) => v === value);
  return (match?.[0] as DragMode) ?? "contrast";
}

function viewModeFromNiiVue(nv: NiiVueReader): ViewMode {
  // ACS vs ACSR differ only by showRender, so match on both.
  const exact = Object.entries(sliceTypeMap).find(
    ([, cfg]) =>
      cfg.sliceType === nv.sliceType && cfg.showRender === nv.showRender,
  );
  if (exact) return exact[0] as ViewMode;
  const bySlice = Object.entries(sliceTypeMap).find(
    ([, cfg]) => cfg.sliceType === nv.sliceType,
  );
  return (bySlice?.[0] as ViewMode) ?? "ACS";
}

/**
 * The niivue flat setting -> viewerOptions mapping, in one place. Used by the
 * `change` event handler (one property at a time) and by `readViewerFromNiiVue`
 * (all of them at once) so the two can never disagree. Returns null for a
 * property FreeBrowse has no UI for.
 *
 * NOTE: crosshairWidth/crosshairVisible are store-owned UI state and are NOT
 * mirrored from `change` events: niivue only has one crosshairWidth (0 ==
 * hidden), so deriving it back would lose the remembered width while hidden.
 * The use-viewer-options handlers own that pair. `readViewerFromNiiVue` does
 * read it once, when seeding from a host-owned instance, since there is no
 * remembered width to lose yet.
 */
function viewerPatchFor(
  nv: NiiVueReader,
  property: string,
  value: unknown,
): Partial<ViewerOptions> | null {
  switch (property) {
    case "crosshairGap":
      return { crosshairGap: value as number };
    case "crosshairColor":
      return { crosshairColor: value as ViewerOptions["crosshairColor"] };
    case "rulerWidth":
      return { rulerWidth: value as number };
    case "isRulerVisible":
      return { rulerVisible: value as boolean };
    case "volumeIsNearestInterpolation":
      return { interpolateVoxels: !value };
    case "volumeOutlineWidth":
      return { overlayOutlineWidth: value as number };
    case "isColorbarVisible":
      return { isColorbar: value as boolean };
    case "isRadiological":
      return { isRadiologicalConvention: value as boolean };
    case "secondaryDragMode":
      return { dragMode: dragModeName(value) };
    case "sliceType":
    case "showRender":
      return { viewMode: viewModeFromNiiVue(nv) };
    default:
      return null;
  }
}

const MIRRORED_PROPS = [
  "crosshairGap",
  "crosshairColor",
  "rulerWidth",
  "isRulerVisible",
  "volumeIsNearestInterpolation",
  "volumeOutlineWidth",
  "isColorbarVisible",
  "isRadiological",
  "secondaryDragMode",
  "sliceType",
] as const;

/**
 * Read the instance's current settings as a viewerOptions patch — the
 * nv -> store direction, for seeding the store from an instance the host
 * built (so FreeBrowse never pushes its own defaults onto it). Only settings
 * the instance actually reports (not undefined) are included, so a partial
 * reader (or the test mock) leaves the rest of the store alone.
 */
export function readViewerFromNiiVue(nv: NiiVueReader): Partial<ViewerOptions> {
  const patch: Partial<ViewerOptions> = {};
  for (const prop of MIRRORED_PROPS) {
    const value = (nv as unknown as Record<string, unknown>)[prop];
    if (value === undefined) continue;
    Object.assign(patch, viewerPatchFor(nv, prop, value));
  }
  if (typeof nv.crosshairWidth === "number") {
    if (nv.crosshairWidth > 0) {
      patch.crosshairVisible = true;
      patch.crosshairWidth = nv.crosshairWidth;
    } else {
      patch.crosshairVisible = false;
    }
  }
  return patch;
}

export function createStoreSyncTarget(nv: NiiVueReader): NiiVueSyncTarget {
  const store = () => useFreeBrowseStore.getState();
  const patchViewer = (partial: Record<string, unknown>) =>
    store().setViewerOptions((prev) => ({ ...prev, ...partial }));

  return {
    onViewerOptionChange(property, value) {
      // Map niivue-mono flat property names -> FreeBrowse viewerOptions (see
      // viewerPatchFor). Properties FreeBrowse has no UI for fall through.
      const patch = viewerPatchFor(nv, property, value);
      if (patch) patchViewer(patch);
    },

    onDrawingOptionChange(property, value) {
      // Only the event-mirrored drawing fields are handled here. penValue/mode/
      // penErases are store-owned (drawPenValue is a derived value that would
      // clobber penValue on erase), and `enabled` follows drawingChanged
      // (drawingVolume presence), not drawIsEnabled (pointer painting).
      const s = store();
      switch (property) {
        case "drawOpacity":
          s.setDrawingOptions((prev) => ({
            ...prev,
            opacity: value as number,
          }));
          break;
        case "drawColormap":
          s.setDrawingOptions((prev) => ({
            ...prev,
            colormap: value as string,
          }));
          break;
        default:
          break;
      }
    },

    onVolumesChanged(volumes) {
      // The sidebar/scene UI reads live nv.volumes; bump the version to re-render.
      const s = store();
      s.incrementVolumeVersion();
      // The drop zone covers the canvas until something is loaded. FreeBrowse's
      // own load paths hide it before loading; a volume added straight through
      // the niivue API (an embedding host, the console) must hide it too, or the
      // canvas is never mounted and nothing renders.
      if (volumes.length > 0 && s.showUploader) s.setShowUploader(false);
    },

    onVolumeUpdated() {
      store().incrementVolumeVersion();
    },

    onSurfacesChanged() {
      // Rebuild the derived surfaces list from live nv.meshes (the old
      // updateSurfaceDetails, now event-driven). niivue-mono emits *Removed
      // BEFORE mutating the model (the removed item is still present at emit
      // time), so read nv.meshes on a microtask — after the synchronous
      // add/remove completes — to capture the post-mutation list. (Volumes
      // avoid this by reading nv.volumes at render via the version counter.)
      queueMicrotask(() => {
        const meshes = nv.meshes as MeshLike[];
        store().setSurfaces(
          meshes.map((mesh, index) => ({
            id: `surface-${index}`,
            name: mesh.name || `Surface ${index + 1}`,
            // niivue-mono does not render a mesh `visible` flag, so FreeBrowse
            // models surface visibility via opacity (0 == hidden), like volumes.
            visible: (mesh.opacity ?? 1.0) > 0,
            opacity: mesh.opacity ?? 1.0,
            rgba255: colorToRgba255(mesh.color),
            shaderType: mesh.shaderType || "phong",
          })),
        );
        store().incrementLayerVersion();
      });
    },

    onDrawingChanged() {
      // `enabled` == a drawing layer exists (create/load -> present, close ->
      // gone). drawingChanged fires on create/stroke/undo/close/load, so read
      // drawingVolume presence each time.
      const hasDrawing =
        (nv as { drawingVolume?: unknown }).drawingVolume != null;
      store().setDrawingOptions((prev) => ({ ...prev, enabled: hasDrawing }));
      store().incrementVolumeVersion(); // the drawing bitmap changed; repaint
    },

    onLocationChange(location) {
      const detail = location as {
        mm?: [number, number, number];
        values?: {
          name?: string;
          value?: number;
          vox?: [number, number, number];
        }[];
      } | null;
      if (!detail) return;
      const voxels = (detail.values ?? []).map((v, index) => {
        const vox = v.vox ?? [0, 0, 0];
        return {
          name: v.name || `Volume ${index + 1}`,
          voxel: [
            Math.round(vox[0]),
            Math.round(vox[1]),
            Math.round(vox[2]),
          ] as [number, number, number],
          value: v.value ?? 0,
        };
      });
      store().setLocationData({ mm: detail.mm ?? [0, 0, 0], voxels });
    },

    onDocumentLoaded() {
      // A document load adds volumes/meshes without per-item events, so bump
      // both versions to make the volume + surface UI re-read. Settings the
      // document applied are NOT resynced here: that waits on upstream `change`
      // events for loadDocument (migration plan Step 8, item 8d).
      store().incrementVolumeVersion();
      store().incrementLayerVersion();
    },

    onColormapAdded() {
      // No store field: the UI reads nv.colormaps on demand. No-op.
    },
  };
}
