import type { NiiVue } from "@niivue/niivue";
import { applyLabelColormapsAfterLoad } from "@/hooks/use-volumes";

const LEGACY_NVD_MESSAGE =
  "This .nvd predates the niivue document schema (it has `imageOptionsArray` " +
  "and no `version`). Regenerate it with scripts/migrate-nvd.py.";

const LINKED_NVD_MESSAGE =
  "This .nvd references external or linked resources, which are blocked in " +
  "embedded Jupyter mode. Save the scene as a self-contained .nvd (with embedded data) to open it here.";

const MAX_DRAWING_BITMAP_BYTES = 512 * 1024 * 1024; // 512 MiB cap against RLE bombs
const BUILTIN_MATCAP_RE = /^[A-Za-z0-9_-]+$/;
const MAX_CBOR_DEPTH = 32;
const MAX_CBOR_ITEMS = 100_000;

const NIIVUE_NUM_SENTINELS: Record<string, number> = {
  NaN: Number.NaN,
  Infinity: Number.POSITIVE_INFINITY,
  "-Infinity": Number.NEGATIVE_INFINITY,
};

const NIIVUE_TYPED_ARRAY_NAMES = new Set([
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
]);

/** Unforgeable marker for validated embedded binary payloads (CBOR byte strings or JSON `$ta`/`b64`). */
const EMBEDDED_BINARY_TAG = Symbol("embeddedBinary");

interface EmbeddedBinaryMarker {
  [EMBEDDED_BINARY_TAG]: true;
  byteLength: number;
  kind?: string;
}

/** Compute decoded byte length of a base64 string without allocating a buffer. */
function base64DecodedByteLength(b64: string): number {
  const clean = b64.replace(/\s+/g, "");
  const len = clean.length;
  if (len === 0) return 0;
  let pad = 0;
  if (clean.endsWith("==")) pad = 2;
  else if (clean.endsWith("=")) pad = 1;
  return Math.max(0, Math.floor((len * 3) / 4) - pad);
}

function looksLikeJson(bytes: Uint8Array): boolean {
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b !== 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d) {
      return b === 0x7b; // '{'
    }
  }
  return false;
}

/**
 * Normalize `.nvd` bytes before both validation and NiiVue deserialization so
 * FreeBrowse and NiiVue always inspect the exact same byte stream.
 * Strips a leading UTF-8 BOM only when the remainder is a JSON object.
 */
export function prepareNvdBytes(bytes: Uint8Array): Uint8Array {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    const stripped = bytes.subarray(3);
    if (looksLikeJson(stripped)) {
      return stripped;
    }
  }
  return bytes;
}

/**
 * Reviver matching NiiVue's `documentJsonParse` (`$num` non-finite sentinels
 * and `$ta`/`b64` typed-array markers) without allocating large base64 buffers.
 */
function reviveNiiVueJsonValue(_key: string, value: unknown): unknown {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const rec = value as Record<string, unknown>;
    const keys = Object.keys(rec);
    if (
      keys.length === 1 &&
      typeof rec.$num === "string" &&
      Object.prototype.hasOwnProperty.call(NIIVUE_NUM_SENTINELS, rec.$num)
    ) {
      return NIIVUE_NUM_SENTINELS[rec.$num];
    }
    if (
      typeof rec.$ta === "string" &&
      typeof rec.b64 === "string" &&
      NIIVUE_TYPED_ARRAY_NAMES.has(rec.$ta)
    ) {
      return {
        [EMBEDDED_BINARY_TAG]: true,
        kind: rec.$ta,
        byteLength: base64DecodedByteLength(rec.b64),
      } satisfies EmbeddedBinaryMarker;
    }
  }
  return value;
}

function normalizeRecordForValidation(value: unknown, depth = 0): unknown {
  if (depth > MAX_CBOR_DEPTH) {
    throw new Error("NVD document exceeds maximum nesting depth");
  }
  if (value === null || typeof value !== "object" || ArrayBuffer.isView(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeRecordForValidation(item, depth + 1));
  }
  const revived = reviveNiiVueJsonValue("", value);
  if (revived !== value) {
    return revived;
  }
  const out: Record<string, unknown> = Object.create(null);
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") {
      continue;
    }
    out[k] = normalizeRecordForValidation(v, depth + 1);
  }
  return out;
}

