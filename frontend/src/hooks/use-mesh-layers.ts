import { useCallback, useEffect, useRef } from "react";
import { useFreeBrowseStore } from "@/store";
import { NVMesh, type Niivue } from "@niivue/niivue";

export function useMeshLayers(
  nvRef: React.RefObject<Niivue | null>,
) {
  const currentSurfaceIndex = useFreeBrowseStore((s) => s.currentSurfaceIndex);
  const selectedLayerIndex = useFreeBrowseStore((s) => s.selectedLayerIndex);
  const setSelectedLayerIndex = useFreeBrowseStore((s) => s.setSelectedLayerIndex);
  const layerVersion = useFreeBrowseStore((s) => s.layerVersion);
  const incrementLayerVersion = useFreeBrowseStore((s) => s.incrementLayerVersion);

  const layerFileInputRef = useRef<HTMLInputElement>(null);

  // Reset layer selection when surface changes
  useEffect(() => {
    setSelectedLayerIndex(null);
  }, [currentSurfaceIndex, setSelectedLayerIndex]);

  const getLayers = useCallback(() => {
    // Consume layerVersion to trigger re-renders on mutation
    void layerVersion;
    const nv = nvRef.current;
    if (!nv || currentSurfaceIndex === null || !nv.meshes[currentSurfaceIndex]) {
      return [];
    }
    const layers = nv.meshes[currentSurfaceIndex].layers || [];
    // WORKAROUND: NiiVue's loadLayer doesn't persist the name on the layer
    // object. Backfill from the URL if available (covers layers loaded via
    // meshesString/loadDocument path). Remove after niivue PR is merged.
    for (const layer of layers) {
      if (!layer.name && layer.url) {
        try {
          const pathname = new URL(layer.url).pathname;
          layer.name = pathname.split("/").pop() || layer.url;
        } catch {
          layer.name = layer.url.split("/").pop() || layer.url;
        }
      }
    }
    return layers;
  }, [nvRef, currentSurfaceIndex, layerVersion]);

  const addLayerFromFile = useCallback(
    async (file: File) => {
      const nv = nvRef.current;
      if (!nv || currentSurfaceIndex === null || !nv.meshes[currentSurfaceIndex]) {
        return;
      }
      const mesh = nv.meshes[currentSurfaceIndex];
      const blobUrl = URL.createObjectURL(file);

      try {
        await NVMesh.loadLayer(
          { url: blobUrl, name: file.name, opacity: 0.5, colormap: "warm" } as any,
          mesh,
        );
        // WORKAROUND: NiiVue's loadLayer doesn't set name on the layer object.
        // Remove after niivue PR is merged.
        const newLayer = mesh.layers[mesh.layers.length - 1];
        if (newLayer) {
          newLayer.name = file.name;
        }
        mesh.updateMesh(nv.gl);
        nv.updateGLVolume();
        incrementLayerVersion();
        setSelectedLayerIndex(mesh.layers.length - 1);
      } catch (error) {
        console.error("Error loading layer file:", error);
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    },
    [nvRef, currentSurfaceIndex, incrementLayerVersion, setSelectedLayerIndex],
  );

  const removeLayer = useCallback(
    (layerIndex: number) => {
      const nv = nvRef.current;
      if (!nv || currentSurfaceIndex === null || !nv.meshes[currentSurfaceIndex]) {
        return;
      }
      const mesh = nv.meshes[currentSurfaceIndex];
      mesh.layers.splice(layerIndex, 1);
      mesh.updateMesh(nv.gl);
      nv.updateGLVolume();
      incrementLayerVersion();

      // Adjust selection
      if (selectedLayerIndex === layerIndex) {
        setSelectedLayerIndex(null);
      } else if (selectedLayerIndex !== null && selectedLayerIndex > layerIndex) {
        setSelectedLayerIndex(selectedLayerIndex - 1);
      }
    },
    [nvRef, currentSurfaceIndex, selectedLayerIndex, incrementLayerVersion, setSelectedLayerIndex],
  );

  const handleLayerOpacityChange = useCallback(
    (value: number) => {
      const nv = nvRef.current;
      if (!nv || currentSurfaceIndex === null || selectedLayerIndex === null) return;
      const mesh = nv.meshes[currentSurfaceIndex];
      if (!mesh) return;
      nv.setMeshLayerProperty(mesh.id, selectedLayerIndex, "opacity", value);
      incrementLayerVersion();
    },
    [nvRef, currentSurfaceIndex, selectedLayerIndex, incrementLayerVersion],
  );

  const handleLayerCalMinChange = useCallback(
    (value: number) => {
      const nv = nvRef.current;
      if (!nv || currentSurfaceIndex === null || selectedLayerIndex === null) return;
      const mesh = nv.meshes[currentSurfaceIndex];
      if (!mesh) return;
      nv.setMeshLayerProperty(mesh.id, selectedLayerIndex, "cal_min", value);
      incrementLayerVersion();
    },
    [nvRef, currentSurfaceIndex, selectedLayerIndex, incrementLayerVersion],
  );

  const handleLayerCalMaxChange = useCallback(
    (value: number) => {
      const nv = nvRef.current;
      if (!nv || currentSurfaceIndex === null || selectedLayerIndex === null) return;
      const mesh = nv.meshes[currentSurfaceIndex];
      if (!mesh) return;
      nv.setMeshLayerProperty(mesh.id, selectedLayerIndex, "cal_max", value);
      incrementLayerVersion();
    },
    [nvRef, currentSurfaceIndex, selectedLayerIndex, incrementLayerVersion],
  );

  const handleLayerColormapChange = useCallback(
    async (colormap: string) => {
      const nv = nvRef.current;
      if (!nv || currentSurfaceIndex === null || selectedLayerIndex === null) return;
      const mesh = nv.meshes[currentSurfaceIndex];
      if (!mesh) return;
      await mesh.setLayerProperty(selectedLayerIndex, "colormap", colormap, nv.gl);
      nv.updateGLVolume();
      incrementLayerVersion();
    },
    [nvRef, currentSurfaceIndex, selectedLayerIndex, incrementLayerVersion],
  );

  const handleLayerUseNegativeCmapChange = useCallback(
    async (checked: boolean) => {
      const nv = nvRef.current;
      if (!nv || currentSurfaceIndex === null || selectedLayerIndex === null) return;
      const mesh = nv.meshes[currentSurfaceIndex];
      if (!mesh) return;
      await mesh.setLayerProperty(selectedLayerIndex, "useNegativeCmap", checked, nv.gl);
      nv.updateGLVolume();
      incrementLayerVersion();
    },
    [nvRef, currentSurfaceIndex, selectedLayerIndex, incrementLayerVersion],
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
