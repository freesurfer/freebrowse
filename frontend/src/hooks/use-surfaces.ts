import { useCallback, useEffect, useRef } from "react";
import { useFreeBrowseStore } from "@/store";
import type { NiiVue } from "@niivue/niivue";

/**
 * Surface (mesh) handlers. Command-only: handlers issue nv.* commands and the
 * derived `surfaces` list follows via the event adapter (which rebuilds it from
 * nv.meshes on meshLoaded/meshRemoved/meshUpdated). Handlers never write the
 * surfaces slice directly.
 */
export function useSurfaces(
  nvRef: React.RefObject<NiiVue | null>,
  debouncedGLUpdate: () => void,
) {
  void debouncedGLUpdate; // setMesh refreshes the GPU itself; kept for call-site stability
  const currentSurfaceIndex = useFreeBrowseStore((s) => s.currentSurfaceIndex);
  const setCurrentSurfaceIndex = useFreeBrowseStore(
    (s) => s.setCurrentSurfaceIndex,
  );
  const surfaceToRemove = useFreeBrowseStore((s) => s.surfaceToRemove);
  const setSurfaceToRemove = useFreeBrowseStore((s) => s.setSurfaceToRemove);
  const skipRemoveConfirmation = useFreeBrowseStore(
    (s) => s.skipRemoveConfirmation,
  );
  const setRemoveDialogOpen = useFreeBrowseStore((s) => s.setRemoveDialogOpen);
  void surfaceToRemove;

  const surfaceColorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    return () => {
      if (surfaceColorTimeoutRef.current)
        clearTimeout(surfaceColorTimeoutRef.current);
    };
  }, []);

  // The surfaces list is rebuilt from nv.meshes by the event adapter now; kept
  // as a no-op for signature stability (still passed into use-file-loading).
  const updateSurfaceDetails = useCallback(() => {}, []);

  const toggleSurfaceVisibility = useCallback(
    // Index-based: niivue-mono meshes have no stable id (unlike volumes), so
    // all mesh ops are addressed by index.
    (surfaceIndex: number) => {
      const nv = nvRef.current;
      const mesh = nv?.meshes[surfaceIndex] as { opacity?: number } | undefined;
      if (!nv || !mesh) return;
      // niivue-mono has no rendered mesh `visible` flag, so toggle via opacity
      // (0 == hidden), mirroring volume visibility.
      const isVisible = (mesh.opacity ?? 1) > 0;
      void nv.setMesh(surfaceIndex, { opacity: isVisible ? 0 : 1 });
    },
    [nvRef],
  );

  const removeSurface = useCallback(
    (surfaceIndex: number) => {
      const nv = nvRef.current;
      if (!nv || !nv.meshes[surfaceIndex]) return;
      void nv.removeMesh(surfaceIndex);

      if (currentSurfaceIndex === surfaceIndex) {
        if (surfaceIndex > 0) setCurrentSurfaceIndex(surfaceIndex - 1);
        else if (nv.meshes.length > 1) setCurrentSurfaceIndex(0);
        else setCurrentSurfaceIndex(null);
      } else if (
        currentSurfaceIndex !== null &&
        currentSurfaceIndex > surfaceIndex
      ) {
        setCurrentSurfaceIndex(currentSurfaceIndex - 1);
      }
    },
    [nvRef, currentSurfaceIndex, setCurrentSurfaceIndex],
  );

  const handleRemoveSurfaceClick = useCallback(
    (surfaceIndex: number) => {
      if (skipRemoveConfirmation) {
        removeSurface(surfaceIndex);
      } else {
        setSurfaceToRemove(surfaceIndex);
        setRemoveDialogOpen(true);
      }
    },
    [
      skipRemoveConfirmation,
      removeSurface,
      setSurfaceToRemove,
      setRemoveDialogOpen,
    ],
  );

  const handleSurfaceOpacityChange = useCallback(
    (newOpacity: number) => {
      const nv = nvRef.current;
      if (
        currentSurfaceIndex === null ||
        !nv ||
        !nv.meshes[currentSurfaceIndex]
      )
        return;
      void nv.setMesh(currentSurfaceIndex, { opacity: newOpacity });
    },
    [currentSurfaceIndex, nvRef],
  );

  const handleSurfaceColorChange = useCallback(
    (hexColor: string) => {
      const nv = nvRef.current;
      if (
        currentSurfaceIndex === null ||
        !nv ||
        !nv.meshes[currentSurfaceIndex]
      )
        return;
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      const index = currentSurfaceIndex;
      if (surfaceColorTimeoutRef.current)
        clearTimeout(surfaceColorTimeoutRef.current);
      surfaceColorTimeoutRef.current = setTimeout(() => {
        // setMesh accepts rgba255 (0-255) and converts to color internally.
        if (nvRef.current)
          void nvRef.current.setMesh(index, { rgba255: [r, g, b, 255] });
      }, 50);
    },
    [currentSurfaceIndex, nvRef],
  );

  const handleMeshShaderChange = useCallback(
    (shaderName: string) => {
      const nv = nvRef.current;
      if (
        currentSurfaceIndex === null ||
        !nv ||
        !nv.meshes[currentSurfaceIndex]
      )
        return;
      void nv.setMesh(currentSurfaceIndex, { shaderType: shaderName });
    },
    [currentSurfaceIndex, nvRef],
  );

  return {
    updateSurfaceDetails,
    toggleSurfaceVisibility,
    removeSurface,
    handleRemoveSurfaceClick,
    handleSurfaceOpacityChange,
    handleSurfaceColorChange,
    handleMeshShaderChange,
  };
}
