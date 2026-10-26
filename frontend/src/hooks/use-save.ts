import { useCallback } from "react";
import { useFreeBrowseStore } from "@/store";
import { gzipUint8Array, uint8ArrayToBase64 } from "@/lib/niivue-helpers";
import { retargetVolumeUrls } from "@/lib/nvd-volume-urls";
import { requestImagingUploadConfirmation } from "@/lib/confirmations";
import { FREEBROWSE_SAVE_SETTINGS } from "@/lib/default-niivue-options";
import { dataUrl } from "@/lib/deployment-config";
import type { NvdFormat } from "@/store/types";
import type { NiiVue } from "@niivue/niivue";

/** Append the given extension if the filename lacks it. */
function ensureExt(name: string, ext: string): string {
  return name.toLowerCase().endsWith(ext) ? name : name + ext;
}

/** Trigger a browser download of `bytes` as `filename`. */
function downloadBytes(bytes: Uint8Array | string, filename: string, type: string) {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function useSave(nvRef: React.RefObject<NiiVue | null>) {
  const setSaveDialogOpen = useFreeBrowseStore((s) => s.setSaveDialogOpen);
  const saveState = useFreeBrowseStore((s) => s.saveState);
  const setSaveState = useFreeBrowseStore((s) => s.setSaveState);

  const handleSaveScene = useCallback(
    async (isDownload: boolean = false) => {
      if (!nvRef.current) return;

      if (!isDownload && nvRef.current.volumes.length > 0) {
        const ok = await requestImagingUploadConfirmation();
        if (!ok) return;
      }

      const volumeStates = nvRef.current.volumes.map((volume) => {
        const isExternal = !!(volume.url && volume.url.startsWith("http"));
        return {
          enabled: !isExternal,
          isExternal,
          url: isDownload ? volume.name || "" : volume.url || "",
        };
      });

      setSaveState({
        isDownloadMode: isDownload,
        document: {
          enabled: false,
          location: "",
          format: "json",
        },
        volumes: volumeStates,
      });

      setSaveDialogOpen(true);
    },
    [nvRef, setSaveState, setSaveDialogOpen],
  );

  const handleConfirmSave = useCallback(async () => {
    console.log("Saving scene to:", saveState.document.location);

    if (!nvRef.current) return;

    if (saveState.isDownloadMode) {
      // Download mode
      if (saveState.document.enabled && saveState.document.location.trim()) {
        try {
          const filename = ensureExt(saveState.document.location.trim(), ".nvd");
          const format = saveState.document.format;
          // niivue serializes both encodings natively; `loadDocument` sniffs
          // them apart on the way back in. Embeds everything, meshes included.
          const bytes = nvRef.current.serializeDocument({
            format,
            settings: FREEBROWSE_SAVE_SETTINGS,
          });
          downloadBytes(
            bytes,
            filename,
            format === "json" ? "application/json" : "application/cbor",
          );
        } catch (error) {
          console.error("Error downloading document:", error);
        }
      }

      // Download enabled volumes
      for (let index = 0; index < saveState.volumes.length; index++) {
        const volumeState = saveState.volumes[index];
        if (
          volumeState.enabled &&
          nvRef.current &&
          nvRef.current.volumes[index]
        ) {
          const filename = ensureExt(
            volumeState.url || `volume_${index + 1}.nii.gz`,
            ".nii.gz",
          );

          try {
            // saveVolume with an empty filename returns raw NIfTI bytes; gzip
            // them for a .nii.gz download.
            const raw = await nvRef.current.saveVolume({
              filename: "",
              volumeByIndex: index,
            });
            if (!(raw instanceof Uint8Array)) {
              throw new Error("saveVolume did not return bytes");
            }
            const bytes = await gzipUint8Array(raw);
            downloadBytes(bytes, filename, "application/octet-stream");
          } catch (error) {
            console.error(`Error downloading volume ${index}:`, error);
          }
        }
      }
    } else {
      // Save to backend mode
      if (saveState.document.enabled && saveState.document.location.trim()) {
        try {
          // Point each volume entry at its backend save URL, and drop embedded
          // volume data (the backend stores volumes separately, below).
          //
          // `linkData: true` is load-bearing: without it niivue embeds every
          // volume's bytes into the document only for us to delete them, which
          // on the JSON path means base64-ing the whole volume first.
          const volumeUrls = saveState.volumes.map((v) =>
            v.url && v.url.trim() ? v.url : null,
          );
          const format: NvdFormat = saveState.document.format;

          let data: unknown;
          if (format === "cbor") {
            // CBOR cannot be retargeted without a decoder, so linked volumes
            // keep the url they were loaded from. The save dialog offers CBOR
            // in download mode only.
            data = uint8ArrayToBase64(
              nvRef.current.serializeDocument({
                linkData: true,
                settings: FREEBROWSE_SAVE_SETTINGS,
              }),
            );
          } else {
            // Parse back to an object: the backend stores `data` as a dict and
            // pretty-prints it, which keeps saved .nvd files diffable.
            const text = new TextDecoder().decode(
              nvRef.current.serializeDocument({
                format: "json",
                linkData: true,
                settings: FREEBROWSE_SAVE_SETTINGS,
              }),
            );
            data = retargetVolumeUrls(
              JSON.parse(text) as Record<string, unknown>,
              volumeUrls,
            );
          }

          const response = await fetch(dataUrl("nvd"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: saveState.document.location,
              data,
              format,
            }),
          });
          if (!response.ok) {
            throw new Error(`Failed to save document: ${response.statusText}`);
          }
          console.log("Document saved:", await response.json());
        } catch (error) {
          console.error("Error saving document:", error);
        }
      }

      // Save enabled volumes to backend
      const volumeSavePromises = saveState.volumes.map(
        async (volumeState, index) => {
          if (
            volumeState.enabled &&
            nvRef.current &&
            nvRef.current.volumes[index]
          ) {
            if (!volumeState.url || volumeState.url.trim() === "") {
              console.log(`Skipping volume ${index}: no URL specified`);
              return;
            }

            try {
              // saveVolume('' ) returns raw NIfTI bytes; gzip for a .nii.gz
              // upload (the backend appends .nii.gz if the name lacks it).
              const raw = await nvRef.current.saveVolume({
                filename: "",
                volumeByIndex: index,
              });
              if (!(raw instanceof Uint8Array)) {
                throw new Error("saveVolume did not return bytes");
              }
              const uint8Array = await gzipUint8Array(raw);
              const base64Data = uint8ArrayToBase64(uint8Array);

              const volumeResponse = await fetch(dataUrl("nii"), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  filename: volumeState.url,
                  data: base64Data,
                }),
              });

              if (!volumeResponse.ok) {
                throw new Error(
                  `Failed to save volume ${index}: ${volumeResponse.statusText}`,
                );
              }

              const volumeResult = await volumeResponse.json();
              console.log(`Volume ${index} saved successfully:`, volumeResult);
            } catch (error) {
              console.error(`Error saving volume ${index}:`, error);
            }
          }
        },
      );

      await Promise.all(volumeSavePromises);
    }

    setSaveDialogOpen(false);
    setSaveState({
      isDownloadMode: false,
      document: {
        enabled: false,
        location: "",
        format: "json",
      },
      volumes: [],
    });
  }, [nvRef, saveState, setSaveDialogOpen, setSaveState]);

  const handleCancelSave = useCallback(() => {
    setSaveDialogOpen(false);
    setSaveState({
      isDownloadMode: false,
      document: {
        enabled: false,
        location: "",
        format: "json",
      },
      volumes: [],
    });
  }, [setSaveDialogOpen, setSaveState]);

  const handleVolumeUrlChange = useCallback(
    (index: number, url: string) => {
      setSaveState((prev) => ({
        ...prev,
        volumes: prev.volumes.map((state, i) =>
          i === index ? { ...state, url } : state,
        ),
      }));
    },
    [setSaveState],
  );

  const handleVolumeCheckboxChange = useCallback(
    (index: number, enabled: boolean) => {
      setSaveState((prev) => ({
        ...prev,
        volumes: prev.volumes.map((state, i) => {
          if (i === index) {
            if (enabled && state.isExternal) {
              return { ...state, enabled, url: "" };
            }
            return { ...state, enabled };
          }
          return state;
        }),
      }));
    },
    [setSaveState],
  );

  const handleDocumentLocationChange = useCallback(
    (location: string) => {
      setSaveState((prev) => ({
        ...prev,
        document: {
          ...prev.document,
          location,
        },
      }));
    },
    [setSaveState],
  );

  const handleDocumentCheckboxChange = useCallback(
    (enabled: boolean) => {
      setSaveState((prev) => ({
        ...prev,
        document: {
          ...prev.document,
          enabled,
        },
      }));
    },
    [setSaveState],
  );

  const handleDocumentFormatChange = useCallback(
    (format: NvdFormat) => {
      setSaveState((prev) => ({
        ...prev,
        document: {
          ...prev.document,
          format,
        },
      }));
    },
    [setSaveState],
  );

  return {
    handleSaveScene,
    handleConfirmSave,
    handleCancelSave,
    handleVolumeUrlChange,
    handleVolumeCheckboxChange,
    handleDocumentLocationChange,
    handleDocumentCheckboxChange,
    handleDocumentFormatChange,
  };
}
