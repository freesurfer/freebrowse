import { useCallback, useEffect, useRef } from "react";
import { useFreeBrowseStore } from "@/store";
import type { Niivue } from "@niivue/niivue";

export function useSurfaces(
  nvRef: React.RefObject<Niivue | null>,
  debouncedGLUpdate: () => void,
) {
  const surfaces = useFreeBrowseStore((s) => s.surfaces);
  const setSurfaces = useFreeBrowseStore((s) => s.setSurfaces);
  const currentSurfaceIndex = useFreeBrowseStore((s) => s.currentSurfaceIndex);
  const setCurrentSurfaceIndex = useFreeBrowseStore((s) => s.setCurrentSurfaceIndex);
  const surfaceToRemove = useFreeBrowseStore((s) => s.surfaceToRemove);
  const setSurfaceToRemove = useFreeBrowseStore((s) => s.setSurfaceToRemove);
  const skipRemoveConfirmation = useFreeBrowseStore((s) => s.skipRemoveConfirmation);
  const setRemoveDialogOpen = useFreeBrowseStore((s) => s.setRemoveDialogOpen);

  const surfaceColorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup surface color timeout on unmount
  useEffect(() => {
    return () => {
      if (surfaceColorTimeoutRef.current) {
        clearTimeout(surfaceColorTimeoutRef.current);
      }
    };
  }, []);

  const updateSurfaceDetails = useCallback(() => {
    const nv = nvRef.current;
    if (nv && nv.meshes) {
      const loadedSurfaces = nv.meshes.map((mesh: any, index: number) => {
        const name = mesh.name || `Surface ${index + 1}`;
        const rgba255 = mesh.rgba255 || new Uint8Array([255, 255, 0, 255]);
        return {
          id: mesh.id,
          name: name,
          visible: mesh.visible !== false,
          opacity: mesh.opacity ?? 1.0,
          rgba255: [rgba255[0], rgba255[1], rgba255[2], rgba255[3]] as [number, number, number, number],
          meshShaderIndex: mesh.meshShaderIndex ?? 14,
        };
      });
      setSurfaces(loadedSurfaces);
      console.log("updateSurfaceDetails() loadedSurfaces:", loadedSurfaces);

      if (currentSurfaceIndex === null && loadedSurfaces.length > 0) {
        setCurrentSurfaceIndex(0);
      }
    }
  }, [nvRef, setSurfaces, currentSurfaceIndex, setCurrentSurfaceIndex]);

  const toggleSurfaceVisibility = useCallback(
    (id: string) => {
      setSurfaces(
        surfaces.map((surf, index) => {
          if (surf.id === id) {
            const newVisible = !surf.visible;
            if (nvRef.current) {
              nvRef.current.setMeshProperty(index, "visible", newVisible);
            }
            return { ...surf, visible: newVisible };
          }
          return surf;
        }),
      );

      if (nvRef.current) {
        nvRef.current.updateGLVolume();
      }
    },
    [surfaces, nvRef, setSurfaces],
  );

  const removeSurface = useCallback(
    (surfaceIndex: number) => {
      if (nvRef.current && surfaces[surfaceIndex]) {
        const mesh = nvRef.current.meshes[surfaceIndex];
        if (mesh) {
          nvRef.current.removeMesh(mesh);
          updateSurfaceDetails();

          if (currentSurfaceIndex === surfaceIndex) {
            if (surfaceIndex > 0) {
              setCurrentSurfaceIndex(surfaceIndex - 1);
            } else if (surfaces.length > 1) {
              setCurrentSurfaceIndex(0);
            } else {
              setCurrentSurfaceIndex(null);
            }
          } else if (
            currentSurfaceIndex !== null &&
            currentSurfaceIndex > surfaceIndex
          ) {
            setCurrentSurfaceIndex(currentSurfaceIndex - 1);
          }
        }
      }
    },
    [surfaces, currentSurfaceIndex, nvRef, updateSurfaceDetails, setCurrentSurfaceIndex],
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
    [skipRemoveConfirmation, removeSurface, setSurfaceToRemove, setRemoveDialogOpen],
  );

  const handleSurfaceOpacityChange = useCallback(
    (newOpacity: number) => {
      if (
        currentSurfaceIndex !== null &&
        nvRef.current &&
        surfaces[currentSurfaceIndex]
      ) {
        nvRef.current.setMeshProperty(currentSurfaceIndex, "opacity", newOpacity);
        debouncedGLUpdate();

        setSurfaces((prevSurfaces) =>
          prevSurfaces.map((surf, index) =>
            index === currentSurfaceIndex
              ? { ...surf, opacity: newOpacity }
              : surf,
          ),
        );
      }
    },
    [currentSurfaceIndex, surfaces, nvRef, debouncedGLUpdate, setSurfaces],
  );

  const handleSurfaceColorChange = useCallback(
    (hexColor: string) => {
      if (
        currentSurfaceIndex !== null &&
        nvRef.current &&
        surfaces[currentSurfaceIndex]
      ) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        setSurfaces((prevSurfaces) =>
          prevSurfaces.map((surf, index) =>
            index === currentSurfaceIndex
              ? { ...surf, rgba255: [r, g, b, 255] as [number, number, number, number] }
              : surf,
          ),
        );

        if (surfaceColorTimeoutRef.current) {
          clearTimeout(surfaceColorTimeoutRef.current);
        }
        const meshIndex = currentSurfaceIndex;
        surfaceColorTimeoutRef.current = setTimeout(() => {
          if (nvRef.current) {
            const rgba255 = new Uint8Array([r, g, b, 255]);
            nvRef.current.setMeshProperty(meshIndex, "rgba255", rgba255);
            nvRef.current.updateGLVolume();
          }
        }, 50);
      }
    },
    [currentSurfaceIndex, surfaces, nvRef, setSurfaces],
  );

  const handleMeshShaderChange = useCallback(
    (shaderName: string) => {
      if (
        currentSurfaceIndex !== null &&
        nvRef.current &&
        surfaces[currentSurfaceIndex]
      ) {
        nvRef.current.setMeshShader(currentSurfaceIndex, shaderName);
        const shaderIndex = nvRef.current.meshShaderNameToNumber(shaderName) ?? 0;
        debouncedGLUpdate();

        setSurfaces((prevSurfaces) =>
          prevSurfaces.map((surf, index) =>
            index === currentSurfaceIndex
              ? { ...surf, meshShaderIndex: shaderIndex }
              : surf,
          ),
        );
      }
    },
    [currentSurfaceIndex, surfaces, nvRef, debouncedGLUpdate, setSurfaces],
  );

  const getMeshShaderName = useCallback(
    (index: number): string => {
      if (!nvRef.current) return "Phong";
      const shaderNames = nvRef.current.meshShaderNames(false);
      return shaderNames[index] || "Phong";
    },
    [nvRef],
  );

  return {
    updateSurfaceDetails,
    toggleSurfaceVisibility,
    removeSurface,
    handleRemoveSurfaceClick,
    handleSurfaceOpacityChange,
    handleSurfaceColorChange,
    handleMeshShaderChange,
    getMeshShaderName,
  };
}
