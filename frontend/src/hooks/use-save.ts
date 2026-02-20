import { useCallback } from "react";
import { useFreeBrowseStore } from "@/store";
import { uint8ArrayToBase64 } from "@/lib/niivue-helpers";
import type { Niivue } from "@niivue/niivue";

export function useSave(nvRef: React.RefObject<Niivue | null>) {
  const saveDialogOpen = useFreeBrowseStore((s) => s.saveDialogOpen);
  const setSaveDialogOpen = useFreeBrowseStore((s) => s.setSaveDialogOpen);
  const saveState = useFreeBrowseStore((s) => s.saveState);
  const setSaveState = useFreeBrowseStore((s) => s.setSaveState);

  const handleSaveScene = useCallback(
    (isDownload: boolean = false) => {
      if (nvRef.current) {
        const volumeStates = nvRef.current.volumes.map((volume: any) => {
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
          },
          volumes: volumeStates,
        });

        setSaveDialogOpen(true);
      }
    },
    [nvRef, setSaveState, setSaveDialogOpen],
  );

  const handleConfirmSave = useCallback(async () => {
    console.log("Saving scene to:", saveState.document.location);

    if (!nvRef.current) return;

    if (saveState.isDownloadMode) {
      // Download mode
      if (saveState.document.enabled && saveState.document.location.trim()) {
        const jsonData = nvRef.current.document.json(true, false);

        if (jsonData.imageOptionsArray && nvRef.current.volumes) {
          for (
            let i = 0;
            i < jsonData.imageOptionsArray.length &&
            i < nvRef.current.volumes.length;
            i++
          ) {
            jsonData.imageOptionsArray[i].url = "";
          }
        }

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = saveState.document.location.endsWith(".nvd")
          ? saveState.document.location
          : `${saveState.document.location}.nvd`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      // Download enabled volumes
      for (let index = 0; index < saveState.volumes.length; index++) {
        const volumeState = saveState.volumes[index];
        if (
          volumeState.enabled &&
          nvRef.current &&
          nvRef.current.volumes[index]
        ) {
          const volume = nvRef.current.volumes[index];
          const filename = volumeState.url || `volume_${index + 1}.nii.gz`;

          try {
            const uint8Array = await volume.saveToUint8Array(
              filename.endsWith(".nii.gz") ? filename : `${filename}.nii.gz`,
            );

            const blob = new Blob([uint8Array], {
              type: "application/octet-stream",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename.endsWith(".nii.gz")
              ? filename
              : `${filename}.nii.gz`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } catch (error) {
            console.error(`Error downloading volume ${index}:`, error);
          }
        }
      }
    } else {
      // Save to backend mode
      console.log(
        "handleConfirmSave() -- nvRef.current.document:",
        nvRef.current.document,
      );
      if (saveState.document.enabled && saveState.document.location.trim()) {
        try {
          const jsonData = nvRef.current.document.json(false, false);

          const finalJsonData = { ...jsonData };
          finalJsonData.imageOptionsArray = finalJsonData.imageOptionsArray.map(
            (imageOption: any, index: number) => {
              const volumeState = saveState.volumes[index];
              if (volumeState?.enabled && volumeState.url.trim() !== "") {
                return { ...imageOption, url: volumeState.url };
              }
              return imageOption;
            },
          );

          const response = await fetch("/nvd", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filename: saveState.document.location,
              data: finalJsonData,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to save scene: ${response.statusText}`);
          }

          const result = await response.json();
          console.log("Scene saved successfully:", result);
        } catch (error) {
          console.error("Error saving scene:", error);
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
            const volume = nvRef.current.volumes[index];

            if (!volumeState.url || volumeState.url.trim() === "") {
              console.log(`Skipping volume ${index}: no URL specified`);
              return;
            }

            try {
              const shouldCompress = volumeState.url
                .toLowerCase()
                .endsWith(".gz");
              const filename = shouldCompress
                ? volumeState.url
                : volumeState.url + ".gz";
              const uint8Array = await volume.saveToUint8Array(filename);
              const base64Data = uint8ArrayToBase64(uint8Array);

              const volumeResponse = await fetch("/nii", {
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

  return {
    handleSaveScene,
    handleConfirmSave,
    handleCancelSave,
    handleVolumeUrlChange,
    handleVolumeCheckboxChange,
    handleDocumentLocationChange,
    handleDocumentCheckboxChange,
  };
}
