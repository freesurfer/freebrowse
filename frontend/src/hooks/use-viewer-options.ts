import { useCallback, useEffect, useRef } from "react";
import { useFreeBrowseStore } from "@/store";
import { readViewerFromNiiVue } from "@/store/niivue-store-sync";
import { sliceTypeMap } from "@/lib/niivue-helpers";
import { DRAG_MODE, type NiiVue } from "@niivue/niivue";
import type { DragMode } from "@/components/drag-mode-selector";
import type { ViewMode } from "@/store/types";

/**
 * Viewer-option handlers. Event-driven model: handlers issue commands to the
 * niivue instance (`nv.*`) and the Zustand store follows via the event adapter
 * (registerNiiVueEvents / createStoreSyncTarget) — handlers do NOT write the
 * store themselves. The single exception is crosshairWidth/crosshairVisible,
 * which is store-owned UI state (niivue has only one crosshairWidth where 0
 * means hidden, so it can't remember the width while hidden).
 *
 * One-time init on mount, chosen by `init` (only the viewer component that owns
 * the mount passes it; other consumers of the handlers leave it at "none"):
 *   - `"apply"` (the app, which built the instance): push the store's viewer
 *     defaults onto the instance once (`applyViewerOptions`).
 *   - `"sync"`  (a host-owned instance): never touch the instance's settings;
 *     seed the store FROM it instead (`syncViewerOptionsFromNiiVue`), so the
 *     UI reflects what the host configured.
 *   - `"none"`  (default): handlers only.
 */
export type ViewerOptionsInit = "apply" | "sync" | "none";

