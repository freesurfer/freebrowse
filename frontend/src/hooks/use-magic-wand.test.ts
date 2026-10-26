import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

// magicWand spawns a Web Worker (?worker&inline) — unavailable under happy-dom,
// so mock the module and drive the orchestration with a deterministic result.
vi.mock("@niivue/nv-ext-drawing", () => ({ magicWand: vi.fn() }));

import { magicWand } from "@niivue/nv-ext-drawing";
import { NiiVue } from "@/__mocks__/niivue";
import { useFreeBrowseStore } from "@/store";
import type { DrawingOptions } from "@/store/types";
import { runMagicWand, useMagicWand } from "./use-magic-wand";

const mockedMagicWand = vi.mocked(magicWand);

const wandResult = (bitmap: Uint8Array) => ({
  bitmap,
  result: {
    filledCount: 0,
    seedIntensity: 0,
    intensityMin: 0,
    intensityMax: 0,
  },
});

const DEFAULT: DrawingOptions = {
  enabled: true,
  mode: "wand",
  penValue: 7,
  penFill: true,
  penErases: false,
  opacity: 1.0,
  colormap: "_draw",
  magicWand2dOnly: true,
  magicWandMaxDistanceMM: 15,
  magicWandThresholdPercent: 0.05,
  filename: "drawing.nii.gz",
};

/** Fake extension context shaped like the fields runMagicWand reads. */
function fakeCtx(opts: { drawing?: boolean; imgRAS?: boolean } = {}) {
  const calls: string[] = [];
  const update = vi.fn(() => {
    calls.push("update");
  });
  const pushUndo = vi.fn(() => {
    calls.push("pushUndo");
  });
  const drawing =
    (opts.drawing ?? true)
      ? {
          bitmap: new Uint8Array(8),
          dims: { dimX: 2, dimY: 2, dimZ: 2 },
          voxelSizeMM: [1, 1, 1] as [number, number, number],
          update,
          pushUndo,
        }
      : null;
  const backgroundVolume = {
    imgRAS: (opts.imgRAS ?? true) ? new Float32Array(8) : null,
    calMin: 10,
    calMax: 200,
    dims: { dimX: 2, dimY: 2, dimZ: 2 },
    voxelSizeMM: [1, 1, 1] as [number, number, number],
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ctx: { drawing, backgroundVolume } as any, update, pushUndo, calls };
}

