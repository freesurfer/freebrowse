import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@niivue/niivue", () => import("@/__mocks__/niivue"));

import { NiiVue } from "@niivue/niivue";
import { mountFreeBrowse, type FreeBrowseHandle } from "./mount";
import { useFreeBrowseStore } from "@/store";
import {
  getFreeBrowseConfig,
  resetFreeBrowseConfig,
} from "@/lib/deployment-config";

describe("mountFreeBrowse", () => {
  let container: HTMLDivElement;
  let handles: FreeBrowseHandle[] = [];
  const mount = (...args: Parameters<typeof mountFreeBrowse>) => {
    const h = mountFreeBrowse(...args);
    handles.push(h);
    return h;
  };

  beforeEach(() => {
    handles = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => [] })),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await act(async () => {
      for (const h of handles) h.destroy();
    });
    handles = [];
    container.remove();
    resetFreeBrowseConfig();
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
    let handle!: FreeBrowseHandle;
    await act(async () => {
      handle = mount(container, { nv });
    });
    expect(handle.nv).toBe(nv);
    expect(container.querySelector(".freebrowse-root")).not.toBeNull();
    // library defaults: no backend, no url params, no global
    expect(handle.config.backend).toBeNull();
    expect(handle.config.readUrlParams).toBe(false);
    expect(window.freebrowse).toBeUndefined();
    // Global deployment config is left untouched by per-mount options.
    expect(getFreeBrowseConfig().readUrlParams).toBe(true);
    await act(async () => {
      handle.destroy();
    });
    expect(container.innerHTML).toBe("");
  });

  test("supports multiple concurrent mounts with isolated stores and configs", async () => {
    const other = document.createElement("div");
    document.body.appendChild(other);
    const nv1 = new NiiVue();
    const nv2 = new NiiVue();
    let first!: FreeBrowseHandle;
    let second!: FreeBrowseHandle;
    try {
      await act(async () => {
        first = mount(container, {
          nv: nv1,
          persist: false,
          sidebar: true,
          footer: false,
          downloadDisabled: true,
        });
        second = mount(other, {
          nv: nv2,
          persist: false,
          sidebar: false,
          footer: true,
          downloadDisabled: false,
        });
      });

      expect(container.querySelector(".freebrowse-root")).not.toBeNull();
      expect(other.querySelector(".freebrowse-root")).not.toBeNull();

      // Independent layout state per mount
      expect(container.textContent).toContain("Volumetric Details");
      expect(container.textContent).not.toContain("Load images to see coordinates");
      expect(other.textContent).not.toContain("Volumetric Details");
      expect(other.textContent).toContain("Load images to see coordinates");

      // Independent export lockdown per mount (nv1 locked, nv2 unlocked)
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      expect(await nv1.saveVolume({ filename: "blocked.nii.gz" })).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
      expect(second.config.downloadDisabled).toBe(false);

      // Destroying the first mount does not disturb the second
      await act(async () => {
        first.destroy();
      });
      expect(container.innerHTML).toBe("");
      expect(other.querySelector(".freebrowse-root")).not.toBeNull();
      // Host-owned nv1 methods are restored after destroy
      warnSpy.mockClear();
      await nv1.saveVolume({ filename: "restored.nii.gz" });
      expect(warnSpy).not.toHaveBeenCalled();

      await act(async () => {
        second.destroy();
      });
      expect(other.innerHTML).toBe("");
    } finally {
      other.remove();
    }
  });

  test("destroy() during pending attachToCanvas defers nv.destroy() until init settles", async () => {
    let resolveAttach!: () => void;
    const attachDone = new Promise<void>((r) => {
      resolveAttach = r;
    });
    const nv = new NiiVue();
    const destroySpy = vi.fn();
    (nv as unknown as { destroy: () => void }).destroy = destroySpy;
    vi.spyOn(nv, "attachToCanvas").mockImplementation((canvas) => {
      nv.canvas = canvas;
      return attachDone.then(() => nv) as unknown as ReturnType<NiiVue["attachToCanvas"]>;
    });

    // Owned instance via mock: exercise hostInstance=false deferral by spying on prototype
    const origAttach = NiiVue.prototype.attachToCanvas;
    const origDestroy = (NiiVue.prototype as unknown as { destroy?: () => void }).destroy;
    const ownedDestroySpy = vi.fn();
    NiiVue.prototype.attachToCanvas = function (this: NiiVue, canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      return attachDone.then(() => this) as unknown as ReturnType<NiiVue["attachToCanvas"]>;
    };
    (NiiVue.prototype as unknown as { destroy?: () => void }).destroy = ownedDestroySpy;

    try {
      let handle!: FreeBrowseHandle;
      await act(async () => {
        handle = mount(container, { dragDrop: false });
      });

      // Destroy while attachToCanvas is still pending
      await act(async () => {
        handle.destroy();
      });
      expect(ownedDestroySpy).not.toHaveBeenCalled();

      // Once attachToCanvas settles, nv.destroy() runs automatically
      resolveAttach();
      await new Promise((r) => setTimeout(r, 10));
      expect(ownedDestroySpy).toHaveBeenCalledTimes(1);
    } finally {
      NiiVue.prototype.attachToCanvas = origAttach;
      if (origDestroy) {
        (NiiVue.prototype as unknown as { destroy?: () => void }).destroy = origDestroy;
      } else {
        delete (NiiVue.prototype as unknown as { destroy?: () => void }).destroy;
      }
    }
  });

  test("slow attachToCanvas settling after destroy() timeout runs follow-up nv.destroy()", async () => {
    vi.useFakeTimers();
    let resolveAttach!: () => void;
    const attachDone = new Promise<void>((r) => {
      resolveAttach = r;
    });
    const origAttach = NiiVue.prototype.attachToCanvas;
    const origDestroy = (NiiVue.prototype as unknown as { destroy?: () => void }).destroy;
    const ownedDestroySpy = vi.fn();
    NiiVue.prototype.attachToCanvas = function (this: NiiVue, canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      return attachDone.then(() => this) as unknown as ReturnType<NiiVue["attachToCanvas"]>;
    };
    (NiiVue.prototype as unknown as { destroy?: () => void }).destroy = ownedDestroySpy;

    try {
      let handle!: FreeBrowseHandle;
      await act(async () => {
        handle = mount(container, { dragDrop: false });
      });

      // Destroy while attachToCanvas is stalled
      await act(async () => {
        handle.destroy();
      });
      expect(ownedDestroySpy).not.toHaveBeenCalled();

      // Advance past the 2s destroy settle timeout -> bounded first cleanup runs
      await vi.advanceTimersByTimeAsync(2_100);
      expect(ownedDestroySpy).toHaveBeenCalledTimes(1);

      // Slow attach finally finishes later -> follow-up teardown cleans up late listeners
      resolveAttach();
      await vi.advanceTimersByTimeAsync(0);
      expect(ownedDestroySpy).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
      NiiVue.prototype.attachToCanvas = origAttach;
      if (origDestroy) {
        (NiiVue.prototype as unknown as { destroy?: () => void }).destroy = origDestroy;
      } else {
        delete (NiiVue.prototype as unknown as { destroy?: () => void }).destroy;
      }
    }
  });

  test("destroy() before canvas attaches unblocks loadFile immediately without hanging", async () => {
    const handle = mount(container, { nv: new NiiVue(), persist: false });
    const file = new File(["bytes"], "brain.nii");
    const loadPromise = handle.loadFile(file);
    await act(async () => {
      handle.destroy();
    });
    // Must resolve right away instead of waiting for CANVAS_ATTACH_TIMEOUT_MS
    await expect(loadPromise).resolves.toBeUndefined();
  });

  test("destroy() during pending .nvd arrayBuffer() skips nv.loadDocument()", async () => {
    const nv = new NiiVue();
    const loadDocSpy = vi.spyOn(nv, "loadDocument");
    let handle!: FreeBrowseHandle;
    await act(async () => {
      handle = mount(container, { nv, dragDrop: false, persist: false });
    });
    let resolveBuf!: (buf: ArrayBuffer) => void;
    const slowNvd = {
      name: "slow.nvd",
      arrayBuffer: () => new Promise<ArrayBuffer>((r) => { resolveBuf = r; }),
    } as unknown as File;
    const loadPromise = handle.loadFile(slowNvd);
    // Let awaitCanvasAttached settle so arrayBuffer() is now pending
    await new Promise((r) => setTimeout(r, 10));
    await act(async () => {
      handle.destroy();
    });
    resolveBuf(new TextEncoder().encode(JSON.stringify({ version: 9 })).buffer);
    await expect(loadPromise).resolves.toBeUndefined();
    expect(loadDocSpy).not.toHaveBeenCalled();
  });

  test("Escape closes SettingsDialog when ancestor widget is focused and ignores hidden tabs", async () => {
    const tab1 = document.createElement("div");
    tab1.tabIndex = -1;
    const tab2 = document.createElement("div");
    tab2.tabIndex = -1;
    tab2.classList.add("lm-mod-hidden");
    document.body.appendChild(tab1);
    document.body.appendChild(tab2);

    try {
      await act(async () => {
        mount(tab1, { nv: new NiiVue(), persist: false });
        mount(tab2, { nv: new NiiVue(), persist: false });
      });

      // Open Settings dialog in both tabs via their header Settings buttons
      const openSettings = (el: HTMLElement) => {
        const btn = Array.from(el.querySelectorAll("button")).find((b) =>
          /settings/i.test(b.getAttribute("title") || b.textContent || ""),
        );
        expect(btn).toBeTruthy();
        btn!.click();
      };
      await act(async () => {
        openSettings(tab1);
        openSettings(tab2);
      });
      expect(tab1.querySelector("[data-freebrowse-dialog='true']")).not.toBeNull();
      expect(tab2.querySelector("[data-freebrowse-dialog='true']")).not.toBeNull();

      // Focus tab1's outer wrapper (like JupyterLab's .jp-FreeBrowseWidget) and press Escape
      tab1.focus();
      await act(async () => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      });

      // Tab 1's dialog closes; hidden tab 2's dialog remains untouched
      expect(tab1.querySelector("[data-freebrowse-dialog='true']")).toBeNull();
      expect(tab2.querySelector("[data-freebrowse-dialog='true']")).not.toBeNull();
    } finally {
      tab1.remove();
      tab2.remove();
    }
  });

  test("creates an instance when none is given", async () => {
    let handle!: FreeBrowseHandle;
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
    let handle!: FreeBrowseHandle;
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
    let handle!: FreeBrowseHandle;
    await act(async () => {
      handle = mount(container, { nv: new NiiVue(), sidebar: false, footer: false });
    });
    expect(container.textContent).not.toContain("Volumetric Details");
    expect(container.textContent).not.toContain("Load images to see coordinates");
    await act(async () => {
      handle.destroy();
    });
    await act(async () => {
      handle = mount(container, { nv: new NiiVue(), sidebar: true, footer: true });
    });
    expect(container.textContent).toContain("Volumetric Details");
    expect(container.textContent).toContain("Load images to see coordinates");
    await act(async () => {
      handle.destroy();
    });
  });

  test("options flow into the per-instance config", async () => {
    let handle!: FreeBrowseHandle;
    await act(async () => {
      handle = mount(container, {
        nv: new NiiVue(),
        backend: { dataUrl: "https://h/data", aiUrl: "https://h/ai" },
        persist: false,
        exposeGlobal: true,
        readUrlParams: true,
      });
    });
    expect(handle.config.backend).toEqual({
      dataUrl: "https://h/data",
      aiUrl: "https://h/ai",
    });
    expect(handle.config.persist).toBe(false);
    expect(handle.config.readUrlParams).toBe(true);
    expect(window.freebrowse?.nv).toBe(handle.nv);
    await act(async () => {
      handle.destroy();
    });
  });
});
