import { describe, expect, test } from "vitest";

import { retargetVolumeUrls } from "./nvd-volume-urls";

/**
 * A document shaped like what `serializeDocument({format:'json', linkData:true})`
 * produces: linked volumes carry no `data`, a volume niivue could not link
 * (blob:/data: url) still embeds its bytes.
 */
function makeDoc(): Record<string, unknown> {
  return {
    version: 9,
    volumes: [
      { url: "brain.nii.gz", name: "brain", colormap: "gray" },
      { url: "blob:abc123", name: "overlay", data: { img: "…bytes…" } },
    ],
    meshes: [{ url: "lh.pial", name: "lh.pial", layers: [{ url: "lh.curv" }] }],
  };
}

describe("retargetVolumeUrls", () => {
  test("rewrites urls to the upload destinations and drops residual data", () => {
    const doc = makeDoc();
    retargetVolumeUrls(doc, ["out/brain.nii.gz", "out/overlay.nii.gz"]);

    const volumes = doc.volumes as Record<string, unknown>[];
    expect(volumes[0].url).toBe("out/brain.nii.gz");
    expect(volumes[1].url).toBe("out/overlay.nii.gz");
    expect("data" in volumes[1]).toBe(false);
  });

  test("leaves meshes embedded", () => {
    const doc = makeDoc();
    retargetVolumeUrls(doc, ["out/brain.nii.gz", "out/overlay.nii.gz"]);

    // Mesh URL-restore does not reapply scalar-overlay layers, so meshes must
    // keep whatever niivue embedded for them.
    expect(doc.meshes).toEqual([
      { url: "lh.pial", name: "lh.pial", layers: [{ url: "lh.curv" }] },
    ]);
  });

  test("a null destination keeps the volume's url AND its embedded bytes", () => {
    const doc = makeDoc();
    retargetVolumeUrls(doc, ["out/brain.nii.gz", null]);

    const volumes = doc.volumes as Record<string, unknown>[];
    expect(volumes[0].url).toBe("out/brain.nii.gz");
    // Behaviour change vs the old stripEmbeddedData, which deleted `data`
    // regardless and left an entry pointing at a url nothing would serve.
    expect(volumes[1].url).toBe("blob:abc123");
    expect(volumes[1].data).toEqual({ img: "…bytes…" });
  });

  test("tolerates a document with no volumes array", () => {
    const doc = { version: 9 } as Record<string, unknown>;
    expect(() => retargetVolumeUrls(doc, [])).not.toThrow();
    expect(doc).toEqual({ version: 9 });
  });

  test("output is still JSON-serializable", () => {
    const doc = makeDoc();
    retargetVolumeUrls(doc, ["out/brain.nii.gz", null]);
    expect(() => JSON.stringify(doc)).not.toThrow();
  });
});
