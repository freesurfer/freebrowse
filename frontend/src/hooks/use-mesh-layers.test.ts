import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { NiiVue } from "@/__mocks__/niivue";
import { useFreeBrowseStore } from "@/store";
import { useMeshLayers } from "./use-mesh-layers";

type LayerRef = Parameters<typeof useMeshLayers>[0];
const refOf = (nv: NiiVue) => ({ current: nv }) as unknown as LayerRef;

// A mesh (index 0) with one layer.
function meshWithLayer() {
  const nv = new NiiVue();
  nv.meshes.push({ layers: [{ colormap: "gray", opacity: 0.5 }] });
  return nv;
}

// useMeshLayers has a mount effect that resets selectedLayerIndex to null when
// the surface changes, so the layer must be selected AFTER mount. currentSurface
// is set before render (it survives the effect).
function mount(nv: NiiVue, { selectLayer = false } = {}) {
  useFreeBrowseStore.setState({ currentSurfaceIndex: 0 });
  const hook = renderHook(() => useMeshLayers(refOf(nv)));
  if (selectLayer) {
    act(() => useFreeBrowseStore.setState({ selectedLayerIndex: 0 }));
  }
  return hook;
}

describe("useMeshLayers — command dispatch", () => {
  beforeEach(() => {
    useFreeBrowseStore.setState({
      currentSurfaceIndex: null,
      selectedLayerIndex: null,
    });
  });

  test("addLayerFromFile calls addMeshLayer(meshIndex, {url,name,opacity})", async () => {
    const nv = meshWithLayer();
    const spy = vi.spyOn(nv, "addMeshLayer");
    const { result } = mount(nv);
    const file = new File([new Uint8Array([1])], "lh.curv");
    await act(async () => {
      await result.current.addLayerFromFile(file);
    });
    expect(spy).toHaveBeenCalledWith(0, {
      url: file,
      name: "lh.curv",
      opacity: 0.5,
    });
  });

  test("removeLayer calls removeMeshLayer(meshIndex, layerIndex)", () => {
    const nv = meshWithLayer();
    const spy = vi.spyOn(nv, "removeMeshLayer");
    const { result } = mount(nv, { selectLayer: true });
    act(() => result.current.removeLayer(0));
    expect(spy).toHaveBeenCalledWith(0, 0);
  });

  test("handleLayerOpacityChange -> setMeshLayerProperty({opacity})", () => {
    const nv = meshWithLayer();
    const spy = vi.spyOn(nv, "setMeshLayerProperty");
    const { result } = mount(nv, { selectLayer: true });
    act(() => result.current.handleLayerOpacityChange(0.8));
    expect(spy).toHaveBeenCalledWith(0, 0, { opacity: 0.8 });
  });

  test("cal min/max map to camelCase calMin/calMax", () => {
    const nv = meshWithLayer();
    const spy = vi.spyOn(nv, "setMeshLayerProperty");
    const { result } = mount(nv, { selectLayer: true });
    act(() => result.current.handleLayerCalMinChange(2));
    act(() => result.current.handleLayerCalMaxChange(8));
    expect(spy).toHaveBeenNthCalledWith(1, 0, 0, { calMin: 2 });
    expect(spy).toHaveBeenNthCalledWith(2, 0, 0, { calMax: 8 });
  });

  test("colormap change sets the layer colormap", async () => {
    const nv = meshWithLayer();
    const spy = vi.spyOn(nv, "setMeshLayerProperty");
    const { result } = mount(nv, { selectLayer: true });
    await act(async () => {
      await result.current.handleLayerColormapChange("warm");
    });
    expect(spy).toHaveBeenCalledWith(0, 0, { colormap: "warm" });
  });

  test("negative colormap toggles colormapNegative between 'winter' and ''", async () => {
    const nv = meshWithLayer();
    const spy = vi.spyOn(nv, "setMeshLayerProperty");
    const { result } = mount(nv, { selectLayer: true });
    await act(async () => {
      await result.current.handleLayerUseNegativeCmapChange(true);
    });
    await act(async () => {
      await result.current.handleLayerUseNegativeCmapChange(false);
    });
    expect(spy).toHaveBeenNthCalledWith(1, 0, 0, {
      colormapNegative: "winter",
    });
    expect(spy).toHaveBeenNthCalledWith(2, 0, 0, { colormapNegative: "" });
  });

  test("no command when no layer is selected", () => {
    const nv = meshWithLayer();
    const spy = vi.spyOn(nv, "setMeshLayerProperty");
    const { result } = mount(nv); // selectedLayerIndex stays null
    act(() => result.current.handleLayerOpacityChange(0.8));
    expect(spy).not.toHaveBeenCalled();
  });
});
