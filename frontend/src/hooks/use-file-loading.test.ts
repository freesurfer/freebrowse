import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { NiiVue } from "@/__mocks__/niivue";
import { useFileLoading } from "./use-file-loading";

type LoadRef = Parameters<typeof useFileLoading>[0];
const refOf = (nv: NiiVue) => ({ current: nv }) as unknown as LoadRef;
const noop = () => {};

const V9_DOC = { version: 9, scene: {}, layout: {}, clipPlanes: [], volumes: [], meshes: [] };

describe("useFileLoading — loadNvdData", () => {
  test("loads with fill: 'current' so omitted settings keep their values", async () => {
    const nv = new NiiVue();
    const load = vi.spyOn(nv, "loadDocument");
    const { result } = renderHook(() =>
      useFileLoading(refOf(nv), noop, noop, noop),
    );
    const bytes = new TextEncoder().encode(JSON.stringify(V9_DOC));
    await act(() => result.current.loadNvdData(bytes));
    expect(load).toHaveBeenCalledTimes(1);
    expect(load.mock.calls[0][1]).toEqual({ fill: "current" });
    expect(nv.lastLoadDocumentOptions).toEqual({ fill: "current" });
  });

  test("the parsed-object (embedded single-file) path uses the same policy", async () => {
    const nv = new NiiVue();
    const load = vi.spyOn(nv, "loadDocument");
    const { result } = renderHook(() =>
      useFileLoading(refOf(nv), noop, noop, noop),
    );
    await act(() => result.current.loadNvdData(V9_DOC));
    expect(load.mock.calls[0][1]).toEqual({ fill: "current" });
  });

  test("a legacy document is refused before niivue sees it", async () => {
    const nv = new NiiVue();
    const load = vi.spyOn(nv, "loadDocument");
    const { result } = renderHook(() =>
      useFileLoading(refOf(nv), noop, noop, noop),
    );
    const legacy = new TextEncoder().encode(
      JSON.stringify({ encodedImageBlobs: ["AAAA"], imageOptionsArray: [] }),
    );
    await expect(result.current.loadNvdData(legacy)).rejects.toThrow(/predates/);
    expect(load).not.toHaveBeenCalled();
  });
});
