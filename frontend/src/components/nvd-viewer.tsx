import { useState, useCallback, useEffect, useRef } from "react"
import { PanelLeft, PanelRight, PanelBottom, Send, ImageIcon, Upload, Trash2, Eye, EyeOff, Save, Settings, Edit, Pencil, FileText, Info, Brain, Database, Undo, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { LabeledSliderWithInput } from "@/components/ui/labeled-slider-with-input"
import { Select } from "@/components/ui/select"
import ViewSelector from "@/components/view-selector"
import DragModeSelector, { type DragMode } from "@/components/drag-mode-selector"
import ProcessingHistory, { type ProcessingHistoryItem } from "@/components/processing-history"
import { cn } from "@/lib/utils"
import { DocumentData, Niivue, NVDocument, NVImage, DRAG_MODE_SECONDARY, cmapper } from '@niivue/niivue'
import '../App.css'
import ImageUploader from "./image-uploader"
import ImageCanvas from "./image-canvas"
import { sliceTypeMap } from "./image-canvas"
import { ViewMode } from "./view-selector"
import { FileList, type FileItem } from "./file-list"

type ImageDetails = {
  id: string
  name: string
  visible: boolean
  colormap: string
  opacity: number
  contrastMin: number
  contrastMax: number
}

const nv = new Niivue({
  loadingText: "Drag-drop images",
  dragAndDropEnabled: true,
  textHeight: 0.02,
  backColor: [0, 0, 0, 1],
  crosshairColor: [1.0, 0.0, 0.0, 0.5],
  multiplanarForceRender: false
});

// for interactive debugging
//window.nv = nv;

export default function NvdViewer() {
  const [images, setImages] = useState<ImageDetails[]>([])
  const [showUploader, setShowUploader] = useState(true)
  const [loadViaNvd, setLoadViaNvd] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("nvds")
  const [footerOpen, setFooterOpen] = useState(true)
  const nvRef = useRef<Niivue | null>(nv)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [volumeToRemove, setVolumeToRemove] = useState<number | null>(null)
  const [skipRemoveConfirmation, setSkipRemoveConfirmation] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveLocation, setSaveLocation] = useState("")
  const [sceneJsonData, setSceneJsonData] = useState<any>(null)
  const [volumeSaveStates, setVolumeSaveStates] = useState<Array<{
    enabled: boolean
    isExternal: boolean
    url: string
  }>>([]);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [viewerOptions, setViewerOptions] = useState({
    viewMode: "ACS" as "axial" | "coronal" | "sagittal" | "ACS" | "ACSR" | "render",
    crosshairWidth: 1,
    crosshairVisible: true,
    crosshairColor: [1.0, 0.0, 0.0, 0.5] as [number, number, number, number],
    interpolateVoxels: false,
    dragMode: "contrast" as DragMode
  })
  const [locationData, setLocationData] = useState<{
    mm: [number, number, number],
    voxels: Array<{
      name: string,
      voxel: [number, number, number],
      value: number
    }>
  } | null>(null)

  // Drawing-related state
  const [drawingOptions, setDrawingOptions] = useState({
    enabled: false,
    mode: "none" as "none" | "pen" | "wand",
    penValue: 1,
    penFill: true,
    penErases: false,
    opacity: 1.0,
    magicWand2dOnly: true,
    //colormap: "gray",
    filename: "drawing.nii.gz"
  })

  // Debounced GL update to prevent excessive calls
  const debouncedGLUpdate = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    updateTimeoutRef.current = setTimeout(() => {
      if (nvRef.current) {
        nvRef.current.updateGLVolume()
      }
    }, 100) // 100ms debounce
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Update voxelData for the footer
  const handleLocationChange = useCallback((locationObject: any) => {
    if (locationObject && nvRef.current && nvRef.current.volumes.length > 0) {
      const voxelData = nvRef.current.volumes.map((volume, index) => {
        // Convert mm to voxel coordinates directly on the volume
        const voxel = volume.mm2vox(locationObject.mm)

        // Round once for getting the value
        const i = Math.round(voxel[0])
        const j = Math.round(voxel[1])
        const k = Math.round(voxel[2])

        // Get the value at this voxel
        const value = volume.getValue(i, j, k)

        return {
          name: volume.name || `Volume ${index + 1}`,
          voxel: [i, j, k] as [number, number, number],
          value: value
        }
      })

      setLocationData({
        mm: locationObject.mm,
        voxels: voxelData
      })
    }
  }, [])

  // all calls that change nv.opts should go here,
  const applyViewerOptions = useCallback(() => {
    if (nvRef.current) {
      const viewConfig = sliceTypeMap[viewerOptions.viewMode]
      console.log("applyViewerOptions() -- viewConfig: ", viewConfig)

      // Apply all options together
      nvRef.current.opts.crosshairWidth = viewerOptions.crosshairVisible ? viewerOptions.crosshairWidth : 0
      nvRef.current.setCrosshairColor(viewerOptions.crosshairColor)
      nvRef.current.setInterpolation(!viewerOptions.interpolateVoxels)
      nvRef.current.opts.dragMode = DRAG_MODE_SECONDARY[viewerOptions.dragMode]

      if (viewConfig) {
        nvRef.current.opts.multiplanarShowRender = viewConfig.showRender
        nvRef.current.setSliceType(viewConfig.sliceType)
      } else {
        nvRef.current.setSliceType(0) // Default to axial if mode is invalid
      }
    }
  }, [viewerOptions])

  // Update viewerOptions state from current niivue state
  const syncViewerOptionsFromNiivue = useCallback(() => {
    if (nvRef.current) {
      const nv = nvRef.current

      // Find the view mode from slice type
      let viewMode: typeof viewerOptions.viewMode = "ACS"
      for (const [mode, config] of Object.entries(sliceTypeMap)) {
        if (config.sliceType === nv.opts.sliceType) {
          viewMode = mode as typeof viewerOptions.viewMode
          break
        }
      }

      // Find drag mode from DRAG_MODE_SECONDARY
      let dragMode: DragMode = "contrast"
      for (const [mode, value] of Object.entries(DRAG_MODE_SECONDARY)) {
        if (value === nv.opts.dragMode) {
          dragMode = mode as DragMode
          break
        }
      }

      setViewerOptions({
        viewMode,
        crosshairWidth: nv.opts.crosshairWidth,
        crosshairVisible: nv.opts.crosshairWidth > 0,
        crosshairColor: nv.opts.crosshairColor ? [...nv.opts.crosshairColor] as [number, number, number, number] : [1.0, 0.0, 0.0, 0.5],
        interpolateVoxels: !nv.opts.isNearestInterpolation,
        dragMode
      })
    }
  }, [])

  // Set up the drag release callback
  // This can change the contrast of a volume, so update the image details accordingly
  useEffect(() => {
    if (nvRef.current) {
      nvRef.current.onDragRelease = async () => {
        // Use requestAnimationFrame to wait for the next render frame
        // otherwise values will 'lag' by one drag operation
        await new Promise(resolve => requestAnimationFrame(resolve));
        updateImageDetails();
      };

      // Set up onImageLoaded to handle drag-and-drop files
      //nvRef.current.onImageLoaded = () => {
      //  updateImageDetails();
      //  setShowUploader(false); // Hide uploader when images are loaded via drag-drop
      //};

      // Set up onLocationChange to track pointer location
      nvRef.current.onLocationChange = handleLocationChange;

      // Set up onOptsChange to consolidate all viewer option updates
      //nvRef.current.onOptsChange = applyViewerOptions;
    }
  }, [handleLocationChange, applyViewerOptions]); // Re-create callback when callbacks change

  // Enable/disable drag-and-drop based on whether images are loaded
  useEffect(() => {
    if (nvRef.current) {
      // Only enable drag-and-drop if we're showing the uploader
      // This prevents re-enabling it after images have been loaded
      nvRef.current.opts.dragAndDropEnabled = showUploader && images.length === 0;
    }
  }, [images.length, showUploader]);

  // Load NVD from URL parameter on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nvdParam = urlParams.get('nvd');

    if (nvdParam) {
      console.log('Loading NVD from URL parameter:', nvdParam);

      // Create a FileItem object from the URL parameter
      const nvdFromUrl: FileItem = {
        filename: nvdParam.split('/').pop() || nvdParam, // Extract filename from path
        url: nvdParam
      };

      // Load the NVD file
      handleNvdFileSelect(nvdFromUrl);
    }
  }, []); // Empty dependency array since this should only run once on mount

  // Add uploaded files to Niivue
  let handleFileUpload = async (files: File[]) => {
    if (!nvRef.current) return;
    const nv = nvRef.current

    // Set the canvas to be visible first, if it's not already
    if (showUploader) {
      setShowUploader(false);
    }

    // Wait for the canvas to be rendered and attached
    let retries = 0;
    while (!nv.canvas && retries < 20) {
      console.log(`Waiting for canvas to be ready for file upload... attempt ${retries + 1}`);
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }

    if (!nv.canvas) {
      throw new Error("Canvas failed to initialize after 2 seconds");
    }

    // Process all files
    const promises = files.map(async (file) => {
      const nvimage = await NVImage.loadFromFile({
        file: file,
      });
      console.log("nv", nv)
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
        console.log(`Waiting for canvas to be ready for imaging file... attempt ${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      if (!nv.canvas) {
        throw new Error("Canvas failed to initialize after 2 seconds");
      }

      // Create volume object
      // Strip directory path from filename
      const basename = file.filename.split('/').pop() || file.filename;
      const volume = {
        url: file.url,
        name: basename
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
      console.error('Error loading imaging file:', error);
    }
  }

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
      console.log("json data returned from server:")
      console.log(jsonData)

      // Set the canvas to be visible, instead of the uploader box
      setShowUploader(false);

      // Wait for the canvas to be rendered and attached
      // This is necessary when loading the first document
      let retries = 0;
      while (!nv.canvas && retries < 20) {
        console.log(`Waiting for canvas to be ready... attempt ${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      if (!nv.canvas) {
        throw new Error("Canvas failed to initialize after 2 seconds");
      }

      // Clear React state before loading new document
      setImages([]);
      setCurrentImageIndex(null);

      if (loadViaNvd) {
        const blob = new Blob([jsonData], { type: 'application/json' })

        // Load as NVDocument
        const document = await NVDocument.loadFromJSON(jsonData);
        await document.fetchLinkedData()

        try {
          // LoadDocument may override some viewer options, so set them again
          // immediatly after.  this still causes some flashing
          await nv.loadDocument(document);
          syncViewerOptionsFromNiivue();
          applyViewerOptions();
        } catch (error) {
          console.error("nv.loadDocument failed:", error);
          console.log("Current nv.volumes:", nv.volumes);
          console.log("Current nv.meshes:", nv.meshes);
          console.log("Current nv.drawBitmap:", nv.drawBitmap);
          throw error;
        }

        // Update niivue volumes with URL information from imageOptionsArray
        // This should be done by nv.loadDocument()?
        if (jsonData.imageOptionsArray && nv.volumes) {
          for (let i = 0; i < nv.volumes.length && i < jsonData.imageOptionsArray.length; i++) {
            const imageOption = jsonData.imageOptionsArray[i];
            if (imageOption.url) {
              nv.volumes[i].url = imageOption.url;
            }
          }
        }

        console.log("niivue volumes immediately after loadDocument:")
        console.log(nv.volumes)
      } else {
        // Direct loading without NVDocument
        console.log("Loading directly without NVDocument");

        // Clear existing state
        // Remove all volumes
        while (nv.volumes.length > 0) {
          nv.removeVolumeByIndex(0);
        }

        // Remove all meshes
        while (nv.meshes && nv.meshes.length > 0) {
          nv.removeMesh(nv.meshes[0]);
        }

        // Reset drawing state
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
        // first, revert the options to the defaults
        // then apply viewer options
        nv.setDefaults();
        if (jsonData.opts) {
          console.log("Applying options:", jsonData.opts);
          nv.setDefaults(jsonData.opts);
        }
        syncViewerOptionsFromNiivue();
        applyViewerOptions();

        console.log("Volumes after direct load:", nv.volumes);
      }

      setCurrentImageIndex(0);
      updateImageDetails();
      nv.setCrosshairColor([0, 1, 0, 0.1]);

      // Switch to scene details tab to show controls
      //setActiveTab("sceneDetails");

    } catch (error) {
      console.error('Error loading NVD:', error);
    }
  }

  const updateImageDetails = () => {
    const nv = nvRef.current
    if (nv) {
      const loadedImages = nv.volumes.map((vol, index) => ({
        id: vol.id,
        name: vol.name || `Volume ${index + 1}`,
        visible: vol.opacity > 0,
        colormap: vol.colormap,
        opacity: vol.opacity,
        contrastMin: vol.cal_min ?? 0,
        contrastMax: vol.cal_max ?? 100
      }));
      setImages(loadedImages);

      console.log("updateImageDetails() loadedImages:", loadedImages)

      // Update footer with current crosshair position
      if (nv.scene && nv.scene.crosshairPos) {
        handleLocationChange({ mm: nv.scene.crosshairPos });
      }
    } else {
      console.log("updateImageDetails(): nvRef is ", nvRef)
    }
  }

  const toggleImageVisibility = (id: string) => {
    setImages(images.map((img) => {
      if (img.id === id) {
        const newVisible = !img.visible;
        // handle edge case where right drag occurs while vol is invisible
        const newOpacity = img.opacity === 0? 1.0 : img.opacity
        // Update the Niivue volume opacity
        if (nvRef.current) {
          const volumeIndex = nvRef.current.getVolumeIndexByID(id);
          if (volumeIndex >= 0) {
            nvRef.current.setOpacity(volumeIndex, newVisible ? newOpacity : 0);
          }
        }

        return { ...img, visible: newVisible };
      }
      return img;
    }));

    // Trigger Niivue to update the canvas
    if (nvRef.current) {
      nvRef.current.updateGLVolume();
    }
  }

  const handleViewMode = (mode: ViewMode) => {
    setViewerOptions(prev => ({ ...prev, viewMode: mode }))
  }

  const handleOpacityChange = useCallback((newOpacity: number) => {
    if (currentImageIndex !== null && nvRef.current && images[currentImageIndex]) {
      const currentImageId = images[currentImageIndex].id;
      const volumeIndex = nvRef.current.getVolumeIndexByID(currentImageId);
      if (volumeIndex >= 0) {
        nvRef.current.setOpacity(volumeIndex, newOpacity);
        debouncedGLUpdate();

        // Update the images state to reflect the new opacity
        setImages(prevImages => prevImages.map((img, index) =>
          index === currentImageIndex ? { ...img, opacity: newOpacity } : img
        ));
      }
    }
  }, [currentImageIndex])

  const handleContrastMinChange = useCallback((newContrastMin: number) => {
    if (currentImageIndex !== null && nvRef.current && images[currentImageIndex]) {
      const currentImageId = images[currentImageIndex].id;
      const volumeIndex = nvRef.current.getVolumeIndexByID(currentImageId);
      if (volumeIndex >= 0) {
        const volume = nvRef.current.volumes[volumeIndex];
        volume.cal_min = newContrastMin;
        debouncedGLUpdate();

        // Update the images state to reflect the new contrast min
        setImages(prevImages => prevImages.map((img, index) =>
          index === currentImageIndex ? { ...img, contrastMin: newContrastMin } : img
        ));
      }
    }
  }, [currentImageIndex])

  const handleContrastMaxChange = useCallback((newContrastMax: number) => {
    if (currentImageIndex !== null && nvRef.current && images[currentImageIndex]) {
      const currentImageId = images[currentImageIndex].id;
      const volumeIndex = nvRef.current.getVolumeIndexByID(currentImageId);
      if (volumeIndex >= 0) {
        const volume = nvRef.current.volumes[volumeIndex];
        volume.cal_max = newContrastMax;
        debouncedGLUpdate();

        // Update the images state to reflect the new contrast max
        setImages(prevImages => prevImages.map((img, index) =>
          index === currentImageIndex ? { ...img, contrastMax: newContrastMax } : img
        ));
      }
    }
  }, [currentImageIndex])

  const handleColormapChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newColormap = event.target.value;
    if (currentImageIndex !== null && nvRef.current && images[currentImageIndex]) {
      const volumeIndex = nvRef.current.getVolumeIndexByID(images[currentImageIndex].id);
      if (volumeIndex >= 0 && nvRef.current.volumes[volumeIndex]) {
        const currentVolume = nvRef.current.volumes[volumeIndex];

        // Skip if colormap hasn't actually changed
        if (currentVolume.colormap === newColormap) {
          return;
        }

        // Set colormap on the volume (this is the expensive part)
        currentVolume.colormap = newColormap;

        // Update only the specific image in React state
        setImages(prevImages => prevImages.map((img, index) =>
          index === currentImageIndex ? { ...img, colormap: newColormap } : img
        ));

        // Use debounced GL update
        debouncedGLUpdate();
      }
    }
  }, [currentImageIndex])

  const handleAddMoreFiles = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleSaveScene = useCallback((saveLocally: boolean = false) => {
    if (nvRef.current) {
      // Temporarily store and clear drawBitmap to exclude it from JSON
      const originalDrawBitmap = nvRef.current.document.drawBitmap
      nvRef.current.document.drawBitmap = null

      const jsonData = nvRef.current.document.json(saveLocally) // embedImages when saving locally

      // Patch name and URL from niivue volumes into imageOptionsArray
      // nv.document.json() should do this?
      if (jsonData.imageOptionsArray && nvRef.current.volumes) {
        for (let i = 0; i < jsonData.imageOptionsArray.length && i < nvRef.current.volumes.length; i++) {
          const volume = nvRef.current.volumes[i]
          if (volume.name) {
            jsonData.imageOptionsArray[i].name = volume.name
          }
          // Only patch URL when not saving locally
          if (!saveLocally && volume.url) {
            jsonData.imageOptionsArray[i].url = volume.url
          }
        }
      }

      console.log("Scene JSON object:", jsonData)

      // Restore the original drawBitmap
      nvRef.current.document.drawBitmap = originalDrawBitmap

      if (saveLocally) {
        // Download the JSON directly to user's computer
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'scene.nvd'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Store the JSON data and show save dialog
        setSceneJsonData(jsonData)

        // Create volume save states
        const volumeStates = jsonData.imageOptionsArray.map((imageOption: any) => {
          const isExternal = !!(imageOption.url && imageOption.url.startsWith('http'))
          return {
            enabled: !isExternal, // Enable by default if not external
            isExternal,
            url: imageOption.url || ''
          }
        })
        setVolumeSaveStates(volumeStates)

        setSaveDialogOpen(true)
      }
    }
  }, [])

  const handleConfirmSave = useCallback(async () => {
    console.log("Saving scene to:", saveLocation)
    if (sceneJsonData && saveLocation.trim()) {
      try {
        // Update JSON with final URLs only for enabled volumes, otherwise keep original
        const finalJsonData = { ...sceneJsonData }
        finalJsonData.imageOptionsArray = finalJsonData.imageOptionsArray.map((imageOption: any, index: number) => {
          const saveState = volumeSaveStates[index]
          if (saveState?.enabled && saveState.url.trim() !== '') {
            return { ...imageOption, url: saveState.url }
          }
          return imageOption // Keep original URL if not enabled or no custom URL
        })

        // Save scene JSON to backend
        const response = await fetch('/nvd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: saveLocation,
            data: finalJsonData
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to save scene: ${response.statusText}`)
        }

        const result = await response.json()
        console.log("Scene saved successfully:", result)

        // Save enabled volumes to backend
        const volumeSavePromises = volumeSaveStates.map(async (saveState, index) => {
          if (saveState.enabled && nvRef.current && nvRef.current.volumes[index]) {
            const volume = nvRef.current.volumes[index]

            // Skip if no URL specified
            if (!saveState.url || saveState.url.trim() === '') {
              console.log(`Skipping volume ${index}: no URL specified`)
              return
            }

            try {
              // Convert volume to base64 with compression if filename ends with .gz
              const shouldCompress = saveState.url.toLowerCase().endsWith('.gz')
              const filename = shouldCompress ? saveState.url : saveState.url + '.gz'
              const uint8Array = await volume.saveToUint8Array(filename)
              const base64Data = uint8ArrayToBase64(uint8Array)

              // Save volume to backend
              const volumeResponse = await fetch('/nii', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  filename: saveState.url,
                  data: base64Data
                })
              })

              if (!volumeResponse.ok) {
                throw new Error(`Failed to save volume ${index}: ${volumeResponse.statusText}`)
              }

              const volumeResult = await volumeResponse.json()
              console.log(`Volume ${index} saved successfully:`, volumeResult)
            } catch (error) {
              console.error(`Error saving volume ${index}:`, error)
              // TODO: Show error message to user
            }
          }
        })

        // Wait for all volume saves to complete
        await Promise.all(volumeSavePromises)

        // TODO: Show success message to user

      } catch (error) {
        console.error("Error saving scene:", error)
        // TODO: Show error message to user
      }
    }

    // Close dialog and reset
    setSaveDialogOpen(false)
    setSaveLocation("")
    setSceneJsonData(null)
  }, [saveLocation, sceneJsonData, volumeSaveStates])

  const handleCancelSave = useCallback(() => {
    setSaveDialogOpen(false)
    setSaveLocation("")
    setSceneJsonData(null)
    setVolumeSaveStates([])
  }, [])

  const uint8ArrayToBase64 = useCallback((uint8Array: Uint8Array): string => {
    // Convert Uint8Array to base64 efficiently for large arrays
    let binaryString = ''
    const chunkSize = 8192
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize)
      binaryString += String.fromCharCode(...chunk)
    }
    return btoa(binaryString)
  }, [])

  const handleVolumeUrlChange = useCallback((index: number, url: string) => {
    setVolumeSaveStates(prev =>
      prev.map((state, i) =>
        i === index ? { ...state, url } : state
      )
    )
  }, [])

  const handleVolumeCheckboxChange = useCallback((index: number, enabled: boolean) => {
    setVolumeSaveStates(prev =>
      prev.map((state, i) => {
        if (i === index) {
          // Clear URL when checkbox is checked for external URLs
          if (enabled && state.isExternal) {
            return { ...state, enabled, url: '' }
          }
          return { ...state, enabled }
        }
        return state
      })
    )
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      handleFileUpload(files)
    }
    // Clear the input value so the same file can be selected again
    e.target.value = ''
  }, [])

  const removeVolume = useCallback((imageIndex: number) => {
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
        } else if (currentImageIndex !== null && currentImageIndex > imageIndex) {
          // Shift selection index down if a volume before it was removed
          setCurrentImageIndex(currentImageIndex - 1);
        }
      }
    }
  }, [images, currentImageIndex]);

  const handleRemoveVolumeClick = useCallback((imageIndex: number) => {
    if (skipRemoveConfirmation) {
      // Remove immediately without confirmation
      removeVolume(imageIndex);
    } else {
      // Show confirmation dialog
      setVolumeToRemove(imageIndex);
      setRemoveDialogOpen(true);
    }
  }, [skipRemoveConfirmation, removeVolume]);

  const handleEditVolume = useCallback(async (imageIndex: number) => {
    if (!nvRef.current || !images[imageIndex]) return;

    const nv = nvRef.current;
    const imageId = images[imageIndex].id;
    const volumeIndex = nv.getVolumeIndexByID(imageId);

    if (volumeIndex < 0) return;

    try {
      // Save the current volume as drawing-compatible NIfTI data
      const volumeData = await nv.saveImage({
        filename: "", // Empty filename returns binary data
        isSaveDrawing: false,
        volumeByIndex: volumeIndex
      }) as Uint8Array;

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
      } else if (currentImageIndex !== null && currentImageIndex > imageIndex) {
        setCurrentImageIndex(currentImageIndex - 1);
      }

      // Load the volume data as a drawing
      const loadSuccess = nv.loadDrawing(drawingImage);
      if (!loadSuccess) {
        console.error("Failed to load drawing - dimensions may be incompatible");
      }

      // Update drawing state
      setDrawingOptions(prev => ({
        ...prev,
        enabled: true,
        mode: "none",
        //colormap: volumeColormap,
        filename: volumeName.endsWith('.nii.gz') ? volumeName : `${volumeName}.nii.gz`
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
      console.error('Error converting volume to drawing:', error);
    }
  }, [images, currentImageIndex, drawingOptions]);

  // Helper function to check if a volume can be edited
  const canEditVolume = useCallback((imageIndex: number): boolean => {
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

    if (volDims[1] !== backDims[1] || volDims[2] !== backDims[2] || volDims[3] !== backDims[3]) {
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
  }, [images]);

  const handleConfirmRemove = useCallback(() => {
    if (volumeToRemove !== null) {
      removeVolume(volumeToRemove);
    }

    // Close dialog and reset state
    setRemoveDialogOpen(false);
    setVolumeToRemove(null);
  }, [volumeToRemove, removeVolume]);

  const handleCancelRemove = useCallback(() => {
    setRemoveDialogOpen(false);
    setVolumeToRemove(null);
  }, []);

  const handleCrosshairWidthChange = useCallback((value: number) => {
    setViewerOptions(prev => ({ ...prev, crosshairWidth: value }))
    debouncedGLUpdate() // Add this line
  }, [])

  const handleInterpolateVoxelsChange = useCallback((checked: boolean) => {
    setViewerOptions(prev => ({ ...prev, interpolateVoxels: checked }))
  }, [])

  const handleCrosshairVisibleChange = useCallback((visible: boolean) => {
    setViewerOptions(prev => ({ ...prev, crosshairVisible: visible }))
  }, [])

  const handleCrosshairColorChange = useCallback((color: string) => {
    // Convert hex color to RGBA array (0-1 range)
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255
    const a = viewerOptions.crosshairColor[3] // Keep existing alpha
    setViewerOptions(prev => ({ ...prev, crosshairColor: [r, g, b, a] as [number, number, number, number] }))
  }, [])

  // Drawing event handlers
  const handleCreateDrawingLayer = useCallback(() => {
    if (nvRef.current) {
      // We keep setDrawingEnabled set to false, because we want the default
      // draw mode to be "none"
      nvRef.current.setDrawingEnabled(false)

      // Set initial drawing properties
      const penValue = drawingOptions.penErases ? 0 : drawingOptions.penValue
      nvRef.current.setPenValue(penValue, drawingOptions.penFill)
      nvRef.current.setDrawOpacity(drawingOptions.opacity)

      setDrawingOptions(prev => ({ ...prev, enabled: true, mode: "none" }))
      setActiveTab("drawing") // Switch to drawing tab when drawing is enabled
    }
  }, [drawingOptions])

  // Not actually used right now..
  const handleDrawingColormapChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newColormap = event.target.value
    setDrawingOptions(prev => ({ ...prev, colormap: newColormap }))
    // Apply the colormap to the drawing layer if one exists
    if (nvRef.current && nvRef.current.drawBitmap) {
      // Set drawing colormap on niivue
      nvRef.current.setDrawColormap(newColormap)
      nvRef.current.updateGLVolume()
    }
  }, [])

  const handleDrawModeChange = useCallback((mode: "none" | "pen" | "wand") => {
    console.log("handleDrawModeChange() ", mode)
    setDrawingOptions(prev => ({
      ...prev,
      mode,
      // Set pen erases to false when magic wand is selected
      penErases: mode === "wand" ? false : prev.penErases
    }))
    if (nvRef.current) {
      if (mode === "pen") {
        const penValue = drawingOptions.penErases ? 0 : drawingOptions.penValue
        nvRef.current.setPenValue(penValue, drawingOptions.penFill)
        nvRef.current.setDrawingEnabled(true)
        // Disable click-to-segment for pen mode
        nvRef.current.opts.clickToSegment = false
      } else if (mode === "wand") {
        nvRef.current.setDrawingEnabled(true)
        // Enable click-to-segment for magic wand
        nvRef.current.opts.clickToSegment = true
        nvRef.current.opts.clickToSegmentIs2D = drawingOptions.magicWand2dOnly
        nvRef.current.opts.clickToSegmentAutoIntensity = true
        const penValue = drawingOptions.penValue // Force pen erases to false for wand
        nvRef.current.setPenValue(penValue, false) // Magic wand doesn't use fill
      } else if (mode === "none") {
        nvRef.current.setDrawingEnabled(false)
        nvRef.current.opts.clickToSegment = false
      }
    }
  }, [drawingOptions])

  const handlePenFillChange = useCallback((checked: boolean) => {
    setDrawingOptions(prev => ({ ...prev, penFill: checked }))
    if (nvRef.current) {
      nvRef.current.drawFillOverwrites = checked
      console.log(drawingOptions.mode)
      if (drawingOptions.mode === "pen") {
        const penValue = drawingOptions.penErases ? 0 : drawingOptions.penValue
        nvRef.current.setPenValue(penValue, checked)
      }
    }
  }, [drawingOptions])

  const handlePenErasesChange = useCallback((checked: boolean) => {
    setDrawingOptions(prev => ({ ...prev, penErases: checked }))
    if (nvRef.current) {
      if (drawingOptions.mode === "pen") {
        const penValue = checked ? 0 : drawingOptions.penValue
        nvRef.current.setPenValue(penValue, drawingOptions.penFill)
      } else if (drawingOptions.mode === "none") {
        nvRef.current.setDrawingEnabled(false)
      }
    }
  }, [drawingOptions])

  const handlePenValueChange = useCallback((value: number) => {
    setDrawingOptions(prev => ({ ...prev, penValue: value }))
    console.log("handlePenValueChange: ", value)
    if (nvRef.current && drawingOptions.mode === "pen" && !drawingOptions.penErases) {
      nvRef.current.setPenValue(value, drawingOptions.penFill)
    }
  }, [drawingOptions])

  const handleDrawingOpacityChange = useCallback((opacity: number) => {
    setDrawingOptions(prev => ({ ...prev, opacity }))
    if (nvRef.current) {
      nvRef.current.setDrawOpacity(opacity)
      debouncedGLUpdate()
    }
  }, [])

  const handleMagicWand2dOnlyChange = useCallback((checked: boolean) => {
    setDrawingOptions(prev => ({ ...prev, magicWand2dOnly: checked }))
    if (nvRef.current && drawingOptions.mode === "wand") {
      nvRef.current.opts.clickToSegmentIs2D = checked
    }
  }, [drawingOptions.mode])

  const handleDrawUndo = useCallback(() => {
    if (nvRef.current) {
      nvRef.current.drawUndo()
    }
  }, [])

  const handleSaveDrawing = useCallback(async () => {
    if (nvRef.current && nvRef.current.drawBitmap) {
      try {
        // Check if there are any volumes loaded - drawing needs a reference volume
        if (nvRef.current.volumes.length === 0) {
          console.error("No reference volume loaded - cannot save drawing")
          return
        }

        // Save the drawing as binary data without triggering download
        const drawingData = await nvRef.current.saveImage({
          filename: "", // Empty filename returns binary data instead of downloading
          isSaveDrawing: true,
          volumeByIndex: 0 // Default to first volume
        }) as Uint8Array

        // Create a File from the binary data using the filename from state
        const drawingFile = new File([drawingData], drawingOptions.filename, {
          type: "application/octet-stream"
        })

        // Close the drawing layer (this clears the drawing bitmap)
        nvRef.current.closeDrawing()

        // Explicitly disable drawing mode in NiiVue
        nvRef.current.setDrawingEnabled(false)
        nvRef.current.setPenValue(0, false) // Ensure pen is set to 0 (no drawing)

        // Load the drawing as a regular volume
        const nvimage = await NVImage.loadFromFile({
          file: drawingFile,
          name: drawingOptions.filename
        })

        // Apply the drawing colormap
        //nvimage.colormap = "red"
        nvimage.opacity = 0.7

        // Add the drawing as a regular volume
        nvRef.current.addVolume(nvimage)

        // Disable drawing mode in our state
        setDrawingOptions(prev => ({ ...prev, enabled: false, mode: "none" }))

        // Switch back to scene details tab
        setActiveTab("sceneDetails")

        // Update image details to reflect the new volume
        updateImageDetails()

      } catch (error) {
        console.error("Error saving drawing:", error)
      }
    }
  }, [drawingOptions])

  // Apply viewer options when they change
  useEffect(() => {
    applyViewerOptions()
  }, [applyViewerOptions])

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center">
            <Brain className="h-6 w-6 mr-2" />
            FreeBrowse 2.0
          </h1>
          <div className="bg-background p-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 border border-border rounded-md px-3 py-1">
                <span className="text-sm font-medium">View:</span>
                <ViewSelector currentView={viewerOptions.viewMode} onViewChange={handleViewMode} />
              </div>
              <div className="flex items-center gap-2 border border-border rounded-md px-3 py-1">
                <span className="text-sm font-medium">Right drag:</span>
                <DragModeSelector
                    currentMode={viewerOptions.dragMode}
                    onModeChange={(mode) => setViewerOptions(prev => ({ ...prev, dragMode: mode }))}
                    availableModes={["contrast", "pan"]}
                  />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLoadViaNvd(!loadViaNvd)}>
              <span className="ml-2 sr-only md:not-sr-only md:inline-block">
                {loadViaNvd ? "Load without loadDocument()" : "Load via loadDocument()"}
              </span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <PanelRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              <span className="ml-2 sr-only md:not-sr-only md:inline-block">
                {/*sidebarOpen ? "Hide Sidebar" : "Show Sidebar"*/}
              </span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFooterOpen(!footerOpen)}>
              <PanelBottom className={cn("h-4 w-4", !footerOpen && "rotate-180")} />
              <span className="ml-2 sr-only md:not-sr-only md:inline-block">
                {/*footerOpen ? "Hide Footer" : "Show Footer"*/}
              </span>
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
                <ImageCanvas viewMode={viewerOptions.viewMode} nvRef={nv}/>
              </div>
            )}
          </main>

          {footerOpen && (
            <footer className="border-t bg-background px-4 py-4 flex-shrink-0">
              {locationData ? (
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="min-w-[120px]"></span>
                    <span className="text-muted-foreground font-mono min-w-[200px]">
                      <span className="inline-block w-12">RAS</span>[{locationData.mm[0].toFixed(1)}, {locationData.mm[1].toFixed(1)}, {locationData.mm[2].toFixed(1)}]
                    </span>
                  </div>
                  {locationData.voxels.map((vol, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <span className="font-medium min-w-[120px]">{vol.name}:</span>
                      <span className="text-muted-foreground font-mono min-w-[200px]">
                        <span className="inline-block w-12">Voxel</span>[{vol.voxel[0]}, {vol.voxel[1]}, {vol.voxel[2]}]
                      </span>
                      <span className="text-muted-foreground">
                        Value: {vol.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Load images to see coordinates</p>
              )}
            </footer>
          )}
        </div>

        {sidebarOpen && (
          <aside className={cn("border-l bg-background w-80 overflow-hidden flex flex-col")}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
              <TabsList className="w-full justify-start border-b rounded-none px-2 h-12 flex-shrink-0">
                <TabsTrigger value="nvds" className="data-[state=active]:bg-muted">
                  <FileText className="h-4 w-4 mr-2" />
                </TabsTrigger>
                <TabsTrigger value="data" className="data-[state=active]:bg-muted">
                  <Database className="h-4 w-4 mr-2" />
                </TabsTrigger>
                <TabsTrigger value="sceneDetails" className="data-[state=active]:bg-muted">
                  <Info className="h-4 w-4 mr-2" />
                </TabsTrigger>
                <TabsTrigger
                  value="drawing"
                  className={cn(
                    "data-[state=active]:bg-muted",
                    !drawingOptions.enabled && "text-muted-foreground"
                  )}
                  disabled={!drawingOptions.enabled}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="nvds" className="flex-1 min-h-0 p-0">
                <div className="border-b px-4 py-3">
                  <h2 className="text-lg font-semibold">NiiVue Documents</h2>
                  <p className="text-sm text-muted-foreground">Load complete scenes and visualizations</p>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <FileList
                      endpoint="/nvd"
                      onFileSelect={handleNvdFileSelect}
                      emptyMessage="No niivue documents available."
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="data" className="flex-1 min-h-0 p-0">
                <div className="border-b px-4 py-3">
                  <h2 className="text-lg font-semibold">Imaging Data</h2>
                  <p className="text-sm text-muted-foreground">Add individual volumes to the current scene</p>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <FileList
                      endpoint="/imaging"
                      onFileSelect={handleImagingFileSelect}
                      emptyMessage="No imaging files available."
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="sceneDetails" className="flex-1 min-h-0 p-0">
                <div className="border-b px-4 py-3">
                  <h2 className="text-lg font-semibold">Scene Details</h2>
                  <p className="text-sm text-muted-foreground">Manage volumes and adjust properties</p>
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
                              currentImageIndex === index ? "bg-muted" : "hover:bg-muted/50",
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
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{image.name}</p>
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
                                title={canEditVolume(index) ? "Edit as drawing" : "Cannot edit - must match background dimensions and affine"}
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
                          disabled={images.length === 0 || drawingOptions.enabled}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Scene
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSaveScene(true)}
                          disabled={images.length === 0 || drawingOptions.enabled}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Scene
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                  <ScrollArea className="flex-1 min-h-0">
                  {currentImageIndex != null ? (
                    <div className="grid gap-4 p-4">
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
                        min={0}
                        max={255}
                        step={0.1}
                        decimalPlaces={1}
                      />
                      <LabeledSliderWithInput
                        label="Contrast Max"
                        value={images[currentImageIndex]?.contrastMax || 100}
                        onValueChange={handleContrastMaxChange}
                        min={0}
                        max={255}
                        step={0.1}
                        decimalPlaces={1}
                      />
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Colormap</Label>
                        <Select
                          value={images[currentImageIndex]?.colormap || "gray"}
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
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">

                    </div>
                  )}

                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="drawing" className="flex-1 min-h-0 p-0">
                <div className="border-b px-4 py-3">
                  <h2 className="text-lg font-semibold">Drawing Tools</h2>
                  <p className="text-sm text-muted-foreground">Edit annotations</p>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {drawingOptions.enabled ? (
                      <>
                        {/* Drawing Filename Input */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Filename</Label>
                          <Input
                            type="text"
                            value={drawingOptions.filename}
                            onChange={(e) => setDrawingOptions(prev => ({ ...prev, filename: e.target.value }))}
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
                        {
                        /* Commented out for now.  Need to rethink this /*
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
                        */
                        }
                        {/* Draw Mode Selector */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Draw Mode</Label>
                          <Select
                            value={drawingOptions.mode}
                            onChange={(e) => handleDrawModeChange(e.target.value as "none" | "pen" | "wand")}
                          >
                            <option value="none">None</option>
                            <option value="pen">Pen</option>
                            <option value="wand">Magic Wand</option>
                          </Select>
                        </div>

                        {/* Undo Button - show when pen or wand mode is selected */}
                        {(drawingOptions.mode === "pen" || drawingOptions.mode === "wand") && (
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
                        {(drawingOptions.mode === "pen" || drawingOptions.mode === "wand") && (
                          <>
                            {/* Pen Fill Checkbox - only show for pen mode */}
                            {drawingOptions.mode === "pen" && (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="pen-fill"
                                  checked={drawingOptions.penFill}
                                  onCheckedChange={handlePenFillChange}
                                />
                                <Label htmlFor="pen-fill" className="text-sm font-medium">
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
                                <Label htmlFor="pen-erases" className="text-sm font-medium">
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
                                <Label htmlFor="magic-wand-2d-only" className="text-sm font-medium">
                                  2D Only
                                </Label>
                              </div>
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
                        <p className="text-xs">Create a drawing layer to access drawing tools</p>
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

      {/* Remove Volume Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent onClose={handleCancelRemove}>
          <DialogHeader>
            <DialogTitle>Remove Volume</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this volume?
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="dont-ask-again"
              checked={skipRemoveConfirmation}
              onCheckedChange={(checked) => setSkipRemoveConfirmation(checked === true)}
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
            <DialogTitle>Save Scene</DialogTitle>
            <DialogDescription>
              Enter the location where you want to save the scene.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Label htmlFor="save-location" className="text-sm font-medium">
              Save Location
            </Label>
            <Input
              id="save-location"
              type="text"
              placeholder="Enter file path..."
              value={saveLocation}
              onChange={(e) => setSaveLocation(e.target.value)}
              className="mt-2"
            />
          </div>

          {sceneJsonData?.imageOptionsArray?.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-medium">Volumes to Save</Label>
              <div className="mt-2 space-y-4 max-h-48 overflow-y-auto">
                {sceneJsonData.imageOptionsArray.map((imageOption: any, index: number) => {
                  const saveState = volumeSaveStates[index]
                  if (!saveState) return null

                  return (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-md">
                      <Checkbox
                        id={`volume-${index}`}
                        checked={saveState.enabled}
                        onCheckedChange={(checked) => handleVolumeCheckboxChange(index, checked === true)}
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`volume-${index}`} className="text-sm font-medium">
                          {imageOption.name || `Volume ${index + 1}`}
                        </Label>
                        <Input
                          type="text"
                          placeholder="Enter path..."
                          value={saveState.url || ''}
                          onChange={(e) => handleVolumeUrlChange(index, e.target.value)}
                          className="mt-1 text-xs"
                        />
                        {saveState.isExternal && !saveState.enabled && (
                          <p className="text-xs text-muted-foreground mt-1">
                            External URL - check to save with custom path
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSave}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSave} disabled={!saveLocation.trim()}>
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
                  onClick={() => handleCrosshairVisibleChange(!viewerOptions.crosshairVisible)}
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
              <Label className="text-sm font-medium">Crosshair Color</Label>
              <Input
                type="color"
                value={`#${Math.round(viewerOptions.crosshairColor[0] * 255).toString(16).padStart(2, '0')}${Math.round(viewerOptions.crosshairColor[1] * 255).toString(16).padStart(2, '0')}${Math.round(viewerOptions.crosshairColor[2] * 255).toString(16).padStart(2, '0')}`}
                onChange={(e) => handleCrosshairColorChange(e.target.value)}
                className="w-full h-10"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="interpolate-voxels"
                checked={viewerOptions.interpolateVoxels}
                onCheckedChange={(checked) => handleInterpolateVoxelsChange(checked as boolean)}
              />
              <Label htmlFor="interpolate-voxels" className="text-sm font-medium">
                Interpolate Voxels
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="skip-remove-confirmation"
                checked={skipRemoveConfirmation}
                onCheckedChange={(checked) => setSkipRemoveConfirmation(checked as boolean)}
              />
              <Label htmlFor="skip-remove-confirmation" className="text-sm font-medium">
                Don't ask me to confirm removals
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setSettingsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
