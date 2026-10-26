import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@niivue/niivue", () => import("@/__mocks__/niivue"));

import { NiiVue } from "@niivue/niivue";
import { applyExportLockdown } from "./disable-export";

type Proto = Record<string, unknown>;
const proto = NiiVue.prototype as unknown as Proto;
const SAVED = [
  "saveVolume",
  "saveDrawing",
  "saveMesh",
  "saveBitmap",
  "saveDocument",
  "serializeDocument",
] as const;

describe("applyExportLockdown — disk paths off, byte exports on", () => {
  const original: Partial<Record<(typeof SAVED)[number], unknown>> = {};

  beforeEach(() => {
    for (const k of SAVED) original[k] = proto[k];
    // Give the mock prototype the disk-only methods the real class has.
    proto.saveDrawing = vi.fn(async () => new Uint8Array([7]));
    proto.saveMesh = vi.fn(async () => {});
    proto.saveBitmap = vi.fn(async () => true);
    proto.saveDocument = vi.fn(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    applyExportLockdown();
  });

  afterEach(() => {
    for (const k of SAVED) {
      if (original[k] === undefined) delete proto[k];
      else proto[k] = original[k];
    }
    vi.restoreAllMocks();
  });

  test("saveVolume with a filename is refused; bytes-only export still works", async () => {
    const nv = new NiiVue();
    expect(await nv.saveVolume({ filename: "brain.nii.gz" })).toBe(false);
    expect(await nv.saveVolume()).toBe(false); // undefined -> default filename -> disk
    const bytes = await nv.saveVolume({ filename: "", volumeByIndex: 0 });
    expect(bytes).toBeInstanceOf(Uint8Array);
  });

  test("saveDrawing follows the same rule", async () => {
    const nv = new NiiVue();
    expect(await nv.saveDrawing("draw.nii")).toBe(false);
    expect(await nv.saveDrawing()).toBe(false);
    expect(await nv.saveDrawing("")).toEqual(new Uint8Array([7]));
  });

  test("disk-only methods are no-ops", async () => {
    const nv = new NiiVue();
    await expect(nv.saveMesh(0, "lh.pial")).resolves.toBeUndefined();
    expect(await nv.saveBitmap("shot.png")).toBe(false);
    expect(nv.saveDocument("scene.nvd")).toBeUndefined();
    expect(console.warn).toHaveBeenCalledTimes(3);
  });

  test("serializeDocument is untouched (backend Save needs it)", () => {
    const nv = new NiiVue();
    const bytes = nv.serializeDocument({ format: "json" });
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(proto.serializeDocument).toBe(original.serializeDocument);
  });
});
