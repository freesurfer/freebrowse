// FreeBrowse embedded in a framework-free page (the shape Neurodesk apps have).
//
// The host creates the NiiVue instance from `@niivue/niivue` (1.0.0-rc — a
// classic niivue 0.x instance, e.g. a `globalThis.niivue` from a script tag,
// cannot drive FreeBrowse), mounts the FreeBrowse UI around it, and then talks
// to the instance directly. FreeBrowse's store is a derived view of the
// instance's events, so the sidebar, toolbar and footer follow every call.
import { NiiVue } from "@niivue/niivue";
import { mountFreeBrowse } from "freebrowse";
import "freebrowse/style.css";

const MNI = "https://niivue.com/demos/images/mni152.nii.gz";
const OVERLAY = "https://niivue.com/demos/images/hippo.nii.gz";

// Something of the host's own on a canvas, to prove FreeBrowse's canvas rules
// stay inside its panel.
const hc = document.getElementById("host-canvas").getContext("2d");
hc.fillStyle = "#b58900";
hc.fillRect(10, 10, 220, 40);
hc.fillStyle = "#fdf6e3";
hc.font = "20px Georgia";
hc.fillText("host canvas", 60, 38);

const viewer = document.getElementById("viewer");
const $ = (id) => document.getElementById(id);

// The host owns the instance: FreeBrowse seeds its UI from these settings and
// never pushes its own defaults onto it.
const nv = new NiiVue({
  backgroundColor: [0.05, 0.05, 0.1, 1],
  crosshairColor: [0.15, 0.55, 0.82, 1],
});

let fb = null;
function mount() {
  fb = mountFreeBrowse(viewer, {
    nv,
    // A host that loads data itself: no drag-and-drop / drop zone, and a
    // minimal chrome (the header buttons can still open the sidebar).
    dragDrop: false,
    sidebar: false,
    footer: false,
    // Demo conveniences; both default to false in a real embed:
    exposeGlobal: true, // window.freebrowse.nv for console experiments
    persist: false, // don't write this demo's preferences to localStorage
  });
  $("btn-destroy").disabled = false;
  $("btn-mount").disabled = true;
}
if (!new URLSearchParams(location.search).has("nomount")) mount();

// --- host-driven actions: plain niivue API calls, nothing FreeBrowse-specific ---
$("btn-load").onclick = () => nv.addVolume({ url: MNI, name: "mni152.nii.gz" });
$("btn-overlay").onclick = () =>
  nv.addVolume({ url: OVERLAY, name: "hippo.nii.gz", colormap: "Red", opacity: 0.6 });
$("btn-colormap").onclick = () => nv.setVolume(0, { colormap: "Hot" });
$("btn-render").onclick = () => {
  nv.showRender = 1; // SHOW_RENDER.ALWAYS
  nv.sliceType = 4; // SLICE_TYPE.RENDER
};
$("btn-radiological").onclick = () => {
  nv.isRadiological = !nv.isRadiological;
};
$("btn-destroy").onclick = () => {
  fb?.destroy();
  fb = null;
  $("btn-destroy").disabled = true;
  $("btn-mount").disabled = false;
};
$("btn-mount").onclick = mount;
