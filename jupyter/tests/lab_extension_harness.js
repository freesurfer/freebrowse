// Exercise jupyter/src/index.ts in a node `vm` sandbox with hand-written
// JupyterLab mocks, for one combination of the deployment settings:
//
//   node lab_extension_harness.js <path to index.ts> [open_in] [file_access] [notebook]
//
// open_in / file_access are what the server published through page config
// ("" = unset). A fourth argument "notebook" sets Notebook 7's `notebookPage`
// page-config flag, which forces document mode whatever open_in says.
// Driven by tests/test_jupyter_integration.py.
"use strict";
const fs = require("fs");
const vm = require("vm");
const assert = require("assert/strict");
const ts = require("typescript");
const { JSDOM } = require("jsdom");
const { Signal } = require("@lumino/signaling");

const [, , sourcePath, openIn = "", fileAccess = "", page = ""] = process.argv;
const notebook = page === "notebook";
const browserMode = openIn === "browser" && !notebook;
const urlMode = fileAccess === "url";
const SOURCE = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018 },
}).outputText;

const downloadUrl = path => `https://hub.example/download/${encodeURIComponent(path)}?_xsrf=session-xsrf`;
const downloadUrlNoXsrf = path => `https://hub.example/download/${encodeURIComponent(path)}`;
const viewerFileUrl = downloadUrl;
const parameterFor = name => (name.toLowerCase().endsWith(".nvd") ? "nvd" : "vol");
const isNvd = name => name.toLowerCase().endsWith(".nvd");
const settle = async () => { for (let i = 0; i < 15; i++) await new Promise(resolve => setImmediate(resolve)); };

class MockFile extends Blob {
  constructor(parts, name, opts = {}) {
    super(parts, opts);
    this.name = name;
  }
}

