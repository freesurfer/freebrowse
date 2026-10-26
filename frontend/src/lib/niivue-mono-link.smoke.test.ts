import { describe, expect, test } from "vitest";

// Health check on the real @niivue/niivue package: verify the pinned registry
// build resolves and exposes the API surface FreeBrowse compiles against. This
// file deliberately does NOT mock "@niivue/niivue" (unlike the app's unit
// tests), so it imports the actual published bundle -- which makes it the
// pre-publish gate that the package is equivalent to what we developed on.
// (Was a link check while the dependency was file:-linked to ../niivue-mono.)
import NiiVue, { DRAG_MODE, SHOW_RENDER, SLICE_TYPE } from "@niivue/niivue";

describe("@niivue/niivue package smoke", () => {
  test("default export is the NiiVue controller class", () => {
    expect(typeof NiiVue).toBe("function");
  });

  test("enums are exported from the '.' entry with expected values", () => {
    expect(SLICE_TYPE.AXIAL).toBe(0);
    expect(SLICE_TYPE.RENDER).toBe(4);
    expect(SHOW_RENDER.NEVER).toBe(0);
    expect(DRAG_MODE.pan).toBeDefined();
  });
});
