import { useCallback } from "react";
import { useFreeBrowseStore } from "@/store";
import type { Niivue } from "@niivue/niivue";

export function useVolumes(
  nvRef: React.RefObject<Niivue | null>,
  debouncedGLUpdate: () => void,
  removeSurface: (surfaceIndex: number) => void,
) {
  const currentImageIndex = useFreeBrowseStore((s) => s.currentImageIndex);
  const setCurrentImageIndex = useFreeBrowseStore((s) => s.setCurrentImageIndex);
  const volumeVersion = useFreeBrowseStore((s) => s.volumeVersion);
  const incrementVolumeVersion = useFreeBrowseStore((s) => s.incrementVolumeVersion);
  const volumeToRemove = useFreeBrowseStore((s) => s.volumeToRemove);
  const setVolumeToRemove = useFreeBrowseStore((s) => s.setVolumeToRemove);
  const skipRemoveConfirmation = useFreeBrowseStore((s) => s.skipRemoveConfirmation);
  const setRemoveDialogOpen = useFreeBrowseStore((s) => s.setRemoveDialogOpen);
  const surfaceToRemove = useFreeBrowseStore((s) => s.surfaceToRemove);
  const setSurfaceToRemove = useFreeBrowseStore((s) => s.setSurfaceToRemove);
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);
  const setDrawingOptions = useFreeBrowseStore((s) => s.setDrawingOptions);
  const setActiveTab = useFreeBrowseStore((s) => s.setActiveTab);

  const getVolumes = useCallback(() => {
    // Consume volumeVersion to trigger re-renders on mutation
    void volumeVersion;
    const nv = nvRef.current;
    if (!nv) return [];
    return nv.volumes || [];
  }, [nvRef, volumeVersion]);

  const toggleImageVisibility = useCallback(
    (id: string) => {
      const nv = nvRef.current;
      if (!nv) return;
      const volumeIndex = nv.getVolumeIndexByID(id);
      if (volumeIndex < 0) return;

      const volume = nv.volumes[volumeIndex];
      const isCurrentlyVisible = volume.opacity > 0;
      const newOpacity = isCurrentlyVisible ? 0 : (volume.opacity === 0 ? 1.0 : volume.opacity);

      nv.setOpacity(volumeIndex, newOpacity);
      if (!isCurrentlyVisible) {
        volume.opacity = newOpacity;
      }
      nv.updateGLVolume();
      incrementVolumeVersion();
    },
    [nvRef, incrementVolumeVersion],
  );

  const handleOpacityChange = useCallback(
    (newOpacity: number) => {
      const nv = nvRef.current;
      if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex]) return;
      nv.setOpacity(currentImageIndex, newOpacity);
      debouncedGLUpdate();
      incrementVolumeVersion();
    },
    [currentImageIndex, nvRef, debouncedGLUpdate, incrementVolumeVersion],
  );

  const handleFrameChange = useCallback(
    (newFrame: number) => {
      const nv = nvRef.current;
      if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex]) return;
      nv.setFrame4D(nv.volumes[currentImageIndex].id, newFrame);
      incrementVolumeVersion();
    },
    [currentImageIndex, nvRef, incrementVolumeVersion],
  );

  const handleContrastMinChange = useCallback(
    (newContrastMin: number) => {
      const nv = nvRef.current;
      if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex]) return;
      nv.volumes[currentImageIndex].cal_min = newContrastMin;
      debouncedGLUpdate();
      incrementVolumeVersion();
    },
    [currentImageIndex, nvRef, debouncedGLUpdate, incrementVolumeVersion],
  );

  const handleContrastMaxChange = useCallback(
    (newContrastMax: number) => {
      const nv = nvRef.current;
      if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex]) return;
      nv.volumes[currentImageIndex].cal_max = newContrastMax;
      debouncedGLUpdate();
      incrementVolumeVersion();
    },
    [currentImageIndex, nvRef, debouncedGLUpdate, incrementVolumeVersion],
  );

  const handleLabelVolumeChange = useCallback(
    (checked: boolean) => {
      const nv = nvRef.current;
      if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex]) return;
      const volume = nv.volumes[currentImageIndex];
      if (!volume.hdr) return;
      volume.hdr.intent_code = checked ? 1002 : 0;
      nv.updateGLVolume();
      incrementVolumeVersion();
    },
    [currentImageIndex, nvRef, incrementVolumeVersion],
  );

  const handleColormapChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newColormap = event.target.value;
      const nv = nvRef.current;
      if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex]) return;
      const volume = nv.volumes[currentImageIndex];
      if (volume.colormap === newColormap) return;
      volume.colormap = newColormap;
      debouncedGLUpdate();
      incrementVolumeVersion();
    },
    [currentImageIndex, nvRef, debouncedGLUpdate, incrementVolumeVersion],
  );

  const removeVolume = useCallback(
    (imageIndex: number) => {
      const nv = nvRef.current;
      if (!nv || !nv.volumes[imageIndex]) return;
      nv.removeVolumeByIndex(imageIndex);
      incrementVolumeVersion();

      if (currentImageIndex === imageIndex) {
        if (imageIndex > 0) {
          setCurrentImageIndex(imageIndex - 1);
        } else if (nv.volumes.length > 0) {
          setCurrentImageIndex(0);
        } else {
          setCurrentImageIndex(null);
        }
      } else if (
        currentImageIndex !== null &&
        currentImageIndex > imageIndex
      ) {
        setCurrentImageIndex(currentImageIndex - 1);
      }
    },
    [currentImageIndex, nvRef, incrementVolumeVersion, setCurrentImageIndex],
  );

  const handleRemoveVolumeClick = useCallback(
    (imageIndex: number) => {
      if (skipRemoveConfirmation) {
        removeVolume(imageIndex);
      } else {
        setVolumeToRemove(imageIndex);
        setRemoveDialogOpen(true);
      }
    },
    [skipRemoveConfirmation, removeVolume, setVolumeToRemove, setRemoveDialogOpen],
  );

  const handleEditVolume = useCallback(
    async (imageIndex: number) => {
      const nv = nvRef.current;
      if (!nv || !nv.volumes[imageIndex]) return;

      const volumeIndex = imageIndex;

      try {
        const volumeData = (await nv.saveImage({
          filename: "",
          isSaveDrawing: false,
          volumeByIndex: volumeIndex,
        })) as Uint8Array;

        const volumeName = nv.volumes[imageIndex].name || `Volume ${imageIndex + 1}`;
        const drawingImage = await nv.niftiArray2NVImage(volumeData);

        nv.removeVolumeByIndex(volumeIndex);
        incrementVolumeVersion();

        if (nv.volumes.length > 0 && !nv.back) {
          console.log("Setting background to first remaining volume");
          nv.setVolume(nv.volumes[0], 0);
        }

        if (currentImageIndex === imageIndex) {
          if (imageIndex > 0) {
            setCurrentImageIndex(imageIndex - 1);
          } else if (nv.volumes.length > 0) {
            setCurrentImageIndex(0);
          } else {
            setCurrentImageIndex(null);
          }
        } else if (
          currentImageIndex !== null &&
          currentImageIndex > imageIndex
        ) {
          setCurrentImageIndex(currentImageIndex - 1);
        }

        const loadSuccess = nv.loadDrawing(drawingImage);
        if (!loadSuccess) {
          console.error(
            "Failed to load drawing - dimensions may be incompatible",
          );
        }

        setDrawingOptions((prev) => ({
          ...prev,
          enabled: true,
          mode: "none",
          filename: volumeName.endsWith(".nii.gz")
            ? volumeName
            : `${volumeName}.nii.gz`,
        }));

        nv.setDrawingEnabled(false);
        nv.setPenValue(drawingOptions.penValue, drawingOptions.penFill);
        nv.drawFillOverwrites = drawingOptions.penFill;

        setActiveTab("drawing");
      } catch (error) {
        console.error("Error converting volume to drawing:", error);
      }
    },
    [currentImageIndex, drawingOptions, nvRef, incrementVolumeVersion, setCurrentImageIndex, setDrawingOptions, setActiveTab],
  );

  const canEditVolume = useCallback(
    (imageIndex: number): boolean => {
      const nv = nvRef.current;
      if (!nv || !nv.volumes[imageIndex]) return false;

      const volume = nv.volumes[imageIndex];
      const background = nv.back;

      if (!background) return false;
      if (volume === background) return false;
      if (!volume.hdr || !background.hdr) return false;

      const volDims = volume.hdr.dims;
      const backDims = background.hdr.dims;

      if (
        volDims[1] !== backDims[1] ||
        volDims[2] !== backDims[2] ||
        volDims[3] !== backDims[3]
      ) {
        return false;
      }

      if (!volume.hdr.affine || !background.hdr.affine) return false;

      const volAffine = volume.hdr.affine;
      const backAffine = background.hdr.affine;

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const idx = i * 4 + j;
          const volValue = Number(volAffine[idx]);
          const backValue = Number(backAffine[idx]);
          if (Math.abs(volValue - backValue) > 0.0001) {
            return false;
          }
        }
      }

      return true;
    },
    [nvRef],
  );

  const handleConfirmRemove = useCallback(() => {
    if (volumeToRemove !== null) {
      removeVolume(volumeToRemove);
    }
    if (surfaceToRemove !== null) {
      removeSurface(surfaceToRemove);
    }
    setRemoveDialogOpen(false);
    setVolumeToRemove(null);
    setSurfaceToRemove(null);
  }, [volumeToRemove, removeVolume, surfaceToRemove, removeSurface, setRemoveDialogOpen, setVolumeToRemove, setSurfaceToRemove]);

  const handleCancelRemove = useCallback(() => {
    setRemoveDialogOpen(false);
    setVolumeToRemove(null);
    setSurfaceToRemove(null);
  }, [setRemoveDialogOpen, setVolumeToRemove, setSurfaceToRemove]);

  return {
    getVolumes,
    toggleImageVisibility,
    handleOpacityChange,
    handleFrameChange,
    handleContrastMinChange,
    handleContrastMaxChange,
    handleColormapChange,
    handleLabelVolumeChange,
    removeVolume,
    handleRemoveVolumeClick,
    handleEditVolume,
    canEditVolume,
    handleConfirmRemove,
    handleCancelRemove,
  };
}
