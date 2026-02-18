import { useCallback } from "react";
import { useFreeBrowseStore } from "@/store";
import type { Niivue } from "@niivue/niivue";

export function useVolumes(
  nvRef: React.RefObject<Niivue | null>,
  debouncedGLUpdate: () => void,
  handleLocationChange: (locationObject: any) => void,
  removeSurface: (surfaceIndex: number) => void,
) {
  const images = useFreeBrowseStore((s) => s.images);
  const setImages = useFreeBrowseStore((s) => s.setImages);
  const currentImageIndex = useFreeBrowseStore((s) => s.currentImageIndex);
  const setCurrentImageIndex = useFreeBrowseStore((s) => s.setCurrentImageIndex);
  const volumeToRemove = useFreeBrowseStore((s) => s.volumeToRemove);
  const setVolumeToRemove = useFreeBrowseStore((s) => s.setVolumeToRemove);
  const skipRemoveConfirmation = useFreeBrowseStore((s) => s.skipRemoveConfirmation);
  const setRemoveDialogOpen = useFreeBrowseStore((s) => s.setRemoveDialogOpen);
  const surfaceToRemove = useFreeBrowseStore((s) => s.surfaceToRemove);
  const setSurfaceToRemove = useFreeBrowseStore((s) => s.setSurfaceToRemove);
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);
  const setDrawingOptions = useFreeBrowseStore((s) => s.setDrawingOptions);
  const setActiveTab = useFreeBrowseStore((s) => s.setActiveTab);

  const updateImageDetails = useCallback(() => {
    const nv = nvRef.current;
    if (nv) {
      const loadedImages = nv.volumes.map((vol: any, index: number) => {
        const is4D = vol.nFrame4D && vol.nFrame4D > 1;
        return {
          id: vol.id,
          name: vol.name || `Volume ${index + 1}`,
          visible: vol.opacity > 0,
          colormap: vol.colormap,
          opacity: vol.opacity,
          contrastMin: vol.cal_min ?? 0,
          contrastMax: vol.cal_max ?? 100,
          globalMin: vol.global_min ?? 0,
          globalMax: is4D ? 150000 : (vol.global_max ?? 150000),
          frame4D: vol.frame4D ?? 0,
          nFrame4D: vol.nFrame4D ?? 1,
        };
      });
      setImages(loadedImages);
      console.log("updateImageDetails() loadedImages:", loadedImages);

      if (nv.scene && nv.scene.crosshairPos) {
        handleLocationChange({ mm: nv.scene.crosshairPos });
      }
    } else {
      console.log("updateImageDetails(): nvRef is ", nvRef);
    }
  }, [nvRef, setImages, handleLocationChange]);

  const toggleImageVisibility = useCallback(
    (id: string) => {
      setImages(
        images.map((img) => {
          if (img.id === id) {
            const newVisible = !img.visible;
            const newOpacity = img.opacity === 0 ? 1.0 : img.opacity;
            if (nvRef.current) {
              const volumeIndex = nvRef.current.getVolumeIndexByID(id);
              if (volumeIndex >= 0) {
                nvRef.current.setOpacity(
                  volumeIndex,
                  newVisible ? newOpacity : 0,
                );
                if (newVisible) {
                  nvRef.current.volumes[volumeIndex].opacity = newOpacity;
                }
              }
            }
            return { ...img, visible: newVisible };
          }
          return img;
        }),
      );
      if (nvRef.current) {
        nvRef.current.updateGLVolume();
      }
    },
    [images, nvRef, setImages],
  );

  const handleOpacityChange = useCallback(
    (newOpacity: number) => {
      if (
        currentImageIndex !== null &&
        nvRef.current &&
        images[currentImageIndex]
      ) {
        const currentImageId = images[currentImageIndex].id;
        const volumeIndex = nvRef.current.getVolumeIndexByID(currentImageId);
        if (volumeIndex >= 0) {
          nvRef.current.setOpacity(volumeIndex, newOpacity);
          debouncedGLUpdate();
          setImages((prevImages) =>
            prevImages.map((img, index) =>
              index === currentImageIndex
                ? { ...img, opacity: newOpacity }
                : img,
            ),
          );
        }
      }
    },
    [currentImageIndex, images, nvRef, debouncedGLUpdate, setImages],
  );

  const handleFrameChange = useCallback(
    (newFrame: number) => {
      if (
        currentImageIndex !== null &&
        nvRef.current &&
        images[currentImageIndex]
      ) {
        const currentImageId = images[currentImageIndex].id;
        nvRef.current.setFrame4D(currentImageId, newFrame);
        setImages((prevImages) =>
          prevImages.map((img, index) =>
            index === currentImageIndex
              ? { ...img, frame4D: newFrame }
              : img,
          ),
        );
      }
    },
    [currentImageIndex, images, nvRef, setImages],
  );

  const handleContrastMinChange = useCallback(
    (newContrastMin: number) => {
      if (
        currentImageIndex !== null &&
        nvRef.current &&
        images[currentImageIndex]
      ) {
        const currentImageId = images[currentImageIndex].id;
        const volumeIndex = nvRef.current.getVolumeIndexByID(currentImageId);
        if (volumeIndex >= 0) {
          const volume = nvRef.current.volumes[volumeIndex];
          volume.cal_min = newContrastMin;
          debouncedGLUpdate();
          setImages((prevImages) =>
            prevImages.map((img, index) =>
              index === currentImageIndex
                ? { ...img, contrastMin: newContrastMin }
                : img,
            ),
          );
        }
      }
    },
    [currentImageIndex, images, nvRef, debouncedGLUpdate, setImages],
  );

  const handleContrastMaxChange = useCallback(
    (newContrastMax: number) => {
      if (
        currentImageIndex !== null &&
        nvRef.current &&
        images[currentImageIndex]
      ) {
        const currentImageId = images[currentImageIndex].id;
        const volumeIndex = nvRef.current.getVolumeIndexByID(currentImageId);
        if (volumeIndex >= 0) {
          const volume = nvRef.current.volumes[volumeIndex];
          volume.cal_max = newContrastMax;
          debouncedGLUpdate();
          setImages((prevImages) =>
            prevImages.map((img, index) =>
              index === currentImageIndex
                ? { ...img, contrastMax: newContrastMax }
                : img,
            ),
          );
        }
      }
    },
    [currentImageIndex, images, nvRef, debouncedGLUpdate, setImages],
  );

  const handleColormapChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newColormap = event.target.value;
      if (
        currentImageIndex !== null &&
        nvRef.current &&
        images[currentImageIndex]
      ) {
        const volumeIndex = nvRef.current.getVolumeIndexByID(
          images[currentImageIndex].id,
        );
        if (volumeIndex >= 0 && nvRef.current.volumes[volumeIndex]) {
          const currentVolume = nvRef.current.volumes[volumeIndex];
          if (currentVolume.colormap === newColormap) {
            return;
          }
          currentVolume.colormap = newColormap;
          setImages((prevImages) =>
            prevImages.map((img, index) =>
              index === currentImageIndex
                ? { ...img, colormap: newColormap }
                : img,
            ),
          );
          debouncedGLUpdate();
        }
      }
    },
    [currentImageIndex, images, nvRef, debouncedGLUpdate, setImages],
  );

  const removeVolume = useCallback(
    (imageIndex: number) => {
      if (nvRef.current && images[imageIndex]) {
        const imageId = images[imageIndex].id;
        const volumeIndex = nvRef.current.getVolumeIndexByID(imageId);
        if (volumeIndex >= 0) {
          nvRef.current.removeVolumeByIndex(volumeIndex);
          updateImageDetails();
          if (currentImageIndex === imageIndex) {
            if (imageIndex > 0) {
              setCurrentImageIndex(imageIndex - 1);
            } else if (images.length > 1) {
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
        }
      }
    },
    [images, currentImageIndex, nvRef, updateImageDetails, setCurrentImageIndex],
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
      if (!nvRef.current || !images[imageIndex]) return;

      const nv = nvRef.current;
      const imageId = images[imageIndex].id;
      const volumeIndex = nv.getVolumeIndexByID(imageId);
      if (volumeIndex < 0) return;

      try {
        const volumeData = (await nv.saveImage({
          filename: "",
          isSaveDrawing: false,
          volumeByIndex: volumeIndex,
        })) as Uint8Array;

        const volumeName = images[imageIndex].name;
        const drawingImage = await nv.niftiArray2NVImage(volumeData);

        nv.removeVolumeByIndex(volumeIndex);
        updateImageDetails();

        if (nv.volumes.length > 0 && !nv.back) {
          console.log("Setting background to first remaining volume");
          nv.setVolume(nv.volumes[0], 0);
        }

        if (currentImageIndex === imageIndex) {
          if (imageIndex > 0) {
            setCurrentImageIndex(imageIndex - 1);
          } else if (images.length > 1) {
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
    [images, currentImageIndex, drawingOptions, nvRef, updateImageDetails, setCurrentImageIndex, setDrawingOptions, setActiveTab],
  );

  const canEditVolume = useCallback(
    (imageIndex: number): boolean => {
      if (!nvRef.current || !images[imageIndex]) return false;

      const nv = nvRef.current;
      const imageId = images[imageIndex].id;
      const volumeIndex = nv.getVolumeIndexByID(imageId);
      if (volumeIndex < 0) return false;

      const volume = nv.volumes[volumeIndex];
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
    [images, nvRef],
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
    updateImageDetails,
    toggleImageVisibility,
    handleOpacityChange,
    handleFrameChange,
    handleContrastMinChange,
    handleContrastMaxChange,
    handleColormapChange,
    removeVolume,
    handleRemoveVolumeClick,
    handleEditVolume,
    canEditVolume,
    handleConfirmRemove,
    handleCancelRemove,
  };
}
