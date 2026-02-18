import { useCallback, useEffect, useRef } from "react";
import { useFreeBrowseStore } from "@/store";
import { sliceTypeMap } from "@/lib/niivue-helpers";
import { DRAG_MODE, type Niivue } from "@niivue/niivue";
import type { DragMode } from "@/components/drag-mode-selector";
import type { ViewMode } from "@/store/types";

export function useViewerOptions(nvRef: React.RefObject<Niivue | null>) {
  const viewerOptions = useFreeBrowseStore((s) => s.viewerOptions);
  const setViewerOptions = useFreeBrowseStore((s) => s.setViewerOptions);

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const crosshairColorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced GL update to prevent excessive calls
  const debouncedGLUpdate = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      if (nvRef.current) {
        nvRef.current.updateGLVolume();
      }
    }, 100);
  }, [nvRef]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (crosshairColorTimeoutRef.current) {
        clearTimeout(crosshairColorTimeoutRef.current);
      }
    };
  }, []);

  const applyViewerOptions = useCallback(() => {
    if (nvRef.current) {
      const viewConfig = sliceTypeMap[viewerOptions.viewMode];
      console.log("applyViewerOptions() -- viewConfig: ", viewConfig);

      nvRef.current.opts.crosshairWidth = viewerOptions.crosshairVisible
        ? viewerOptions.crosshairWidth
        : 0;
      nvRef.current.opts.crosshairGap = viewerOptions.crosshairGap;
      nvRef.current.setCrosshairColor(viewerOptions.crosshairColor);
      nvRef.current.opts.rulerWidth = viewerOptions.rulerWidth;
      nvRef.current.opts.isRuler = viewerOptions.rulerVisible;
      nvRef.current.setInterpolation(!viewerOptions.interpolateVoxels);
      nvRef.current.opts.dragMode = DRAG_MODE[viewerOptions.dragMode];
      nvRef.current.overlayOutlineWidth = viewerOptions.overlayOutlineWidth;

      if (viewConfig) {
        nvRef.current.opts.multiplanarShowRender = viewConfig.showRender;
        nvRef.current.setSliceType(viewConfig.sliceType);
      } else {
        nvRef.current.setSliceType(0);
      }
    }
  }, [viewerOptions, nvRef]);

  const syncViewerOptionsFromNiivue = useCallback(() => {
    if (nvRef.current) {
      const nv = nvRef.current;

      let viewMode: ViewMode = "ACS";
      for (const [mode, config] of Object.entries(sliceTypeMap)) {
        if (config.sliceType === nv.opts.sliceType) {
          viewMode = mode as ViewMode;
          break;
        }
      }

      let dragMode: DragMode = "contrast";
      for (const [mode, value] of Object.entries(DRAG_MODE)) {
        if (value === nv.opts.dragMode) {
          dragMode = mode as DragMode;
          break;
        }
      }

      setViewerOptions({
        viewMode,
        crosshairWidth: nv.opts.crosshairWidth,
        crosshairGap: nv.opts.crosshairGap ?? 0,
        crosshairVisible: nv.opts.crosshairWidth > 0,
        crosshairColor: nv.opts.crosshairColor
          ? ([...nv.opts.crosshairColor] as [number, number, number, number])
          : [1.0, 0.0, 0.0, 0.5],
        rulerWidth: nv.opts.rulerWidth ?? 1.0,
        rulerVisible: nv.opts.isRuler ?? false,
        interpolateVoxels: !nv.opts.isNearestInterpolation,
        dragMode,
        overlayOutlineWidth: nv.overlayOutlineWidth,
      });
    }
  }, [nvRef, setViewerOptions]);

  // Apply viewer options when they change
  useEffect(() => {
    applyViewerOptions();
  }, [applyViewerOptions]);

  const handleViewMode = useCallback(
    (mode: ViewMode) => {
      setViewerOptions((prev) => ({ ...prev, viewMode: mode }));
    },
    [setViewerOptions],
  );

  const handleCrosshairWidthChange = useCallback(
    (value: number) => {
      setViewerOptions((prev) => ({ ...prev, crosshairWidth: value }));
      debouncedGLUpdate();
    },
    [setViewerOptions, debouncedGLUpdate],
  );

  const handleCrosshairGapChange = useCallback(
    (value: number) => {
      setViewerOptions((prev) => ({ ...prev, crosshairGap: value }));
      debouncedGLUpdate();
    },
    [setViewerOptions, debouncedGLUpdate],
  );

  const handleInterpolateVoxelsChange = useCallback(
    (checked: boolean) => {
      setViewerOptions((prev) => ({ ...prev, interpolateVoxels: checked }));
    },
    [setViewerOptions],
  );

  const handleCrosshairVisibleChange = useCallback(
    (visible: boolean) => {
      setViewerOptions((prev) => ({ ...prev, crosshairVisible: visible }));
    },
    [setViewerOptions],
  );

  const handleCrosshairColorChange = useCallback(
    (color: string) => {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      const a = viewerOptions.crosshairColor[3];

      if (crosshairColorTimeoutRef.current) {
        clearTimeout(crosshairColorTimeoutRef.current);
      }
      crosshairColorTimeoutRef.current = setTimeout(() => {
        if (nvRef.current) {
          nvRef.current.setCrosshairColor([r, g, b, a]);
          nvRef.current.updateGLVolume();
        }
        setViewerOptions((prev) => ({
          ...prev,
          crosshairColor: [r, g, b, a] as [number, number, number, number],
        }));
      }, 50);
    },
    [viewerOptions.crosshairColor, nvRef, setViewerOptions],
  );

  const handleRulerWidthChange = useCallback(
    (value: number) => {
      setViewerOptions((prev) => ({ ...prev, rulerWidth: value }));
      debouncedGLUpdate();
    },
    [setViewerOptions, debouncedGLUpdate],
  );

  const handleRulerVisibleChange = useCallback(
    (visible: boolean) => {
      setViewerOptions((prev) => ({ ...prev, rulerVisible: visible }));
    },
    [setViewerOptions],
  );

  const handleOverlayOutlineWidthChange = useCallback(
    (value: number) => {
      setViewerOptions((prev) => ({ ...prev, overlayOutlineWidth: value }));
      if (nvRef.current) {
        nvRef.current.overlayOutlineWidth = value;
        debouncedGLUpdate();
      }
    },
    [nvRef, setViewerOptions, debouncedGLUpdate],
  );

  return {
    viewerOptions,
    setViewerOptions,
    applyViewerOptions,
    syncViewerOptionsFromNiivue,
    debouncedGLUpdate,
    handleViewMode,
    handleCrosshairWidthChange,
    handleCrosshairGapChange,
    handleInterpolateVoxelsChange,
    handleCrosshairVisibleChange,
    handleCrosshairColorChange,
    handleRulerWidthChange,
    handleRulerVisibleChange,
    handleOverlayOutlineWidthChange,
  };
}