describe("runMagicWand — orchestration", () => {
  beforeEach(() => {
    mockedMagicWand.mockReset();
  });

  test("builds MagicWandOptions from drawingOptions + volume, applies result", async () => {
    const returned = new Uint8Array([9, 9]);
    mockedMagicWand.mockResolvedValue(wandResult(returned));
    const { ctx, update } = fakeCtx();

    await runMagicWand(ctx, DEFAULT, [1, 2, 3], 2);

    expect(mockedMagicWand).toHaveBeenCalledTimes(1);
    const [seed, bitmap, dims, imgRAS, options, voxelSizeMM] =
      mockedMagicWand.mock.calls[0];
    expect(seed).toEqual([1, 2, 3]);
    expect(bitmap).toBe(ctx.drawing.bitmap);
    expect(dims).toEqual({ dimX: 2, dimY: 2, dimZ: 2 });
    expect(imgRAS).toBe(ctx.backgroundVolume.imgRAS);
    expect(voxelSizeMM).toEqual([1, 1, 1]);
    expect(options).toMatchObject({
      thresholdMode: "auto",
      percent: 0.05,
      calMin: 10,
      calMax: 200,
      maxDistanceMM: 15,
      is2D: true,
      sliceAxis: 2, // == sliceType passed in
      penValue: 7,
    });
    expect(update).toHaveBeenCalledWith(returned);
  });

  test("sliceAxis follows the clicked sliceType", async () => {
    mockedMagicWand.mockResolvedValue(wandResult(new Uint8Array()));
    const { ctx } = fakeCtx();
    await runMagicWand(ctx, DEFAULT, [0, 0, 0], 1);
    expect(mockedMagicWand.mock.calls[0][4]).toMatchObject({ sliceAxis: 1 });
  });

  test("pushes one undo snapshot, before the fill is applied", async () => {
    mockedMagicWand.mockResolvedValue({
      bitmap: new Uint8Array(8),
      result: {},
    } as never);
    const { ctx, pushUndo, calls } = fakeCtx();
    await runMagicWand(ctx, DEFAULT, [0, 0, 0], 0);
    expect(pushUndo).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["pushUndo", "update"]); // snapshot the pre-fill bitmap
  });

  test("no-op without a drawing layer", async () => {
    const { ctx, update, pushUndo } = fakeCtx({ drawing: false });
    await runMagicWand(ctx, DEFAULT, [0, 0, 0], 0);
    expect(mockedMagicWand).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(pushUndo).not.toHaveBeenCalled();
  });

  test("no-op without background imgRAS", async () => {
    const { ctx, update } = fakeCtx({ imgRAS: false });
    await runMagicWand(ctx, DEFAULT, [0, 0, 0], 0);
    expect(mockedMagicWand).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});

describe("useMagicWand — slicePointerUp wiring", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refOf = (nv: NiiVue) => ({ current: nv }) as any;

  const emitClick = async (nv: NiiVue, voxel: number[], sliceType: number) =>
    act(async () => {
      nv.emit("slicePointerUp", { voxel, sliceType });
      await Promise.resolve();
    });

  beforeEach(() => {
    mockedMagicWand.mockReset();
    mockedMagicWand.mockResolvedValue(wandResult(new Uint8Array([1])));
    useFreeBrowseStore.setState({ drawingOptions: { ...DEFAULT } });
  });

  test("wand mode: a slice click seeds magicWand with the clicked voxel/axis", async () => {
    const nv = new NiiVue();
    nv.volumes.push({ id: "vol-0" });
    nv.createEmptyDrawing();
    renderHook(() => useMagicWand(refOf(nv)));

    await emitClick(nv, [4, 5, 6], 1);

    expect(mockedMagicWand).toHaveBeenCalledTimes(1);
    expect(mockedMagicWand.mock.calls[0][0]).toEqual([4, 5, 6]);
    expect(mockedMagicWand.mock.calls[0][4]).toMatchObject({ sliceAxis: 1 });
  });

  test("non-wand mode: click is ignored", async () => {
    useFreeBrowseStore.setState({
      drawingOptions: { ...DEFAULT, mode: "pen" },
    });
    const nv = new NiiVue();
    nv.volumes.push({ id: "vol-0" });
    nv.createEmptyDrawing();
    renderHook(() => useMagicWand(refOf(nv)));

    await emitClick(nv, [0, 0, 0], 0);
    expect(mockedMagicWand).not.toHaveBeenCalled();
  });

  test("no drawing layer: click is ignored", async () => {
    const nv = new NiiVue();
    nv.volumes.push({ id: "vol-0" }); // volume present, but no drawing layer
    renderHook(() => useMagicWand(refOf(nv)));

    await emitClick(nv, [0, 0, 0], 0);
    expect(mockedMagicWand).not.toHaveBeenCalled();
  });

  test("teardown removes the subscription", async () => {
    const nv = new NiiVue();
    nv.volumes.push({ id: "vol-0" });
    nv.createEmptyDrawing();
    const { unmount } = renderHook(() => useMagicWand(refOf(nv)));

    unmount();
    await emitClick(nv, [0, 0, 0], 0);
    expect(mockedMagicWand).not.toHaveBeenCalled();
  });
});

