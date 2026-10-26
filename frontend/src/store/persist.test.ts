import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { useFreeBrowseStore } from "@/store";
import {
  configureFreeBrowse,
  resetFreeBrowseConfig,
} from "@/lib/deployment-config";

describe("store persistence follows the runtime config", () => {
  beforeEach(() => {
    localStorage.clear();
    resetFreeBrowseConfig();
  });
  afterEach(() => {
    resetFreeBrowseConfig();
    localStorage.clear();
  });

  test("writes user preferences under the default key", () => {
    useFreeBrowseStore.setState({ darkMode: true });
    const raw = localStorage.getItem("freebrowse-user-settings");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).state.darkMode).toBe(true);
  });

  test("a configured key is used instead", () => {
    configureFreeBrowse({ persist: "host-app:freebrowse" });
    useFreeBrowseStore.setState({ sidebarOpen: false });
    expect(localStorage.getItem("host-app:freebrowse")).not.toBeNull();
    expect(localStorage.getItem("freebrowse-user-settings")).toBeNull();
  });

  test("persist: false writes nothing to localStorage", () => {
    configureFreeBrowse({ persist: false });
    useFreeBrowseStore.setState({ footerOpen: false });
    expect(localStorage.length).toBe(0);
    // and reads back from memory on rehydrate
    useFreeBrowseStore.setState({ footerOpen: true });
    expect(useFreeBrowseStore.getState().footerOpen).toBe(true);
  });
});