export function useViewerOptions(
  nvRef: React.RefObject<NiiVue | null>,
  init: ViewerOptionsInit = "none",
) {
  const viewerOptions = useFreeBrowseStore((s) => s.viewerOptions);
  const setViewerOptions = useFreeBrowseStore((s) => s.setViewerOptions);

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const crosshairColorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced GPU texture refresh (used by volume/mesh hooks via this handle).
  const debouncedGLUpdate = useCallback(() => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      if (nvRef.current) void nvRef.current.updateGLVolume();
    }, 100);
  }, [nvRef]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (crosshairColorTimeoutRef.current)
        clearTimeout(crosshairColorTimeoutRef.current);
    };
  }, []);

  // Store -> niivue push. Applied once at init (and reusable after loads) to
  // seed the instance from the current store viewerOptions. Steady-state
  // changes flow the other way (handlers -> nv -> events -> store).
  const applyViewerOptions = useCallback(() => {
    const nv = nvRef.current;
    if (!nv) return;
    const o = useFreeBrowseStore.getState().viewerOptions;
    nv.crosshairWidth = o.crosshairVisible ? o.crosshairWidth : 0;
    nv.crosshairGap = o.crosshairGap;
    nv.crosshairColor = o.crosshairColor;
    nv.rulerWidth = o.rulerWidth;
    nv.isRulerVisible = o.rulerVisible;
    nv.volumeIsNearestInterpolation = !o.interpolateVoxels;
    nv.secondaryDragMode = DRAG_MODE[o.dragMode];
    nv.volumeOutlineWidth = o.overlayOutlineWidth;
    nv.isColorbarVisible = o.isColorbar;
    nv.isRadiological = o.isRadiologicalConvention;
    const viewConfig = sliceTypeMap[o.viewMode];
    if (viewConfig) {
      nv.showRender = viewConfig.showRender;
      nv.sliceType = viewConfig.sliceType;
    } else {
      nv.sliceType = 0;
    }
  }, [nvRef]);

  // niivue -> store read-back: seed viewerOptions from the instance's current
  // settings (only the ones it reports). Steady-state changes still arrive
  // through the event adapter; this is the one-shot for a host-owned instance.
  const syncViewerOptionsFromNiiVue = useCallback(() => {
    const nv = nvRef.current;
    if (!nv) return;
    const patch = readViewerFromNiiVue(nv);
    if (Object.keys(patch).length === 0) return;
    setViewerOptions((prev) => ({ ...prev, ...patch }));
  }, [nvRef, setViewerOptions]);

  // One-time init, direction per `init` (see the docblock).
  const didInit = useRef(false);
  useEffect(() => {
    if (init === "none" || didInit.current || !nvRef.current) return;
    didInit.current = true;
    if (init === "apply") applyViewerOptions();
    else syncViewerOptionsFromNiiVue();
  }, [init, applyViewerOptions, syncViewerOptionsFromNiiVue, nvRef]);

  const handleViewMode = useCallback(
    (mode: ViewMode) => {
      const nv = nvRef.current;
      const cfg = sliceTypeMap[mode];
      if (!nv || !cfg) return;
      nv.showRender = cfg.showRender;
      nv.sliceType = cfg.sliceType;
    },
    [nvRef],
  );

  // "Right drag" mode -> niivue's secondaryDragMode. Store follows via the
  // `change` event -> adapter (secondaryDragMode -> dragMode string).
  const handleDragModeChange = useCallback(
    (mode: DragMode) => {
      if (nvRef.current) nvRef.current.secondaryDragMode = DRAG_MODE[mode];
    },
    [nvRef],
  );

  // crosshairWidth/crosshairVisible: store-owned (see file header). Write the
  // store AND push the composed width to nv.
  const handleCrosshairWidthChange = useCallback(
    (value: number) => {
      setViewerOptions((prev) => ({ ...prev, crosshairWidth: value }));
      const nv = nvRef.current;
      if (nv) nv.crosshairWidth = viewerOptions.crosshairVisible ? value : 0;
    },
    [nvRef, setViewerOptions, viewerOptions.crosshairVisible],
  );

  const handleCrosshairVisibleChange = useCallback(
    (visible: boolean) => {
      setViewerOptions((prev) => ({ ...prev, crosshairVisible: visible }));
      const nv = nvRef.current;
      if (nv) nv.crosshairWidth = visible ? viewerOptions.crosshairWidth : 0;
    },
    [nvRef, setViewerOptions, viewerOptions.crosshairWidth],
  );

  const handleCrosshairGapChange = useCallback(
    (value: number) => {
      if (nvRef.current) nvRef.current.crosshairGap = value;
    },
    [nvRef],
  );

  const handleCrosshairColorChange = useCallback(
    (color: string) => {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      const a = viewerOptions.crosshairColor[3];
      if (crosshairColorTimeoutRef.current)
        clearTimeout(crosshairColorTimeoutRef.current);
      crosshairColorTimeoutRef.current = setTimeout(() => {
        if (nvRef.current) nvRef.current.crosshairColor = [r, g, b, a];
      }, 50);
    },
    [viewerOptions.crosshairColor, nvRef],
  );

  const handleInterpolateVoxelsChange = useCallback(
    (checked: boolean) => {
      if (nvRef.current) nvRef.current.volumeIsNearestInterpolation = !checked;
    },
    [nvRef],
  );

  const handleRulerWidthChange = useCallback(
    (value: number) => {
      if (nvRef.current) nvRef.current.rulerWidth = value;
    },
    [nvRef],
  );

  const handleRulerVisibleChange = useCallback(
    (visible: boolean) => {
      if (nvRef.current) nvRef.current.isRulerVisible = visible;
    },
    [nvRef],
  );

  const handleColorbarChange = useCallback(
    (checked: boolean) => {
      if (nvRef.current) nvRef.current.isColorbarVisible = checked;
    },
    [nvRef],
  );

  const handleRadiologicalChange = useCallback(
    (checked: boolean) => {
      if (nvRef.current) nvRef.current.isRadiological = checked;
    },
    [nvRef],
  );

  const handleSagittalNoseLeftChange = useCallback(
    (checked: boolean) => {
      // niivue-mono has no sagittal nose-left option (upstream request: migration
      // plan Step 8, item 8j). The Settings toggle is hidden meanwhile; this
      // handler and the store field stay so it can be re-enabled. Store-only.
      setViewerOptions((prev) => ({ ...prev, sagittalNoseLeft: checked }));
    },
    [setViewerOptions],
  );

  const handleOverlayOutlineWidthChange = useCallback(
    (value: number) => {
      if (nvRef.current) nvRef.current.volumeOutlineWidth = value;
    },
    [nvRef],
  );

  // Reset view + per-volume contrast to load-time defaults. Commands only;
  // the store follows via volumeUpdated/change events.
  const resetViewAndContrast = useCallback(() => {
    const nv = nvRef.current;
    if (!nv) return;
    nv.scaleMultiplier = 1.0;
    nv.pan2Dxyzmm = [0, 0, 0, 1];
    nv.crosshairPos = [0.5, 0.5, 0.5];
    nv.azimuth = 110;
    nv.elevation = 10;
    (nv.volumes ?? []).forEach((vol, i) => {
      if (vol.robustMin !== undefined && vol.robustMax !== undefined) {
        void nv.setVolume(i, { calMin: vol.robustMin, calMax: vol.robustMax });
      }
    });
  }, [nvRef]);

  return {
    viewerOptions,
    setViewerOptions,
    applyViewerOptions,
    syncViewerOptionsFromNiiVue,
    debouncedGLUpdate,
    handleViewMode,
    handleDragModeChange,
    handleCrosshairWidthChange,
    handleCrosshairGapChange,
    handleInterpolateVoxelsChange,
    handleCrosshairVisibleChange,
    handleCrosshairColorChange,
    handleRulerWidthChange,
    handleRulerVisibleChange,
    handleOverlayOutlineWidthChange,
    handleColorbarChange,
    handleRadiologicalChange,
    handleSagittalNoseLeftChange,
    resetViewAndContrast,
  };
}