describe("useMagicWand — hover preview (4c.2)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refOf = (nv: NiiVue) => ({ current: nv }) as any;

  const move = (nv: NiiVue, voxel: number[], sliceType = 0) =>
    act(async () => {
      nv.emit("slicePointerMove", { voxel, sliceType });
      await Promise.resolve();
    });

  /** A ready-to-draw instance: one volume + an active drawing layer, wired. */
  function ready(): NiiVue {
    const nv = new NiiVue();
    nv.volumes.push({ id: "vol-0" });
    nv.createEmptyDrawing();
    renderHook(() => useMagicWand(refOf(nv)));
    return nv;
  }

  beforeEach(() => {
    mockedMagicWand.mockReset();
    // Preview result is length 1 — distinct from the committed base (the mock
    // drawing bitmap, length 8) so we can prove previews flood from committed.
    mockedMagicWand.mockResolvedValue(wandResult(new Uint8Array([1])));
    useFreeBrowseStore.setState({ drawingOptions: { ...DEFAULT } });
  });

  test("hover previews the fill at the pointer", async () => {
    const nv = ready();
    await move(nv, [1, 1, 1]);
    expect(mockedMagicWand).toHaveBeenCalledTimes(1);
    expect(mockedMagicWand.mock.calls[0][0]).toEqual([1, 1, 1]);
  });

  test("previews flood from the committed snapshot, not the prior preview", async () => {
    const nv = ready();
    await act(async () => {
      nv.emit("slicePointerMove", { voxel: [1, 1, 1], sliceType: 0 });
      nv.emit("slicePointerMove", { voxel: [2, 2, 2], sliceType: 0 });
    });
    await vi.waitFor(() => expect(mockedMagicWand).toHaveBeenCalledTimes(2));
    // The committed base (drawBitmap arg) is the drawing bitmap (length 8) on
    // BOTH calls — never the length-1 preview the first call returned.
    expect(mockedMagicWand.mock.calls[0][1]).toHaveLength(8);
    expect(mockedMagicWand.mock.calls[1][1]).toHaveLength(8);
    expect(mockedMagicWand.mock.calls[1][0]).toEqual([2, 2, 2]);
  });

  test("leave restores the committed bitmap (clears the preview)", async () => {
    const nv = ready();
    const updates: (string | undefined)[] = [];
    nv.addEventListener("drawingChanged", (e) =>
      updates.push((e as CustomEvent).detail?.action),
    );
    await move(nv, [1, 1, 1]);
    await vi.waitFor(() =>
      expect(updates.filter((a) => a === "update")).toHaveLength(1),
    );
    await act(async () => {
      nv.emit("slicePointerLeave");
      await Promise.resolve();
    });
    expect(updates.filter((a) => a === "update")).toHaveLength(2); // preview + restore
  });

  test("click after a preview commits by keeping it (no extra flood), with one undo snapshot", async () => {
    const nv = ready();
    const updates: (string | undefined)[] = [];
    nv.addEventListener("drawingChanged", (e) =>
      updates.push((e as CustomEvent).detail?.action),
    );
    await move(nv, [1, 1, 1]);
    await vi.waitFor(() => expect(mockedMagicWand).toHaveBeenCalledTimes(1));
    expect(nv.undoPushes).toBe(0); // previews never push
    await act(async () => {
      nv.emit("slicePointerUp", { voxel: [1, 1, 1], sliceType: 0 });
      await Promise.resolve();
    });
    expect(mockedMagicWand).toHaveBeenCalledTimes(1); // kept, not recomputed
    expect(nv.undoPushes).toBe(1); // ... but made undoable:
    // preview, then restore the pre-preview bitmap, push, re-apply the preview.
    expect(updates.filter((a) => a === "update")).toHaveLength(3);
  });

  test("external drawing edit (undo) drops the snapshot so leave won't clobber", async () => {
    const nv = ready();
    const actions: (string | undefined)[] = [];
    nv.addEventListener("drawingChanged", (e) =>
      actions.push((e as CustomEvent).detail?.action),
    );
    await move(nv, [1, 1, 1]);
    await vi.waitFor(() => expect(actions).toContain("update")); // preview applied

    await act(async () => {
      nv.drawUndo(); // external edit → drawingChanged 'undo' → snapshot invalidated
    });
    const before = actions.filter((a) => a === "update").length;
    await act(async () => {
      nv.emit("slicePointerLeave");
      await Promise.resolve();
    });
    // Snapshot was dropped, so leave restores nothing (no extra 'update').
    expect(actions.filter((a) => a === "update")).toHaveLength(before);
  });
});
