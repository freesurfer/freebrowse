import { describe, expect, test } from "vitest";

import {
  DRAG_MODE,
  NiiVue,
  SHOW_RENDER,
  SLICE_TYPE,
} from "@/__mocks__/niivue";
import { useFreeBrowseStore } from "@/store";
import { registerNiiVueEvents } from "./niivue-sync";
import { createStoreSyncTarget, readViewerFromNiiVue } from "./niivue-store-sync";

// The adapter reads sliceType/showRender for viewMode; the v2 mock exposes them.
type Reader = NiiVue & { sliceType: number; showRender: number };

function wire() {
  const nv = new NiiVue() as Reader;
  const teardown = registerNiiVueEvents(nv, createStoreSyncTarget(nv));
  return { nv, teardown };
}

// The surfaces rebuild is deferred to a microtask (so it reads nv.meshes after
// niivue-mono's emit-before-removal). Flush before asserting surface state.
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe("createStoreSyncTarget — niivue events drive the store", () => {
  test("maps flat viewer-option change events into viewerOptions", () => {
    const { nv, teardown } = wire();
    nv.isColorbarVisible = true;
    nv.isRadiological = true;
    nv.volumeIsNearestInterpolation = true;
    nv.rulerWidth = 3;

    const opts = useFreeBrowseStore.getState().viewerOptions;
    expect(opts.isColorbar).toBe(true);
    expect(opts.isRadiologicalConvention).toBe(true);
    expect(opts.interpolateVoxels).toBe(false); // negated
    expect(opts.rulerWidth).toBe(3);
    teardown();
  });

  test("does NOT mirror crosshairWidth back into the store (store-owned)", () => {
    const { nv, teardown } = wire();
    const before = useFreeBrowseStore.getState().viewerOptions.crosshairWidth;
    nv.crosshairWidth = 0; // e.g. hidden — must not clobber the remembered width
    expect(useFreeBrowseStore.getState().viewerOptions.crosshairWidth).toBe(
      before,
    );
    teardown();
  });

  test("translates secondaryDragMode (number) to the dragMode string", () => {
    const { nv, teardown } = wire();
    nv.secondaryDragMode = DRAG_MODE.pan;
    expect(useFreeBrowseStore.getState().viewerOptions.dragMode).toBe("pan");
    teardown();
  });

  test("derives viewMode from sliceType + showRender", () => {
    const { nv, teardown } = wire();
    nv.showRender = SHOW_RENDER.NEVER;
    nv.sliceType = SLICE_TYPE.AXIAL;
    expect(useFreeBrowseStore.getState().viewerOptions.viewMode).toBe("axial");

    nv.sliceType = SLICE_TYPE.MULTIPLANAR; // ACS (showRender NEVER)
    expect(useFreeBrowseStore.getState().viewerOptions.viewMode).toBe("ACS");

    nv.showRender = SHOW_RENDER.ALWAYS; // now ACSR
    expect(useFreeBrowseStore.getState().viewerOptions.viewMode).toBe("ACSR");
    teardown();
  });

  test("bumps volumeVersion on volume load / update / remove", async () => {
    const { nv, teardown } = wire();
    const before = useFreeBrowseStore.getState().volumeVersion;
    await nv.addVolume({ url: "a.nii" });
    await nv.setVolume(0, { colormap: "hot" });
    nv.removeVolume(0);
    // 1 load + 1 update (+1 list refresh) + 1 remove = at least 3 bumps.
    expect(useFreeBrowseStore.getState().volumeVersion).toBeGreaterThan(before);
    teardown();
  });

  test("bumps layerVersion on mesh/layer changes", async () => {
    const { nv, teardown } = wire();
    const before = useFreeBrowseStore.getState().layerVersion;
    await nv.addMesh({ url: "lh.white" });
    await nv.addMeshLayer(0, { url: "lh.curv" });
    await flush();
    expect(useFreeBrowseStore.getState().layerVersion).toBeGreaterThan(before);
    teardown();
  });

  test("rebuilds the surfaces list from nv.meshes (color->rgba255, shaderType)", async () => {
    const { nv, teardown } = wire();
    await nv.addMesh({
      url: "lh.white",
      name: "LH",
      color: [1, 0, 0, 1],
      shaderType: "matcap",
    });
    await flush();
    const surfaces = useFreeBrowseStore.getState().surfaces;
    const s = surfaces[surfaces.length - 1];
    expect(s.name).toBe("LH");
    expect(s.rgba255).toEqual([255, 0, 0, 255]);
    expect(s.shaderType).toBe("matcap");
    expect(s.visible).toBe(true);

    // Visibility is opacity-derived (niivue-mono has no rendered mesh.visible).
    await nv.setMesh(nv.meshes.length - 1, { opacity: 0 });
    await flush();
    const after = useFreeBrowseStore.getState().surfaces;
    expect(after[after.length - 1].visible).toBe(false);
    expect(after[after.length - 1].opacity).toBe(0);
    teardown();
  });

  test("mirrors locationChange into locationData", () => {
    const { nv, teardown } = wire();
    nv.emit("locationChange", {
      mm: [1, 2, 3],
      values: [{ name: "brain", value: 42, vox: [10, 20, 30] }],
    });
    const loc = useFreeBrowseStore.getState().locationData;
    expect(loc?.mm).toEqual([1, 2, 3]);
    expect(loc?.voxels[0]).toEqual({
      name: "brain",
      voxel: [10, 20, 30],
      value: 42,
    });
    teardown();
  });

  test("teardown stops store updates", () => {
    const { nv, teardown } = wire();
    teardown();
    const before = useFreeBrowseStore.getState().volumeVersion;
    nv.isColorbarVisible = false;
    void nv.addVolume({ url: "b.nii" });
    expect(useFreeBrowseStore.getState().volumeVersion).toBe(before);
  });
});


describe("readViewerFromNiiVue — nv -> store seeding", () => {
  test("maps every mirrored setting the instance reports and skips the rest", () => {
    const nv = new NiiVue();
    nv.sliceType = 4;
    nv.showRender = 1;
    nv.isRadiological = true;
    nv.volumeIsNearestInterpolation = false;
    nv.crosshairWidth = 0;
    const patch = readViewerFromNiiVue(nv);
    expect(patch).toEqual({
      viewMode: "render",
      isRadiologicalConvention: true,
      interpolateVoxels: true,
      crosshairVisible: false,
    });
  });

  test("settings the instance does not report are left out of the patch", () => {
    const nv = new NiiVue();
    // The mock's flat setters are unset until written; only sliceType/showRender
    // have defaults, so the patch carries just the view mode.
    expect(readViewerFromNiiVue(nv)).toEqual({ viewMode: "ACS" });
  });
});
