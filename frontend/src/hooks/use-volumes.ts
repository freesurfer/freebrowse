import { useCallback } from "react";
import { useFreeBrowseStore } from "@/store";
import type { NiiVue } from "@niivue/niivue";

/**
 * Built-in colormaps that are categorical/label maps (as opposed to continuous
 * gradients). When one of these is selected, FreeBrowse applies it as a label
 * colormap (setColormapLabel) so the volume renders as discrete regions.
 * niivue-mono does not tag colormaps as label-vs-continuous, so this list is
 * curated here; matched case-insensitively against nv.colormaps. Only palettes
 * we've made opaque (alpha 255) are included — random/nih still ship alpha 64
 * and would wash out, so they're excluded pending the Phase-7 systemic fix.
 */
export const LABEL_COLORMAPS = new Set(["freesurfer", "roi_i256"]);

/**
 * After a document loads, attach the label LUT to every volume whose
 * `colormap` names a categorical palette but that carries no `colormapLabel`.
 *
 * niivue-mono applies a document's `colormap` as a continuous gradient
 * (niivue/mono#69), so a migrated legacy scene -- `aseg` with `Freesurfer`,
 * say -- would render as a smooth ramp. A document the app itself saved after
 * a dropdown change already embeds `colormapLabel` and is left alone. Same
 * dual call as `handleColormapChange`.
 */
export async function applyLabelColormapsAfterLoad(nv: NiiVue): Promise<void> {
  const volumes = nv.volumes || [];
  for (let i = 0; i < volumes.length; i++) {
    const v = volumes[i] as { colormap?: unknown; colormapLabel?: unknown };
    const name = typeof v.colormap === "string" ? v.colormap : "";
    if (!name || v.colormapLabel) continue;
    if (!LABEL_COLORMAPS.has(name.toLowerCase())) continue;
    await nv.setColormapLabel(i, name);
  }
}

