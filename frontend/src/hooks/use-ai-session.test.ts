import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Auto-approve the upload / delete confirmation dialogs.
vi.mock("@/lib/confirmations", () => ({
  requestImagingUploadConfirmation: vi.fn(async () => true),
  requestSessionDeleteConfirmation: vi.fn(async () => true),
}));

import { NiiVue } from "@/__mocks__/niivue";
import { useFreeBrowseStore } from "@/store";
import type { AiSessionSummary } from "@/store/ai-slice";
import { useAiSession } from "./use-ai-session";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const refOf = (nv: NiiVue) => ({ current: nv }) as any;

type Call = { url: string; method: string; body: unknown };
let calls: Call[] = [];

function jsonRes(obj: unknown): Response {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/** Route fetch by URL substring; record every call for assertions. */
function installFetch(): void {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";
      let body: unknown = null;
      if (typeof init?.body === "string") {
        try {
          body = JSON.parse(init.body);
        } catch {
          body = init.body;
        }
      }
      calls.push({ url, method, body });

      if (url.includes("/ai/session/list")) return jsonRes([]);
      if (url.includes("/ai/session/new"))
        return jsonRes({ session_id: "s1", session_name: "test" });
      if (url.includes("/infer/")) return jsonRes({ ok: true });
      if (url.includes("/ai/session/") && method === "DELETE")
        return new Response("", { status: 200 });
      if (url.includes("set_volume") || url.includes("set_annots"))
        return new Response("", { status: 200 });
      if (url.includes("/data/nii")) return new Response("", { status: 200 });
      // Annotation download (arrayBuffer) — a tiny uint8 payload.
      if (url.includes("/data/ai-sessions/"))
        return new Response(new Uint8Array([1, 2, 3, 4]));
      return jsonRes({});
    },
  );
  vi.stubGlobal("fetch", fetchMock);
}

const urls = () => calls.map((c) => `${c.method} ${c.url}`);
const call = (frag: string) => calls.find((c) => c.url.includes(frag));

beforeEach(() => {
  calls = [];
  installFetch();
  useFreeBrowseStore.setState({ aiSessions: [], aiActiveSession: null });
});

describe("useAiSession — handleNewSession (volume already on backend)", () => {
  test("creates a session, sets the volume, and enters draw mode", async () => {
    const nv = new NiiVue();
    nv.volumes.push({ id: "vol-0", url: "/data/foo.nii.gz", name: "foo" });
    const { result } = renderHook(() => useAiSession(refOf(nv)));

    await act(async () => {
      await result.current.handleNewSession("test");
    });

    // No re-upload when the volume already lives under /data/.
    expect(call("/data/nii")).toBeUndefined();
    expect(urls()).toContain("POST /ai/session/new");
    // set_volume points at the stripped backend-relative path.
    expect(call("set_volume")?.body).toMatchObject({
      volume_path: "foo.nii.gz",
    });
    // enterDrawMode prepared the prompt drawing layer + colormap.
    expect(nv.drawingVolume).not.toBeNull();
    expect(nv.drawColormap).toBe("ai_prompt");
    expect(useFreeBrowseStore.getState().aiActiveSession).toMatchObject({
      session_id: "s1",
      session_name: "test",
    });
  });
});

describe("useAiSession — handleRunSegmentation", () => {
  test("uploads annotations, infers, and loads the result overlay", async () => {
    const nv = new NiiVue();
    nv.volumes.push({ id: "vol-0", url: "/data/foo.nii.gz", name: "foo" });
    nv.createEmptyDrawing(); // prompts drawn → a drawing layer exists
    useFreeBrowseStore.setState({
      aiActiveSession: { session_id: "s1", session_name: "test" },
    });
    const addVolume = vi.spyOn(nv, "addVolume");
    const addColormap = vi.spyOn(nv, "addColormap");
    const saveVolume = vi.spyOn(nv, "saveVolume");
    const { result } = renderHook(() => useAiSession(refOf(nv)));

    await act(async () => {
      await result.current.handleRunSegmentation("ml1", 1);
    });

    expect(saveVolume).toHaveBeenCalledWith(
      expect.objectContaining({ isSaveDrawing: true }),
    );
    expect(call("/data/nii")?.body).toMatchObject({
      filename: "ai-sessions/test/annotations.nii.gz",
    });
    expect(call("set_annots")?.body).toMatchObject({
      annotation_path: "annotations.nii.gz",
    });
    expect(urls().some((u) => u.includes("/infer/ml1"))).toBe(true);
    expect(addColormap).toHaveBeenCalledWith("sky_blue", expect.anything());
    expect(addVolume).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "result.nii.gz",
        colormap: "sky_blue",
        opacity: 0.5,
      }),
    );
  });

  test("throws when there is no drawing layer to send", async () => {
    const nv = new NiiVue();
    nv.volumes.push({ id: "vol-0", url: "/data/foo.nii.gz", name: "foo" });
    useFreeBrowseStore.setState({
      aiActiveSession: { session_id: "s1", session_name: "test" },
    });
    const { result } = renderHook(() => useAiSession(refOf(nv)));

    await expect(
      result.current.handleRunSegmentation("ml1", 1),
    ).rejects.toThrow(/No drawing layer/);
  });
});

describe("useAiSession — handleLoadSession", () => {
  test("loads the session volume and its annotation drawing", async () => {
    const summary: AiSessionSummary = {
      session_id: "s1",
      session_name: "test",
      created_at: "2026-07-08T00:00:00Z",
      volume_path: "foo.nii.gz",
      volume_path_root: "session",
      annotation_path: "annotations.nii.gz",
      result_path: null,
      last_inference_ml_id: null,
      last_inference_at: null,
    };
    useFreeBrowseStore.setState({ aiSessions: [summary] });
    const nv = new NiiVue();
    const loadDrawing = vi.spyOn(nv, "loadDrawing");
    const { result } = renderHook(() => useAiSession(refOf(nv)));

    await act(async () => {
      await result.current.handleLoadSession("s1");
    });

    expect(nv.volumes).toHaveLength(1); // loadVolumes ran
    expect(loadDrawing).toHaveBeenCalledTimes(1);
    expect(nv.drawingVolume).not.toBeNull();
    expect(useFreeBrowseStore.getState().aiActiveSession).toMatchObject({
      session_id: "s1",
    });
  });
});

describe("useAiSession — exit", () => {
  test("save-and-exit uploads annotations then tears down the drawing", async () => {
    const nv = new NiiVue();
    nv.volumes.push({ id: "vol-0", url: "/data/foo.nii.gz", name: "foo" });
    nv.createEmptyDrawing();
    useFreeBrowseStore.setState({
      aiActiveSession: { session_id: "s1", session_name: "test" },
    });
    const closeDrawing = vi.spyOn(nv, "closeDrawing");
    const { result } = renderHook(() => useAiSession(refOf(nv)));

    await act(async () => {
      await result.current.handleExitAndSaveSession();
    });

    expect(call("set_annots")).toBeDefined(); // annotations saved on exit
    expect(closeDrawing).toHaveBeenCalled();
    expect(nv.drawingVolume).toBeNull();
    expect(useFreeBrowseStore.getState().aiActiveSession).toBeNull();
  });
});
