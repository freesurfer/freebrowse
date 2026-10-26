import {
  NiiVue,
  type NiiVueOptions,
  type SettingsSavePolicy,
} from "@niivue/niivue";

/**
 * The options FreeBrowse constructs its NiiVue instance with. Shared by the
 * app entry (`main.tsx`) and the library (`createFreeBrowseInstance`) so both
 * produce identical instances. No `backend` option: niivue picks WebGPU when
 * `navigator.gpu` exists and falls back to WebGL2 otherwise.
 */
export const DEFAULT_NIIVUE_OPTIONS: Partial<NiiVueOptions> = {
  placeholderText: "Drag-drop images",
  isDragDropEnabled: true,
  backgroundColor: [0, 0, 0, 1],
  crosshairColor: [1.0, 0.0, 0.0, 0.5],
};

/** Overrides the QA route applies on top of the defaults. */
export const QA_VIEWER_NIIVUE_OPTIONS: Partial<NiiVueOptions> = {
  placeholderText: "",
  isDragDropEnabled: false,
  crosshairColor: [1.0, 0.88, 0.88, 1.0],
  crosshairWidth: 0.3,
  crosshairGap: 10,
};

/**
 * Settings policy for every document FreeBrowse saves.
 *
 * `volume.matcap` is omitted: niivue-mono applies its bundled `cortex` matcap
 * to every instance but declares the default as `''`, so the sparsifier can
 * never elide it and each saved document carries the matcap as a ~23 KB
 * `data:image/jpeg;base64,…` URL -- 88% of a typical FreeBrowse save
 * (niivue/mono#225). FreeBrowse exposes no matcap UI, so nothing a user chose
 * is lost; on load an omitted matcap falls back to the instance's own. Remove
 * once #225 is fixed upstream.
 */
export const FREEBROWSE_SAVE_SETTINGS: SettingsSavePolicy = {
  neverSave: ["volume.matcap"],
};

/**
 * Build a NiiVue instance the way FreeBrowse does. A host that wants FreeBrowse
 * to own the instance calls this (or lets `mountFreeBrowse` call it); a host
 * that already has an instance passes its own instead.
 */
export function createFreeBrowseInstance(
  overrides: Partial<NiiVueOptions> = {},
): NiiVue {
  return new NiiVue({ ...DEFAULT_NIIVUE_OPTIONS, ...overrides });
}