export function useVolumes(
  nvRef: React.RefObject<NiiVue | null>,
  debouncedGLUpdate: () => void,
  removeSurface: (surfaceIndex: number) => void,
) {
  // Contrast/colormap/opacity now go through nv.setVolume (which refreshes the
  // GPU itself and emits volumeUpdated), so the debounced GL update is no
  // longer needed here; kept in the signature for call-site stability.
  void debouncedGLUpdate;
  const currentImageIndex = useFreeBrowseStore((s) => s.currentImageIndex);
  const setCurrentImageIndex = useFreeBrowseStore(
    (s) => s.setCurrentImageIndex,
  );
  const volumeVersion = useFreeBrowseStore((s) => s.volumeVersion);
  const incrementVolumeVersion = useFreeBrowseStore(
    (s) => s.incrementVolumeVersion,
  );
  const volumeToRemove = useFreeBrowseStore((s) => s.volumeToRemove);
  const setVolumeToRemove = useFreeBrowseStore((s) => s.setVolumeToRemove);
  const skipRemoveConfirmation = useFreeBrowseStore(
    (s) => s.skipRemoveConfirmation,
  );
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
      const volumeIndex = nv.volumes.findIndex((v) => v.id === id);
      if (volumeIndex < 0) return;

      // niivue-mono's `visible` flag hides a volume without touching its
      // opacity, so a hide/show round trip restores the user's value (it used
      // to be encoded as opacity 0 and came back as 1).
      const volume = nv.volumes[volumeIndex];
      void nv.setVolume(volumeIndex, { visible: volume.visible === false });
      incrementVolumeVersion();
    },
    [nvRef, incrementVolumeVersion],
  );

  const handleOpacityChange = useCallback(
    (newOpacity: number) => {
      const nv = nvRef.current;
      if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex])
        return;
      void nv.setVolume(currentImageIndex, { opacity: newOpacity });
      incrementVolumeVersion();
    },
    [currentImageIndex, nvRef, incrementVolumeVersion],
  );

  const handleFrameChange = useCallback(
    (newFrame: number) => {
      const nv = nvRef.current;
      if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex])
        return;
      const id = nv.volumes[currentImageIndex].id;
      if (!id) return;
      void nv.setFrame4D(id, newFrame);
      incrementVolumeVersion();
    },
    [currentImageIndex, nvRef, incrementVolumeVersion],
  );

  const handleContrastMinChange = useCallback(
    (newContrastMin: number) => {
      const nv = nvRef.current;
      if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex])
        return;
      // setVolume emits volumeUpdated -> the store follows via the event adapter.
      void nv.setVolume(currentImageIndex, { calMin: newContrastMin });
    },
    [currentImageIndex, nvRef],
  );

  const handleContrastMaxChange = useCallback(
    (newContrastMax: number) => {
      const nv = nvRef.current;
      if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex])
        return;
      void nv.setVolume(currentImageIndex, { calMax: newContrastMax });
    },
    [currentImageIndex, nvRef],
  );

  const handleColormapChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newColormap = event.target.value;
      const nv = nvRef.current;
      if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex])
        return;
      // Always set the continuous colormap (so the dropdown value derives from
      // volume.colormap and round-trips through the document). If the chosen
      // colormap is categorical, ALSO attach it as a label colormap so the
      // volume renders as discrete regions; otherwise clear any label colormap.
      // colormapLabel overrides colormap in the renderer, so setting both is safe.
      void nv.setVolume(currentImageIndex, { colormap: newColormap });
      if (LABEL_COLORMAPS.has(newColormap.toLowerCase())) {
        void nv.setColormapLabel(currentImageIndex, newColormap);
      } else {
        void nv.setColormapLabel(currentImageIndex, null);
      }
    },
    [currentImageIndex, nvRef],
  );

  const handleMoveVolumeUp = useCallback(() => {
    const nv = nvRef.current;
    if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex])
      return;
    if (currentImageIndex === 0) return; // already first in the list
    // UI "up" means earlier in the list (lower index); niivue's moveVolumeDown
    // decreases the array index.
    void nv.moveVolumeDown(currentImageIndex);
    setCurrentImageIndex(currentImageIndex - 1); // keep selection on moved volume
    incrementVolumeVersion();
  }, [currentImageIndex, nvRef, setCurrentImageIndex, incrementVolumeVersion]);

  const handleMoveVolumeDown = useCallback(() => {
    const nv = nvRef.current;
    if (currentImageIndex === null || !nv || !nv.volumes[currentImageIndex])
      return;
    if (currentImageIndex >= nv.volumes.length - 1) return; // already last in the list
    // UI "down" means later in the list (higher index); niivue's moveVolumeUp
    // increases the array index.
    void nv.moveVolumeUp(currentImageIndex);
    setCurrentImageIndex(currentImageIndex + 1); // keep selection on moved volume
    incrementVolumeVersion();
  }, [currentImageIndex, nvRef, setCurrentImageIndex, incrementVolumeVersion]);

  const removeVolume = useCallback(
    (imageIndex: number) => {
      const nv = nvRef.current;
      if (!nv || !nv.volumes[imageIndex]) return;
      void nv.removeVolume(imageIndex);
      incrementVolumeVersion();

      if (currentImageIndex === imageIndex) {
        if (imageIndex > 0) {
          setCurrentImageIndex(imageIndex - 1);
        } else if (nv.volumes.length > 0) {
          setCurrentImageIndex(0);
        } else {
          setCurrentImageIndex(null);
        }
      } else if (currentImageIndex !== null && currentImageIndex > imageIndex) {
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
    [
      skipRemoveConfirmation,
      removeVolume,
      setVolumeToRemove,
      setRemoveDialogOpen,
    ],
  );

  const handleEditVolume = useCallback(
    async (imageIndex: number) => {
      const nv = nvRef.current;
      if (!nv || !nv.volumes[imageIndex]) return;
      const volume = nv.volumes[imageIndex];
      // Carry the volume's colormap onto the drawing so it looks the same as an
      // editable layer (inverse of save-drawing). Captured before removal.
      const cmap = volume.colormap as string | undefined;
      const name = ((volume.name as string) || "edit.nii").replace(
        /\.gz$/i,
        "",
      );
      // Export the volume's voxels (uint8 — canEditVolume gates this) as raw bytes.
      const bytes = (await nv.saveVolume({
        filename: "",
        volumeByIndex: imageIndex,
      })) as Uint8Array;
      if (!(bytes instanceof Uint8Array)) return;
      const file = new File([bytes], name, {
        type: "application/octet-stream",
      });

      // The volume becomes the editable drawing.
      await nv.removeVolume(imageIndex);
      await nv.loadDrawing(file); // -> drawingChanged 'load' -> adapter enabled=true
      if (cmap) nv.drawColormap = cmap;

      // Enter pen mode with the current pen settings.
      nv.drawPenValue = drawingOptions.penErases ? 0 : drawingOptions.penValue;
      nv.drawPenFilled = drawingOptions.penFill;
      nv.drawIsFillOverwriting = drawingOptions.penFill;
      nv.drawIsEnabled = true;
      setDrawingOptions((prev) => ({ ...prev, mode: "pen" }));

      // Keep the selection valid now that a volume was removed.
      if (currentImageIndex !== null && currentImageIndex >= imageIndex) {
        const next = Math.max(0, currentImageIndex - 1);
        setCurrentImageIndex(nv.volumes.length > 0 ? next : null);
      }
      setActiveTab("drawing");
    },
    [
      nvRef,
      currentImageIndex,
      drawingOptions.penErases,
      drawingOptions.penValue,
      drawingOptions.penFill,
      setCurrentImageIndex,
      setDrawingOptions,
      setActiveTab,
    ],
  );

  const canEditVolume = useCallback(
    (imageIndex: number): boolean => {
      const nv = nvRef.current;
      if (!nv || !nv.volumes[imageIndex]) return false;

      const volume = nv.volumes[imageIndex];
      const background = nv.volumes[0];

      if (!background) return false;
      if (volume === background) return false;
      if (!volume.hdr || !background.hdr) return false;

      // niivue-mono's loadDrawing hard-requires DT_UINT8 (datatypeCode 2) and
      // rejects anything else, so a non-uint8 volume can't be edited as a
      // drawing — grey out the button rather than convert.
      if (volume.hdr.datatypeCode !== 2) return false;

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
  }, [
    volumeToRemove,
    removeVolume,
    surfaceToRemove,
    removeSurface,
    setRemoveDialogOpen,
    setVolumeToRemove,
    setSurfaceToRemove,
  ]);

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
    handleMoveVolumeUp,
    handleMoveVolumeDown,
    removeVolume,
    handleRemoveVolumeClick,
    handleEditVolume,
    canEditVolume,
    handleConfirmRemove,
    handleCancelRemove,
  };
}