/** Decode RFC 8949 / IEEE 754 binary16 half-precision float. */
function decodeFloat16(bits: number): number {
  const sign = bits & 0x8000 ? -1 : 1;
  const exp = (bits >> 10) & 0x1f;
  const frac = bits & 0x03ff;
  if (exp === 0) {
    return sign * 2 ** -14 * (frac / 1024);
  }
  if (exp === 31) {
    return frac === 0 ? sign * Infinity : Number.NaN;
  }
  return sign * 2 ** (exp - 15) * (1 + frac / 1024);
}

/**
 * Minimal, zero-dependency RFC 8949 CBOR metadata decoder that skips copying
 * binary byte-string payloads (`major type 2`) so large self-contained `.nvd`
 * files can be inspected in O(metadata) time and memory before passing bytes
 * to NiiVue.
 *
 * Security: fail closed on non-typed-array CBOR tags (preventing `cbor-x`
 * shared-reference/stringref/record tag parser differentials such as tag
 * 28/29, 25/256, 51, 57344+), on non-string or BOM-prefixed map keys, on
 * unassigned simple values, and on trailing bytes.
 */
function decodeCborMetadata(bytes: Uint8Array): unknown {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  let offset = 0;
  let items = 0;

  function need(n: number): void {
    if (n < 0 || offset + n > bytes.length) {
      throw new Error("Truncated CBOR document");
    }
  }

  function readArg(ai: number): number {
    if (ai < 24) return ai;
    if (ai === 24) {
      need(1);
      return bytes[offset++];
    }
    if (ai === 25) {
      need(2);
      const v = view.getUint16(offset, false);
      offset += 2;
      return v;
    }
    if (ai === 26) {
      need(4);
      const v = view.getUint32(offset, false);
      offset += 4;
      return v;
    }
    if (ai === 27) {
      need(8);
      const hi = view.getUint32(offset, false);
      const lo = view.getUint32(offset + 4, false);
      offset += 8;
      return hi * 2 ** 32 + lo;
    }
    throw new Error(`Unsupported CBOR additional info: ${ai}`);
  }

  function decodeItem(depth: number): unknown {
    if (depth > MAX_CBOR_DEPTH) {
      throw new Error("CBOR document exceeds maximum nesting depth");
    }
    if (++items > MAX_CBOR_ITEMS) {
      throw new Error("CBOR document exceeds maximum item count");
    }
    need(1);
    const initial = bytes[offset++];
    const major = initial >> 5;
    const ai = initial & 0x1f;

    switch (major) {
      case 0:
        return readArg(ai);
      case 1:
        return -1 - readArg(ai);
      case 2: {
        // Byte string: skip payload without copying large voxel/mesh buffers.
        if (ai === 31) {
          let total = 0;
          while (true) {
            need(1);
            if (bytes[offset] === 0xff) {
              offset++;
              break;
            }
            const chunkInit = bytes[offset++];
            if (chunkInit >> 5 !== 2 || (chunkInit & 0x1f) === 31) {
              throw new Error("Invalid indefinite CBOR byte string");
            }
            const len = readArg(chunkInit & 0x1f);
            need(len);
            offset += len;
            total += len;
          }
          return { [EMBEDDED_BINARY_TAG]: true, byteLength: total };
        }
        const len = readArg(ai);
        need(len);
        offset += len;
        return { [EMBEDDED_BINARY_TAG]: true, byteLength: len };
      }
      case 3: {
        if (ai === 31) {
          const parts: string[] = [];
          while (true) {
            need(1);
            if (bytes[offset] === 0xff) {
              offset++;
              break;
            }
            const chunkInit = bytes[offset++];
            if (chunkInit >> 5 !== 3 || (chunkInit & 0x1f) === 31) {
              throw new Error("Invalid indefinite CBOR text string");
            }
            const len = readArg(chunkInit & 0x1f);
            need(len);
            parts.push(decoder.decode(bytes.subarray(offset, offset + len)));
            offset += len;
          }
          return parts.join("");
        }
        const len = readArg(ai);
        need(len);
        const str = decoder.decode(bytes.subarray(offset, offset + len));
        offset += len;
        return str;
      }
      case 4: {
        const arr: unknown[] = [];
        if (ai === 31) {
          while (true) {
            need(1);
            if (bytes[offset] === 0xff) {
              offset++;
              break;
            }
            arr.push(decodeItem(depth + 1));
          }
          return arr;
        }
        const len = readArg(ai);
        for (let i = 0; i < len; i++) {
          arr.push(decodeItem(depth + 1));
        }
        return arr;
      }
      case 5: {
        const obj: Record<string, unknown> = Object.create(null);
        const setEntry = (k: unknown, v: unknown) => {
          if (typeof k !== "string") {
            throw new Error("Unsupported non-string CBOR map key");
          }
          if (k.charCodeAt(0) === 0xfeff) {
            throw new Error("Unsupported BOM-prefixed CBOR map key");
          }
          if (
            k === "__proto__" ||
            k === "constructor" ||
            k === "prototype"
          ) {
            throw new Error(`Unsupported CBOR map key: ${k}`);
          }
          obj[k] = v;
        };
        if (ai === 31) {
          while (true) {
            need(1);
            if (bytes[offset] === 0xff) {
              offset++;
              break;
            }
            const k = decodeItem(depth + 1);
            const v = decodeItem(depth + 1);
            setEntry(k, v);
          }
          return obj;
        }
        const len = readArg(ai);
        for (let i = 0; i < len; i++) {
          const k = decodeItem(depth + 1);
          const v = decodeItem(depth + 1);
          setEntry(k, v);
        }
        return obj;
      }
      case 6: {
        // Only allow RFC 8746 typed-array tags (64..87) wrapping a byte string.
        // Reject all other tags (e.g. cbor-x shareable/sharedref 28/29,
        // stringref 25/256, packed records 51/57344+) to prevent parser
        // differentials against cbor-x's decoder.
        const tag = readArg(ai);
        if (tag < 64 || tag > 87) {
          throw new Error(`Unsupported CBOR tag in .nvd document: ${tag}`);
        }
        need(1);
        if (bytes[offset] >> 5 !== 2) {
          throw new Error(`CBOR typed-array tag ${tag} must wrap a byte string`);
        }
        return decodeItem(depth + 1);
      }
      case 7: {
        if (ai === 20) return false;
        if (ai === 21) return true;
        if (ai === 22) return null;
        if (ai === 23) return undefined;
        if (ai === 25) {
          need(2);
          const bits = view.getUint16(offset, false);
          offset += 2;
          return decodeFloat16(bits);
        }
        if (ai === 26) {
          need(4);
          const v = view.getFloat32(offset, false);
          offset += 4;
          return v;
        }
        if (ai === 27) {
          need(8);
          const v = view.getFloat64(offset, false);
          offset += 8;
          return v;
        }
        throw new Error(`Unsupported CBOR simple value: ${ai}`);
      }
      default:
        throw new Error(`Invalid CBOR major type: ${major}`);
    }
  }

  const result = decodeItem(0);
  if (offset !== bytes.length) {
    throw new Error("Unexpected trailing bytes in CBOR .nvd document");
  }
  return result;
}

