import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { NiiVue } from "@/__mocks__/niivue";
import { useFreeBrowseStore } from "@/store";
import type { DrawingOptions } from "@/store/types";
import { useDrawing } from "./use-drawing";

type DrawRef = Parameters<typeof useDrawing>[0];
const refOf = (nv: NiiVue) => ({ current: nv }) as unknown as DrawRef;

const DEFAULT: DrawingOptions = {
  enabled: false,
  mode: "none",
  penValue: 1,
  penFill: true,
  penErases: false,
  opacity: 1.0,
  colormap: "_draw",
  magicWand2dOnly: true,
  magicWandMaxDistanceMM: 15,
  magicWandThresholdPercent: 0.05,
  filename: "drawing.nii.gz",
};

function render(nv: NiiVue, drawing: Partial<DrawingOptions> = {}) {
  useFreeBrowseStore.setState({ drawingOptions: { ...DEFAULT, ...drawing } });
  return renderHook(() => useDrawing(refOf(nv), () => {}));
}

const colormapEvent = (value: string) =>
  ({ target: { value } }) as unknown as React.ChangeEvent<HTMLSelectElement>;

describe("useDrawing — command dispatch (Phase 4a)", () => {
  beforeEach(() => {
    useFreeBrowseStore.setState({ drawingOptions: { ...DEFAULT } });
  });

  test("create layer: createEmptyDrawing + applies colormap/opacity, starts in none", () => {
    const nv = new NiiVue();
    nv.volumes.push({ id: "vol-0" });
    const spy = vi.spyOn(nv, "createEmptyDrawing");
    const { result } = render(nv, { colormap: "_itksnap", opacity: 0.8 });
    act(() => result.current.handleCreateDrawingLayer());
    expect(spy).toHaveBeenCalled();
    expect(nv.drawingVolume).not.toBeNull();
    expect(nv.drawColormap).toBe("_itksnap");
    expect(nv.drawOpacity).toBe(0.8);
    expect(nv.drawIsEnabled).toBe(false);
    expect(useFreeBrowseStore.getState().drawingOptions.mode).toBe("none");
    expect(useFreeBrowseStore.getState().activeTab).toBe("drawing");
  });

  test("no layer created without a background volume", () => {
    const nv = new NiiVue();
    const spy = vi.spyOn(nv, "createEmptyDrawing");
    const { result } = render(nv);
    act(() => result.current.handleCreateDrawingLayer());
    expect(spy).not.toHaveBeenCalled();
  });

  test("pen mode enables drawing with pen value + fill", () => {
    const nv = new NiiVue();
    const { result } = render(nv, {
      penValue: 3,
      penFill: true,
      penErases: false,
    });
    act(() => result.current.handleDrawModeChange("pen"));
    expect(nv.drawPenValue).toBe(3);
    expect(nv.drawPenFilled).toBe(true);
    expect(nv.drawIsFillOverwriting).toBe(true);
    expect(nv.drawIsEnabled).toBe(true);
    expect(useFreeBrowseStore.getState().drawingOptions.mode).toBe("pen");
  });

  test("pen mode with erase paints value 0", () => {
    const nv = new NiiVue();
    const { result } = render(nv, { penValue: 3, penErases: true });
    act(() => result.current.handleDrawModeChange("pen"));
    expect(nv.drawPenValue).toBe(0);
  });

  test("none mode disables drawing", () => {
    const nv = new NiiVue();
    const { result } = render(nv, { mode: "pen" });
    act(() => result.current.handleDrawModeChange("none"));
    expect(nv.drawIsEnabled).toBe(false);
    expect(useFreeBrowseStore.getState().drawingOptions.mode).toBe("none");
  });

  test("penValue is store-owned and pushed to niivue in pen mode", () => {
    const nv = new NiiVue();
    const { result } = render(nv, { mode: "pen", penErases: false });
    act(() => result.current.handlePenValueChange(7));
    expect(useFreeBrowseStore.getState().drawingOptions.penValue).toBe(7);
    expect(nv.drawPenValue).toBe(7);
  });

  test("toggling erase sets drawPenValue 0 without losing the stored penValue", () => {
    const nv = new NiiVue();
    const { result } = render(nv, {
      mode: "pen",
      penValue: 4,
      penErases: false,
    });
    act(() => result.current.handlePenErasesChange(true));
    expect(nv.drawPenValue).toBe(0);
    expect(useFreeBrowseStore.getState().drawingOptions.penValue).toBe(4); // retained
    act(() => result.current.handlePenErasesChange(false));
    expect(nv.drawPenValue).toBe(4); // restored from the store
  });

  test("fill / opacity / colormap dispatch to niivue", () => {
    const nv = new NiiVue();
    const { result } = render(nv);
    act(() => result.current.handlePenFillChange(false));
    expect(nv.drawPenFilled).toBe(false);
    expect(nv.drawIsFillOverwriting).toBe(false);
    expect(useFreeBrowseStore.getState().drawingOptions.penFill).toBe(false);
    act(() => result.current.handleDrawingOpacityChange(0.4));
    expect(nv.drawOpacity).toBe(0.4);
    act(() =>
      result.current.handleDrawingColormapChange(colormapEvent("_slicer3d")),
    );
    expect(nv.drawColormap).toBe("_slicer3d");
  });

  test("undo calls nv.drawUndo", () => {
    const nv = new NiiVue();
    const spy = vi.spyOn(nv, "drawUndo");
    const { result } = render(nv);
    act(() => result.current.handleDrawUndo());
    expect(spy).toHaveBeenCalled();
  });

  test("save drawing: export -> close -> re-add as roi_i256 label volume", async () => {
    const nv = new NiiVue();
    nv.volumes.push({ id: "vol-0" });
    nv.drawingVolume = { id: "drawing" };
    const saveSpy = vi.spyOn(nv, "saveVolume");
    const closeSpy = vi.spyOn(nv, "closeDrawing");
    const addSpy = vi.spyOn(nv, "addVolume");
    const volSpy = vi.spyOn(nv, "setVolume");
    const labelSpy = vi.spyOn(nv, "setColormapLabel");
    const { result } = render(nv, { filename: "seg.nii.gz" });
    await act(async () => {
      await result.current.handleSaveDrawing();
    });
    expect(saveSpy).toHaveBeenCalledWith({
      filename: "",
      isSaveDrawing: true,
      volumeByIndex: 0,
    });
    expect(closeSpy).toHaveBeenCalled();
    // Raw bytes -> File named .nii (the .gz is stripped so the loader won't gunzip).
    expect(addSpy.mock.calls[0][0].name).toBe("seg.nii");
    // Saved as a roi_i256 label volume (dropdown colormap + label colormap).
    expect(volSpy).toHaveBeenCalledWith(expect.any(Number), {
      colormap: "roi_i256",
    });
    expect(labelSpy).toHaveBeenCalledWith(expect.any(Number), "roi_i256");
    expect(useFreeBrowseStore.getState().drawingOptions.mode).toBe("none");
    expect(useFreeBrowseStore.getState().activeTab).toBe("sceneDetails");
  });

  test("save drawing is a no-op with no open drawing", async () => {
    const nv = new NiiVue();
    nv.volumes.push({ id: "vol-0" });
    const saveSpy = vi.spyOn(nv, "saveVolume");
    const { result } = render(nv);
    await act(async () => {
      await result.current.handleSaveDrawing();
    });
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
