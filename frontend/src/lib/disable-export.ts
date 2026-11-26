import { NiiVue } from "@niivue/niivue";

/**
 * Neutralize niivue's save-to-DISK API for secure deployments
 * (`VITE_DISABLE_DOWNLOAD`, see `deployment-config.ts`).
 *
 * Hiding the Download button stops the obvious path; this additionally no-ops
 * the underlying niivue methods so a well-intentioned user poking the browser
 * console (`nv.saveVolume({filename: "x.nii.gz"})`, `nv.saveDocument("scene")`,
 * ...) doesn't trivially write data to disk. It is NOT a defense against a
 * malicious user as the voxels are still on the GPU. It raises the bar for
 * honest mistakes.
 *
 * Only the disk-writing paths are patched. The in-memory byte exports stay
 * intact on purpose: `saveVolume({filename: ""})` / `saveDrawing("")` return a
 * `Uint8Array` and `serializeDocument()` returns document bytes, and those feed
 * the backend Save, the AI session upload, save-drawing and edit-volume, all of
 * which must keep working in a locked-down deployment.
 *
 * Patched at the prototype level: there is effectively one NiiVue instance, and
 * this also covers the QA viewer and any instance created later.
 */

const REFUSED = "applyExportLockdown: saving to disk is disabled in this deployment";

/** True when a `saveVolume` / `saveDrawing` call is a bytes-only export. */
function isBytesOnly(filename: string | undefined): boolean {
  // Only an explicit empty string means "return data"; `undefined` falls back
  // to niivue's default filename and would download.
  return filename === "";
}

type ExportMethodKey =
  | "saveVolume"
  | "saveDrawing"
  | "saveMesh"
  | "saveBitmap"
  | "saveDocument";

function patchTarget(
  target: Pick<NiiVue, ExportMethodKey>,
): () => void {
  const keys: ExportMethodKey[] = [
    "saveVolume",
    "saveDrawing",
    "saveMesh",
    "saveBitmap",
    "saveDocument",
  ];
  const hadOwn = new Map<ExportMethodKey, boolean>();
  const prevDescriptors = new Map<ExportMethodKey, PropertyDescriptor | undefined>();
  for (const key of keys) {
    hadOwn.set(key, Object.prototype.hasOwnProperty.call(target, key));
    prevDescriptors.set(key, Object.getOwnPropertyDescriptor(target, key));
  }

  const origSaveVolume = target.saveVolume;
  const origSaveDrawing = target.saveDrawing;

  target.saveVolume = async function (
    this: NiiVue,
    options?: Parameters<NiiVue["saveVolume"]>[0],
  ) {
    if (!isBytesOnly(options?.filename)) {
      console.warn(REFUSED);
      return false;
    }
    return origSaveVolume.call(this, options);
  };

  target.saveDrawing = async function (this: NiiVue, filename?: string) {
    if (!isBytesOnly(filename)) {
      console.warn(REFUSED);
      return false;
    }
    return origSaveDrawing.call(this, filename);
  };

  // Disk-only methods: no in-memory variant exists, so they are no-ops.
  target.saveMesh = async () => {
    console.warn(REFUSED);
  };
  target.saveBitmap = async () => {
    console.warn(REFUSED);
    return false;
  };
  target.saveDocument = () => {
    console.warn(REFUSED);
  };
  // `serializeDocument` is deliberately left alone: it returns bytes to the
  // caller (backend Save), it never writes to disk.

  return () => {
    for (const key of keys) {
      if (hadOwn.get(key)) {
        const desc = prevDescriptors.get(key);
        if (desc) Object.defineProperty(target, key, desc);
      } else {
        delete (target as Record<string, unknown>)[key];
      }
    }
  };
}

const instanceRefCounts = new WeakMap<NiiVue, { count: number; restore: () => void }>();

/**
 * Neutralize disk-saving methods on one NiiVue instance without mutating
 * `NiiVue.prototype` for sibling instances on the same page. Returns a cleanup
 * function that restores the instance's original methods once the last lock
 * holder releases it.
 */
export function applyExportLockdownToInstance(nv: NiiVue): () => void {
  let entry = instanceRefCounts.get(nv);
  if (!entry) {
    entry = { count: 0, restore: patchTarget(nv) };
    instanceRefCounts.set(nv, entry);
  }
  entry.count += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const current = instanceRefCounts.get(nv);
    if (!current) return;
    current.count -= 1;
    if (current.count <= 0) {
      instanceRefCounts.delete(nv);
      current.restore();
    }
  };
}

export function applyExportLockdown(): void {
  patchTarget(NiiVue.prototype);
}
