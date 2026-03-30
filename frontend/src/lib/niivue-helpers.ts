import { SHOW_RENDER, NVImage } from "@niivue/niivue";

/**
 * Map from view mode name to Niivue slice type and render settings.
 */
export const sliceTypeMap: {
  [type: string]: { sliceType: number; showRender: number };
} = {
  axial: { sliceType: 0, showRender: SHOW_RENDER.NEVER },
  coronal: { sliceType: 1, showRender: SHOW_RENDER.NEVER },
  sagittal: { sliceType: 2, showRender: SHOW_RENDER.NEVER },
  ACS: { sliceType: 3, showRender: SHOW_RENDER.NEVER },
  ACSR: { sliceType: 3, showRender: SHOW_RENDER.ALWAYS },
  render: { sliceType: 4, showRender: SHOW_RENDER.ALWAYS },
};

/**
 * Convert an RGBA [0-255] tuple to a hex color string (ignoring alpha).
 */
export function rgba255ToHex(
  rgba255: [number, number, number, number],
): string {
  const r = rgba255[0].toString(16).padStart(2, "0");
  const g = rgba255[1].toString(16).padStart(2, "0");
  const b = rgba255[2].toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

/**
 * Decode a base64 string to a Uint8Array.
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decode a base64-encoded NIfTI into an NVImage ready for Niivue.
 */
export async function base64NiftiToNVImage(
  niftiBase64: string,
  filename: string = "volume.nii.gz",
  opts: { colormap?: string; opacity?: number } = {},
): Promise<NVImage> {
  const niftiBytes = base64ToBytes(niftiBase64);
  const blob = new Blob([niftiBytes], { type: "application/gzip" });
  const file = new File([blob], filename);
  return await NVImage.loadFromFile({
    file,
    colormap: opts.colormap,
    opacity: opts.opacity,
  });
}

/**
 * Convert a Uint8Array to a base64 string efficiently for large arrays.
 */
export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binaryString = "";
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binaryString += String.fromCharCode(...chunk);
  }
  return btoa(binaryString);
}
