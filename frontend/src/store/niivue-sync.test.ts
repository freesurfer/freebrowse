import { describe, it, expect, vi, beforeEach } from "vitest";

import { NiiVue } from "@/__mocks__/niivue";
import { registerNiiVueEvents, type NiiVueSyncTarget } from "./niivue-sync";

function makeTarget() {
  return {
    onViewerOptionChange: vi.fn(),
    onDrawingOptionChange: vi.fn(),
    onVolumesChanged: vi.fn(),
    onVolumeUpdated: vi.fn(),
    onSurfacesChanged: vi.fn(),
    onDrawingChanged: vi.fn(),
    onLocationChange: vi.fn(),
    onDocumentLoaded: vi.fn(),
    onColormapAdded: vi.fn(),
  } satisfies NiiVueSyncTarget;
}

describe("registerNiiVueEvents", () => {
  let nv: NiiVue;
  let target: ReturnType<typeof makeTarget>;
  let teardown: () => void;

  beforeEach(() => {
    nv = new NiiVue();
    target = makeTarget();
    teardown = registerNiiVueEvents(nv, target);
  });

  it("routes non-drawing scalar `change` to onViewerOptionChange", async () => {
    nv.isColorbarVisible = true;
    expect(target.onViewerOptionChange).toHaveBeenCalledWith(
      "isColorbarVisible",
      true,
    );
    expect(target.onDrawingOptionChange).not.toHaveBeenCalled();
  });

  it("routes drawing scalars to onDrawingOptionChange", () => {
    nv.drawOpacity = 0.5;
    nv.drawColormap = "red";
    expect(target.onDrawingOptionChange).toHaveBeenCalledWith(
      "drawOpacity",
      0.5,
    );
    expect(target.onDrawingOptionChange).toHaveBeenCalledWith(
      "drawColormap",
      "red",
    );
  });

  it("handles a scalar exactly once even when a specific mirror event also fires", () => {
    // sliceType emits BOTH `change` and `sliceTypeChange`; drawPenValue emits
    // BOTH `change` and `penValueChanged`. We must not double-count.
    nv.sliceType = 2;
    nv.drawPenValue = 3;
    expect(target.onViewerOptionChange).toHaveBeenCalledTimes(1);
    expect(target.onViewerOptionChange).toHaveBeenCalledWith("sliceType", 2);
    expect(target.onDrawingOptionChange).toHaveBeenCalledTimes(1);
    expect(target.onDrawingOptionChange).toHaveBeenCalledWith(
      "drawPenValue",
      3,
    );
  });

  it("re-reads the volume list on load / remove / reorder", async () => {
    await nv.addVolume({ url: "a.nii" });
    await nv.addVolume({ url: "b.nii" });
    nv.removeVolume(0);
    await nv.moveVolumeToTop(0);
    // 2 loads + 1 remove + 1 reorder = 4 snapshots.
    expect(target.onVolumesChanged).toHaveBeenCalledTimes(4);
    // Last snapshot is the live array reference.
    expect(target.onVolumesChanged).toHaveBeenLastCalledWith(nv.volumes);
  });

  it("delivers volumeUpdated with the exact changes plus a list refresh", async () => {
    await nv.addVolume({ url: "a.nii" });
    target.onVolumesChanged.mockClear();
    await nv.setVolume(0, { colormap: "hot", opacity: 0.7 });
    expect(target.onVolumeUpdated).toHaveBeenCalledWith(0, {
      colormap: "hot",
      opacity: 0.7,
    });
    expect(target.onVolumesChanged).toHaveBeenCalledTimes(1);
  });

  it("refreshes surfaces on mesh load / update / layer ops", async () => {
    await nv.addMesh({ url: "lh.white" });
    await nv.setMesh(0, { visible: false });
    await nv.addMeshLayer(0, { url: "lh.curv" });
    expect(target.onSurfacesChanged).toHaveBeenCalledTimes(3);
    expect(target.onSurfacesChanged).toHaveBeenLastCalledWith(nv.meshes);
  });

  it("forwards drawing actions, location, document, and colormap events", async () => {
    nv.createEmptyDrawing();
    nv.drawUndo();
    nv.emit("locationChange", { mm: [1, 2, 3], values: [] });
    await nv.loadDocument("x.nvd");
    nv.addColormap("ai_prompt", {});

    expect(target.onDrawingChanged).toHaveBeenCalledWith("create");
    expect(target.onDrawingChanged).toHaveBeenCalledWith("undo");
    expect(target.onLocationChange).toHaveBeenCalledWith({
      mm: [1, 2, 3],
      values: [],
    });
    expect(target.onDocumentLoaded).toHaveBeenCalledTimes(1);
    expect(target.onColormapAdded).toHaveBeenCalledWith("ai_prompt");
  });

  it("models an external mutation: window.freebrowse.nv drives the UI with no app code", async () => {
    // A developer holding the instance mutates it directly through the API.
    await nv.addVolume({ url: "external.nii" });
    nv.sliceType = 1;
    await nv.setVolume(0, { colormap: "viridis" });
    expect(target.onVolumesChanged).toHaveBeenCalled();
    expect(target.onViewerOptionChange).toHaveBeenCalledWith("sliceType", 1);
    expect(target.onVolumeUpdated).toHaveBeenCalledWith(0, {
      colormap: "viridis",
    });
  });

  it("teardown removes every listener", async () => {
    teardown();
    nv.isColorbarVisible = true;
    nv.sliceType = 2;
    await nv.addVolume({ url: "a.nii" });
    nv.createEmptyDrawing();
    expect(target.onViewerOptionChange).not.toHaveBeenCalled();
    expect(target.onVolumesChanged).not.toHaveBeenCalled();
    expect(target.onDrawingChanged).not.toHaveBeenCalled();
  });
});
