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
const viewerFileUrl = downloadUrl; // url mode hands the viewer the download URL as is, _xsrf included
const parameterFor = name => (name.toLowerCase().endsWith(".nvd") ? "nvd" : "vol");
const settle = async () => { for (let i = 0; i < 10; i++) await new Promise(resolve => setImmediate(resolve)); };

(async () => {
for (const base of ["/", "/user/alice/", "https://hub.example/user/alice/"]) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://hub.example" });
  const opened = [], types = [], factories = [], modelFactories = [], menus = [], downloads = [], requests = [];
  const opens = [], tabs = [], intervals = [], closedWidgets = [];
  const blobs = new Map();
  let nextBlob = 0;
  const browserURL = class extends URL {};
  browserURL.createObjectURL = blob => { const url = `blob:https://hub.example/${++nextBlob}`; blobs.set(url, blob); return url; };
  browserURL.revokeObjectURL = url => blobs.delete(url);
  const settings = { baseUrl: base, token: "private-parent-token" };
  const goodResponse = () => ({ ok: true, status: 200, headers: { get: () => "application/octet-stream" }, blob: async () => new Blob(["volume bytes"]) });
  let responseFor = async () => goodResponse();
  let downloadUrlFor = async path => downloadUrl(path);
  const services = { serverSettings: settings, contents: {
    getDownloadUrl: async path => { downloads.push(path); return downloadUrlFor(path); },
  } };
  let selected;
  let popupBlocked = false;
  const commands = new Map();
  class Widget {
    constructor() { this.node = dom.window.document.createElement("div"); this.isDisposed = false; }
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
  const pageConfig = { notebookPage: notebook ? "edit" : "", freebrowseOpenIn: openIn, freebrowseFileAccess: fileAccess };
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
  };
  const unexpected = what => () => { throw Error(`Unexpected ${what}`); };
  const windowMock = browserMode
    ? { open: (url, target) => { opens.push([url, target]); return popupBlocked ? null : makeTab(); },
        setInterval: (fn, ms) => { intervals.push({ fn, ms, cleared: false }); return intervals.length; },
        clearInterval: id => { intervals[id - 1].cleared = true; } }
    : { open: unexpected("external browser tab"), setInterval: unexpected("timer"), clearInterval: unexpected("timer") };
  const sandbox = { exports: {}, require: name => modules[name], console,
    document: dom.window.document, URL: browserURL, AbortController,
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
  assert.deepEqual(Array.from(factories[0].options.defaultFor), ["nifti", "nifti-gz", "nvd"]);
  assert.equal(factories[0].options.name, "FreeBrowse");
  assert.equal(factories[0].options.modelName, "freebrowse", "The widget factory uses the no-content model");
  assert.equal(modelFactories.length, 1);
  assert.equal(modelFactories[0].name, "freebrowse");
  assert.equal(modelFactories[0].fileFormat, null, "A null fileFormat stops the context from fetching the file");
  assert.equal(modelFactories[0].contentType, "file");
  assert.deepEqual(types.map(t => t.name), ["nifti", "nifti-gz", "nvd"]);
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
    if (browserMode) {
      assert.equal(opens.length, before + 1, "The browser tab is opened synchronously in createNewWidget");
      assert.deepEqual(opens.at(-1), ["about:blank", "_blank"]);
      if (!popupBlocked) assert.equal(tabs.at(-1).opener, null);
      assert.equal(widget.content.node.querySelector("iframe"), null);
    } else {
      assert.equal(opens.length, before);
    }
    return { widget, context };
  };
  const viewerUrl = widget => browserMode ? tabs.at(-1).navigated : widget.content.node.querySelector("iframe").src;
  const checkViewerUrl = (href, name) => {
    const url = new URL(href, "https://hub.example");
    assert.equal(url.pathname, new URL(`${base}freebrowse/`, "https://hub.example").pathname);
    assert.equal(url.hash, "");
    assert.equal(Array.from(url.searchParams).length, 2);
    assert.equal(url.searchParams.get("filename"), name);
    const file = url.searchParams.get(parameterFor(name));
    if (urlMode) assert.equal(file, viewerFileUrl(`data folder/${name}`), "The viewer fetches Jupyter's /files/ URL itself, _xsrf included");
    else assert.ok(blobs.has(file), "The viewer receives locally fetched bytes");
    assert.equal(url.href.includes(settings.token), false);
    assert.equal(url.href.includes("session-xsrf"), urlMode, "Only url mode carries the xsrf parameter (the server demands it on /files/)");
    return url;
  };
  const expectFailure = (widget, text) => {
    assert.equal(widget.content.node.textContent, text);
    assert.equal(widget.content.node.querySelector("iframe"), null);
    if (browserMode) {
      assert.equal(tabs.at(-1).closed, true, "A failed open closes the blank tab");
      assert.equal(tabs.at(-1).navigated, null);
      assert.equal(closedWidgets.includes(widget), false, "The placeholder stays to show the message");
    }
    assert.equal(blobs.size, 0);
  };
  // Defer the step that produces the file in the current mode; returns the resume function.
  const deferNext = () => {
    let resume;
    const pending = new Promise(resolve => { resume = resolve; });
    if (urlMode) downloadUrlFor = async path => { await pending; return downloadUrl(path); };
    else responseFor = async () => ({ ...goodResponse(), blob: () => pending.then(() => new Blob(["late bytes"])) });
    return () => resume();
  };
  const restore = () => { downloadUrlFor = async path => downloadUrl(path); responseFor = async () => goodResponse(); };

  // --- open each kind of file ---------------------------------------------
  for (const name of ["brain.nii", "brain.nii.gz", "scene.nvd", "Bräin # & ? 100%.NII.GZ", "scene # &.NVD"]) {
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
    if (urlMode) assert.equal(requests.length, requestsBefore, "url mode never downloads from the Lab page");
    else assert.equal(requests.at(-1), downloadUrl(path));
    const url = checkViewerUrl(viewerUrl(widget), name);

    if (browserMode) {
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
        assert.equal(blobs.has(url.searchParams.get(parameterFor(name))), true, "The blob lives while the viewer tab is open");
        tab.closed = true;
        poll.fn();
        assert.equal(blobs.has(url.searchParams.get(parameterFor(name))), false, "Closing the viewer tab revokes the blob");
        assert.equal(poll.cleared, true);
      }
      continue;
    }

    // Document mode: a second document, a rename, and disposal.
    const frame = widget.content.node.querySelector("iframe");
    assert.equal(frame.title, "FreeBrowse");
    const { widget: second } = openPath("another.nii");
    await settle();
    const originalFile = new URL(frame.src).searchParams.get(parameterFor(name));
    context.path = "renamed #.nii.gz";
    context.pathChanged.emit(context.path);
    await settle();
    assert.equal(new URL(frame.src).searchParams.get("filename"), "renamed #.nii.gz");
    if (urlMode) assert.equal(new URL(frame.src).searchParams.get("vol"), viewerFileUrl("renamed #.nii.gz"));
    else assert.equal(blobs.has(originalFile), false, "A rename releases the previous blob");
    assert.equal(new URL(second.content.node.querySelector("iframe").src).searchParams.get("filename"), "another.nii");
    widget.content.dispose();
    assert.equal(frame.src, "about:blank");
    context.path = "after-close.nii";
    context.pathChanged.emit(context.path);
    await settle();
    assert.equal(frame.src, "about:blank");
    second.content.dispose();
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

  // --- races --------------------------------------------------------------
  if (!browserMode) {
    const finishOld = deferNext();
    const { widget: pending, context: pendingContext } = openPath("old.nii");
    await settle();
    restore();
    pendingContext.path = "new.nii";
    pendingContext.pathChanged.emit(pendingContext.path);
    await settle();
    const liveFrame = pending.content.node.querySelector("iframe");
    const latest = liveFrame.src;
    finishOld();
    await settle();
    assert.equal(liveFrame.src, latest, "A stale download cannot replace the renamed file");
    assert.equal(new URL(latest).searchParams.get("filename"), "new.nii");
    pending.content.dispose();
    assert.equal(blobs.size, 0);
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
