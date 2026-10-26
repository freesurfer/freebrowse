import { useCallback } from "react";
import { useFreeBrowseStore } from "@/store";
import NiiVue from "@niivue/niivue";

/**
 * Core pen-drawing handlers (Phase 4a). Hybrid store/command model:
 *  - Event-mirrored fields (opacity, penFill, colormap, enabled): handlers issue
 *    nv.* commands only; the event adapter maps the resulting events into
 *    drawingOptions. `enabled` follows drawingChanged (a drawing layer exists),
 *    NOT drawIsEnabled (pointer painting) — `mode` is FreeBrowse's abstraction
 *    over drawIsEnabled.
 *  - Store-owned fields (mode, penErases, penValue): handlers set the store AND
 *    drive niivue as a derived value (drawPenValue = penErases ? 0 : penValue),
 *    which the adapter does NOT mirror back (mirroring would clobber penValue on
 *    erase). Magic-wand params stay store-owned for 4c.
 */
export function useDrawing(
  nvRef: React.RefObject<NiiVue | null>,
  debouncedGLUpdate: () => void,
) {
  void debouncedGLUpdate; // nv draw setters refresh the GPU; kept for call-site stability
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);
  const setDrawingOptions = useFreeBrowseStore((s) => s.setDrawingOptions);
  const setActiveTab = useFreeBrowseStore((s) => s.setActiveTab);

  const handleCreateDrawingLayer = useCallback(() => {
    const nv = nvRef.current;
    if (!nv || !nv.volumes[0]) return; // a drawing overlays the background volume
    // niivue-mono no longer auto-creates the bitmap when drawing is enabled.
    nv.createEmptyDrawing();
    nv.drawColormap = drawingOptions.colormap;
    nv.drawOpacity = drawingOptions.opacity;
    nv.drawPenFilled = drawingOptions.penFill;
    nv.drawIsEnabled = false; // start in 'none' mode; user picks a tool
    setDrawingOptions((prev) => ({ ...prev, mode: "none" }));
    setActiveTab("drawing");
  }, [
    nvRef,
    drawingOptions.colormap,
    drawingOptions.opacity,
    drawingOptions.penFill,
    setDrawingOptions,
    setActiveTab,
  ]);

  const handleDrawModeChange = useCallback(
    (mode: "none" | "pen" | "wand") => {
      setDrawingOptions((prev) => ({ ...prev, mode })); // store-owned
      const nv = nvRef.current;
      if (!nv) return;
      if (mode === "pen") {
        nv.drawPenValue = drawingOptions.penErases
          ? 0
          : drawingOptions.penValue;
        nv.drawPenFilled = drawingOptions.penFill; // flood-fill the enclosed shape
        nv.drawIsFillOverwriting = drawingOptions.penFill; // fill overwrites existing labels
        nv.drawIsEnabled = true;
      } else {
        // 'none' (and 'wand', which is disabled in the UI until 4c)
        nv.drawIsEnabled = false;
      }
    },
    [
      nvRef,
      drawingOptions.penErases,
      drawingOptions.penValue,
      drawingOptions.penFill,
      setDrawingOptions,
    ],
  );

  const handlePenValueChange = useCallback(
    (value: number) => {
      setDrawingOptions((prev) => ({ ...prev, penValue: value })); // store-owned
      const nv = nvRef.current;
      if (nv && drawingOptions.mode === "pen" && !drawingOptions.penErases) {
        nv.drawPenValue = value;
      }
    },
    [nvRef, drawingOptions.mode, drawingOptions.penErases, setDrawingOptions],
  );

  const handlePenErasesChange = useCallback(
    (checked: boolean) => {
      setDrawingOptions((prev) => ({ ...prev, penErases: checked })); // store-owned
      const nv = nvRef.current;
      if (nv && drawingOptions.mode === "pen") {
        nv.drawPenValue = checked ? 0 : drawingOptions.penValue;
      }
    },
    [nvRef, drawingOptions.mode, drawingOptions.penValue, setDrawingOptions],
  );

  const handlePenFillChange = useCallback(
    // store-owned: drawPenFilled is a plain field (no event to mirror). "Pen
    // fill" = flood-fill the enclosed shape (drawPenFilled) AND overwrite
    // existing labels (drawIsFillOverwriting), matching old FreeBrowse.
    (checked: boolean) => {
      setDrawingOptions((prev) => ({ ...prev, penFill: checked }));
      const nv = nvRef.current;
      if (nv) {
        nv.drawPenFilled = checked;
        nv.drawIsFillOverwriting = checked;
      }
    },
    [nvRef, setDrawingOptions],
  );

  const handleDrawingOpacityChange = useCallback(
    // event-mirrored (opacity follows drawOpacity)
    (opacity: number) => {
      const nv = nvRef.current;
      if (nv) nv.drawOpacity = opacity;
    },
    [nvRef],
  );

  const handleDrawingColormapChange = useCallback(
    // event-mirrored (colormap follows drawColormap). Options come from
    // nv.drawingColormapNames() — the `_`-prefixed draw LUTs, not nv.colormaps.
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nv = nvRef.current;
      if (nv) nv.drawColormap = event.target.value;
    },
    [nvRef],
  );

  const handleDrawUndo = useCallback(() => {
    const nv = nvRef.current;
    if (nv) nv.drawUndo();
  }, [nvRef]);

  // --- magic-wand params: store-owned; wired to the extension in 4c ---
  const handleMagicWand2dOnlyChange = useCallback(
    (checked: boolean) =>
      setDrawingOptions((prev) => ({ ...prev, magicWand2dOnly: checked })),
    [setDrawingOptions],
  );
  const handleMagicWandMaxDistanceChange = useCallback(
    (value: number) =>
      setDrawingOptions((prev) => ({ ...prev, magicWandMaxDistanceMM: value })),
    [setDrawingOptions],
  );
  const handleMagicWandThresholdChange = useCallback(
    (value: number) =>
      setDrawingOptions((prev) => ({
        ...prev,
        magicWandThresholdPercent: value,
      })),
    [setDrawingOptions],
  );

  const handleSaveDrawing = useCallback(async () => {
    const nv = nvRef.current;
    if (!nv || !nv.drawingVolume) return;
    // Export the drawing bitmap as raw NIfTI bytes. filename '' returns a
    // Uint8Array; since it isn't a .gz name the bytes are uncompressed, so the
    // reloaded File must be named .nii (not .nii.gz, or the loader gunzips).
    const bytes = (await nv.saveVolume({
      filename: "",
      isSaveDrawing: true,
      volumeByIndex: 0,
    })) as Uint8Array;
    if (!(bytes instanceof Uint8Array)) return;
    const name = drawingOptions.filename.replace(/\.gz$/i, "");
    const file = new File([bytes], name, { type: "application/octet-stream" });

    nv.drawIsEnabled = false;
    nv.closeDrawing(); // -> drawingChanged 'close' -> adapter sets enabled=false
    await nv.addVolume({ url: file, name });
    // Persist as a label volume with a dropdown-native, opaque palette
    // (roi_i256: sequential indices so pen values 1..N map 1:1, no `labels` so
    // no legend). Set both colormap + colormapLabel (the 3c pattern) so it's
    // consistent with the Scene-Details dropdown. Exact draw-color persistence
    // is deferred (Phase 7). NOTE: the drawing's own `_draw` colormap is NOT
    // carried over — the saved segmentation is recolored with roi_i256.
    const idx = nv.volumes.length - 1;
    if (idx >= 0) {
      await nv.setVolume(idx, { colormap: "roi_i256" });
      await nv.setColormapLabel(idx, "roi_i256");
    }

    setDrawingOptions((prev) => ({ ...prev, mode: "none" }));
    setActiveTab("sceneDetails");
  }, [nvRef, drawingOptions.filename, setDrawingOptions, setActiveTab]);

  return {
    handleCreateDrawingLayer,
    handleDrawingColormapChange,
    handleDrawModeChange,
    handlePenFillChange,
    handlePenErasesChange,
    handlePenValueChange,
    handleDrawingOpacityChange,
    handleMagicWand2dOnlyChange,
    handleMagicWandMaxDistanceChange,
    handleMagicWandThresholdChange,
    handleDrawUndo,
    handleSaveDrawing,
  };
}
