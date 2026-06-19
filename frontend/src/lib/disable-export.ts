import { Niivue, NVImage } from "@niivue/niivue";

/**
 * Neutralize niivue's public save-to-disk API for secure deployments.
 *
 * Hiding the Download button stops the obvious path; this additionally no-ops
 * the underlying niivue methods so a well-intentioned user poking the browser
 * console (`nv.saveImage(...)`, `nv.volumes[0].saveToDisk(...)`, ...) doesn't
 * trivially exfiltrate data. It is NOT a defense against a malicious user — the
 * pixels are still on the GPU — it raises the bar for honest mistakes.
 *
 * Patched at the prototype level: there is effectively one Niivue instance, and
 * this also covers the QA viewer and any volumes loaded later.
 */
export function applyExportLockdown(): void {
  const emptyBytes = async (): Promise<Uint8Array> => new Uint8Array();

  // Per-volume export (NVImage).
  NVImage.prototype.saveToDisk = emptyBytes;
  NVImage.prototype.saveToUint8Array = emptyBytes;

  // Whole-instance export (Niivue).
  Niivue.prototype.saveImage = async () => false;
  Niivue.prototype.saveScene = async () => {};
  Niivue.prototype.saveHTML = async () => {};
  Niivue.prototype.saveDocument = async () => {};
}
