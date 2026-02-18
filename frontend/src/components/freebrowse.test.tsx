import { describe, it, expect, vi } from "vitest";

vi.mock("@niivue/niivue", () => import("@/__mocks__/niivue"));

describe("FreeBrowse", () => {
  it("placeholder: test scaffolding works", () => {
    expect(1 + 1).toBe(2);
  });
});
