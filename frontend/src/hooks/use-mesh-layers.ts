import { useCallback, useEffect, useRef } from "react";
import { useFreeBrowseStore } from "@/store";
import NiiVue from "@niivue/niivue";

/**
 * Mesh scalar-overlay layer handlers. Command-only: handlers issue nv.* layer
 * commands (addMeshLayer/removeMeshLayer/setMeshLayerProperty), which emit
 * meshUpdated -> the event adapter bumps layerVersion. getLayers re-reads
 * nv.meshes[i].layers at render, so the UI follows without imperative writes.
 * Layers are addressed by (meshIndex, layerIndex) — niivue-mono meshes have no id.
 */
export function useMeshLayers(nvRef: React.RefObject<NiiVue | null>) {
  const currentSurfaceIndex = useFreeBrowseStore((s) => s.currentSurfaceIndex);
  const selectedLayerIndex = useFreeBrowseStore((s) => s.selectedLayerIndex);
  const setSelectedLayerIndex = useFreeBrowseStore(
    (s) => s.setSelectedLayerIndex,
  );
  const layerVersion = useFreeBrowseStore((s) => s.layerVersion);

  const layerFileInputRef = useRef<HTMLInputElement>(null);

  // Reset layer selection when the selected surface changes
  useEffect(() => {
    setSelectedLayerIndex(null);
  }, [currentSurfaceIndex, setSelectedLayerIndex]);

  const getLayers = useCallback(() => {
    // Consume layerVersion so the list re-renders when layers mutate.
    void layerVersion;
    const nv = nvRef.current;
    if (nv && currentSurfaceIndex !== null && nv.meshes[currentSurfaceIndex]) {
      return nv.meshes[currentSurfaceIndex].layers || [];
    }
    return [];
  }, [nvRef, currentSurfaceIndex, layerVersion]);

  const addLayerFromFile = useCallback(
    async (file: File) => {
      const nv = nvRef.current;
      if (
        !nv ||
        currentSurfaceIndex === null ||
        !nv.meshes[currentSurfaceIndex]
      )
        return;
      // niivue-mono loads layers by URL/File and now persists the layer name
      // (PR: URL mesh layers). The old NVMesh.loadLayer + name backfill is gone.
      await nv.addMeshLayer(currentSurfaceIndex, {
        url: file,
        name: file.name,
        opacity: 0.5,
      });
      // Select the newly added (last) layer.
      const layers = nv.meshes[currentSurfaceIndex].layers || [];
      setSelectedLayerIndex(layers.length - 1);
    },
    [nvRef, currentSurfaceIndex, setSelectedLayerIndex],
  );

  const removeLayer = useCallback(
    (layerIndex: number) => {
      const nv = nvRef.current;
      if (
        !nv ||
        currentSurfaceIndex === null ||
        !nv.meshes[currentSurfaceIndex]
      )
        return;
      void nv.removeMeshLayer(currentSurfaceIndex, layerIndex);

      if (selectedLayerIndex === layerIndex) {
        setSelectedLayerIndex(null);
      } else if (
        selectedLayerIndex !== null &&
        selectedLayerIndex > layerIndex
      ) {
        setSelectedLayerIndex(selectedLayerIndex - 1);
      }
    },
    [nvRef, currentSurfaceIndex, selectedLayerIndex, setSelectedLayerIndex],
  );

  // Shared: apply a property change to the currently selected layer.
  const setLayerProperty = useCallback(
    (options: Record<string, unknown>) => {
      const nv = nvRef.current;
      if (
        !nv ||
        currentSurfaceIndex === null ||
        selectedLayerIndex === null ||
        !nv.meshes[currentSurfaceIndex]
      )
        return;
      void nv.setMeshLayerProperty(
        currentSurfaceIndex,
        selectedLayerIndex,
        options,
      );
    },
    [nvRef, currentSurfaceIndex, selectedLayerIndex],
  );

  const handleLayerOpacityChange = useCallback(
    (value: number) => setLayerProperty({ opacity: value }),
    [setLayerProperty],
  );

  const handleLayerCalMinChange = useCallback(
    (value: number) => setLayerProperty({ calMin: value }),
    [setLayerProperty],
  );

  const handleLayerCalMaxChange = useCallback(
    (value: number) => setLayerProperty({ calMax: value }),
    [setLayerProperty],
  );

  const handleLayerColormapChange = useCallback(
    async (colormap: string) => setLayerProperty({ colormap }),
    [setLayerProperty],
  );

  const handleLayerUseNegativeCmapChange = useCallback(
    // niivue-mono has no `useNegativeCmap` boolean; enabling a negative colormap
    // means setting `colormapNegative` to a colormap name ('' disables).
    async (checked: boolean) =>
      setLayerProperty({ colormapNegative: checked ? "winter" : "" }),
    [setLayerProperty],
  );

  const handleAddLayerFiles = useCallback(() => {
    layerFileInputRef.current?.click();
  }, []);

  const handleLayerFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        for (const file of files) {
          await addLayerFromFile(file);
        }
      }
      e.target.value = "";
    },
    [addLayerFromFile],
  );

  return {
    layerFileInputRef,
    getLayers,
    addLayerFromFile,
    removeLayer,
    handleLayerOpacityChange,
    handleLayerCalMinChange,
    handleLayerCalMaxChange,
    handleLayerColormapChange,
    handleLayerUseNegativeCmapChange,
    handleAddLayerFiles,
    handleLayerFileChange,
  };
}
