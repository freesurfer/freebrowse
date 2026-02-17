import { useCallback, useEffect, useRef } from "react";
import { useFreeBrowseStore } from "@/store";
import { useViewerOptions } from "@/hooks/use-viewer-options";
import {
  PanelLeft,
  PanelRight,
  PanelBottom,
  Send,
  ImageIcon,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Settings,
  Edit,
  Pencil,
  FileText,
  Info,
  Box,
  Brain,
  Database,
  Undo,
  Download,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LabeledSliderWithInput } from "@/components/ui/labeled-slider-with-input";
import { Select } from "@/components/ui/select";
import ViewSelector from "@/components/view-selector";
import DragModeSelector, {
  type DragMode,
} from "@/components/drag-mode-selector";
import { cn } from "@/lib/utils";
import {
  DocumentData,
  Niivue,
  NVDocument,
  NVImage,
  DRAG_MODE,
  cmapper,
} from "@niivue/niivue";
import "../App.css";
import ImageUploader from "./image-uploader";
import ImageCanvas from "./image-canvas";
import { sliceTypeMap, rgba255ToHex, uint8ArrayToBase64 } from "@/lib/niivue-helpers";
import { ViewMode } from "./view-selector";
import { FileList, type FileItem } from "./file-list";

const nv = new Niivue({
  loadingText: "Drag-drop images",
  dragAndDropEnabled: true,
  textHeight: 0.02,
  backColor: [0, 0, 0, 1],
  crosshairColor: [1.0, 0.0, 0.0, 0.5],
  multiplanarForceRender: false,
});

// for interactive debugging
//window.nv = nv;