/**
 * Fail legibly on a pre-niivue-mono `.nvd` instead of letting niivue report the
 * opaque "Invalid NVD file: missing version".
 */
export function assertNotLegacyDocument(
  data: Uint8Array | Record<string, unknown>,
): void {
  if (data instanceof Uint8Array) {
    const clean = prepareNvdBytes(data);
    if (!looksLikeJson(clean)) return;
    const prefix = new TextDecoder("utf-8", { fatal: false }).decode(
      clean.subarray(0, 64 * 1024),
    );
    const legacyKey =
      prefix.includes('"imageOptionsArray"') ||
      prefix.includes('"encodedImageBlobs"');
    if (legacyKey && !prefix.includes('"version"')) {
      throw new Error(LEGACY_NVD_MESSAGE);
    }
    return;
  }
  if (
    ("imageOptionsArray" in data || "encodedImageBlobs" in data) &&
    typeof data.version !== "number"
  ) {
    throw new Error(LEGACY_NVD_MESSAGE);
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    !ArrayBuffer.isView(v) &&
    !(EMBEDDED_BINARY_TAG in v)
    ? (v as Record<string, unknown>)
    : null;
}

function embeddedBinaryByteLength(v: unknown): number | null {
  if (ArrayBuffer.isView(v)) return v.byteLength;
  if (typeof v === "object" && v !== null && EMBEDDED_BINARY_TAG in v) {
    return (v as EmbeddedBinaryMarker).byteLength;
  }
  return null;
}

function isEmbeddedBinary(v: unknown): boolean {
  return embeddedBinaryByteLength(v) !== null;
}

const NIFTI_DATATYPE_BITS: Record<number, number> = {
  1: 1, // DT_BINARY
  2: 8, // DT_UINT8
  4: 16, // DT_INT16
  8: 32, // DT_INT32
  16: 32, // DT_FLOAT32
  32: 64, // DT_COMPLEX64
  64: 64, // DT_FLOAT64
  128: 24, // DT_RGB24
  256: 8, // DT_INT8
  512: 16, // DT_UINT16
  768: 32, // DT_UINT32
  1024: 64, // DT_INT64
  1280: 64, // DT_UINT64
  1536: 128, // DT_FLOAT128
  1792: 128, // DT_COMPLEX128
  2048: 256, // DT_COMPLEX256
  2304: 32, // DT_RGBA32
};

/**
 * Bound NIfTI header voxel dimensions against both `MAX_DRAWING_BITMAP_BYTES`
 * (since NiiVue's `ia()` allocates `new Uint8Array(dims[1]*dims[2]*dims[3])`
 * before verifying drawing length) and the actual embedded image payload size.
 */
function assertBoundedVolumeHeader(
  hdr: Record<string, unknown>,
  imgByteLength: number,
): void {
  if (hdr.dims === undefined) return;
  if (!Array.isArray(hdr.dims) || hdr.dims.length < 4) {
    throw new Error("Invalid .nvd document: volume hdr.dims must be an array of length >= 4.");
  }
  let nVox3D = 1;
  for (let i = 1; i <= 3; i++) {
    const dim = hdr.dims[i];
    if (
      typeof dim !== "number" ||
      !Number.isInteger(dim) ||
      dim < 0 ||
      dim > MAX_DRAWING_BITMAP_BYTES
    ) {
      throw new Error(
        `Invalid .nvd document: volume hdr.dims[${i}] must be a non-negative integer <= ${MAX_DRAWING_BITMAP_BYTES}.`,
      );
    }
    nVox3D *= Math.max(dim, 1);
    if (!Number.isSafeInteger(nVox3D) || nVox3D > MAX_DRAWING_BITMAP_BYTES) {
      throw new Error(
        `Invalid .nvd document: volume 3D voxel count exceeds ${MAX_DRAWING_BITMAP_BYTES} bytes.`,
      );
    }
  }
  let nTotalFrames = 1;
  for (const idx of [4, 5, 6]) {
    if (idx < hdr.dims.length && hdr.dims[idx] !== undefined) {
      const dim = hdr.dims[idx];
      if (typeof dim !== "number" || !Number.isInteger(dim) || dim < 0) {
        throw new Error(
          `Invalid .nvd document: volume hdr.dims[${idx}] must be a non-negative integer.`,
        );
      }
      if (dim > 1) {
        nTotalFrames *= dim;
        if (!Number.isSafeInteger(nTotalFrames) || nTotalFrames > MAX_DRAWING_BITMAP_BYTES) {
          throw new Error(
            "Invalid .nvd document: volume higher-dimensional frame count is too large.",
          );
        }
      }
    }
  }
  const datatypeCode = hdr.datatypeCode;
  const bitsPerVoxel = hdr.numBitsPerVoxel;
  const knownDatatypeBits =
    typeof datatypeCode === "number" &&
    Object.prototype.hasOwnProperty.call(NIFTI_DATATYPE_BITS, datatypeCode)
      ? NIFTI_DATATYPE_BITS[datatypeCode]
      : null;
  if (bitsPerVoxel !== undefined) {
    if (
      typeof bitsPerVoxel !== "number" ||
      !Number.isInteger(bitsPerVoxel) ||
      bitsPerVoxel < 1
    ) {
      throw new Error(
        "Invalid .nvd document: volume hdr.numBitsPerVoxel must be a positive integer.",
      );
    }
    if (knownDatatypeBits !== null && bitsPerVoxel !== knownDatatypeBits) {
      throw new Error(
        "Invalid .nvd document: volume hdr.numBitsPerVoxel does not match hdr.datatypeCode.",
      );
    }
  }
  const effectiveBits = bitsPerVoxel ?? knownDatatypeBits ?? 8;
  const totalVoxels = nVox3D * nTotalFrames;
  if (!Number.isSafeInteger(totalVoxels)) {
    throw new Error(
      "Invalid .nvd document: volume voxel count overflows safe integer bounds.",
    );
  }
  const minBytesNeeded = Math.ceil((totalVoxels * effectiveBits) / 8);
  if (imgByteLength < minBytesNeeded) {
    throw new Error(
      nTotalFrames > 1
        ? LINKED_NVD_MESSAGE
        : "Invalid .nvd document: volume hdr.dims exceeds embedded image payload size.",
    );
  }
}

/**
 * True when a URL-bearing field has ANY JavaScript-truthy value (including
 * whitespace-only strings, non-zero numbers, arrays, or objects), matching
 * NiiVue's `if (e.url)` / `if (this.model.ui.thumbnailUrl)` guards.
 */
function hasUrlValue(v: unknown): boolean {
  return Boolean(v);
}

function assertBoundedLength(field: string, value: unknown): void {
  if (value == null) return;
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_DRAWING_BITMAP_BYTES
  ) {
    throw new Error(
      `Invalid .nvd document: ${field} must be a non-negative integer <= ${MAX_DRAWING_BITMAP_BYTES} bytes.`,
    );
  }
}

