import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { NiiVue } from "@/__mocks__/niivue";
import { useFreeBrowseStore } from "@/store";
import { FREEBROWSE_SAVE_SETTINGS } from "@/lib/default-niivue-options";
import { useSave } from "./use-save";

type SaveRef = Parameters<typeof useSave>[0];
const refOf = (nv: NiiVue) => ({ current: nv }) as unknown as SaveRef;

function nvWithVolume() {
  const nv = new NiiVue();
  nv.volumes.push({ id: "vol-0", name: "brain.nii.gz", url: "brain.nii.gz" });
  return nv;
}

/** Seed the save dialog as the confirm handler expects to find it. */
function primeSaveState(opts: {
  isDownloadMode: boolean;
  format: "json" | "cbor";
  volumeUrl?: string;
}) {
  useFreeBrowseStore.setState({
    saveState: {
      isDownloadMode: opts.isDownloadMode,
      document: { enabled: true, location: "scene", format: opts.format },
      volumes: [
        {
          enabled: false,
          isExternal: false,
          url: opts.volumeUrl ?? "out/brain.nii.gz",
        },
      ],
    },
  });
}

describe("useSave — serializeDocument options", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({}) })),
    );
    // happy-dom has no object-URL plumbing, and an anchor .click() would try to
    // navigate. Patch the statics onto the real URL (replacing it wholesale
    // breaks its constructor) and neuter the click.
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  test("backend save asks for JSON and linked volume data", async () => {
    const nv = nvWithVolume();
    const serialize = vi.spyOn(nv, "serializeDocument");
    primeSaveState({ isDownloadMode: false, format: "json" });

    const { result } = renderHook(() => useSave(refOf(nv)));
    await act(async () => {
      await result.current.handleConfirmSave();
    });

    // linkData is load-bearing: without it niivue embeds every volume's bytes
    // into the document only for retargetVolumeUrls to delete them.
    expect(serialize).toHaveBeenCalledWith({
      format: "json",
      linkData: true,
      settings: FREEBROWSE_SAVE_SETTINGS,
    });
  });

  test("every save omits volume.matcap (niivue/mono#225)", async () => {
    // niivue-mono writes its bundled cortex matcap into every document as a
    // ~23 KB data URL; FreeBrowse has no matcap UI, so it never saves it.
    expect(FREEBROWSE_SAVE_SETTINGS).toEqual({ neverSave: ["volume.matcap"] });
    const nv = nvWithVolume();
    const serialize = vi.spyOn(nv, "serializeDocument");
    primeSaveState({ isDownloadMode: false, format: "cbor" });

    const { result } = renderHook(() => useSave(refOf(nv)));
    await act(async () => {
      await result.current.handleConfirmSave();
    });

    expect(serialize).toHaveBeenCalledWith({
      linkData: true,
      settings: FREEBROWSE_SAVE_SETTINGS,
    });
  });

  test("backend save posts a parsed object with retargeted volume urls", async () => {
    const nv = nvWithVolume();
    primeSaveState({ isDownloadMode: false, format: "json" });

    const { result } = renderHook(() => useSave(refOf(nv)));
    await act(async () => {
      await result.current.handleConfirmSave();
    });

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const nvdCall = fetchMock.mock.calls.find((c) => c[0] === "/data/nvd");
    expect(nvdCall).toBeTruthy();
    const body = JSON.parse(nvdCall![1].body as string);
    // The backend stores `data` as a dict and pretty-prints it, so it must be
    // an object here, not a JSON string.
    expect(typeof body.data).toBe("object");
    expect(body.format).toBe("json");
  });

  test("download save passes the chosen format through", async () => {
    const nv = nvWithVolume();
    const serialize = vi.spyOn(nv, "serializeDocument");
    primeSaveState({ isDownloadMode: true, format: "cbor" });

    const { result } = renderHook(() => useSave(refOf(nv)));
    await act(async () => {
      await result.current.handleConfirmSave();
    });

    expect(serialize).toHaveBeenCalledWith({
      format: "cbor",
      settings: FREEBROWSE_SAVE_SETTINGS,
    });
  });
});
