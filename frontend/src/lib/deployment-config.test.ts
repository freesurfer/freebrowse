import { afterEach, describe, expect, test } from "vitest";

import {
  aiUrl,
  configureFreeBrowse,
  dataUrl,
  deploymentConfig,
  getFreeBrowseConfig,
  relativeToDataRoot,
  resetFreeBrowseConfig,
} from "./deployment-config";

describe("deployment config", () => {
  afterEach(() => resetFreeBrowseConfig());

  test("defaults: backend at /data + /ai, persistence on, app-style globals", () => {
    const c = getFreeBrowseConfig();
    expect(c.backend).toEqual({ dataUrl: "/data", aiUrl: "/ai" });
    expect(c.persist).toBe("freebrowse-user-settings");
    expect(c.readUrlParams).toBe(true);
    expect(c.exposeGlobal).toBe(true);
    expect(deploymentConfig.serverless).toBe(false);
    expect(dataUrl("nvd")).toBe("/data/nvd");
    expect(aiUrl("session/list")).toBe("/ai/session/list");
  });

  test("configured backend bases are honoured, slashes normalised", () => {
    configureFreeBrowse({
      backend: { dataUrl: "https://host/api/data/", aiUrl: "https://host/api/ai" },
    });
    expect(dataUrl("/nii")).toBe("https://host/api/data/nii");
    expect(aiUrl("model/list")).toBe("https://host/api/ai/model/list");
    expect(relativeToDataRoot("https://host/api/data/sub/x.nii.gz")).toBe("sub/x.nii.gz");
    expect(relativeToDataRoot("https://elsewhere/x.nii.gz")).toBeNull();
  });

  test("backend: null means serverless and the URL helpers refuse", () => {
    configureFreeBrowse({ backend: null });
    expect(deploymentConfig.serverless).toBe(true);
    expect(() => dataUrl("nvd")).toThrow(/no backend/);
    expect(() => aiUrl("x")).toThrow(/no backend/);
  });

  test("relativeToDataRoot accepts the bare relative spelling", () => {
    expect(relativeToDataRoot("/data/a/b.nii")).toBe("a/b.nii");
    expect(relativeToDataRoot("data/a/b.nii")).toBe("a/b.nii");
  });

  test("deploymentConfig getters are live, not cached", () => {
    expect(deploymentConfig.downloadDisabled).toBe(false);
    configureFreeBrowse({ downloadDisabled: true });
    expect(deploymentConfig.downloadDisabled).toBe(true);
  });
});
