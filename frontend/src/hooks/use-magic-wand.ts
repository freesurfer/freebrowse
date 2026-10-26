import { useEffect, useRef } from "react";
import { magicWand, type MagicWandOptions } from "@niivue/nv-ext-drawing";
import type {
  BackgroundVolumeAccess,
  DrawingChangedDetail,
  NiiVue,
  NVExtensionContext,
  SlicePointerEvent,
} from "@niivue/niivue";
import { useFreeBrowseStore } from "@/store";
import type { DrawingOptions } from "@/store/types";

/**
 * Magic-wand (click-to-segment) rebuilt on `@niivue/nv-ext-drawing` (Phase 4c):
 * an intensity flood-fill seeded from the pointer, painted into the active
 * drawing layer, honoring the store's threshold / 2D-only / max-distance params.
 * niivue-mono has grown its own click-to-segment wand since (`draw.isClickToSegment`),
 * but the extension is what gives us the hover preview and the max-distance
 * limit, so FreeBrowse stays on it.
 *
 * **Hover preview (4c.2):** the fill previews live as the pointer moves and only
 * commits on click. niivue-mono has no separate preview overlay — the preview
 * *is* the drawing bitmap, temporarily. We keep a `committed` snapshot of the
 * pre-preview drawing and always flood FROM it (never from the current preview,
 * so previews don't accumulate); leaving restores the snapshot, clicking makes
 * the preview permanent. All fills apply via `ctx.drawing.update`, which emits
 * `drawingChanged {action:'update'}` — the store adapter repaints, so no adapter
 * change is needed here.
 *
 * This uses the copy-based `magicWand` (worker via postMessage) for both preview
 * and commit — no headers, works in every build target incl. `file://`. The
 * zero-copy `MagicWandShared` preview (faster on large volumes, needs COOP/COEP)
 * is a Phase 7 perf upgrade.
 *
 * **Undo:** every committed fill pushes one undo snapshot first
 * (`ctx.drawing.pushUndo()`, niivue-mono >= the drawing-undo-snapshot branch), so
 * the drawing tab's Undo reverts a wand fill like a pen stroke. Previews never
 * push. On the preview-then-click path the preview is already in the drawing,
 * so the commit puts the pre-preview bitmap back, pushes, then re-applies it.
 */

function buildWandOptions(
  opts: DrawingOptions,
  bg: BackgroundVolumeAccess,
  sliceType: number,
): MagicWandOptions {
  return {
    thresholdMode: "auto", // bright/dark auto-picked around the seed via calMin/calMax
    percent: opts.magicWandThresholdPercent, // == old clickToSegmentPercent
    calMin: bg.calMin,
    calMax: bg.calMax,
    maxDistanceMM: opts.magicWandMaxDistanceMM,
    is2D: opts.magicWand2dOnly,
    sliceAxis: sliceType, // 0/1/2 axial/coronal/sagittal, matches sliceType
    penValue: opts.penValue, // wand writes the current pen value
  };
}

/**
 * Flood from the drawing layer's *current* bitmap and apply the result. Used for
 * the one-shot commit path (a click with no preceding hover preview). Exported
 * for unit testing against a fake ctx. Guards on drawing/volume so a click before
 * a layer/volume exists is a no-op.
 */
export async function runMagicWand(
  ctx: NVExtensionContext,
  opts: DrawingOptions,
  seed: [number, number, number],
  sliceType: number,
): Promise<void> {
  const bg = ctx.backgroundVolume;
  const drawing = ctx.drawing;
  if (!bg?.imgRAS || !drawing) return;
  const { bitmap } = await magicWand(
    seed,
    drawing.bitmap,
    drawing.dims,
    bg.imgRAS,
    buildWandOptions(opts, bg, sliceType),
    drawing.voxelSizeMM,
  );
  drawing.pushUndo(); // one snapshot per committed fill
  drawing.update(bitmap);
}

/**
 * Wires the wand engine to the niivue instance. One extension context per
 * instance; params are read imperatively at event time (so changing them never
 * re-subscribes).
 */
