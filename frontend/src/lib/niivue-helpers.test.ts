import { describe, it, expect, vi } from "vitest";

vi.mock("@niivue/niivue", () => import("@/__mocks__/niivue"));

import { rgba255ToHex, uint8ArrayToBase64, sliceTypeMap } from "./niivue-helpers";

describe("rgba255ToHex", () => {
  it("converts RGBA [0-255] to hex string", () => {
    expect(rgba255ToHex([255, 0, 0, 255])).toBe("#ff0000");
    expect(rgba255ToHex([0, 255, 0, 128])).toBe("#00ff00");
    expect(rgba255ToHex([0, 0, 255, 0])).toBe("#0000ff");
    expect(rgba255ToHex([16, 32, 48, 255])).toBe("#102030");
  });
});

describe("uint8ArrayToBase64", () => {
  it("converts a Uint8Array to base64", () => {
    const arr = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    expect(uint8ArrayToBase64(arr)).toBe(btoa("Hello"));
  });

  it("handles empty array", () => {
    const arr = new Uint8Array([]);
    expect(uint8ArrayToBase64(arr)).toBe("");
  });
});

describe("sliceTypeMap", () => {
  it("has entries for all view modes", () => {
    expect(sliceTypeMap).toHaveProperty("axial");
    expect(sliceTypeMap).toHaveProperty("coronal");
    expect(sliceTypeMap).toHaveProperty("sagittal");
    expect(sliceTypeMap).toHaveProperty("ACS");
    expect(sliceTypeMap).toHaveProperty("ACSR");
    expect(sliceTypeMap).toHaveProperty("render");
  });

  it("each entry has sliceType and showRender", () => {
    for (const [, config] of Object.entries(sliceTypeMap)) {
      expect(config).toHaveProperty("sliceType");
      expect(config).toHaveProperty("showRender");
      expect(typeof config.sliceType).toBe("number");
      expect(typeof config.showRender).toBe("number");
    }
  });
});