/**
 * Verify that an `.nvd` document (JSON or CBOR) contains no linked external or
 * same-origin resource URLs that would cause NiiVue to initiate network
 * requests from an authenticated embedding host (e.g. JupyterLab), and bound
 * decoded drawing bitmap allocations (for both v6+ `drawingBitmapLength` and
 * v<=5 `drawBitmapLength`).
 */
export function assertSelfContainedNvd(
  data: Uint8Array | Record<string, unknown>,
): void {
  let doc: Record<string, unknown> | null;
  if (data instanceof Uint8Array) {
    const clean = prepareNvdBytes(data);
    let parsed: unknown;
    try {
      if (looksLikeJson(clean)) {
        parsed = JSON.parse(
          new TextDecoder("utf-8", { fatal: true }).decode(clean),
          reviveNiiVueJsonValue,
        );
      } else {
        parsed = decodeCborMetadata(clean);
      }
    } catch (err) {
      throw new Error(
        `Could not validate .nvd document: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    doc = asRecord(parsed);
  } else {
    try {
      doc = asRecord(normalizeRecordForValidation(data));
    } catch (err) {
      throw new Error(
        `Could not validate .nvd document: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (!doc) {
    throw new Error("Invalid .nvd document: expected a top-level object.");
  }

  // Bound RLE drawing allocation (both current and v<=5 legacy field name)
  assertBoundedLength("drawingBitmapLength", doc.drawingBitmapLength);
  assertBoundedLength("drawBitmapLength", doc.drawBitmapLength);

  // Reject slidePlane (tile pyramids are never embedded and always refetch)
  if (doc.slidePlane) {
    throw new Error(LINKED_NVD_MESSAGE);
  }

  // Reject any truthy ui.thumbnailUrl (NiiVue assigns `img.src = thumbnailUrl`)
  const ui = asRecord(doc.ui);
  if (ui && hasUrlValue(ui.thumbnailUrl)) {
    throw new Error(LINKED_NVD_MESSAGE);
  }

  // Reject non-builtin volume.matcap values (strings with paths/URLs/whitespace or non-strings)
  const volumeCfg = asRecord(doc.volume);
  if (volumeCfg && hasUrlValue(volumeCfg.matcap)) {
    if (
      typeof volumeCfg.matcap !== "string" ||
      !BUILTIN_MATCAP_RE.test(volumeCfg.matcap)
    ) {
      throw new Error(LINKED_NVD_MESSAGE);
    }
  }

  // Validate volumes array strictly against NiiVue's `if (e.data) ... else e.url`
  if (doc.volumes !== undefined) {
    if (!Array.isArray(doc.volumes)) {
      throw new Error("Invalid .nvd document: volumes must be an array.");
    }
    for (const entry of doc.volumes) {
      const vol = asRecord(entry);
      if (!vol) {
        throw new Error("Invalid .nvd document: volume entry must be an object.");
      }
      const volData = asRecord(vol.data);
      const volHdr = volData !== null ? asRecord(volData.hdr) : null;
      const volImgBytes = volData !== null ? embeddedBinaryByteLength(volData.img) : null;
      const hasEmbeddedVolume = volHdr !== null && volImgBytes !== null;
      if (hasEmbeddedVolume) {
        assertBoundedVolumeHeader(volHdr, volImgBytes);
      } else if (volData !== null && volHdr !== null) {
        assertBoundedVolumeHeader(volHdr, 0);
      }
      if (hasUrlValue(vol.url) && !hasEmbeddedVolume) {
        throw new Error(LINKED_NVD_MESSAGE);
      }
    }
  }

  // Validate meshes array strictly against NiiVue's `if (e.data) ... else if (e.url)`
  // (tractData/connectomeData are only read inside `if (e.data)` in NiiVue).
  if (doc.meshes !== undefined) {
    if (!Array.isArray(doc.meshes)) {
      throw new Error("Invalid .nvd document: meshes must be an array.");
    }
    for (const entry of doc.meshes) {
      const mesh = asRecord(entry);
      if (!mesh) {
        throw new Error("Invalid .nvd document: mesh entry must be an object.");
      }
      const meshData = asRecord(mesh.data);
      const hasEmbeddedMesh =
        meshData !== null &&
        isEmbeddedBinary(meshData.positions) &&
        isEmbeddedBinary(meshData.indices) &&
        isEmbeddedBinary(meshData.colors);
      if (hasUrlValue(mesh.url) && !hasEmbeddedMesh) {
        throw new Error(LINKED_NVD_MESSAGE);
      }
      if (mesh.layers !== undefined) {
        if (!Array.isArray(mesh.layers)) {
          throw new Error("Invalid .nvd document: mesh layers must be an array.");
        }
        for (const layerEntry of mesh.layers) {
          const layer = asRecord(layerEntry);
          if (!layer) {
            throw new Error(
              "Invalid .nvd document: mesh layer entry must be an object.",
            );
          }
          if (hasUrlValue(layer.url) && !isEmbeddedBinary(layer.data)) {
            throw new Error(LINKED_NVD_MESSAGE);
          }
        }
      }
    }
  }
}

export function isNvdFilename(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".nvd") || lower.endsWith(".json");
}

export interface LoadFileOptions {
  /** Allow `.nvd` documents to fetch linked external/same-origin URLs. Default true. */
  allowExternalDocumentUrls?: boolean;
  /** Optional abort signal checked after async file reads and before mutating `nv`. */
  signal?: AbortSignal;
}

/**
 * Strip document-supplied resource URLs and deferred-4D re-fetch metadata on
 * loaded volumes/meshes so NiiVue cannot initiate post-load network requests
 * (such as `loadDeferred4DVolumes`) in restricted embedded mode.
 */
export function stripLoadedDocumentUrls(nv: NiiVue): void {
  for (const vol of nv.volumes ?? []) {
    vol.url = "";
    const internal = vol as unknown as {
      _urlImageData?: unknown;
    };
    if ("_urlImageData" in internal) {
      internal._urlImageData = null;
    }
  }
  for (const mesh of nv.meshes ?? []) {
    mesh.url = "";
    for (const layer of mesh.layers ?? []) {
      layer.url = "";
    }
  }
}

/**
 * Load a neuroimaging volume (`.nii`, `.nii.gz`, `.mgh`, `.mgz`, ...) or
 * NiiVue document (`.nvd`) `File` into `nv`.
 */
export async function loadFreeBrowseFile(
  nv: NiiVue,
  file: File,
  options: LoadFileOptions = {},
): Promise<void> {
  if (options.signal?.aborted) return;
  if (isNvdFilename(file.name)) {
    const rawBytes = new Uint8Array(await file.arrayBuffer());
    if (options.signal?.aborted) return;
    const bytes = prepareNvdBytes(rawBytes);
    assertNotLegacyDocument(bytes);
    if (options.allowExternalDocumentUrls === false) {
      assertSelfContainedNvd(bytes);
    }
    if (options.signal?.aborted) return;
    const nvdFile = new File([bytes], file.name || "scene.nvd", {
      type: "application/octet-stream",
    });
    try {
      await nv.loadDocument(nvdFile, { fill: "current" });
    } finally {
      if (options.allowExternalDocumentUrls === false) {
        stripLoadedDocumentUrls(nv);
      }
    }
    if (options.signal?.aborted) return;
    await applyLabelColormapsAfterLoad(nv);
    return;
  }
  await nv.addVolume({ url: file, name: file.name });
}
