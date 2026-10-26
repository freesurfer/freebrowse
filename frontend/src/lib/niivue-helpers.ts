import { SHOW_RENDER } from "@niivue/niivue";

/**
 * Map from view mode name to NiiVue slice type and render settings.
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

/**
 * Gzip a byte array with the browser-native `CompressionStream('gzip')`.
 *
 * niivue-mono's `saveVolume` returns raw (uncompressed) bytes only for an empty
 * filename — a `.gz` filename triggers a browser download instead of returning
 * bytes. So the AI upload path exports raw bytes via `saveVolume({filename:''})`
 * and gzips them here (matching old FreeBrowse's `saveToUint8Array(name.gz)`),
 * with no extra dependency.
 */
export async function gzipUint8Array(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Response(bytes).body?.pipeThrough(
    new CompressionStream("gzip"),
  );
  if (!stream) throw new Error("gzip: no readable stream from input");
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
