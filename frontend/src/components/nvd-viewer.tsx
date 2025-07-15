import { useState, useCallback, useEffect, useRef, useContext } from "react"
import { PanelLeft, PanelRight, Send, ImageIcon, Upload, Trash2, Eye, EyeOff, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LabeledSliderWithInput } from "@/components/ui/labeled-slider-with-input"
import { Select } from "@/components/ui/select"
import ViewSelector from "@/components/view-selector"
import DragModeSelector, { type DragMode } from "@/components/drag-mode-selector"
import ProcessingHistory, { type ProcessingHistoryItem } from "@/components/processing-history"
import { cn } from "@/lib/utils"
import { DocumentData, Niivue, NVDocument, NVImage, DRAG_MODE_SECONDARY } from '@niivue/niivue'
import '../App.css'
import ImageUploader from "./image-uploader"
import ImageCanvas from "./image-canvas"
import { sliceTypeMap } from "./image-canvas"
import { ViewMode } from "./view-selector"
import { NvdList, NvdContext } from "./nvds"

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
  crosshairColor: [244, 243, 238, 0.5],
  multiplanarForceRender: false
});

export default function NvdViewer() {
  const [images, setImages] = useState<ImageDetails[]>([])
  const [showUploader, setShowUploader] = useState(true)
  const [loadViaNvd, setLoadViaNvd] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("nvds")
  const [viewMode, setViewMode] = useState<"axial" | "coronal" | "sagittal" | "ACS" | "ACSR" | "render">("ACS")
  const [dragMode, setDragMode] = useState<DragMode>("contrast")
  const nvRef = useRef<Niivue | null>(nv)
  const { selectedNvd, setSelectedNvd } = useContext(NvdContext)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [volumeToRemove, setVolumeToRemove] = useState<number | null>(null)
  const [skipRemoveConfirmation, setSkipRemoveConfirmation] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveLocation, setSaveLocation] = useState("")

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
      nvRef.current.onImageLoaded = () => {
        updateImageDetails();
        setShowUploader(false); // Hide uploader when images are loaded via drag-drop
      };
    }
  }, []); // Re-create callback when currentImageIndex changes

  // Enable/disable drag-and-drop based on whether images are loaded
  useEffect(() => {
    if (nvRef.current) {
      // Only enable drag-and-drop if we're showing the uploader
      // This prevents re-enabling it after images have been loaded
      nvRef.current.opts.dragAndDropEnabled = showUploader && images.length === 0;
    }
  }, [images.length, showUploader]);

  // Load NVD document when selected
  useEffect(() => {
      async function loadNvd() {
      if (!selectedNvd || !nvRef.current) return;
      const nv = nvRef.current;

      try {
        // Fetch the document from the server
        const response = await fetch(selectedNvd.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
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
            await nv.loadDocument(document);
          } catch (error) {
            console.error("nv.loadDocument failed:", error);
            // Log more details about the state when it fails
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
          nv.setDefaults();
          if (jsonData.opts) {
            console.log("Applying options:", jsonData.opts);
            nv.setDefaults(jsonData.opts);
          }

          console.log("Volumes after direct load:", nv.volumes);
        }

        // Set the selected view mode
        handleViewMode(viewMode);

        // Update the images state for the UI
        updateImageDetails();

      } catch (error) {
        console.error('Error loading NVD:', error);
      }
    }

    loadNvd();
  }, [selectedNvd])

  // Load NVD from URL parameter on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nvdParam = urlParams.get('nvd');

    if (nvdParam && !selectedNvd) {
      console.log('Loading NVD from URL parameter:', nvdParam);

      // Create an Nvd object from the URL parameter
      const nvdFromUrl = {
        filename: nvdParam.split('/').pop() || nvdParam, // Extract filename from path
        url: nvdParam
      };

      // Set selectedNvd which will trigger the existing loadNvd() useEffect
      setSelectedNvd(nvdFromUrl);

      // Since a niivue document is already loaded, set the active tab to
      // "sceneDetails"
      setActiveTab("sceneDetails")
    }
  }, [selectedNvd, setSelectedNvd]);

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

    // Update image details to get complete volume information
    updateImageDetails();

    if (currentImageIndex === null && files.length > 0) {
      setCurrentImageIndex(0);
    }
  }

  const updateImageDetails = () => {
    const nv = nvRef.current
    if (nv) {
      const loadedImages = nv.volumes.map((vol, index) => ({
        id: vol.id,
        name: vol.name || `Volume ${index + 1}`,
        visible: true,
        colormap: vol.colormap,
        opacity: vol.opacity,
        contrastMin: vol.cal_min ?? 0,
        contrastMax: vol.cal_max ?? 100
      }));
      setImages(loadedImages);
      console.log("updateImageDetails() loadedImages:", loadedImages)
      if (loadedImages.length > 0) {
        setCurrentImageIndex(0);
      }
    } else {
      console.log("updateImageDetails(): nvRef is ", nvRef)
    }
  }

  const toggleImageVisibility = (id: string) => {
    setImages(images.map((img) => {
      if (img.id === id) {
        const newVisible = !img.visible;

        // Update the Niivue volume opacity
        if (nvRef.current) {
          const volumeIndex = nvRef.current.getVolumeIndexByID(id);
          if (volumeIndex >= 0) {
            nvRef.current.setOpacity(volumeIndex, newVisible ? img.opacity : 0);
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
    setViewMode(mode)
    if (nvRef.current) {
      const viewConfig = sliceTypeMap[mode]
      console.log("handleViewMode() -- viewConfig: ", viewConfig)
      if (viewConfig) {
        nvRef.current.opts.multiplanarShowRender = viewConfig.showRender
        nvRef.current.setSliceType(viewConfig.sliceType)
      } else {
        nvRef.current.setSliceType(0) // Default to axial if mode is invalid
      }
    }
  }

  const handleDragMode = (mode: DragMode) => {
    setDragMode(mode)
    if (nvRef.current) {
      nvRef.current.opts.dragMode = DRAG_MODE_SECONDARY[mode]
    }
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
  }, [currentImageIndex, debouncedGLUpdate])

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
  }, [currentImageIndex, debouncedGLUpdate])

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
  }, [currentImageIndex, debouncedGLUpdate])

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
  }, [currentImageIndex, debouncedGLUpdate])

  const handleAddMoreFiles = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleSaveScene = useCallback(() => {
    setSaveDialogOpen(true)
  }, [])

  const handleConfirmSave = useCallback(async () => {
    console.log("Saving scene to:", saveLocation)
    if (nvRef.current && saveLocation.trim()) {
      try {
        // Temporarily store and clear drawBitmap to exclude it from JSON
        const originalDrawBitmap = nvRef.current.document.drawBitmap
        nvRef.current.document.drawBitmap = null

        const jsonData = nvRef.current.document.json(false) // embedImages = false

        // Patch name and URL from niivue volumes into imageOptionsArray
        // nv.document.json() should do this?
        if (jsonData.imageOptionsArray && nvRef.current.volumes) {
          for (let i = 0; i < jsonData.imageOptionsArray.length && i < nvRef.current.volumes.length; i++) {
            const volume = nvRef.current.volumes[i]
            if (volume.name) {
              jsonData.imageOptionsArray[i].name = volume.name
            }
            if (volume.url) {
              jsonData.imageOptionsArray[i].url = volume.url
            }
          }
        }

        console.log("Scene JSON object:", jsonData)

        // Restore the original drawBitmap
        nvRef.current.document.drawBitmap = originalDrawBitmap

        // Save to backend
        const response = await fetch('/nvd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: saveLocation,
            data: jsonData
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to save scene: ${response.statusText}`)
        }

        const result = await response.json()
        console.log("Scene saved successfully:", result)

        // TODO: Show success message to user

      } catch (error) {
        console.error("Error saving scene:", error)
        // TODO: Show error message to user
      }
    }

    // Close dialog and reset
    setSaveDialogOpen(false)
    setSaveLocation("")
  }, [saveLocation])

  const handleCancelSave = useCallback(() => {
    setSaveDialogOpen(false)
    setSaveLocation("")
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      handleFileUpload(files)
    }
    // Clear the input value so the same file can be selected again
    e.target.value = ''
  }, [handleFileUpload])

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

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">FreeBrowse 2.0</h1>
          <div className="bg-background p-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <ViewSelector currentView={viewMode} onViewChange={handleViewMode} />
              <DragModeSelector
                currentMode={dragMode}
                onModeChange={handleDragMode}
                availableModes={["contrast", "pan"]}
              />
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
                {sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            {showUploader ? (
              <div className="flex h-full items-center justify-center">
                <ImageUploader onUpload={handleFileUpload} />
              </div>
            ) : (
              <div className="relative flex h-full flex-col">
                <div className="flex-1 overflow-hidden">
                  {<ImageCanvas viewMode={viewMode} nvRef={nv}/>}
                </div>
              </div>
            )}
          </div>
        </main>

        {sidebarOpen && (
          <aside className={cn("border-l bg-background w-80 overflow-hidden flex flex-col")}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start border-b rounded-none px-2 h-12">
                <TabsTrigger value="nvds" className="data-[state=active]:bg-muted">
                  NiiVue Documents
                </TabsTrigger>
                <TabsTrigger value="sceneDetails" className="data-[state=active]:bg-muted">
                  Scene Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="nvds" className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <NvdList />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="sceneDetails" className="flex-1 p-0">
                <div className="flex flex-col h-full">

                  <ScrollArea className="flex-1">
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
                            <div className="flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveVolumeClick(index);
                                }}
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
                        Add more files
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleSaveScene}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save scene
                      </Button>
                    </div>
                  </ScrollArea>
                  <ScrollArea className="flex-1">
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
              placeholder="Enter file path or URL..."
              value={saveLocation}
              onChange={(e) => setSaveLocation(e.target.value)}
              className="mt-2"
            />
          </div>

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
    </div>
  )
}
