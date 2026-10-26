/**
 * Point each volume entry at the backend path it is being uploaded to, for the
 * "save to server" flow.
 *
 * The document is serialized with `linkData: true`, so a volume that already has
 * a fetchable url carries no bytes. This rewrites that url to the *destination*
 * — which `linkData` cannot do, because it keys off where a volume was loaded
 * from (`shouldLinkVolume` in niivue's `documentLinkData.ts`), not where it is
 * going. FreeBrowse's save dialog collects a path for a file being uploaded in
 * the same submit, which does not exist yet and is not `volume.url`.
 *
 * Any residual embedded data is dropped: a `blob:`/`data:` url fails niivue's
 * `isLinkableUrl`, so those volumes embed as a fallback.
 *
 * A `null` entry means the user gave no destination for that volume, so its
 * bytes are KEPT and the document still round-trips. (The previous
 * `stripEmbeddedData` deleted them regardless, producing an entry that pointed
 * at nothing.)
 *
 * Meshes are deliberately untouched: niivue's mesh URL-restore path does not
 * reapply scalar-overlay layers or tract options, so a linked mesh loses that
 * state silently.
 *
 * Mutates and returns `doc`.
 */
export function retargetVolumeUrls(
  doc: Record<string, unknown>,
  volumeUrls: (string | null)[],
): Record<string, unknown> {
  const volumes = doc.volumes;
  if (!Array.isArray(volumes)) return doc;

  volumes.forEach((vol, i) => {
    if (typeof vol !== "object" || vol === null || Array.isArray(vol)) return;
    const url = volumeUrls[i];
    if (url == null) return; // no destination -> keep the embedded bytes
    const entry = vol as Record<string, unknown>;
    delete entry.data;
    entry.url = url;
  });

  return doc;
}
