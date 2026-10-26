import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { NiiVue } from "@/__mocks__/niivue";
import { useFreeBrowseStore } from "@/store";
import { useSurfaces } from "./use-surfaces";

type SurfRef = Parameters<typeof useSurfaces>[0];
const refOf = (nv: NiiVue) => ({ current: nv }) as unknown as SurfRef;
const noop = () => {};

// Command-only: handlers must issue the right nv.* command (by index — meshes
// have no id). The store follows via the event adapter, tested separately.
describe("useSurfaces — command dispatch", () => {
  beforeEach(() => {
    useFreeBrowseStore.setState({ currentSurfaceIndex: null });
  });

  test("toggleSurfaceVisibility hides a visible mesh via opacity 0", () => {
    const nv = new NiiVue();
    nv.meshes.push({ opacity: 1, layers: [] });
    const spy = vi.spyOn(nv, "setMesh");
    const { result } = renderHook(() => useSurfaces(refOf(nv), noop));
    act(() => result.current.toggleSurfaceVisibility(0));
    expect(spy).toHaveBeenCalledWith(0, { opacity: 0 });
  });

  test("toggleSurfaceVisibility shows a hidden mesh via opacity 1", () => {
    const nv = new NiiVue();
    nv.meshes.push({ opacity: 0, layers: [] });
    const spy = vi.spyOn(nv, "setMesh");
    const { result } = renderHook(() => useSurfaces(refOf(nv), noop));
    act(() => result.current.toggleSurfaceVisibility(0));
    expect(spy).toHaveBeenCalledWith(0, { opacity: 1 });
  });

  test("removeSurface calls nv.removeMesh by index", () => {
    const nv = new NiiVue();
    nv.meshes.push({ opacity: 1, layers: [] });
    const spy = vi.spyOn(nv, "removeMesh");
    const { result } = renderHook(() => useSurfaces(refOf(nv), noop));
    act(() => result.current.removeSurface(0));
    expect(spy).toHaveBeenCalledWith(0);
  });

  test("handleSurfaceOpacityChange applies to the selected surface", () => {
    const nv = new NiiVue();
    nv.meshes.push({ opacity: 1, layers: [] });
    useFreeBrowseStore.setState({ currentSurfaceIndex: 0 });
    const spy = vi.spyOn(nv, "setMesh");
    const { result } = renderHook(() => useSurfaces(refOf(nv), noop));
    act(() => result.current.handleSurfaceOpacityChange(0.5));
    expect(spy).toHaveBeenCalledWith(0, { opacity: 0.5 });
  });

  test("handleMeshShaderChange sets shaderType by name", () => {
    const nv = new NiiVue();
    nv.meshes.push({ opacity: 1, layers: [] });
    useFreeBrowseStore.setState({ currentSurfaceIndex: 0 });
    const spy = vi.spyOn(nv, "setMesh");
    const { result } = renderHook(() => useSurfaces(refOf(nv), noop));
    act(() => result.current.handleMeshShaderChange("matcap"));
    expect(spy).toHaveBeenCalledWith(0, { shaderType: "matcap" });
  });

  test("handleSurfaceColorChange sets rgba255 (debounced)", () => {
    vi.useFakeTimers();
    try {
      const nv = new NiiVue();
      nv.meshes.push({ opacity: 1, layers: [] });
      useFreeBrowseStore.setState({ currentSurfaceIndex: 0 });
      const spy = vi.spyOn(nv, "setMesh");
      const { result } = renderHook(() => useSurfaces(refOf(nv), noop));
      act(() => result.current.handleSurfaceColorChange("#ff8000"));
      expect(spy).not.toHaveBeenCalled(); // debounced
      act(() => vi.advanceTimersByTime(60));
      expect(spy).toHaveBeenCalledWith(0, { rgba255: [255, 128, 0, 255] });
    } finally {
      vi.useRealTimers();
    }
  });

  test("no command when no surface is selected / mesh missing", () => {
    const nv = new NiiVue();
    useFreeBrowseStore.setState({ currentSurfaceIndex: null });
    const spy = vi.spyOn(nv, "setMesh");
    const { result } = renderHook(() => useSurfaces(refOf(nv), noop));
    act(() => result.current.handleSurfaceOpacityChange(0.5));
    act(() => result.current.toggleSurfaceVisibility(5)); // out of range
    expect(spy).not.toHaveBeenCalled();
  });
});