export default function FreeBrowse() {
  // --- Zustand store ---
  const images = useFreeBrowseStore((s) => s.images);
  const setImages = useFreeBrowseStore((s) => s.setImages);
  const showUploader = useFreeBrowseStore((s) => s.showUploader);
  const setShowUploader = useFreeBrowseStore((s) => s.setShowUploader);
  const loadViaNvd = useFreeBrowseStore((s) => s.loadViaNvd);
  const setLoadViaNvd = useFreeBrowseStore((s) => s.setLoadViaNvd);
  const currentImageIndex = useFreeBrowseStore((s) => s.currentImageIndex);
  const setCurrentImageIndex = useFreeBrowseStore((s) => s.setCurrentImageIndex);
  const sidebarOpen = useFreeBrowseStore((s) => s.sidebarOpen);
  const setSidebarOpen = useFreeBrowseStore((s) => s.setSidebarOpen);
  const activeTab = useFreeBrowseStore((s) => s.activeTab);
  const setActiveTab = useFreeBrowseStore((s) => s.setActiveTab);
  const footerOpen = useFreeBrowseStore((s) => s.footerOpen);
  const setFooterOpen = useFreeBrowseStore((s) => s.setFooterOpen);
  const darkMode = useFreeBrowseStore((s) => s.darkMode);
  const setDarkMode = useFreeBrowseStore((s) => s.setDarkMode);
  const removeDialogOpen = useFreeBrowseStore((s) => s.removeDialogOpen);
  const setRemoveDialogOpen = useFreeBrowseStore((s) => s.setRemoveDialogOpen);
  const volumeToRemove = useFreeBrowseStore((s) => s.volumeToRemove);
  const setVolumeToRemove = useFreeBrowseStore((s) => s.setVolumeToRemove);
  const skipRemoveConfirmation = useFreeBrowseStore((s) => s.skipRemoveConfirmation);
  const setSkipRemoveConfirmation = useFreeBrowseStore((s) => s.setSkipRemoveConfirmation);
  const saveDialogOpen = useFreeBrowseStore((s) => s.saveDialogOpen);
  const setSaveDialogOpen = useFreeBrowseStore((s) => s.setSaveDialogOpen);
  const saveState = useFreeBrowseStore((s) => s.saveState);
  const setSaveState = useFreeBrowseStore((s) => s.setSaveState);
  const settingsDialogOpen = useFreeBrowseStore((s) => s.settingsDialogOpen);
  const setSettingsDialogOpen = useFreeBrowseStore((s) => s.setSettingsDialogOpen);
  const locationData = useFreeBrowseStore((s) => s.locationData);
  const setLocationData = useFreeBrowseStore((s) => s.setLocationData);
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);
  const setDrawingOptions = useFreeBrowseStore((s) => s.setDrawingOptions);
  const surfaces = useFreeBrowseStore((s) => s.surfaces);
  const setSurfaces = useFreeBrowseStore((s) => s.setSurfaces);
  const currentSurfaceIndex = useFreeBrowseStore((s) => s.currentSurfaceIndex);
  const setCurrentSurfaceIndex = useFreeBrowseStore((s) => s.setCurrentSurfaceIndex);
  const surfaceToRemove = useFreeBrowseStore((s) => s.surfaceToRemove);
  const setSurfaceToRemove = useFreeBrowseStore((s) => s.setSurfaceToRemove);

  // --- Component-local state ---
  // Serverless mode is determined at build time via VITE_SERVERLESS env var
  const serverlessMode = import.meta.env.VITE_SERVERLESS === 'true';
  const nvRef = useRef<Niivue | null>(nv);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const surfaceFileInputRef = useRef<HTMLInputElement>(null);
  const surfaceColorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Hooks ---
  const {
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
  } = useViewerOptions(nvRef);

  // Cleanup surface color timeout on unmount
  useEffect(() => {
    return () => {
      if (surfaceColorTimeoutRef.current) {
        clearTimeout(surfaceColorTimeoutRef.current);
      }
    };
  }, []);

  // Update voxelData for the footer
  const handleLocationChange = useCallback((locationObject: any) => {
    if (locationObject && nvRef.current && nvRef.current.volumes.length > 0) {
      const voxelData = nvRef.current.volumes.map((volume, index) => {
        // Convert mm to voxel coordinates directly on the volume
        const voxel = volume.mm2vox(locationObject.mm);

        // Round once for getting the value
        const i = Math.round(voxel[0]);
        const j = Math.round(voxel[1]);
        const k = Math.round(voxel[2]);

        // Get the value at this voxel
        const value = volume.getValue(i, j, k, volume.frame4D);

        return {
          name: volume.name || `Volume ${index + 1}`,
          voxel: [i, j, k] as [number, number, number],
          value: value,
        };
      });

      setLocationData({
        mm: locationObject.mm,
        voxels: voxelData,
      });
    }
  }, []);


  // Sync drawing options from Niivue when they change (e.g., via mouse wheel)
  const syncDrawingOptionsFromNiivue = useCallback(() => {
    if (nvRef.current && drawingOptions.mode === "wand") {
      const nv = nvRef.current;
      // Only update if values have actually changed
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
    drawingOptions.mode,
    drawingOptions.magicWandThresholdPercent,
    drawingOptions.magicWandMaxDistanceMM,
  ]);

  // Set up the drag release callback
  // This can change the contrast of a volume, so update the image details accordingly
  useEffect(() => {
    if (nvRef.current) {
      nvRef.current.onDragRelease = async () => {
        // Use requestAnimationFrame to wait for the next render frame
        // otherwise values will 'lag' by one drag operation
        await new Promise((resolve) => requestAnimationFrame(resolve));
        updateImageDetails();
      };

      // Set up onImageLoaded to handle drag-and-drop files
      //nvRef.current.onImageLoaded = () => {
      //  updateImageDetails();
      //  setShowUploader(false); // Hide uploader when images are loaded via drag-drop
      //};

      // Set up onLocationChange to track pointer location
      nvRef.current.onLocationChange = handleLocationChange;

      // Set up onOptsChange to sync drawing options when changed via mouse wheel
      nvRef.current.onOptsChange = syncDrawingOptionsFromNiivue;
    }
  }, [handleLocationChange, syncDrawingOptionsFromNiivue]); // Re-create callback when callbacks change

  // Enable/disable drag-and-drop based on whether images are loaded
  useEffect(() => {
    if (nvRef.current) {
      // Only enable drag-and-drop if we're showing the uploader
      // This prevents re-enabling it after images have been loaded
      nvRef.current.opts.dragAndDropEnabled =
        showUploader && images.length === 0;
    }
  }, [images.length, showUploader]);

  // If in serverless mode, switch to sceneDetails tab by default
  useEffect(() => {
    if (serverlessMode) {
      setActiveTab("sceneDetails");
    }
  }, [serverlessMode]);

  // Load NVD from URL parameter on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nvdParam = urlParams.get("nvd");

    if (nvdParam) {
      console.log("Loading NVD from URL parameter:", nvdParam);

      // Create a FileItem object from the URL parameter
      const nvdFromUrl: FileItem = {
        filename: nvdParam.split("/").pop() || nvdParam, // Extract filename from path
        url: nvdParam,
      };

      // Load the NVD file
      handleNvdFileSelect(nvdFromUrl);
    }
  }, []); // Empty dependency array since this should only run once on mount

  // Load volume from URL parameter on initial load (e.g., ?vol=/files/brain.nii.gz)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const volParam = urlParams.get("vol");

    if (volParam) {
      console.log("Loading volume from URL parameter:", volParam);

      const filename = volParam.split("/").pop() || volParam;
      const fileItem: FileItem = { filename, url: volParam };
      handleImagingFileSelect(fileItem);
    }
  }, []);

  // Load embedded NVD data (for self-contained HTML files)
  useEffect(() => {
    const handleEmbeddedNvd = async (event: CustomEvent) => {
      if (!event.detail || !nvRef.current) return;

      // Prevent double-loading (both bootstrap and React may dispatch the event)
      if ((window as any).__EMBEDDED_NVD_LOADED__) return;
      (window as any).__EMBEDDED_NVD_LOADED__ = true;

      console.log('Loading embedded NVD data');
      setShowUploader(false);

      // Wait for canvas to be ready
      let retries = 0;
      while (!nvRef.current.canvas && retries < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      if (nvRef.current.canvas) {
        await loadNvdData(event.detail);
      }
    };

    window.addEventListener('loadEmbeddedNvd', handleEmbeddedNvd as unknown as EventListener);

    // Check if data was loaded before React mounted
    if ((window as any).__EMBEDDED_NVD_DATA__ && !(window as any).__EMBEDDED_NVD_LOADED__) {
      window.dispatchEvent(new CustomEvent('loadEmbeddedNvd', {
        detail: (window as any).__EMBEDDED_NVD_DATA__
      }));
    }

    return () => window.removeEventListener('loadEmbeddedNvd', handleEmbeddedNvd as unknown as EventListener);
  }, []);

  // Helper function to load NVD data (extracted from handleNvdFileSelect)
  const loadNvdData = async (jsonData: any) => {
    if (!nvRef.current) return;
    const nv = nvRef.current;

    // Clear React state before loading new document
    setImages([]);
    setCurrentImageIndex(null);

    console.log("loadNvdData() -- jsonData: ", jsonData);

    if (loadViaNvd) {
      // Load as NVDocument
      const document = await NVDocument.loadFromJSON(jsonData);
      await document.fetchLinkedData();
      console.log("loadNvdData() document: ", document);

      try {
        await nv.loadDocument(document);

        // Handle encoded image blobs if present
        if (
          jsonData.encodedImageBlobs &&
          jsonData.encodedImageBlobs.length > 0
        ) {
          console.log(
            "Loading encoded image blobs:",
            jsonData.encodedImageBlobs.length,
          );
          for (let i = 0; i < jsonData.encodedImageBlobs.length; i++) {
            const blob = jsonData.encodedImageBlobs[i];
            if (blob) {
              try {
                // Get corresponding image options if available
                const imageOptions = jsonData.imageOptionsArray?.[i] || {};

                // Create NVImage from base64 with proper syntax
                const nvimage = await NVImage.loadFromBase64({
                  base64: blob,
                  ...imageOptions,
                });

                // Add to document volumes
                //document.volumes.push(nvimage)
                nv.addVolume(nvimage);
                console.log(
                  `Loaded encoded image blob ${i + 1}/${jsonData.encodedImageBlobs.length}`,
                );
              } catch (error) {
                console.error(`Failed to load encoded image blob ${i}:`, error);
              }
            }
          }
        }

        syncViewerOptionsFromNiivue();
      } catch (error) {
        console.error("nv.loadDocument failed:", error);
        console.log("Current nv.volumes:", nv.volumes);
        console.log("Current nv.meshes:", nv.meshes);
        console.log("Current nv.drawBitmap:", nv.drawBitmap);
        throw error;
      }

      // Update niivue volumes with URL information from imageOptionsArray
      if (jsonData.imageOptionsArray && nv.volumes) {
        for (
          let i = 0;
          i < nv.volumes.length && i < jsonData.imageOptionsArray.length;
          i++
        ) {
          const imageOption = jsonData.imageOptionsArray[i];
          if (imageOption.url) {
            nv.volumes[i].url = imageOption.url;
          }
        }
      }
    } else {
      // Direct loading without NVDocument
      console.log("Loading directly without NVDocument");

      // Clear existing state
      while (nv.volumes.length > 0) {
        nv.removeVolumeByIndex(0);
      }
      while (nv.meshes && nv.meshes.length > 0) {
        nv.removeMesh(nv.meshes[0]);
      }
      nv.drawBitmap = null;
      nv.setDrawingEnabled(false);

      // Load volumes directly from the JSON data
      if (jsonData.imageOptionsArray && jsonData.imageOptionsArray.length > 0) {
        console.log("Loading volumes directly:", jsonData.imageOptionsArray);
        await nv.loadVolumes(jsonData.imageOptionsArray);
      }

      // Load meshes if present
      if (jsonData.meshOptionsArray && jsonData.meshOptionsArray.length > 0) {
        console.log("Loading meshes:", jsonData.meshOptionsArray);
        await nv.loadMeshes(jsonData.meshOptionsArray);
      }

      // Apply scene options if present
      nv.setDefaults();
      if (jsonData.opts) {
        console.log("Applying options:", jsonData.opts);
        nv.setDefaults(jsonData.opts);
      }
      syncViewerOptionsFromNiivue();
    }

    // Load meshes if present (NVDocument doesn't support loading meshes from URL)
    if (jsonData.meshes && jsonData.meshes.length > 0) {
      console.log("Loading meshes:", jsonData.meshes);
      await nv.loadMeshes(jsonData.meshes);
    }

    setCurrentImageIndex(0);
    updateImageDetails();
    updateSurfaceDetails();
    nv.setCrosshairColor([0, 1, 0, 0.1]);
  };

  // Add uploaded files to Niivue
  let handleFileUpload = async (files: File[]) => {
    if (!nvRef.current) return;
    const nv = nvRef.current;

    // Set the canvas to be visible first, if it's not already
    if (showUploader) {
      setShowUploader(false);
    }

    // Wait for the canvas to be rendered and attached
    let retries = 0;
    while (!nv.canvas && retries < 20) {
      console.log(
        `Waiting for canvas to be ready for file upload... attempt ${retries + 1}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      retries++;
    }

    if (!nv.canvas) {
      throw new Error("Canvas failed to initialize after 2 seconds");
    }

    // Check if any file is an NVD file
    const nvdFiles = files.filter(
      (file) =>
        file.name.toLowerCase().endsWith(".nvd") ||
        file.name.toLowerCase().endsWith(".json"),
    );

    if (nvdFiles.length > 0) {
      // Handle NVD file upload
      const nvdFile = nvdFiles[0]; // Take the first NVD file if multiple
      try {
        const text = await nvdFile.text();
        const jsonData = JSON.parse(text);
        console.log("NVD data loaded from uploaded file:", jsonData);
        await loadNvdData(jsonData);
      } catch (error) {
        console.error("Error loading uploaded NVD file:", error);
        // Fall back to regular file processing if JSON parsing fails
      }
    } else {
      // Process regular image files
      const promises = files.map(async (file) => {
        const nvimage = await NVImage.loadFromFile({
          file: file,
        });
        console.log("nv", nv);
        nv.addVolume(nvimage);
        return nvimage;
      });

      // Wait for all files to be loaded
      await Promise.all(promises);

      // Apply viewer options
      applyViewerOptions();

      // Update image details to get complete volume information
      updateImageDetails();

      if (currentImageIndex === null && files.length > 0) {
        setCurrentImageIndex(0);
      }
    }
  };

  const handleImagingFileSelect = async (file: FileItem) => {
    if (!nvRef.current) return;
    const nv = nvRef.current;

    try {
      // Set the canvas to be visible first, if it's not already
      if (showUploader) {
        setShowUploader(false);
      }

      // Wait for the canvas to be rendered and attached
      let retries = 0;
      while (!nv.canvas && retries < 20) {
        console.log(
          `Waiting for canvas to be ready for imaging file... attempt ${retries + 1}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!nv.canvas) {
        throw new Error("Canvas failed to initialize after 2 seconds");
      }

      // Create volume object
      // Strip directory path from filename
      const basename = file.filename.split("/").pop() || file.filename;
      const volume = {
        url: file.url,
        name: basename,
      };

      console.log("Adding imaging file to scene:", volume);

      // Add the volume to existing volumes instead of replacing
      await nv.addVolumeFromUrl(volume);

      // Apply viewer options
      applyViewerOptions();

      // Update image details
      updateImageDetails();

      // Set the newly added volume as current (it will be the last one)
      if (nv.volumes.length > 0) {
        setCurrentImageIndex(nv.volumes.length - 1);
      }

      // Switch to scene details tab to show controls
      //setActiveTab("sceneDetails");

      console.log("Imaging file loaded successfully");
    } catch (error) {
      console.error("Error loading imaging file:", error);
    }
  };

  const handleNvdFileSelect = async (file: FileItem) => {
    if (!nvRef.current) return;
    const nv = nvRef.current;

    try {
      // Fetch the document from the server
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      console.log("json data returned from server:");
      console.log(jsonData);

      // Set the canvas to be visible, instead of the uploader box
      setShowUploader(false);

      // Wait for the canvas to be rendered and attached
      // This is necessary when loading the first document
      let retries = 0;
      while (!nv.canvas && retries < 20) {
        console.log(`Waiting for canvas to be ready... attempt ${retries + 1}`);
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!nv.canvas) {
        throw new Error("Canvas failed to initialize after 2 seconds");
      }

      // Use the shared NVD loading logic
      await loadNvdData(jsonData);

      // Switch to scene details tab to show controls
      //setActiveTab("sceneDetails");
    } catch (error) {
      console.error("Error loading NVD:", error);
    }
  };

  const updateImageDetails = () => {
    const nv = nvRef.current;
    if (nv) {
      const loadedImages = nv.volumes.map((vol, index) => {
        // NiiVue issue: global_min/global_max are calculated from only frame 0,
        // not all frames. For 4D volumes, use 150000 as max fornow.
        // See: https://github.com/niivue/niivue/issues/1521
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

      // Update footer with current crosshair position
      if (nv.scene && nv.scene.crosshairPos) {
        handleLocationChange({ mm: nv.scene.crosshairPos });
      }
    } else {
      console.log("updateImageDetails(): nvRef is ", nvRef);
    }
  };

  const toggleImageVisibility = (id: string) => {
    setImages(
      images.map((img) => {
        if (img.id === id) {
          const newVisible = !img.visible;
          // handle edge case where right drag occurs while vol is invisible
          const newOpacity = img.opacity === 0 ? 1.0 : img.opacity;
          // Update the Niivue volume opacity
          if (nvRef.current) {
            const volumeIndex = nvRef.current.getVolumeIndexByID(id);
            if (volumeIndex >= 0) {
              nvRef.current.setOpacity(
                volumeIndex,
                newVisible ? newOpacity : 0,
              );
            }
          }

          return { ...img, visible: newVisible };
        }
        return img;
      }),
    );

    // Trigger Niivue to update the canvas
    if (nvRef.current) {
      nvRef.current.updateGLVolume();
    }
  };

  // Surface-related functions
  const updateSurfaceDetails = () => {
    const nv = nvRef.current;
    if (nv && nv.meshes) {
      const loadedSurfaces = nv.meshes.map((mesh, index) => {
        // Use mesh name, or fallback to a default
        const name = mesh.name || `Surface ${index + 1}`;
        // Default to yellow color and Crosscut shader if not specified
        const rgba255 = mesh.rgba255 || new Uint8Array([255, 255, 0, 255]);
        return {
          id: mesh.id,
          name: name,
          visible: mesh.visible !== false,
          opacity: mesh.opacity ?? 1.0,
          rgba255: [rgba255[0], rgba255[1], rgba255[2], rgba255[3]] as [number, number, number, number],
          meshShaderIndex: mesh.meshShaderIndex ?? 14, // Default to Crosscut
        };
      });
      setSurfaces(loadedSurfaces);
      console.log("updateSurfaceDetails() loadedSurfaces:", loadedSurfaces);

      // Select first surface if none selected and surfaces exist
      if (currentSurfaceIndex === null && loadedSurfaces.length > 0) {
        setCurrentSurfaceIndex(0);
      }
    }
  };

  const toggleSurfaceVisibility = (id: string) => {
    setSurfaces(
      surfaces.map((surf, index) => {
        if (surf.id === id) {
          const newVisible = !surf.visible;
          if (nvRef.current) {
            // Use mesh index for setMeshProperty
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
  };

  const removeSurface = useCallback(
    (surfaceIndex: number) => {
      if (nvRef.current && surfaces[surfaceIndex]) {
        const mesh = nvRef.current.meshes[surfaceIndex];
        if (mesh) {
          nvRef.current.removeMesh(mesh);
          updateSurfaceDetails();

          // Adjust current selection if needed
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
    [surfaces, currentSurfaceIndex],
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
    [skipRemoveConfirmation, removeSurface],
  );

  const handleSurfaceOpacityChange = useCallback(
    (newOpacity: number) => {
      if (
        currentSurfaceIndex !== null &&
        nvRef.current &&
        surfaces[currentSurfaceIndex]
      ) {
        // Use mesh index for setMeshProperty
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
    [currentSurfaceIndex, surfaces, debouncedGLUpdate],
  );

  const handleSurfaceColorChange = useCallback(
    (hexColor: string) => {
      if (
        currentSurfaceIndex !== null &&
        nvRef.current &&
        surfaces[currentSurfaceIndex]
      ) {
        // Convert hex to rgba255
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        // Update React state immediately for responsive UI
        setSurfaces((prevSurfaces) =>
          prevSurfaces.map((surf, index) =>
            index === currentSurfaceIndex
              ? { ...surf, rgba255: [r, g, b, 255] as [number, number, number, number] }
              : surf,
          ),
        );

        // Debounce the NiiVue update to prevent lag
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
        }, 50); // 50ms debounce for color changes
      }
    },
    [currentSurfaceIndex, surfaces],
  );

  const handleMeshShaderChange = useCallback(
    (shaderName: string) => {
      if (
        currentSurfaceIndex !== null &&
        nvRef.current &&
        surfaces[currentSurfaceIndex]
      ) {
        // Use mesh index for setMeshShader
        nvRef.current.setMeshShader(currentSurfaceIndex, shaderName);

        // Get the shader index after setting
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
    [currentSurfaceIndex, surfaces, debouncedGLUpdate],
  );

  // Get mesh shader name from index
  const getMeshShaderName = (index: number): string => {
    if (!nvRef.current) return "Phong";
    const shaderNames = nvRef.current.meshShaderNames(false); // unsorted
    return shaderNames[index] || "Phong";
  };


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

          // Update the images state to reflect the new opacity
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
    [currentImageIndex],
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

        // Update the images state to reflect the new frame
        setImages((prevImages) =>
          prevImages.map((img, index) =>
            index === currentImageIndex
              ? { ...img, frame4D: newFrame }
              : img,
          ),
        );
      }
    },
    [currentImageIndex, images],
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

          // Update the images state to reflect the new contrast min
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
    [currentImageIndex],
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

          // Update the images state to reflect the new contrast max
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
    [currentImageIndex],
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

          // Skip if colormap hasn't actually changed
          if (currentVolume.colormap === newColormap) {
            return;
          }

          // Set colormap on the volume (this is the expensive part)
          currentVolume.colormap = newColormap;

          // Update only the specific image in React state
          setImages((prevImages) =>
            prevImages.map((img, index) =>
              index === currentImageIndex
                ? { ...img, colormap: newColormap }
                : img,
            ),
          );

          // Use debounced GL update
          debouncedGLUpdate();
        }
      }
    },
    [currentImageIndex],
  );

  const handleAddMoreFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSaveScene = useCallback((isDownload: boolean = false) => {
    if (nvRef.current) {
      // Create volume save states based on current volumes
      const volumeStates = nvRef.current.volumes.map((volume) => {
        const isExternal = !!(volume.url && volume.url.startsWith("http"));
        return {
          enabled: !isExternal, // Enable by default if not external
          isExternal,
          url: isDownload ? volume.name || "" : volume.url || "",
        };
      });

      // Reset save state with new data
      setSaveState({
        isDownloadMode: isDownload,
        document: {
          enabled: false,
          location: "",
        },
        volumes: volumeStates,
      });

      setSaveDialogOpen(true);
    }
  }, []);

  const handleConfirmSave = useCallback(async () => {
    console.log("Saving scene to:", saveState.document.location);

    if (!nvRef.current) return;

    if (saveState.isDownloadMode) {
      // Download mode
      if (saveState.document.enabled && saveState.document.location.trim()) {
        // Generate JSON with embedded images for download
        const jsonData = nvRef.current.document.json(true, false); // embed images but not drawing

        // Remove URL element from the jsonData until fixed in NiiVue
        if (jsonData.imageOptionsArray && nvRef.current.volumes) {
          for (
            let i = 0;
            i < jsonData.imageOptionsArray.length &&
            i < nvRef.current.volumes.length;
            i++
          ) {
            jsonData.imageOptionsArray[i].url = "";
          }
        }

        // Download the Niivue document
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = saveState.document.location.endsWith(".nvd")
          ? saveState.document.location
          : `${saveState.document.location}.nvd`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      // Download enabled volumes
      for (let index = 0; index < saveState.volumes.length; index++) {
        const volumeState = saveState.volumes[index];
        if (
          volumeState.enabled &&
          nvRef.current &&
          nvRef.current.volumes[index]
        ) {
          const volume = nvRef.current.volumes[index];
          const filename = volumeState.url || `volume_${index + 1}.nii.gz`;

          try {
            // Convert volume to Uint8Array
            const uint8Array = await volume.saveToUint8Array(
              filename.endsWith(".nii.gz") ? filename : `${filename}.nii.gz`,
            );

            // Create blob and download
            const blob = new Blob([uint8Array], {
              type: "application/octet-stream",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename.endsWith(".nii.gz")
              ? filename
              : `${filename}.nii.gz`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } catch (error) {
            console.error(`Error downloading volume ${index}:`, error);
          }
        }
      }
    } else {
      // Save to backend mode
      // DEBUG **** DELETE
      console.log(
        "handleConfirmSave() -- nvRef.current.document:",
        nvRef.current.document,
      );
      if (saveState.document.enabled && saveState.document.location.trim()) {
        try {
          // Generate JSON without embedded images for backend save
          //const originalDrawBitmap = nvRef.current.document.drawBitmap
          //nvRef.current.document.drawBitmap = null

          // no embedded images; no bitmap
          const jsonData = nvRef.current.document.json(false, false);
          //const jsonData = nvRef.current.document.json(false) // no embedded images
          //console.log("handleConfirmSave() -- jsonData: ", structuredClone(jsonData))
          //console.log("handleConfirmSave() -- jsonData.imageOptionsArray[0].name ", jsonData.imageOptionsArray[0].name)
          // Patch name and URL from niivue volumes into imageOptionsArray
          // niivue should do this?
          /*
          if (jsonData.imageOptionsArray && nvRef.current.volumes) {
            for (let i = 0; i < jsonData.imageOptionsArray.length && i < nvRef.current.volumes.length; i++) {
              const volume = nvRef.current.volumes[i]
              if (volume.name) {
                console.log("handleConfirmSave() -- jsonData.imageOptionsArray[i].name before patch: ", jsonData.imageOptionsArray[i].name)
                jsonData.imageOptionsArray[i].name = volume.name
                console.log("handleConfirmSave() -- jsonData.imageOptionsArray[i].name after patch: ", jsonData.imageOptionsArray[i].name)
              }
              if (volume.url) {
                jsonData.imageOptionsArray[i].url = volume.url
              }
            }
          }
          */

          // Update JSON with final URLs only for enabled volumes
          const finalJsonData = { ...jsonData };
          finalJsonData.imageOptionsArray = finalJsonData.imageOptionsArray.map(
            (imageOption: any, index: number) => {
              const volumeState = saveState.volumes[index];
              if (volumeState?.enabled && volumeState.url.trim() !== "") {
                return { ...imageOption, url: volumeState.url };
              }
              return imageOption; // Keep original URL if not enabled or no custom URL
            },
          );

          // Restore the original drawBitmap
          //nvRef.current.document.drawBitmap = originalDrawBitmap

          // Save scene JSON to backend
          const response = await fetch("/nvd", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filename: saveState.document.location,
              data: finalJsonData,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to save scene: ${response.statusText}`);
          }

          const result = await response.json();
          console.log("Scene saved successfully:", result);
        } catch (error) {
          console.error("Error saving scene:", error);
          // TODO: Show error message to user
        }
      }

      // Save enabled volumes to backend
      const volumeSavePromises = saveState.volumes.map(
        async (volumeState, index) => {
          if (
            volumeState.enabled &&
            nvRef.current &&
            nvRef.current.volumes[index]
          ) {
            const volume = nvRef.current.volumes[index];

            // Skip if no URL specified
            if (!volumeState.url || volumeState.url.trim() === "") {
              console.log(`Skipping volume ${index}: no URL specified`);
              return;
            }

            try {
              // Convert volume to base64 with compression if filename ends with .gz
              const shouldCompress = volumeState.url
                .toLowerCase()
                .endsWith(".gz");
              const filename = shouldCompress
                ? volumeState.url
                : volumeState.url + ".gz";
              const uint8Array = await volume.saveToUint8Array(filename);
              const base64Data = uint8ArrayToBase64(uint8Array);

              // Save volume to backend
              const volumeResponse = await fetch("/nii", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  filename: volumeState.url,
                  data: base64Data,
                }),
              });

              if (!volumeResponse.ok) {
                throw new Error(
                  `Failed to save volume ${index}: ${volumeResponse.statusText}`,
                );
              }

              const volumeResult = await volumeResponse.json();
              console.log(`Volume ${index} saved successfully:`, volumeResult);
            } catch (error) {
              console.error(`Error saving volume ${index}:`, error);
              // TODO: Show error message to user
            }
          }
        },
      );

      // Wait for all volume saves to complete
      await Promise.all(volumeSavePromises);

      // TODO: Show success message to user
    }

    // Close dialog and reset
    setSaveDialogOpen(false);
    setSaveState({
      isDownloadMode: false,
      document: {
        enabled: false,
        location: "",
      },
      volumes: [],
    });
  }, [saveState]);

  const handleCancelSave = useCallback(() => {
    setSaveDialogOpen(false);
    setSaveState({
      isDownloadMode: false,
      document: {
        enabled: false,
        location: "",
      },
      volumes: [],
    });
  }, []);

  const handleVolumeUrlChange = useCallback((index: number, url: string) => {
    setSaveState((prev) => ({
      ...prev,
      volumes: prev.volumes.map((state, i) =>
        i === index ? { ...state, url } : state,
      ),
    }));
  }, []);

  const handleVolumeCheckboxChange = useCallback(
    (index: number, enabled: boolean) => {
      setSaveState((prev) => ({
        ...prev,
        volumes: prev.volumes.map((state, i) => {
          if (i === index) {
            // Clear URL when checkbox is checked for external URLs
            if (enabled && state.isExternal) {
              return { ...state, enabled, url: "" };
            }
            return { ...state, enabled };
          }
          return state;
        }),
      }));
    },
    [],
  );

  const handleDocumentLocationChange = useCallback((location: string) => {
    setSaveState((prev) => ({
      ...prev,
      document: {
        ...prev.document,
        location,
      },
    }));
  }, []);

  const handleDocumentCheckboxChange = useCallback((enabled: boolean) => {
    setSaveState((prev) => ({
      ...prev,
      document: {
        ...prev.document,
        enabled,
      },
    }));
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        handleFileUpload(files);
      }
      // Clear the input value so the same file can be selected again
      e.target.value = "";
    },
    [],
  );

  const handleAddSurfaceFiles = useCallback(() => {
    surfaceFileInputRef.current?.click();
  }, []);

  const handleSurfaceFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0 && nvRef.current) {
        const nv = nvRef.current;
        const files = Array.from(e.target.files);

        // Ensure canvas is ready
        if (showUploader) {
          setShowUploader(false);
        }

        let retries = 0;
        while (!nv.canvas && retries < 20) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }

        if (!nv.canvas) {
          console.error("Canvas failed to initialize for surface upload");
          return;
        }

        // Load surface files (use addMeshesFromUrl to append, not replace)
        const meshOptionsList = files.map((file) => ({
          url: URL.createObjectURL(file),
          name: file.name,
          rgba255: [255, 255, 0, 255] as [number, number, number, number],
          meshShaderIndex: 14, // Crosscut shader
        }));

        try {
          await nv.addMeshesFromUrl(meshOptionsList);
          nv.updateGLVolume();
        } catch (error) {
          console.error("Error loading surface files:", error);
        }

        updateSurfaceDetails();

        // Select the first newly loaded surface if none selected
        if (currentSurfaceIndex === null && nv.meshes.length > 0) {
          setCurrentSurfaceIndex(nv.meshes.length - files.length);
        }
      }
      // Clear the input value so the same file can be selected again
      e.target.value = "";
    },
    [showUploader, currentSurfaceIndex],
  );

  const removeVolume = useCallback(
    (imageIndex: number) => {
      if (nvRef.current && images[imageIndex]) {
        const imageId = images[imageIndex].id;
        const volumeIndex = nvRef.current.getVolumeIndexByID(imageId);

        if (volumeIndex >= 0) {
          // Remove the volume from NiiVue
          nvRef.current.removeVolumeByIndex(volumeIndex);

          // Update React state
          updateImageDetails();

          // Adjust current selection if needed
          if (currentImageIndex === imageIndex) {
            // If we removed the selected volume, select the previous one or null
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
            // Shift selection index down if a volume before it was removed
            setCurrentImageIndex(currentImageIndex - 1);
          }
        }
      }
    },
    [images, currentImageIndex],
  );

  const handleRemoveVolumeClick = useCallback(
    (imageIndex: number) => {
      if (skipRemoveConfirmation) {
        // Remove immediately without confirmation
        removeVolume(imageIndex);
      } else {
        // Show confirmation dialog
        setVolumeToRemove(imageIndex);
        setRemoveDialogOpen(true);
      }
    },
    [skipRemoveConfirmation, removeVolume],
  );

  const handleEditVolume = useCallback(
    async (imageIndex: number) => {
      if (!nvRef.current || !images[imageIndex]) return;

      const nv = nvRef.current;
      const imageId = images[imageIndex].id;
      const volumeIndex = nv.getVolumeIndexByID(imageId);

      if (volumeIndex < 0) return;

      try {
        // Save the current volume as drawing-compatible NIfTI data
        const volumeData = (await nv.saveImage({
          filename: "", // Empty filename returns binary data
          isSaveDrawing: false,
          volumeByIndex: volumeIndex,
        })) as Uint8Array;

        // Get the volume name and colormap for the drawing
        const volumeName = images[imageIndex].name;
        //const volumeColormap = nv.volumes[volumeIndex].colormap;

        // Convert the volume data to an NVImage
        const drawingImage = await nv.niftiArray2NVImage(volumeData);
        //console.log(drawingImage);

        // Remove the volume from NiiVue
        nv.removeVolumeByIndex(volumeIndex);

        // Update React state to remove the volume
        updateImageDetails();

        // Ensure we have a background volume after removal
        if (nv.volumes.length > 0 && !nv.back) {
          console.log("Setting background to first remaining volume");
          nv.setVolume(nv.volumes[0], 0);
        }

        // Adjust current selection if needed
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

        // Load the volume data as a drawing
        const loadSuccess = nv.loadDrawing(drawingImage);
        if (!loadSuccess) {
          console.error(
            "Failed to load drawing - dimensions may be incompatible",
          );
        }

        // Update drawing state
        setDrawingOptions((prev) => ({
          ...prev,
          enabled: true,
          mode: "none",
          //colormap: volumeColormap,
          filename: volumeName.endsWith(".nii.gz")
            ? volumeName
            : `${volumeName}.nii.gz`,
        }));

        // We keep drawingEnabled set to false, because we want the default
        // draw mode to be "none"
        nv.setDrawingEnabled(false);
        nv.setPenValue(drawingOptions.penValue, drawingOptions.penFill);
        nv.drawFillOverwrites = drawingOptions.penFill;
        //nv.setDrawColormap(volumeColormap);

        // Switch to drawing tab
        setActiveTab("drawing");
      } catch (error) {
        console.error("Error converting volume to drawing:", error);
      }
    },
    [images, currentImageIndex, drawingOptions],
  );

  // Helper function to check if a volume can be edited
  const canEditVolume = useCallback(
    (imageIndex: number): boolean => {
      if (!nvRef.current || !images[imageIndex]) return false;

      const nv = nvRef.current;
      const imageId = images[imageIndex].id;
      const volumeIndex = nv.getVolumeIndexByID(imageId);

      if (volumeIndex < 0) return false;

      const volume = nv.volumes[volumeIndex];
      const background = nv.back;

      // Can't edit if there's no background
      if (!background) return false;

      // Can't edit the background itself
      if (volume === background) return false;

      // Check if dimensions match
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

      // Check if affine matrices match
      if (!volume.hdr.affine || !background.hdr.affine) return false;

      const volAffine = volume.hdr.affine;
      const backAffine = background.hdr.affine;

      // Compare affine matrices (4x4)
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
    [images],
  );

  const handleConfirmRemove = useCallback(() => {
    if (volumeToRemove !== null) {
      removeVolume(volumeToRemove);
    }
    if (surfaceToRemove !== null) {
      removeSurface(surfaceToRemove);
    }

    // Close dialog and reset state
    setRemoveDialogOpen(false);
    setVolumeToRemove(null);
    setSurfaceToRemove(null);
  }, [volumeToRemove, removeVolume, surfaceToRemove, removeSurface]);

  const handleCancelRemove = useCallback(() => {
    setRemoveDialogOpen(false);
    setVolumeToRemove(null);
    setSurfaceToRemove(null);
  }, []);

  // Drawing event handlers
  const handleCreateDrawingLayer = useCallback(() => {
    if (nvRef.current) {
      // We keep setDrawingEnabled set to false, because we want the default
      // draw mode to be "none"
      nvRef.current.setDrawingEnabled(false);

      // Set initial drawing properties
      const penValue = drawingOptions.penErases ? 0 : drawingOptions.penValue;
      nvRef.current.setPenValue(penValue, drawingOptions.penFill);
      nvRef.current.setDrawOpacity(drawingOptions.opacity);

      setDrawingOptions((prev) => ({ ...prev, enabled: true, mode: "none" }));
      setActiveTab("drawing"); // Switch to drawing tab when drawing is enabled
    }
  }, [drawingOptions]);

  // Not actually used right now..
  const handleDrawingColormapChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newColormap = event.target.value;
      setDrawingOptions((prev) => ({ ...prev, colormap: newColormap }));
      // Apply the colormap to the drawing layer if one exists
      if (nvRef.current && nvRef.current.drawBitmap) {
        // Set drawing colormap on niivue
        nvRef.current.setDrawColormap(newColormap);
        nvRef.current.updateGLVolume();
      }
    },
    [],
  );

  const handleDrawModeChange = useCallback(
    (mode: "none" | "pen" | "wand") => {
      console.log("handleDrawModeChange() ", mode);
      setDrawingOptions((prev) => ({
        ...prev,
        mode,
        // Set pen erases to false when magic wand is selected
        penErases: mode === "wand" ? false : prev.penErases,
      }));
      if (nvRef.current) {
        if (mode === "pen") {
          const penValue = drawingOptions.penErases
            ? 0
            : drawingOptions.penValue;
          nvRef.current.setPenValue(penValue, drawingOptions.penFill);
          nvRef.current.setDrawingEnabled(true);
          // Disable click-to-segment for pen mode
          nvRef.current.opts.clickToSegment = false;
        } else if (mode === "wand") {
          nvRef.current.setDrawingEnabled(true);
          // Enable click-to-segment for magic wand
          nvRef.current.opts.clickToSegment = true;
          nvRef.current.opts.clickToSegmentIs2D =
            drawingOptions.magicWand2dOnly;
          nvRef.current.opts.clickToSegmentAutoIntensity = true;
          nvRef.current.opts.clickToSegmentMaxDistanceMM =
            drawingOptions.magicWandMaxDistanceMM;
          nvRef.current.opts.clickToSegmentPercent =
            drawingOptions.magicWandThresholdPercent;
          const penValue = drawingOptions.penValue; // Force pen erases to false for wand
          nvRef.current.setPenValue(penValue, false); // Magic wand doesn't use fill
        } else if (mode === "none") {
          nvRef.current.setDrawingEnabled(false);
          nvRef.current.opts.clickToSegment = false;
        }
      }
    },
    [drawingOptions],
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
    [drawingOptions],
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
    [drawingOptions],
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
    [drawingOptions],
  );

  const handleDrawingOpacityChange = useCallback((opacity: number) => {
    setDrawingOptions((prev) => ({ ...prev, opacity }));
    if (nvRef.current) {
      nvRef.current.setDrawOpacity(opacity);
      debouncedGLUpdate();
    }
  }, []);

  const handleMagicWand2dOnlyChange = useCallback(
    (checked: boolean) => {
      setDrawingOptions((prev) => ({ ...prev, magicWand2dOnly: checked }));
      if (nvRef.current && drawingOptions.mode === "wand") {
        nvRef.current.opts.clickToSegmentIs2D = checked;
      }
    },
    [drawingOptions.mode],
  );

  const handleMagicWandMaxDistanceChange = useCallback(
    (value: number) => {
      setDrawingOptions((prev) => ({ ...prev, magicWandMaxDistanceMM: value }));
      if (nvRef.current && drawingOptions.mode === "wand") {
        nvRef.current.opts.clickToSegmentMaxDistanceMM = value;
      }
    },
    [drawingOptions.mode],
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
    [drawingOptions.mode],
  );

  const handleDrawUndo = useCallback(() => {
    if (nvRef.current) {
      nvRef.current.drawUndo();
    }
  }, []);

  const handleSaveDrawing = useCallback(async () => {
    if (nvRef.current && nvRef.current.drawBitmap) {
      try {
        // Check if there are any volumes loaded - drawing needs a reference volume
        if (nvRef.current.volumes.length === 0) {
          console.error("No reference volume loaded - cannot save drawing");
          return;
        }

        // Save the drawing as binary data without triggering download
        const drawingData = (await nvRef.current.saveImage({
          filename: "", // Empty filename returns binary data instead of downloading
          isSaveDrawing: true,
          volumeByIndex: 0, // Default to first volume
        })) as Uint8Array;

        // Create a File from the binary data using the filename from state
        const drawingFile = new File([drawingData], drawingOptions.filename, {
          type: "application/octet-stream",
        });

        // Explicitly disable drawing mode in NiiVue
        nvRef.current.setDrawingEnabled(false);
        nvRef.current.setPenValue(0, false); // Ensure pen is set to 0 (no drawing)
        // we also explicitly set clickToSegment to false so that scroll mouse behavior is not affected
        nvRef.current.opts.clickToSegment = false;

        // Close the drawing layer (this clears the drawing bitmap)
        nvRef.current.closeDrawing();

        // Load the drawing as a regular volume
        const nvimage = await NVImage.loadFromFile({
          file: drawingFile,
          name: drawingOptions.filename,
        });

        // Apply the drawing colormap
        nvimage.colormap = "red";
        nvimage.opacity = 1.0;

        // Add the drawing as a regular volume
        nvRef.current.addVolume(nvimage);

        // Disable drawing mode in our state
        setDrawingOptions((prev) => ({
          ...prev,
          enabled: false,
          mode: "none",
        }));

        // Switch back to scene details tab
        setActiveTab("sceneDetails");

        // Update image details to reflect the new volume
        updateImageDetails();
      } catch (error) {
        console.error("Error saving drawing:", error);
      }
    }
  }, [drawingOptions]);

  // Apply dark mode class to document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center">
            <Brain className="h-6 w-6 mr-2" />
            <a href="https://github.com/freesurfer/freebrowse" target="_blank" rel="noopener noreferrer">FreeBrowse {__APP_VERSION__}</a>
          </h1>
          <div className="bg-background p-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 border border-border rounded-md px-3 py-1">
                <span className="text-sm font-medium">View:</span>
                <ViewSelector
                  currentView={viewerOptions.viewMode}
                  onViewChange={handleViewMode}
                />
              </div>
              <div className="flex items-center gap-2 border border-border rounded-md px-3 py-1">
                <span className="text-sm font-medium">Right drag:</span>
                <DragModeSelector
                  currentMode={viewerOptions.dragMode}
                  onModeChange={(mode) =>
                    setViewerOptions((prev) => ({ ...prev, dragMode: mode }))
                  }
                  availableModes={["contrast", "pan"]}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/*
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLoadViaNvd(!loadViaNvd)}
            >
              <span className="ml-2 sr-only md:not-sr-only md:inline-block">
                {loadViaNvd
                  ? "Load without loadDocument()"
                  : "Load via loadDocument()"}
              </span>
            </Button>
            */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelRight className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
              <span className="ml-2 sr-only md:not-sr-only md:inline-block">
                {/*sidebarOpen ? "Hide Sidebar" : "Show Sidebar"*/}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFooterOpen(!footerOpen)}
            >
              <PanelBottom
                className={cn("h-4 w-4", !footerOpen && "rotate-180")}
              />
              <span className="ml-2 sr-only md:not-sr-only md:inline-block">
                {/*footerOpen ? "Hide Footer" : "Show Footer"*/}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className="h-8 w-8 p-0"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsDialogOpen(true)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col min-h-0">
          <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {showUploader ? (
              <div className="flex flex-1 items-center justify-center">
                <ImageUploader onUpload={handleFileUpload} />
              </div>
            ) : (
              <div className="flex flex-1">
                <ImageCanvas viewMode={viewerOptions.viewMode} nvRef={nv} />
              </div>
            )}
          </main>

          {footerOpen && (
            <footer className="border-t bg-background px-4 py-4 flex-shrink-0">
              {locationData ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-[50%_auto_1fr] gap-4 items-center text-sm">
                    <div></div>
                    <div className="text-muted-foreground font-mono whitespace-nowrap">
                      <span className="inline-block w-16">RAS</span>[
                      {locationData.mm[0].toFixed(1)},{" "}
                      {locationData.mm[1].toFixed(1)},{" "}
                      {locationData.mm[2].toFixed(1)}]
                    </div>
                    <div></div>
                  </div>
                  {locationData.voxels.map((vol, index) => (
                    <div
                      key={index}
                      className={cn(
                        "grid grid-cols-[50%_auto_1fr] gap-4 items-center text-sm px-2 py-1 rounded-sm",
                        index % 2 === 1 && "bg-accent",
                      )}
                    >
                      <div className="font-medium overflow-x-auto whitespace-nowrap">
                        {vol.name}:
                      </div>
                      <div className="text-muted-foreground font-mono whitespace-nowrap">
                        <span className="inline-block w-16">Voxel</span>[
                        {vol.voxel[0]}, {vol.voxel[1]}, {vol.voxel[2]}]
                      </div>
                      <div className="text-muted-foreground">
                        Value: {vol.value.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Load images to see coordinates
                </p>
              )}
            </footer>
          )}
        </div>

        {sidebarOpen && (
          <aside
            className={cn(
              "border-l bg-background w-80 overflow-hidden flex flex-col",
            )}
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col flex-1 min-h-0"
            >
              <TabsList className="w-full justify-start border-b rounded-none px-2 h-12 flex-shrink-0">
                {!serverlessMode && (
                  <TabsTrigger
                    value="nvds"
                    className="data-[state=active]:bg-muted"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                  </TabsTrigger>
                )}
                {!serverlessMode && (
                  <TabsTrigger
                    value="data"
                    className="data-[state=active]:bg-muted"
                  >
                    <Database className="h-4 w-4 mr-2" />
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="sceneDetails"
                  className="data-[state=active]:bg-muted"
                >
                  <Box className="h-4 w-4 mr-2" />
                </TabsTrigger>
                <TabsTrigger
                  value="surfaceDetails"
                  className="data-[state=active]:bg-muted"
                >
                  <Brain className="h-4 w-4 mr-2" />
                </TabsTrigger>
                <TabsTrigger
                  value="drawing"
                  className={cn(
                    "data-[state=active]:bg-muted",
                    !drawingOptions.enabled && "text-muted-foreground",
                  )}
                  disabled={!drawingOptions.enabled}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="nvds" className="flex-1 min-h-0 p-0">
                {!serverlessMode && (
                  <>
                    <div className="border-b px-4 py-3">
                      <h2 className="text-lg font-semibold">
                        NiiVue Documents
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Load complete scenes and visualizations
                      </p>
                    </div>
                    <ScrollArea className="h-full">
                      <div className="p-4 pb-6">
                        <FileList
                          endpoint="/nvd"
                          onFileSelect={handleNvdFileSelect}
                          emptyMessage="No niivue documents available."
                        />
                      </div>
                    </ScrollArea>
                  </>
                )}
              </TabsContent>

              <TabsContent value="data" className="flex-1 min-h-0 p-0">
                {!serverlessMode && (
                  <>
                    <div className="border-b px-4 py-3">
                      <h2 className="text-lg font-semibold">Imaging Data</h2>
                      <p className="text-sm text-muted-foreground">
                        Add individual volumes to the current scene
                      </p>
                    </div>
                    <ScrollArea className="h-full">
                      <div className="p-4 pb-6">
                        <FileList
                          endpoint="/imaging"
                          onFileSelect={handleImagingFileSelect}
                          emptyMessage="No imaging files available."
                        />
                      </div>
                    </ScrollArea>
                  </>
                )}
              </TabsContent>

              <TabsContent value="sceneDetails" className="flex-1 min-h-0 p-0">
                <div className="border-b px-4 py-3">
                  <h2 className="text-lg font-semibold">Volumetric Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage volumes and adjust properties
                  </p>
                </div>
                <div className="flex flex-col h-full">
                  <ScrollArea className="max-h-[50%] min-h-0">
                    {images.length > 0 ? (
                      <div className="grid gap-2 p-4">
                        {images.map((image, index) => (
                          <div
                            key={image.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                              currentImageIndex === index
                                ? "bg-muted"
                                : "hover:bg-muted/50",
                            )}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            <div className="flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleImageVisibility(image.id);
                                }}
                              >
                                {image.visible ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <EyeOff className="h-3 w-3 opacity-50" />
                                )}
                              </Button>
                            </div>
                            <div className="flex-1 w-0">
                              <p className="text-sm font-medium break-words">
                                {image.name}
                              </p>
                            </div>
                            <div className="flex-shrink-0 flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditVolume(index);
                                }}
                                disabled={!canEditVolume(index)}
                                title={
                                  canEditVolume(index)
                                    ? "Edit as drawing"
                                    : "Cannot edit - must match background dimensions and affine"
                                }
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveVolumeClick(index);
                                }}
                                title="Delete volume"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mb-2" />
                        <p>No images</p>
                      </div>
                    )}
                    <div className="p-2 border-t space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleAddMoreFiles}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload files
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleCreateDrawingLayer}
                        disabled={drawingOptions.enabled || images.length === 0}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Create empty drawing layer
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSaveScene(false)}
                          disabled={
                            images.length === 0 ||
                            drawingOptions.enabled ||
                            serverlessMode
                          }
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSaveScene(true)}
                          disabled={
                            images.length === 0 || drawingOptions.enabled
                          }
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                  <ScrollArea className="flex-1 min-h-0">
                    {currentImageIndex != null ? (
                      <div className="grid gap-4 p-4 pb-20">
                        {(images[currentImageIndex]?.nFrame4D || 1) > 1 && (
                          <LabeledSliderWithInput
                            label="Frame"
                            value={images[currentImageIndex]?.frame4D || 0}
                            onValueChange={handleFrameChange}
                            min={0}
                            max={(images[currentImageIndex]?.nFrame4D || 1) - 1}
                            step={1}
                          />
                        )}
                        <LabeledSliderWithInput
                          label="Opacity"
                          value={images[currentImageIndex]?.opacity || 1}
                          onValueChange={handleOpacityChange}
                          min={0}
                          max={1}
                          step={0.01}
                        />
                        <LabeledSliderWithInput
                          label="Contrast Min"
                          value={images[currentImageIndex]?.contrastMin || 0}
                          onValueChange={handleContrastMinChange}
                          min={images[currentImageIndex]?.globalMin ?? 0}
                          max={images[currentImageIndex]?.globalMax ?? 255}
                          step={0.1}
                          decimalPlaces={1}
                        />
                        <LabeledSliderWithInput
                          label="Contrast Max"
                          value={images[currentImageIndex]?.contrastMax || 100}
                          onValueChange={handleContrastMaxChange}
                          min={images[currentImageIndex]?.globalMin ?? 0}
                          max={images[currentImageIndex]?.globalMax ?? 255}
                          step={0.1}
                          decimalPlaces={1}
                        />
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Colormap
                          </Label>
                          <Select
                            value={
                              images[currentImageIndex]?.colormap || "gray"
                            }
                            onChange={handleColormapChange}
                          >
                            {nvRef.current?.colormaps().map((colormap) => (
                              <option key={colormap} value={colormap}>
                                {colormap}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground"></div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="surfaceDetails" className="flex-1 min-h-0 p-0">
                <div className="border-b px-4 py-3">
                  <h2 className="text-lg font-semibold">Surface Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage surfaces and adjust properties
                  </p>
                </div>
                <div className="flex flex-col h-full">
                  <ScrollArea className="max-h-[50%] min-h-0">
                    {surfaces.length > 0 ? (
                      <div className="grid gap-2 p-4">
                        {surfaces.map((surface, index) => (
                          <div
                            key={surface.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                              currentSurfaceIndex === index
                                ? "bg-muted"
                                : "hover:bg-muted/50",
                            )}
                            onClick={() => setCurrentSurfaceIndex(index)}
                          >
                            <div className="flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSurfaceVisibility(surface.id);
                                }}
                              >
                                {surface.visible ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <EyeOff className="h-3 w-3 opacity-50" />
                                )}
                              </Button>
                            </div>
                            <div className="flex-1 w-0">
                              <p className="text-sm font-medium break-words">
                                {surface.name}
                              </p>
                            </div>
                            <div className="flex-shrink-0 flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSurfaceClick(index);
                                }}
                                title="Delete surface"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                        <Brain className="h-8 w-8 mb-2" />
                        <p>No surfaces</p>
                      </div>
                    )}
                    <div className="p-2 border-t space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleAddSurfaceFiles}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload surfaces
                      </Button>
                    </div>
                  </ScrollArea>
                  <ScrollArea className="flex-1 min-h-0">
                    {currentSurfaceIndex != null && surfaces[currentSurfaceIndex] ? (
                      <div className="grid gap-4 p-4 pb-20">
                        <LabeledSliderWithInput
                          label="Opacity"
                          value={surfaces[currentSurfaceIndex]?.opacity || 1}
                          onValueChange={handleSurfaceOpacityChange}
                          min={0}
                          max={1}
                          step={0.01}
                        />
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={rgba255ToHex(surfaces[currentSurfaceIndex]?.rgba255 || [255, 255, 0, 255])}
                              onChange={(e) => handleSurfaceColorChange(e.target.value)}
                              className="h-9 w-16 rounded-md border border-input cursor-pointer"
                            />
                            <span className="text-sm text-muted-foreground">
                              {rgba255ToHex(surfaces[currentSurfaceIndex]?.rgba255 || [255, 255, 0, 255])}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Mesh Shader
                          </Label>
                          <Select
                            value={getMeshShaderName(surfaces[currentSurfaceIndex]?.meshShaderIndex || 0)}
                            onChange={(e) => handleMeshShaderChange(e.target.value)}
                          >
                            {nvRef.current?.meshShaderNames(true).map((shaderName) => (
                              <option key={shaderName} value={shaderName}>
                                {shaderName}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground"></div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="drawing" className="flex-1 min-h-0 p-0">
                <div className="border-b px-4 py-3">
                  <h2 className="text-lg font-semibold">Drawing Tools</h2>
                  <p className="text-sm text-muted-foreground">
                    Edit annotations
                  </p>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {drawingOptions.enabled ? (
                      <>
                        {/* Drawing Filename Input */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Filename
                          </Label>
                          <Input
                            type="text"
                            value={drawingOptions.filename}
                            onChange={(e) =>
                              setDrawingOptions((prev) => ({
                                ...prev,
                                filename: e.target.value,
                              }))
                            }
                            placeholder="Enter filename..."
                          />
                        </div>

                        {/* Drawing Opacity Slider */}
                        <LabeledSliderWithInput
                          label="Drawing Opacity"
                          value={drawingOptions.opacity}
                          onValueChange={handleDrawingOpacityChange}
                          min={0}
                          max={1}
                          step={0.01}
                        />

                        {/* Drawing Colormap Selector */}
                        {/* Commented out for now.  Need to rethink this /*
                        /*
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Drawing Colormap</Label>
                          <Select
                            value={drawingOptions.colormap}
                            onChange={handleDrawingColormapChange}
                          >
                            {nvRef.current?.colormaps().map((colormap) => (
                              <option key={colormap} value={colormap}>
                                {colormap}
                              </option>
                            ))}
                          </Select>
                        </div>
                        */}
                        {/* Draw Mode Selector */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Draw Mode
                          </Label>
                          <Select
                            value={drawingOptions.mode}
                            onChange={(e) =>
                              handleDrawModeChange(
                                e.target.value as "none" | "pen" | "wand",
                              )
                            }
                          >
                            <option value="none">None</option>
                            <option value="pen">Pen</option>
                            <option value="wand">Magic Wand</option>
                          </Select>
                        </div>

                        {/* Undo Button - show when pen or wand mode is selected */}
                        {(drawingOptions.mode === "pen" ||
                          drawingOptions.mode === "wand") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={handleDrawUndo}
                          >
                            <Undo className="mr-2 h-4 w-4" />
                            Undo
                          </Button>
                        )}

                        {/* Pen-related controls - show when pen or wand mode is selected */}
                        {(drawingOptions.mode === "pen" ||
                          drawingOptions.mode === "wand") && (
                          <>
                            {/* Pen Fill Checkbox - only show for pen mode */}
                            {drawingOptions.mode === "pen" && (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="pen-fill"
                                  checked={drawingOptions.penFill}
                                  onCheckedChange={handlePenFillChange}
                                />
                                <Label
                                  htmlFor="pen-fill"
                                  className="text-sm font-medium"
                                >
                                  Pen Fill
                                </Label>
                              </div>
                            )}

                            {/* Pen Erases Checkbox - only show for pen mode */}
                            {drawingOptions.mode === "pen" && (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="pen-erases"
                                  checked={drawingOptions.penErases}
                                  onCheckedChange={handlePenErasesChange}
                                />
                                <Label
                                  htmlFor="pen-erases"
                                  className="text-sm font-medium"
                                >
                                  Pen Erases
                                </Label>
                              </div>
                            )}

                            {/* 2D Only Checkbox - only show for wand mode */}
                            {drawingOptions.mode === "wand" && (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="magic-wand-2d-only"
                                  checked={drawingOptions.magicWand2dOnly}
                                  onCheckedChange={handleMagicWand2dOnlyChange}
                                />
                                <Label
                                  htmlFor="magic-wand-2d-only"
                                  className="text-sm font-medium"
                                >
                                  2D Only
                                </Label>
                              </div>
                            )}

                            {/* Magic Wand Max Distance - only show for wand mode */}
                            {drawingOptions.mode === "wand" && (
                              <LabeledSliderWithInput
                                label="Max Distance (mm)"
                                value={drawingOptions.magicWandMaxDistanceMM}
                                onValueChange={handleMagicWandMaxDistanceChange}
                                min={2}
                                max={500}
                                step={1}
                              />
                            )}

                            {/* Magic Wand Threshold Percentage - only show for wand mode */}
                            {drawingOptions.mode === "wand" && (
                              <LabeledSliderWithInput
                                label="Threshold Percentage"
                                value={drawingOptions.magicWandThresholdPercent}
                                onValueChange={handleMagicWandThresholdChange}
                                min={0.0}
                                max={1.0}
                                step={0.01}
                              />
                            )}

                            {/* Pen Value Slider */}
                            <LabeledSliderWithInput
                              label="Pen Value"
                              value={drawingOptions.penValue}
                              onValueChange={handlePenValueChange}
                              min={1}
                              max={255}
                              step={1}
                              disabled={drawingOptions.penErases}
                            />
                          </>
                        )}

                        {/* Save Drawing Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleSaveDrawing}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Drawing
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                        <Pencil className="h-8 w-8 mb-2" />
                        <p>No drawing layer active</p>
                        <p className="text-xs">
                          Create a drawing layer to access drawing tools
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </aside>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={surfaceFileInputRef}
        onChange={handleSurfaceFileChange}
        multiple
        className="hidden"
      />

      {/* Remove Volume/Surface Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent onClose={handleCancelRemove}>
          <DialogHeader>
            <DialogTitle>
              {surfaceToRemove !== null ? "Remove Surface" : "Remove Volume"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this {surfaceToRemove !== null ? "surface" : "volume"}?
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="dont-ask-again"
              checked={skipRemoveConfirmation}
              onCheckedChange={(checked) =>
                setSkipRemoveConfirmation(checked === true)
              }
            />
            <Label htmlFor="dont-ask-again" className="text-sm">
              Don't ask me again
            </Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelRemove}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Scene Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent onClose={handleCancelSave}>
          <DialogHeader>
            <DialogTitle>
              {saveState.isDownloadMode ? "Download Scene" : "Save Scene"}
            </DialogTitle>
            <DialogDescription>
              {saveState.isDownloadMode
                ? "Select the files you want to download."
                : "Enter the location where you want to save the scene."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex items-center gap-3 p-3 border rounded-md">
              <Checkbox
                id="document-checkbox"
                checked={saveState.document.enabled}
                onCheckedChange={handleDocumentCheckboxChange}
                disabled={!saveState.document.location.trim()}
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor="document-checkbox"
                  className="text-sm font-medium"
                >
                  {saveState.isDownloadMode
                    ? "Niivue Document Name"
                    : "Niivue Document Save Location"}
                </Label>
                <Input
                  id="save-location"
                  type="text"
                  placeholder={
                    saveState.isDownloadMode
                      ? "Enter filename..."
                      : "Enter file path..."
                  }
                  value={saveState.document.location}
                  onChange={(e) => handleDocumentLocationChange(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {saveState.volumes.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-medium">
                Volumes to {saveState.isDownloadMode ? "Download" : "Save"}
              </Label>
              <div className="mt-2 space-y-4 max-h-48 overflow-y-auto">
                {saveState.volumes.map((volumeState, index) => {
                  const volume = nvRef.current?.volumes[index];
                  if (!volumeState || !volume) return null;

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-md"
                    >
                      <Checkbox
                        id={`volume-${index}`}
                        checked={volumeState.enabled}
                        onCheckedChange={(checked) =>
                          handleVolumeCheckboxChange(index, checked === true)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`volume-${index}`}
                          className="text-sm font-medium"
                        >
                          {volume.name || `Volume ${index + 1}`}
                        </Label>
                        <Input
                          type="text"
                          placeholder={
                            saveState.isDownloadMode
                              ? "Enter filename..."
                              : "Enter path..."
                          }
                          value={volumeState.url || ""}
                          onChange={(e) =>
                            handleVolumeUrlChange(index, e.target.value)
                          }
                          className="mt-1 text-xs"
                        />
                        {!saveState.isDownloadMode &&
                          volumeState.isExternal &&
                          !volumeState.enabled && (
                            <p className="text-xs text-muted-foreground mt-1">
                              External URL - check to save with custom path
                            </p>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSave}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={
                !saveState.document.enabled &&
                !saveState.volumes.some((v) => v.enabled)
              }
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent onClose={() => setSettingsDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>FreeBrowse Settings</DialogTitle>
            <DialogDescription>
              Configure the FreeBrowse viewer settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Crosshair Width</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() =>
                    handleCrosshairVisibleChange(
                      !viewerOptions.crosshairVisible,
                    )
                  }
                >
                  {viewerOptions.crosshairVisible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4 opacity-50" />
                  )}
                </Button>
              </div>
              <LabeledSliderWithInput
                label=""
                value={viewerOptions.crosshairWidth}
                onValueChange={handleCrosshairWidthChange}
                min={0.0}
                max={5}
                step={0.1}
                decimalPlaces={1}
                disabled={!viewerOptions.crosshairVisible}
              />
            </div>

            <div className="space-y-2">
              <LabeledSliderWithInput
                label="Crosshair Gap"
                value={viewerOptions.crosshairGap}
                onValueChange={handleCrosshairGapChange}
                min={0.0}
                max={10.0}
                step={0.5}
                decimalPlaces={1}
                disabled={!viewerOptions.crosshairVisible}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Crosshair Color</Label>
              <Input
                type="color"
                value={`#${Math.round(viewerOptions.crosshairColor[0] * 255)
                  .toString(16)
                  .padStart(2, "0")}${Math.round(
                  viewerOptions.crosshairColor[1] * 255,
                )
                  .toString(16)
                  .padStart(2, "0")}${Math.round(
                  viewerOptions.crosshairColor[2] * 255,
                )
                  .toString(16)
                  .padStart(2, "0")}`}
                onChange={(e) => handleCrosshairColorChange(e.target.value)}
                className="w-full h-10"
              />
            </div>
            {/*
            // PW 20251210: Ruler UI elements commented out for now.  Only shows
            //              in first panel and unclear what the scale is
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Ruler Width</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() =>
                    handleRulerVisibleChange(!viewerOptions.rulerVisible)
                  }
                >
                  {viewerOptions.rulerVisible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4 opacity-50" />
                  )}
                </Button>
              </div>
              <LabeledSliderWithInput
                label=""
                value={viewerOptions.rulerWidth}
                onValueChange={handleRulerWidthChange}
                min={0.0}
                max={10.0}
                step={0.1}
                decimalPlaces={1}
                disabled={!viewerOptions.rulerVisible}
              />
            </div>
            */}
            <div className="space-y-2">
              <LabeledSliderWithInput
                label="Overlay Outline Width"
                value={viewerOptions.overlayOutlineWidth}
                onValueChange={handleOverlayOutlineWidthChange}
                min={0.0}
                max={2.0}
                step={0.1}
                decimalPlaces={1}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="interpolate-voxels"
                checked={viewerOptions.interpolateVoxels}
                onCheckedChange={(checked) =>
                  handleInterpolateVoxelsChange(checked as boolean)
                }
              />
              <Label
                htmlFor="interpolate-voxels"
                className="text-sm font-medium"
              >
                Interpolate Voxels
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="skip-remove-confirmation"
                checked={skipRemoveConfirmation}
                onCheckedChange={(checked) =>
                  setSkipRemoveConfirmation(checked as boolean)
                }
              />
              <Label
                htmlFor="skip-remove-confirmation"
                className="text-sm font-medium"
              >
                Don't ask me to confirm removals
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
