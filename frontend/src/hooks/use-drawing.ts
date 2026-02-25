import { useCallback } from "react";
import { useFreeBrowseStore } from "@/store";
import { NVImage, type Niivue } from "@niivue/niivue";

export function useDrawing(
  nvRef: React.RefObject<Niivue | null>,
  debouncedGLUpdate: () => void,
  updateImageDetails: () => void,
) {
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);
  const setDrawingOptions = useFreeBrowseStore((s) => s.setDrawingOptions);
  const setActiveTab = useFreeBrowseStore((s) => s.setActiveTab);

  const syncDrawingOptionsFromNiivue = useCallback(() => {
    if (nvRef.current && drawingOptions.mode === "wand") {
      const nv = nvRef.current;
      if (
        nv.opts.clickToSegmentPercent !==
          drawingOptions.magicWandThresholdPercent ||
        nv.opts.clickToSegmentMaxDistanceMM !==
          drawingOptions.magicWandMaxDistanceMM
      ) {
        setDrawingOptions((prev) => ({
          ...prev,
          magicWandThresholdPercent: nv.opts.clickToSegmentPercent,
          magicWandMaxDistanceMM: nv.opts.clickToSegmentMaxDistanceMM,
        }));
      }
    }
  }, [
    nvRef,
    drawingOptions.mode,
    drawingOptions.magicWandThresholdPercent,
    drawingOptions.magicWandMaxDistanceMM,
    setDrawingOptions,
  ]);

  const handleCreateDrawingLayer = useCallback(() => {
    if (nvRef.current) {
      nvRef.current.setDrawingEnabled(false);

      const penValue = drawingOptions.penErases ? 0 : drawingOptions.penValue;
      nvRef.current.setPenValue(penValue, drawingOptions.penFill);
      nvRef.current.setDrawOpacity(drawingOptions.opacity);

      setDrawingOptions((prev) => ({ ...prev, enabled: true, mode: "none" }));
      setActiveTab("drawing");
    }
  }, [nvRef, drawingOptions, setDrawingOptions, setActiveTab]);

  const handleDrawingColormapChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newColormap = event.target.value;
      setDrawingOptions((prev) => ({ ...prev, colormap: newColormap }));
      if (nvRef.current && nvRef.current.drawBitmap) {
        nvRef.current.setDrawColormap(newColormap);
        nvRef.current.updateGLVolume();
      }
    },
    [nvRef, setDrawingOptions],
  );

  const handleDrawModeChange = useCallback(
    (mode: "none" | "pen" | "wand") => {
      console.log("handleDrawModeChange() ", mode);
      setDrawingOptions((prev) => ({
        ...prev,
        mode,
        penErases: mode === "wand" ? false : prev.penErases,
      }));
      if (nvRef.current) {
        if (mode === "pen") {
          const penValue = drawingOptions.penErases
            ? 0
            : drawingOptions.penValue;
          nvRef.current.setPenValue(penValue, drawingOptions.penFill);
          nvRef.current.setDrawingEnabled(true);
          nvRef.current.opts.clickToSegment = false;
        } else if (mode === "wand") {
          nvRef.current.setDrawingEnabled(true);
          nvRef.current.opts.clickToSegment = true;
          nvRef.current.opts.clickToSegmentIs2D =
            drawingOptions.magicWand2dOnly;
          nvRef.current.opts.clickToSegmentAutoIntensity = true;
          nvRef.current.opts.clickToSegmentMaxDistanceMM =
            drawingOptions.magicWandMaxDistanceMM;
          nvRef.current.opts.clickToSegmentPercent =
            drawingOptions.magicWandThresholdPercent;
          const penValue = drawingOptions.penValue;
          nvRef.current.setPenValue(penValue, false);
        } else if (mode === "none") {
          nvRef.current.setDrawingEnabled(false);
          nvRef.current.opts.clickToSegment = false;
        }
      }
    },
    [nvRef, drawingOptions, setDrawingOptions],
  );

  const handlePenFillChange = useCallback(
    (checked: boolean) => {
      setDrawingOptions((prev) => ({ ...prev, penFill: checked }));
      if (nvRef.current) {
        nvRef.current.drawFillOverwrites = checked;
        console.log(drawingOptions.mode);
        if (drawingOptions.mode === "pen") {
          const penValue = drawingOptions.penErases
            ? 0
            : drawingOptions.penValue;
          nvRef.current.setPenValue(penValue, checked);
        }
      }
    },
    [nvRef, drawingOptions, setDrawingOptions],
  );

  const handlePenErasesChange = useCallback(
    (checked: boolean) => {
      setDrawingOptions((prev) => ({ ...prev, penErases: checked }));
      if (nvRef.current) {
        if (drawingOptions.mode === "pen") {
          const penValue = checked ? 0 : drawingOptions.penValue;
          nvRef.current.setPenValue(penValue, drawingOptions.penFill);
        } else if (drawingOptions.mode === "none") {
          nvRef.current.setDrawingEnabled(false);
        }
      }
    },
    [nvRef, drawingOptions, setDrawingOptions],
  );

  const handlePenValueChange = useCallback(
    (value: number) => {
      setDrawingOptions((prev) => ({ ...prev, penValue: value }));
      console.log("handlePenValueChange: ", value);
      if (
        nvRef.current &&
        drawingOptions.mode === "pen" &&
        !drawingOptions.penErases
      ) {
        nvRef.current.setPenValue(value, drawingOptions.penFill);
      }
    },
    [nvRef, drawingOptions, setDrawingOptions],
  );

  const handleDrawingOpacityChange = useCallback(
    (opacity: number) => {
      setDrawingOptions((prev) => ({ ...prev, opacity }));
      if (nvRef.current) {
        nvRef.current.setDrawOpacity(opacity);
        debouncedGLUpdate();
      }
    },
    [nvRef, debouncedGLUpdate, setDrawingOptions],
  );

  const handleMagicWand2dOnlyChange = useCallback(
    (checked: boolean) => {
      setDrawingOptions((prev) => ({ ...prev, magicWand2dOnly: checked }));
      if (nvRef.current && drawingOptions.mode === "wand") {
        nvRef.current.opts.clickToSegmentIs2D = checked;
      }
    },
    [nvRef, drawingOptions.mode, setDrawingOptions],
  );

  const handleMagicWandMaxDistanceChange = useCallback(
    (value: number) => {
      setDrawingOptions((prev) => ({ ...prev, magicWandMaxDistanceMM: value }));
      if (nvRef.current && drawingOptions.mode === "wand") {
        nvRef.current.opts.clickToSegmentMaxDistanceMM = value;
      }
    },
    [nvRef, drawingOptions.mode, setDrawingOptions],
  );

  const handleMagicWandThresholdChange = useCallback(
    (value: number) => {
      setDrawingOptions((prev) => ({
        ...prev,
        magicWandThresholdPercent: value,
      }));
      if (nvRef.current && drawingOptions.mode === "wand") {
        nvRef.current.opts.clickToSegmentPercent = value;
      }
    },
    [nvRef, drawingOptions.mode, setDrawingOptions],
  );

  const handleDrawUndo = useCallback(() => {
    if (nvRef.current) {
      nvRef.current.drawUndo();
    }
  }, [nvRef]);

  const handleSaveDrawing = useCallback(async () => {
    if (nvRef.current && nvRef.current.drawBitmap) {
      try {
        if (nvRef.current.volumes.length === 0) {
          console.error("No reference volume loaded - cannot save drawing");
          return;
        }

        const drawingData = (await nvRef.current.saveImage({
          filename: "",
          isSaveDrawing: true,
          volumeByIndex: 0,
        })) as Uint8Array;

        const drawingFile = new File([drawingData], drawingOptions.filename, {
          type: "application/octet-stream",
        });

        nvRef.current.setDrawingEnabled(false);
        nvRef.current.setPenValue(0, false);
        nvRef.current.opts.clickToSegment = false;
        nvRef.current.closeDrawing();

        const nvimage = await NVImage.loadFromFile({
          file: drawingFile,
          name: drawingOptions.filename,
        });

        nvimage.colormap = "red";
        nvimage.opacity = 1.0;
        nvRef.current.addVolume(nvimage);

        setDrawingOptions((prev) => ({
          ...prev,
          enabled: false,
          mode: "none",
        }));

        setActiveTab("sceneDetails");
        updateImageDetails();
      } catch (error) {
        console.error("Error saving drawing:", error);
      }
    }
  }, [nvRef, drawingOptions, setDrawingOptions, setActiveTab, updateImageDetails]);

  return {
    syncDrawingOptionsFromNiivue,
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