export function useMagicWand(nvRef: React.RefObject<NiiVue | null>): void {
  // Snapshot of the drawing bitmap before the active preview (null = no active
  // preview; the live drawing bitmap is the truth). Flood base for previews.
  const committedRef = useRef<Uint8Array | null>(null);
  // One worker call in flight at a time; latest hovered seed waits its turn.
  const busyRef = useRef(false);
  const pendingRef = useRef<{
    seed: [number, number, number];
    sliceType: number;
  } | null>(null);
  // Bumped on leave / external edit; a preview whose gen changed mid-flight is
  // discarded instead of painting a stale region.
  const genRef = useRef(0);

  useEffect(() => {
    const nv = nvRef.current;
    if (!nv) return;
    const ctx = nv.createExtensionContext();
    const opts = () => useFreeBrowseStore.getState().drawingOptions;

    // Flood from the committed snapshot and paint the preview.
    const previewAt = async (
      seed: [number, number, number],
      sliceType: number,
    ): Promise<void> => {
      const drawing = ctx.drawing;
      const bg = ctx.backgroundVolume;
      if (!drawing || !bg?.imgRAS) return;
      if (committedRef.current == null) {
        committedRef.current = drawing.bitmap.slice(); // snapshot the truth
      }
      const myGen = genRef.current;
      const { bitmap } = await magicWand(
        seed,
        committedRef.current, // magicWand copies its buffer, so this stays intact
        drawing.dims,
        bg.imgRAS,
        buildWandOptions(opts(), bg, sliceType),
        drawing.voxelSizeMM,
      );
      if (myGen !== genRef.current) return; // left / invalidated mid-flight
      drawing.update(bitmap);
    };

    // Process the latest pending position; re-pump when the worker frees up.
    const pump = (): void => {
      if (busyRef.current) return;
      const p = pendingRef.current;
      if (!p) return;
      pendingRef.current = null;
      busyRef.current = true;
      void previewAt(p.seed, p.sliceType).finally(() => {
        busyRef.current = false;
        pump();
      });
    };

    const onMove = (e: CustomEvent<SlicePointerEvent>): void => {
      if (opts().mode !== "wand") return;
      if (!ctx.drawing || !ctx.backgroundVolume?.imgRAS) return;
      pendingRef.current = {
        seed: e.detail.voxel,
        sliceType: e.detail.sliceType,
      };
      pump();
    };

    const onLeave = (): void => {
      genRef.current++; // discard any in-flight preview
      pendingRef.current = null;
      if (committedRef.current != null) {
        ctx.drawing?.update(committedRef.current); // clear the preview
        committedRef.current = null;
      }
    };

    const onUp = (e: CustomEvent<SlicePointerEvent>): void => {
      if (opts().mode !== "wand") return;
      if (!ctx.drawing || !ctx.backgroundVolume?.imgRAS) return;
      pendingRef.current = null;
      if (committedRef.current != null) {
        // An active preview already shows the fill at this location — commit
        // it. The preview is already in the drawing, so to make the commit
        // undoable: put the pre-preview bitmap back, push the undo snapshot,
        // re-apply the preview. Any in-flight preview is intentionally NOT
        // discarded (it lands the same commit); the snapshot is dropped so the
        // next hover re-snapshots.
        const drawing = ctx.drawing;
        const preview = drawing.bitmap.slice();
        drawing.update(committedRef.current);
        drawing.pushUndo();
        drawing.update(preview);
        committedRef.current = null;
      } else if (!busyRef.current) {
        // No hover preview happened (e.g. a bare click) — one-shot commit.
        busyRef.current = true;
        void runMagicWand(
          ctx,
          opts(),
          e.detail.voxel,
          e.detail.sliceType,
        ).finally(() => {
          busyRef.current = false;
        });
      }
    };

    // External drawing edits (undo/close/load) invalidate the snapshot. Our own
    // preview/commit updates use action 'update', which we ignore.
    const onDrawingChanged = (e: CustomEvent<DrawingChangedDetail>): void => {
      if (e.detail?.action === "update") return;
      genRef.current++;
      committedRef.current = null;
    };

    ctx.on("slicePointerMove", onMove);
    ctx.on("slicePointerUp", onUp);
    ctx.on("slicePointerLeave", onLeave);
    ctx.on("drawingChanged", onDrawingChanged);
    return () => ctx.dispose();
  }, [nvRef]);
}
