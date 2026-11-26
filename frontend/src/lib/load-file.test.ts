import { describe, expect, test, vi } from "vitest";
import { encode as cborEncode } from "cbor-x";
import postcss from "postcss";
import { NiiVue } from "@niivue/niivue";
import {
  assertNotLegacyDocument,
  assertSelfContainedNvd,
  loadFreeBrowseFile,
  prepareNvdBytes,
} from "@/lib/load-file";
import { scopeEmbeddedCss } from "../../scope-css";

/** Encode a JS object using NiiVue's JSON document wire format (`$ta`/`b64` + `$num`). */
function encodeNiiVueJson(obj: unknown): Uint8Array {
  const json = JSON.stringify(obj, (_k, v) => {
    if (ArrayBuffer.isView(v) && !(v instanceof DataView)) {
      const bytes = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return { $ta: v.constructor.name, b64: btoa(bin) };
    }
    return v;
  });
  return new TextEncoder().encode(json);
}

describe("assertSelfContainedNvd (JSON and CBOR)", () => {
  const encodings = [
    ["JSON", encodeNiiVueJson],
    ["CBOR", (obj: unknown) => new Uint8Array(cborEncode(obj))],
  ] as const;

  for (const [label, encode] of encodings) {
    test(`${label}: accepts self-contained document with embedded data and built-in matcap`, () => {
      const doc = {
        version: 9,
        volume: { matcap: "bronze" },
        volumes: [
          {
            name: "brain.nii.gz",
            url: "brain.nii.gz",
            data: { hdr: { dims: [3, 1, 1, 1] }, img: new Uint8Array([1, 2, 3]) },
          },
        ],
        meshes: [
          {
            name: "lh.pial",
            url: "lh.pial",
            data: {
              positions: new Uint8Array([1, 2, 3, 4]),
              indices: new Uint8Array([0, 0, 0, 0]),
              colors: new Uint8Array([255, 255, 255, 255]),
            },
            layers: [{ name: "curv", url: "lh.curv", data: new Uint8Array([1, 2, 3, 4]) }],
          },
        ],
      };
      expect(() => assertSelfContainedNvd(encode(doc))).not.toThrow();
    });

    test(`${label}: rejects linked volume url without embedded data`, () => {
      const doc = {
        version: 9,
        volumes: [{ url: "/user/victim/api/contents/secret.nii.gz" }],
      };
      expect(() => assertSelfContainedNvd(encode(doc))).toThrow(/self-contained/i);
    });

    test(`${label}: rejects linked mesh url without embedded data`, () => {
      const doc = {
        version: 9,
        meshes: [{ url: "https://attacker.example/mesh.mz3" }],
      };
      expect(() => assertSelfContainedNvd(encode(doc))).toThrow(/self-contained/i);
    });

    test(`${label}: rejects linked mesh layer url without embedded data`, () => {
      const doc = {
        version: 9,
        meshes: [
          {
            data: { positions: new Uint8Array([1]), indices: new Uint8Array([0]), colors: new Uint8Array([255]) },
            layers: [{ url: "https://attacker.example/overlay.curv" }],
          },
        ],
      };
      expect(() => assertSelfContainedNvd(encode(doc))).toThrow(/self-contained/i);
    });

    test(`${label}: rejects ui.thumbnailUrl`, () => {
      const doc = {
        version: 9,
        ui: { thumbnailUrl: "https://attacker.example/beacon.png" },
      };
      expect(() => assertSelfContainedNvd(encode(doc))).toThrow(/self-contained/i);
    });

    test(`${label}: rejects non-builtin volume.matcap URL/path`, () => {
      const doc = {
        version: 9,
        volume: { matcap: "https://attacker.example/matcap.jpg" },
      };
      expect(() => assertSelfContainedNvd(encode(doc))).toThrow(/self-contained/i);
    });

    test(`${label}: rejects slidePlane`, () => {
      const doc = {
        version: 9,
        slidePlane: { manifestUrl: "https://attacker.example/slide.dzi" },
      };
      expect(() => assertSelfContainedNvd(encode(doc))).toThrow(/self-contained/i);
    });

    test(`${label}: rejects oversized drawingBitmapLength`, () => {
      const doc = {
        version: 9,
        drawingBitmapLength: 1024 * 1024 * 1024,
      };
      expect(() => assertSelfContainedNvd(encode(doc))).toThrow(/drawingBitmapLength/i);
    });

    test(`${label}: rejects v<=5 drawBitmapLength overflow and non-numeric length coercion`, () => {
      expect(() =>
        assertSelfContainedNvd(
          encode({ version: 5, drawBitmapLength: 1024 * 1024 * 1024 }),
        ),
      ).toThrow(/drawBitmapLength/i);
      expect(() =>
        assertSelfContainedNvd(
          encode({ version: 9, drawingBitmapLength: "1000000000" }),
        ),
      ).toThrow(/drawingBitmapLength/i);
    });

    test(`${label}: rejects falsy data (false/0/empty) paired with volume or mesh url`, () => {
      for (const falsy of [false, 0, ""]) {
        expect(() =>
          assertSelfContainedNvd(
            encode({ version: 9, volumes: [{ url: "/user/victim/api/me", data: falsy }] }),
          ),
        ).toThrow(/self-contained/i);
        expect(() =>
          assertSelfContainedNvd(
            encode({ version: 9, meshes: [{ url: "/user/victim/api/me", data: falsy }] }),
          ),
        ).toThrow(/self-contained/i);
      }
    });

    test(`${label}: rejects mesh with tractData/connectomeData but no data paired with url`, () => {
      expect(() =>
        assertSelfContainedNvd(
          encode({
            version: 9,
            meshes: [{ url: "https://attacker.example/m.mz3", tractData: {} }],
          }),
        ),
      ).toThrow(/self-contained/i);
    });

    test(`${label}: rejects non-string truthy array-coerced thumbnailUrl and volume url`, () => {
      expect(() =>
        assertSelfContainedNvd(
          encode({
            version: 9,
            ui: { thumbnailUrl: ["https://attacker.example/beacon.png"] },
          }),
        ),
      ).toThrow(/self-contained/i);
      expect(() =>
        assertSelfContainedNvd(
          encode({
            version: 9,
            volumes: [{ url: ["https://attacker.example/vol.nii.gz"] }],
          }),
        ),
      ).toThrow(/self-contained/i);
    });
    test(`${label}: rejects whitespace-only URLs and matcaps`, () => {
      expect(() =>
        assertSelfContainedNvd(encode({ version: 9, ui: { thumbnailUrl: "   " } })),
      ).toThrow(/self-contained/i);
      expect(() =>
        assertSelfContainedNvd(encode({ version: 9, volumes: [{ url: "   " }] })),
      ).toThrow(/self-contained/i);
      expect(() =>
        assertSelfContainedNvd(encode({ version: 9, meshes: [{ url: "   " }] })),
      ).toThrow(/self-contained/i);
      expect(() =>
        assertSelfContainedNvd(encode({ version: 9, volume: { matcap: "   " } })),
      ).toThrow(/self-contained/i);
    });
  }

  test("JSON: rejects $num reviver NaN bypass on volumes, meshes, and mesh layers", () => {
    const meshPayload = new TextEncoder().encode(
      JSON.stringify({
        version: 9,
        meshes: [
          {
            url: "https://attacker.example/exfil.mz3",
            data: { $num: "NaN" },
            layers: [
              { url: "/user/victim/api/contents/secret", data: { $num: "NaN" } },
            ],
          },
        ],
      }),
    );
    expect(() => assertSelfContainedNvd(meshPayload)).toThrow(/self-contained/i);

    const layerOnlyPayload = new TextEncoder().encode(
      JSON.stringify({
        version: 9,
        meshes: [
          {
            data: {
              positions: { $ta: "Uint8Array", b64: "AAAA" },
              indices: { $ta: "Uint8Array", b64: "AAAA" },
              colors: { $ta: "Uint8Array", b64: "AAAA" },
            },
            layers: [{ url: "/user/victim/api/me", data: { $num: "NaN" } }],
          },
        ],
      }),
    );
    expect(() => assertSelfContainedNvd(layerOnlyPayload)).toThrow(/self-contained/i);

    const volPayload = new TextEncoder().encode(
      JSON.stringify({
        version: 9,
        volumes: [{ url: "/user/victim/api/me", data: { $num: "NaN" } }],
      }),
    );
    expect(() => assertSelfContainedNvd(volPayload)).toThrow(/self-contained/i);

    // Same bypass via already-parsed JS object (embedded NVD path)
    expect(() =>
      assertSelfContainedNvd({
        version: 9,
        meshes: [{ url: "https://attacker.example/exfil.mz3", data: { $num: "NaN" } }],
      }),
    ).toThrow(/self-contained/i);
  });

  test("CBOR: rejects float16 truthy URLs, unassigned ai=24 simple values, and BOM-prefixed map keys", () => {
    // { "version": 9, "ui": { "thumbnailUrl": float16(1.0) } }
    // float16(1.0) = 0xf9 0x3c 0x00
    const enc = new TextEncoder();
    const float16Thumb = new Uint8Array([
      0xa2,
      0x67, ...enc.encode("version"), 0x09,
      0x62, ...enc.encode("ui"),
      0xa1,
      0x6c, ...enc.encode("thumbnailUrl"),
      0xf9, 0x3c, 0x00,
    ]);
    expect(() => assertSelfContainedNvd(float16Thumb)).toThrow(/self-contained/i);

    // Unassigned 1-byte simple value (0xf8 0x20) must fail closed
    const simple24 = new Uint8Array([
      0xa2,
      0x67, ...enc.encode("version"), 0x09,
      0x61, 0x78, 0xf8, 0x20,
    ]);
    expect(() => assertSelfContainedNvd(simple24)).toThrow(/Unsupported CBOR simple value/i);

    // BOM-prefixed CBOR map key "\uFEFFdata" must fail closed (preventing cbor-x key mismatch)
    const bomKeyCbor = new Uint8Array(
      cborEncode({
        version: 9,
        volumes: [
          {
            url: "https://attacker.example/exfil.nii",
            "\uFEFFdata": { hdr: {}, img: new Uint8Array([1, 2, 3]) },
          },
        ],
      }),
    );
    expect(() => assertSelfContainedNvd(bomKeyCbor)).toThrow(/BOM-prefixed CBOR map key/i);
  });

  test("CBOR: rejects unsupported tags (e.g. tag 28/29 sharedref) and trailing bytes", () => {
    // Hand-craft CBOR map { "version": 9, "x": tag28({"url": "https://evil.test/a"}), "volumes": [tag29(0)] }
    // Tag 28 = 0xd8 0x1c; tag 29 = 0xd8 0x1d.
    const taggedCbor = new Uint8Array([
      0xa2, // map(2)
      0x67, ...new TextEncoder().encode("version"), 0x09,
      0x61, 0x78, // "x"
      0xd8, 0x1c, // tag(28) shareable
      0xa1, 0x63, 0x75, 0x72, 0x6c, 0x61, 0x61, // {"url":"a"}
    ]);
    expect(() => assertSelfContainedNvd(taggedCbor)).toThrow(/Unsupported CBOR tag/i);

    // Trailing bytes after valid CBOR
    const valid = new Uint8Array(cborEncode({ version: 9 }));
    const withTrailing = new Uint8Array(valid.length + 1);
    withTrailing.set(valid);
    withTrailing[valid.length] = 0x00;
    expect(() => assertSelfContainedNvd(withTrailing)).toThrow(/trailing bytes/i);
  });

  test("JSON with UTF-8 BOM is stripped before both validation and NiiVue handoff", () => {
    const jsonBytes = new TextEncoder().encode(JSON.stringify({ version: 9 }));
    const withBom = new Uint8Array(3 + jsonBytes.length);
    withBom.set([0xef, 0xbb, 0xbf]);
    withBom.set(jsonBytes, 3);
    expect(prepareNvdBytes(withBom)[0]).toBe(0x7b);
    expect(() => assertSelfContainedNvd(withBom)).not.toThrow();
  });

  test("loadFreeBrowseFile against real NiiVue.loadDocument blocks bypass payloads and loads BOM-prefixed self-contained JSON with zero network requests", async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("Unexpected fetch")));
    vi.stubGlobal("fetch", fetchSpy);
    const imageSrcs: string[] = [];
    class SpyImage {
      set src(v: string) {
        imageSrcs.push(String(v));
      }
      decode() {
        return Promise.resolve();
      }
    }
    vi.stubGlobal("Image", SpyImage);

    try {
      const nv = new NiiVue();
      const loadSpy = vi.spyOn(nv, "loadDocument");
      const bypasses: Array<[string, Uint8Array]> = [
        [
          "json-$num-mesh",
          new TextEncoder().encode(
            JSON.stringify({
              version: 9,
              meshes: [{ url: "https://attacker.example/m.mz3", data: { $num: "NaN" } }],
            }),
          ),
        ],
        [
          "json-whitespace-url",
          new TextEncoder().encode(
            JSON.stringify({ version: 9, volumes: [{ url: "   " }] }),
          ),
        ],
        [
          "cbor-float16-thumb",
          new Uint8Array([
            0xa2,
            0x67, ...new TextEncoder().encode("version"), 0x09,
            0x62, ...new TextEncoder().encode("ui"),
            0xa1,
            0x6c, ...new TextEncoder().encode("thumbnailUrl"),
            0xf9, 0x3c, 0x00,
          ]),
        ],
      ];

      for (const [name, bytes] of bypasses) {
        const file = new File([bytes], `${name}.nvd`);
        await expect(
          loadFreeBrowseFile(nv, file, { allowExternalDocumentUrls: false }),
        ).rejects.toThrow(/self-contained/i);
      }
      expect(loadSpy).not.toHaveBeenCalled();

      // BOM-prefixed valid self-contained JSON .nvd actually loads cleanly via real NiiVue.loadDocument
      const rawJson = new TextEncoder().encode(JSON.stringify({ version: 9, volumes: [], meshes: [] }));
      const bomJson = new Uint8Array(3 + rawJson.length);
      bomJson.set([0xef, 0xbb, 0xbf]);
      bomJson.set(rawJson, 3);
      await loadFreeBrowseFile(nv, new File([bomJson], "bom-valid.nvd"), {
        allowExternalDocumentUrls: false,
      });
      expect(loadSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(imageSrcs).toEqual([]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  test("loadFreeBrowseFile rejects partial 4D .nvd without requests and round-trips complete 4D .nvd with stripped URLs", async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("Unexpected fetch")));
    vi.stubGlobal("fetch", fetchSpy);
    try {
      const make4dHdr = () => ({
        littleEndian: true,
        dims: [4, 2, 2, 2, 10, 1, 1, 1],
        pixDims: [1, 1, 1, 1, 1, 1, 1, 1],
        datatypeCode: 2,
        numBitsPerVoxel: 8,
        scl_slope: 1,
        scl_inter: 0,
        affine: [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ],
      });

      // 1. Partial 4D (10 declared frames, only 1 embedded frame) must be rejected before NiiVue loads it
      const nvPartial = new NiiVue();
      const loadSpy = vi.spyOn(nvPartial, "loadDocument");
      const partialDoc = {
        version: 9,
        volumes: [
          {
            name: "bold4d-partial.nii.gz",
            url: "/user/victim/api/contents/secret4d.nii.gz",
            data: { datatypeCode: 2, hdr: make4dHdr(), img: new Uint8Array(8) },
          },
        ],
        meshes: [],
      };
      await expect(
        loadFreeBrowseFile(
          nvPartial,
          new File([encodeNiiVueJson(partialDoc)], "4d-partial.nvd"),
          { allowExternalDocumentUrls: false },
        ),
      ).rejects.toThrow(/self-contained/i);
      expect(loadSpy).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();

      // 1b. Conflicting datatypeCode (UINT8=8-bit) vs numBitsPerVoxel (16) must also be rejected
      const conflictingWidthDoc = {
        version: 9,
        volumes: [
          {
            name: "bold4d-mismatch.nii.gz",
            data: {
              datatypeCode: 2,
              hdr: { ...make4dHdr(), numBitsPerVoxel: 16 },
              img: new Uint8Array(80),
            },
          },
        ],
        meshes: [],
      };
      await expect(
        loadFreeBrowseFile(
          nvPartial,
          new File([encodeNiiVueJson(conflictingWidthDoc)], "4d-mismatch.nvd"),
          { allowExternalDocumentUrls: false },
        ),
      ).rejects.toThrow(/numBitsPerVoxel does not match/i);
      expect(loadSpy).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();

      // 2. Complete 4D (all 10 frames = 80 bytes embedded) loads, clears URL, triggers 0 fetches, and round-trips intact
      const nvComplete = new NiiVue();
      const fullImg = new Uint8Array(80);
      for (let i = 0; i < fullImg.length; i++) fullImg[i] = i;
      const completeDoc = {
        version: 9,
        volumes: [
          {
            name: "bold4d-complete.nii.gz",
            url: "/user/victim/api/contents/secret4d.nii.gz",
            data: { datatypeCode: 2, hdr: make4dHdr(), img: fullImg },
          },
        ],
        meshes: [],
      };
      await loadFreeBrowseFile(
        nvComplete,
        new File([encodeNiiVueJson(completeDoc)], "4d-complete.nvd"),
        { allowExternalDocumentUrls: false },
      );
      expect(nvComplete.volumes).toHaveLength(1);
      expect(nvComplete.volumes[0].url).toBe("");
      expect(nvComplete.volumes[0].nFrame4D).toBe(10);
      expect(nvComplete.volumes[0].nTotalFrame4D).toBe(10);
      expect(nvComplete.volumes[0].id).toBeTruthy();
      await nvComplete.loadDeferred4DVolumes(nvComplete.volumes[0].id!);
      expect(fetchSpy).not.toHaveBeenCalled();

      // Re-saving preserves all 10 frames and voxel data cleanly
      const resavedBytes = nvComplete.serializeDocument({ format: "json" });
      const nvReloaded = new NiiVue();
      await loadFreeBrowseFile(
        nvReloaded,
        new File([resavedBytes], "4d-resaved.nvd"),
        { allowExternalDocumentUrls: false },
      );
      expect(nvReloaded.volumes).toHaveLength(1);
      expect(nvReloaded.volumes[0].nFrame4D).toBe(10);
      expect(nvReloaded.volumes[0].nTotalFrame4D).toBe(10);
      const reloadedImg = nvReloaded.volumes[0].img;
      expect(reloadedImg).not.toBeNull();
      expect(reloadedImg!.byteLength).toBe(80);
      expect(Array.from(reloadedImg!)).toEqual(Array.from(fullImg));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  test("rejects volume hdr.dims exceeding drawing allocation cap or embedded img payload size", () => {
    const hugeDims = encodeNiiVueJson({
      version: 9,
      volumes: [
        {
          name: "bomb.nii",
          data: {
            hdr: { dims: [3, 10000, 10000, 10000], numBitsPerVoxel: 8 },
            img: new Uint8Array([1]),
          },
        },
      ],
    });
    expect(() => assertSelfContainedNvd(hugeDims)).toThrow(/3D voxel count exceeds/i);

    const amplifiedDims = new Uint8Array(
      cborEncode({
        version: 9,
        volumes: [
          {
            name: "amp.nii",
            data: {
              hdr: { dims: [3, 500, 500, 500], numBitsPerVoxel: 8 },
              img: new Uint8Array([1]),
            },
          },
        ],
      }),
    );
    expect(() => assertSelfContainedNvd(amplifiedDims)).toThrow(
      /exceeds embedded image payload size/i,
    );

    // Fractional numBitsPerVoxel cannot understate payload requirements
    const fractionalBits = encodeNiiVueJson({
      version: 9,
      volumes: [
        {
          name: "frac.nii",
          data: {
            hdr: { dims: [3, 100, 100, 100], numBitsPerVoxel: 1e-9 },
            img: new Uint8Array([1]),
          },
        },
      ],
    });
    expect(() => assertSelfContainedNvd(fractionalBits)).toThrow(
      /numBitsPerVoxel must be a positive integer/i,
    );

    // Internal whitespace in base64 cannot inflate decoded byte length
    const paddedB64 = new TextEncoder().encode(
      JSON.stringify({
        version: 9,
        volumes: [
          {
            name: "ws.nii",
            data: {
              hdr: { dims: [3, 10, 10, 10], datatypeCode: 2 },
              img: { $ta: "Uint8Array", b64: `AA${" ".repeat(2000)}==` },
            },
          },
        ],
      }),
    );
    expect(() => assertSelfContainedNvd(paddedB64)).toThrow(
      /exceeds embedded image payload size/i,
    );
  });

  test("loadFreeBrowseFile strips retained volume URLs even if nv.loadDocument() throws after adding volumes", async () => {
    const partialVol = {
      url: "/user/victim/api/contents/secret4d.nii.gz",
      nFrame4D: 1,
      nTotalFrame4D: 10,
      _urlImageData: "/user/victim/api/contents/secret4d.nii.gz",
    };
    const volumes: Array<typeof partialVol> = [];
    const nv = {
      volumes,
      meshes: [],
      async loadDocument() {
        volumes.push(partialVol);
        throw new Error("Simulated mid-load GL failure");
      },
    } as unknown as NiiVue;
    const file = new File([JSON.stringify({ version: 9 })], "partial.nvd");
    await expect(
      loadFreeBrowseFile(nv, file, { allowExternalDocumentUrls: false }),
    ).rejects.toThrow(/Simulated mid-load GL failure/);
    expect(partialVol.url).toBe("");
    expect(partialVol._urlImageData).toBeNull();
  });

  test("loadFreeBrowseFile aborts before nv.loadDocument when signal aborts during arrayBuffer()", async () => {
    let resolveBuf!: (buf: ArrayBuffer) => void;
    const slowFile = {
      name: "slow.nvd",
      arrayBuffer: () => new Promise<ArrayBuffer>((r) => { resolveBuf = r; }),
    } as unknown as File;
    const loadDocument = vi.fn();
    const nv = { loadDocument } as unknown as NiiVue;
    const ac = new AbortController();

    const p = loadFreeBrowseFile(nv, slowFile, {
      allowExternalDocumentUrls: false,
      signal: ac.signal,
    });
    ac.abort();
    resolveBuf(new TextEncoder().encode(JSON.stringify({ version: 9 })).buffer);
    await p;
    expect(loadDocument).not.toHaveBeenCalled();
  });

  test("assertNotLegacyDocument rejects legacy imageOptionsArray JSON", () => {
    const legacy = new TextEncoder().encode(
      JSON.stringify({ imageOptionsArray: [{ url: "x.nii" }] }),
    );
    expect(() => assertNotLegacyDocument(legacy)).toThrow(/migrate-nvd\.py/);
  });
});

describe("scopeEmbeddedCss", () => {
  test("scopes :root, :host, *, bare !important utilities, and namespaces @keyframes under .freebrowse-root", () => {
    const input = `
      @property --tw-border-style { syntax: "*"; inherits: false; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      :root, :host { --font-sans: ui-sans-serif; --animate-spin: spin 1s linear infinite; }
      .animate-spin { animation: spin 1s linear infinite; }
      *, :before, :after { --tw-shadow: 0 0 #0000; }
      .hidden { display: none !important; }
      .flex { display: flex !important; }
      .relative { position: relative !important; }
      .freebrowse-root .already-scoped { color: red; }
    `;
    const out = scopeEmbeddedCss(input);
    const parsed = postcss.parse(out);
    const unscoped: string[] = [];
    parsed.walkRules((rule) => {
      if (
        rule.parent?.type === "atrule" &&
        ["keyframes", "property", "font-face"].includes(
          (rule.parent as postcss.AtRule).name.toLowerCase(),
        )
      ) {
        return;
      }
      for (const sel of rule.selectors) {
        if (!sel.includes(".freebrowse-root") || /:(root|host)\b/.test(sel)) {
          unscoped.push(sel);
        }
      }
    });
    expect(unscoped).toEqual([]);
    expect(out).toContain(".freebrowse-root.hidden");
    expect(out).toContain(".freebrowse-root .hidden");
    expect(out).toContain("@keyframes freebrowse-spin");
    expect(out).toContain("--animate-spin: freebrowse-spin 1s linear infinite");
    expect(out).toContain("animation: freebrowse-spin 1s linear infinite");
    expect(out).not.toContain("@keyframes spin ");
    expect(out).toContain("@property --tw-border-style");
  });
});
