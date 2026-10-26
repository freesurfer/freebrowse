import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@niivue/niivue", () => import("@/__mocks__/niivue"));

import { NiiVue } from "@niivue/niivue";
import { mountFreeBrowse, type FreeBrowseHandle } from "./mount";
import { useFreeBrowseStore } from "@/store";
import {
  deploymentConfig,
  getFreeBrowseConfig,
  resetFreeBrowseConfig,
} from "@/lib/deployment-config";

describe("mountFreeBrowse", () => {
  let container: HTMLDivElement;
  let active: FreeBrowseHandle | null = null;
  const mount = (...args: Parameters<typeof mountFreeBrowse>) => {
    active = mountFreeBrowse(...args);
    return active;
  };

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => [] })),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(async () => {
    // Never leave a mount behind (a failed assertion would otherwise make the
    // next test's mount throw "already mounted").
    await act(async () => {
      active?.destroy();
    });
    active = null;
    container.remove();
    resetFreeBrowseConfig();
    // The UI store is a singleton: put the layout flags back to their defaults.
    useFreeBrowseStore.setState({
      showUploader: true,
      dragDropEnabled: true,
      sidebarOpen: true,
      footerOpen: true,
    });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete window.freebrowse;
  });

  test("renders into the container with library defaults and destroys cleanly", async () => {
    const nv = new NiiVue();
    let handle!: ReturnType<typeof mountFreeBrowse>;
    await act(async () => {
      handle = mount(container, { nv });
    });
    expect(handle.nv).toBe(nv);
    expect(container.querySelector(".freebrowse-root")).not.toBeNull();
    // library defaults: no backend, no url params, no global
    expect(deploymentConfig.serverless).toBe(true);
    expect(getFreeBrowseConfig().readUrlParams).toBe(false);
    expect(window.freebrowse).toBeUndefined();
    await act(async () => {
      handle.destroy();
    });
    expect(container.innerHTML).toBe("");
  });

  test("a second concurrent mount throws; after destroy a new mount works", async () => {
    let first!: ReturnType<typeof mountFreeBrowse>;
    await act(async () => {
      first = mount(container);
    });
    const other = document.createElement("div");
    expect(() => mountFreeBrowse(other)).toThrow(/already mounted/);
    await act(async () => {
      first.destroy();
    });
    let second!: ReturnType<typeof mountFreeBrowse>;
    await act(async () => {
      second = mount(other);
    });
    expect(other.querySelector(".freebrowse-root")).not.toBeNull();
    await act(async () => {
      second.destroy();
    });
  });

  test("creates an instance when none is given", async () => {
    let handle!: ReturnType<typeof mountFreeBrowse>;
    await act(async () => {
      handle = mount(container);
    });
    expect(handle.nv).toBeInstanceOf(NiiVue);
    await act(async () => {
      handle.destroy();
    });
  });

  test("dragDrop: false shows the canvas at once and disables niivue's drop", async () => {
    const nv = new NiiVue();
    let handle!: ReturnType<typeof mountFreeBrowse>;
    await act(async () => {
      handle = mount(container, { nv, dragDrop: false });
    });
    expect(container.textContent).not.toContain("Load Medical Images");
    expect(container.querySelector("canvas")).not.toBeNull();
    expect(nv.isDragDropEnabled).toBe(false);
    await act(async () => {
      handle.destroy();
    });
  });

  test("sidebar: false and footer: false hide both initially", async () => {
    let handle!: ReturnType<typeof mountFreeBrowse>;
    await act(async () => {
      handle = mount(container, { nv: new NiiVue(), sidebar: false, footer: false });
    });
    expect(container.textContent).not.toContain("Volumetric Details");
    expect(container.textContent).not.toContain("Load images to see coordinates");
    await act(async () => {
      handle.destroy();
    });
    // With no option the host's earlier choice (a persisted preference in real
    // life) is left alone; an explicit `true` shows them again.
    await act(async () => {
      handle = mount(container, { nv: new NiiVue(), sidebar: true, footer: true });
    });
    expect(container.textContent).toContain("Volumetric Details");
    expect(container.textContent).toContain("Load images to see coordinates");
    await act(async () => {
      handle.destroy();
    });
  });

  test("options flow into the runtime config", async () => {
    let handle!: ReturnType<typeof mountFreeBrowse>;
    await act(async () => {
      handle = mount(container, {
        nv: new NiiVue(),
        backend: { dataUrl: "https://h/data", aiUrl: "https://h/ai" },
        persist: false,
        exposeGlobal: true,
        readUrlParams: true,
      });
    });
    const c = getFreeBrowseConfig();
    expect(c.backend).toEqual({ dataUrl: "https://h/data", aiUrl: "https://h/ai" });
    expect(c.persist).toBe(false);
    expect(c.readUrlParams).toBe(true);
    expect(window.freebrowse?.nv).toBe(handle.nv);
    await act(async () => {
      handle.destroy();
    });
  });
});