(async () => {
for (const base of ["/", "/user/alice/", "https://hub.example/user/alice/"]) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://hub.example" });
  const opened = [], types = [], factories = [], modelFactories = [], menus = [], downloads = [], requests = [];
  const opens = [], tabs = [], intervals = [], closedWidgets = [];
  const mounts = [];
  const blobs = new Map();
  let nextBlob = 0;
  const browserURL = class extends URL {};
  browserURL.createObjectURL = blob => { const url = `blob:https://hub.example/${++nextBlob}`; blobs.set(url, blob); return url; };
  browserURL.revokeObjectURL = url => blobs.delete(url);
  const settings = { baseUrl: base, token: "private-parent-token" };
  const goodResponse = () => ({ ok: true, status: 200, headers: { get: () => "application/octet-stream" }, blob: async () => new Blob(["volume bytes"]) });
  let responseFor = async () => goodResponse();
  let downloadUrlFor = async path => downloadUrl(path);
  let loadHook = null;
  const services = { serverSettings: settings, contents: {
    getDownloadUrl: async path => { downloads.push(path); return downloadUrlFor(path); },
  } };
  let selected;
  let popupBlocked = false;
  const commands = new Map();
  class Widget {
    constructor() { this.node = dom.window.document.createElement("div"); this.isDisposed = false; }
    addClass(cls) { this.node.classList.add(cls); }
    onResize() {}
    dispose() { this.isDisposed = true; }
  }
  class Factory { constructor(options) { this.options = options; } }
  class DocumentWidget {
    constructor(options) { Object.assign(this, options); this.isDisposed = false; }
    close() { closedWidgets.push(this); this.isDisposed = true; }
  }
  const makeTab = () => {
    const tab = { closed: false, opener: "parent window", navigated: null,
      location: { replace(url) { tab.navigated = url; } }, close() { tab.closed = true; } };
    tabs.push(tab);
    return tab;
  };
  const liveMounts = () => mounts.filter(m => !m.destroyed);
  const embedMock = {
    mountFreeBrowse(container, options) {
      const record = {
        container,
        options,
        loadedFiles: [],
        loadedUrls: [],
        resized: 0,
        destroyed: false,
        nv: { resize() { record.resized += 1; } },
        async loadFile(file, signal) {
          if (loadHook) await loadHook(record, file, signal);
          record.loadedFiles.push(file);
        },
        async loadVolumeUrl(url, filename, signal) {
          if (loadHook) await loadHook(record, { url, filename }, signal);
          record.loadedUrls.push({ url, filename });
        },
        destroy() {
          record.destroyed = true;
          container.replaceChildren();
        },
      };
      const marker = dom.window.document.createElement("div");
      marker.className = "freebrowse-root";
      container.appendChild(marker);
      mounts.push(record);
      return record;
    },
  };
  const pageConfig = {
    notebookPage: notebook ? "edit" : "",
    freebrowseOpenIn: openIn,
    freebrowseFileAccess: fileAccess,
  };
  const modules = {
    "@jupyterlab/application": {},
    "@jupyterlab/docregistry": { ABCWidgetFactory: Factory, DocumentWidget, DocumentModel: class {} },
    "@jupyterlab/filebrowser": { IFileBrowserFactory: Symbol() },
    "@jupyterlab/coreutils": { PageConfig: { getBaseUrl: () => base, getOption: key => pageConfig[key] ?? "" } },
    "@lumino/widgets": { Widget },
    "@jupyterlab/services": { ServerConnection: { makeRequest: async (url, init, supplied) => {
      assert.equal(supplied, settings); assert.equal(init.method, "GET");
      requests.push(url);
      return responseFor(url, init);
    } } },
    "../embed/freebrowse-embed.js": embedMock,
    "../embed/freebrowse-embed.css": {},
  };
  const unexpected = what => () => { throw Error(`Unexpected ${what}`); };
  const windowMock = browserMode
    ? { open: (url, target) => { opens.push([url, target]); return popupBlocked ? null : makeTab(); },
        setInterval: (fn, ms) => { intervals.push({ fn, ms, cleared: false }); return intervals.length; },
        clearInterval: id => { intervals[id - 1].cleared = true; } }
    : { open: unexpected("external browser tab"), setInterval: unexpected("timer"), clearInterval: unexpected("timer") };
  const sandbox = { exports: {}, require: name => modules[name], console,
    document: dom.window.document, URL: browserURL, AbortController, File: MockFile, Blob,
    window: windowMock, setTimeout: unexpected("auto-close") };
  vm.runInNewContext(SOURCE, sandbox);
  sandbox.exports.default.activate({
    serviceManager: services,
    commands: { addCommand: (id, command) => commands.set(id, command),
      execute: (id, args) => { assert.equal(id, "docmanager:open"); opened.push(args); } },
    contextMenu: { addItem: item => menus.push(item) },
    docRegistry: { addFileType: type => types.push(type), addWidgetFactory: f => factories.push(f),
      addModelFactory: f => modelFactories.push(f) },
  }, { tracker: { currentWidget: { selectedItems: function* () { if (selected) yield selected; } } } });

  // --- registration -------------------------------------------------------
  assert.deepEqual(Array.from(factories[0].options.defaultFor), ["nifti", "nifti-gz", "mgh", "mgz", "nvd"]);
  assert.equal(factories[0].options.name, "FreeBrowse");
  assert.equal(factories[0].options.modelName, "freebrowse", "The widget factory uses the no-content model");
  assert.equal(modelFactories.length, 1);
  assert.equal(modelFactories[0].name, "freebrowse");
  assert.equal(modelFactories[0].fileFormat, null, "A null fileFormat stops the context from fetching the file");
  assert.equal(modelFactories[0].contentType, "file");
  assert.deepEqual(types.map(t => t.name), ["nifti", "nifti-gz", "mgh", "mgz", "nvd"]);
  assert.ok(types.every(t => t.fileFormat === undefined && t.contentType === "file"), "No file type asks for base64 content");
  assert.equal(menus[0].command, "freebrowse:open");
  assert.equal(JSON.stringify(sandbox.exports.readSettings()),
    JSON.stringify({ openIn: browserMode ? "browser" : "document", fileAccess: urlMode ? "url" : "blob" }));
  const command = commands.get("freebrowse:open");

  // --- helpers ------------------------------------------------------------
  const openPath = path => {
    const context = { path };
    context.pathChanged = new Signal(context);
    const before = opens.length;
    const widget = factories[0].createNewWidget(context);
    assert.equal(widget.content.node.querySelector("iframe"), null, "Neither mode embeds an iframe");
    if (browserMode) {
      assert.equal(opens.length, before + 1, "The browser tab is opened synchronously in createNewWidget");
      assert.deepEqual(opens.at(-1), ["about:blank", "_blank"]);
      if (!popupBlocked) assert.equal(tabs.at(-1).opener, null);
    } else {
      assert.equal(opens.length, before);
      assert.equal(widget.content.node.dataset.lmSuppressShortcuts, "true");
    }
    return { widget, context };
  };
  const checkBrowserViewerUrl = (href, name) => {
    const url = new URL(href, "https://hub.example");
    assert.equal(url.pathname, new URL(`${base}freebrowse/`, "https://hub.example").pathname);
    assert.equal(url.hash, "");
    assert.equal(Array.from(url.searchParams).length, 2);
    assert.equal(url.searchParams.get("filename"), name);
    const file = url.searchParams.get(parameterFor(name));
    if (urlMode) assert.equal(file, viewerFileUrl(`data folder/${name}`));
    else assert.ok(blobs.has(file));
    assert.equal(url.href.includes(settings.token), false);
    assert.equal(url.href.includes("session-xsrf"), urlMode);
    return url;
  };
  const expectFailure = (widget, text) => {
    assert.equal(widget.content.node.textContent, text);
    assert.equal(widget.content.node.querySelector("iframe"), null);
    if (browserMode) {
      assert.equal(tabs.at(-1).closed, true, "A failed open closes the blank tab");
      assert.equal(tabs.at(-1).navigated, null);
      assert.equal(closedWidgets.includes(widget), false, "The placeholder stays to show the message");
    } else {
      assert.equal(liveMounts().length, 0, "Failed document open leaves no mounted viewer");
    }
    assert.equal(blobs.size, 0);
  };
  const deferNext = () => {
    let resume;
    const pending = new Promise(resolve => { resume = resolve; });
    if (urlMode) downloadUrlFor = async path => { await pending; return downloadUrl(path); };
    else responseFor = async () => ({ ...goodResponse(), blob: () => pending.then(() => new Blob(["late bytes"])) });
    return () => resume();
  };
  const restore = () => {
    downloadUrlFor = async path => downloadUrl(path);
    responseFor = async () => goodResponse();
    loadHook = null;
  };

  // --- open each kind of file ---------------------------------------------
  for (const name of ["brain.nii", "brain.nii.gz", "orig.mgh", "aseg.mgz", "scene.nvd", "Bräin # & ? 100%.NII.GZ", "T1 # &.MGZ", "scene # &.NVD"]) {
    const path = `data folder/${name}`;
    selected = { name, path };
    assert.equal(command.isVisible(), true);
    command.execute();
    const request = opened.pop();
    assert.equal(request.path, path);
    assert.equal(request.factory, "FreeBrowse");
    const requestsBefore = requests.length;
    const { widget, context } = openPath(path);
    if (browserMode) assert.equal(widget.content.node.textContent, `Opening ${name} in a new browser tab…`);
    await settle();
    assert.equal(downloads.at(-1), path, "Use the Jupyter contents service to resolve the file");

    if (browserMode) {
      if (urlMode) assert.equal(requests.length, requestsBefore, "url mode never downloads from the Lab page");
      else assert.equal(requests.at(-1), downloadUrlNoXsrf(path), "blob mode strips _xsrf query param because ServerConnection sends X-XSRFToken header");
      const url = checkBrowserViewerUrl(tabs.at(-1).navigated, name);
      assert.equal(closedWidgets.at(-1), widget, "The placeholder closes once the viewer tab has the file");
      const tab = tabs.at(-1);
      if (urlMode) {
        assert.equal(intervals.length, 0, "Nothing to revoke in url mode");
        assert.equal(blobs.size, 0);
      } else {
        assert.equal(intervals.length, tabs.length, "One revoke poll per viewer tab");
        const poll = intervals.at(-1);
        assert.equal(poll.ms, 1000);
        poll.fn();
        assert.equal(blobs.has(url.searchParams.get(parameterFor(name))), true);
        tab.closed = true;
        poll.fn();
        assert.equal(blobs.has(url.searchParams.get(parameterFor(name))), false);
        assert.equal(poll.cleared, true);
      }
      continue;
    }

    // Document mode: in-DOM mount (no iframe, no blob URL leak), multi-tab, rename, resize, disposal.
    assert.equal(blobs.size, 0, "In-DOM document mode creates no blob: URLs");
    assert.equal(widget.content.node.querySelector("iframe"), null);
    assert.notEqual(widget.content.node.querySelector(".freebrowse-root"), null);
    const firstMount = mounts.at(-1);
    assert.equal(firstMount.destroyed, false);
    assert.equal(firstMount.options.backend, null);
    assert.equal(firstMount.options.persist, false);
    assert.equal(firstMount.options.dragDrop, false);
    assert.equal(firstMount.options.allowExternalDocumentUrls, false, "Document mode blocks external .nvd URLs");

    if (urlMode && !isNvd(name)) {
      assert.equal(requests.length, requestsBefore, "url mode skips Lab-side buffering for volumes");
      assert.equal(firstMount.loadedUrls.length, 1);
      assert.equal(firstMount.loadedUrls[0].filename, name);
      assert.equal(firstMount.loadedUrls[0].url, viewerFileUrl(path));
    } else {
      assert.equal(requests.at(-1), downloadUrlNoXsrf(path), "document blob/nvd fetch strips _xsrf query param");
      assert.equal(firstMount.loadedFiles.length, 1);
      assert.equal(firstMount.loadedFiles[0].name, name);
    }

    // Clicking a non-interactive viewer background child focuses widget.node
    // (despite widget.node having tabIndex=-1), while clicking an interactive
    // descendant button does not steal focus back to widget.node.
    dom.window.document.body.appendChild(widget.content.node);
    const canvasArea = dom.window.document.createElement("div");
    const button = dom.window.document.createElement("button");
    const rootMarker = widget.content.node.querySelector(".freebrowse-root");
    rootMarker.appendChild(canvasArea);
    rootMarker.appendChild(button);
    let nodeFocusCalls = 0;
    const origFocus = widget.content.node.focus.bind(widget.content.node);
    widget.content.node.focus = opts => { nodeFocusCalls += 1; return origFocus(opts); };
    canvasArea.dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true }));
    assert.equal(nodeFocusCalls, 1, "Clicking non-interactive viewer area focuses widget node");
    button.dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true }));
    assert.equal(nodeFocusCalls, 1, "Clicking an interactive control does not steal focus to widget node");

    // Resize forwards to NiiVue
    const resizesBefore = firstMount.resized;
    widget.content.onResize({});
    assert.equal(firstMount.resized, resizesBefore + 1);

    // Second concurrent document mounts cleanly alongside the first
    const { widget: second } = openPath("another.nii");
    await settle();
    const secondMount = mounts.at(-1);
    assert.equal(liveMounts().length, 2);

    // Rename tears down previous mount and loads renamed file without disturbing sibling
    context.path = "renamed #.nii.gz";
    context.pathChanged.emit(context.path);
    await settle();
    assert.equal(firstMount.destroyed, true, "A rename destroys the previous mount");
    const renamedMount = mounts.at(-1);
    if (urlMode) assert.equal(renamedMount.loadedUrls[0].filename, "renamed #.nii.gz");
    else assert.equal(renamedMount.loadedFiles[0].name, "renamed #.nii.gz");
    assert.equal(secondMount.destroyed, false);

    // Dispose tears down mount and ignores subsequent pathChanged
    widget.content.dispose();
    assert.equal(renamedMount.destroyed, true);
    const mountsAfterDispose = mounts.length;
    context.path = "after-close.nii";
    context.pathChanged.emit(context.path);
    await settle();
    assert.equal(mounts.length, mountsAfterDispose);

    second.content.dispose();
    assert.equal(secondMount.destroyed, true);
    assert.equal(liveMounts().length, 0);
    assert.equal(blobs.size, 0);
  }

  // --- failures -----------------------------------------------------------
  const failures = urlMode
    ? [() => { downloadUrlFor = async () => { throw new Error("contents service down"); }; }]
    : [{ ok: false, status: 403 }, { ok: true, status: 200 }].map(response =>
        () => { responseFor = async () => ({ ...response, headers: { get: () => "text/html" } }); });
  for (const arrange of failures) {
    arrange();
    const { widget } = openPath("denied.nii");
    await settle();
    expectFailure(widget, "FreeBrowse could not load this file through Jupyter.");
    widget.content.dispose();
    restore();
  }
  if (browserMode) {
    popupBlocked = true;
    const pollsBefore = intervals.length;
    const { widget } = openPath("blocked.nii");
    await settle();
    assert.match(widget.content.node.textContent, /pop-ups/);
    assert.equal(closedWidgets.includes(widget), false);
    assert.equal(blobs.size, 0, "A blocked pop-up retains no blob");
    assert.equal(intervals.length, pollsBefore, "A blocked pop-up starts no revoke poll");
    popupBlocked = false;
    widget.content.dispose();
  }

  // --- races (download AND in-flight decode/loadFile) ---------------------
  if (!browserMode) {
    const finishOld = deferNext();
    const { widget: pending, context: pendingContext } = openPath("old.nii");
    await settle();
    restore();
    pendingContext.path = "new.nii";
    pendingContext.pathChanged.emit(pendingContext.path);
    await settle();
    const latestMount = mounts.at(-1);
    finishOld();
    await settle();
    assert.equal(mounts.at(-1), latestMount, "A stale download cannot replace the renamed file");
    assert.equal(liveMounts().length, 1);
    pending.content.dispose();
    assert.equal(liveMounts().length, 0);

    // Close while loadFile / loadVolumeUrl is still in flight
    let releaseDecode;
    const decodeWait = new Promise(resolve => { releaseDecode = resolve; });
    loadHook = async () => { await decodeWait; };
    const { widget: decoding } = openPath("decoding.nii");
    await settle();
    assert.equal(liveMounts().length, 1);
    decoding.content.dispose();
    assert.equal(liveMounts().length, 0, "Disposing mid-decode tears down the mount");
    releaseDecode();
    await settle();
    assert.equal(liveMounts().length, 0, "Late decode completion leaves no mounted viewer");
    restore();
  }
  {
    const finishLate = deferNext();
    const { widget: closed } = openPath("closed.nii");
    await settle();
    closed.content.dispose();
    if (browserMode) {
      assert.equal(tabs.at(-1).closed, true, "Closing the placeholder closes the still-blank tab");
    }
    finishLate();
    await settle();
    assert.equal(blobs.size, 0, "A download completing after close must not retain a blob");
    assert.equal(liveMounts().length, 0, "A download completing after close must not mount a viewer");
    if (browserMode) {
      assert.equal(tabs.at(-1).navigated, null, "A download completing after close must not navigate the tab");
      assert.equal(closedWidgets.includes(closed), false);
    }
    restore();
  }

  selected = { name: "notes.txt", path: "notes.txt" };
  assert.equal(command.isVisible(), false);
  selected = undefined;
  assert.equal(command.isVisible(), false);
}
})().catch(error => { console.error(error); process.exitCode = 1; });
