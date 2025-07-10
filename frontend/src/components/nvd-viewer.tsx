import { useState } from "react"
import { PanelLeft, PanelRight, Send, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LabeledSliderWithInput } from "@/components/ui/labeled-slider-with-input"
import ViewSelector from "@/components/view-selector"
import ProcessingHistory, { type ProcessingHistoryItem } from "@/components/processing-history"
import { cn } from "@/lib/utils"
import { useRef, useContext, useEffect } from 'react'
import { DocumentData, Niivue, NVDocument, NVImage } from '@niivue/niivue'
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
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [processingHistory, setProcessingHistory] = useState<ProcessingHistoryItem[]>([])
  const [viewMode, setViewMode] = useState<"axial" | "coronal" | "sagittal" | "ACS" | "ACSR" | "render">("ACS")
  const nvRef = useRef<Niivue | null>(nv)
  const { selectedNvd } = useContext(NvdContext)

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
    }
  }, []); // Re-create callback when currentImageIndex changes

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

          // Clear overlays if any
          // removeOverlay() not in v0.60.0?
          //if (nv.overlays && nv.overlays.length > 0) {
          //  nv.removeOverlay();
          //}

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

  // Add uploaded files to Niivue
  let handleFileUpload = async (files: File[]) => {
    if (!nvRef.current) return;
    const nv = nvRef.current
    files.forEach(async (file) => {
      const nvimage = await NVImage.loadFromFile({
        file: file,
      });
      console.log("nv", nv)

      nv.addVolume(nvimage);

      const newImage = {
        id: nvimage.id,
        name: nvimage.name,
        visible: true,
      }
      setImages((prev) => [...prev, ...[newImage]])
    })

    if (currentImageIndex === null && files.length > 0) {
      setShowUploader(false);
      setCurrentImageIndex(0);
    }
  }

  const updateImageDetails = () => {
    const nv = nvRef.current
    if (nvRef.current) {
      const loadedImages = nv.volumes.map((vol, index) => ({
        id: vol.id,
        name: vol.name || `Volume ${index + 1}`,
        visible: true,
        colormap: vol.colormap,
        opacity: vol.opacity,
        contrastMin: vol.cal_min,
        contrastMax: vol.cal_max
      }));
      setImages(loadedImages);
      console.log("updateImageDetails() loadedImages:", loadedImages)
      if (loadedImages.length > 0) {
        setCurrentImageIndex(0);
      }
    } else {
      console.log("updateImageDetails(): nvRef is ", nvref)
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

  const handleOpacityChange = (newOpacity: number) => {
    if (currentImageIndex !== null && nvRef.current) {
      const volumeIndex = nvRef.current.getVolumeIndexByID(images[currentImageIndex].id);
      if (volumeIndex >= 0) {
        nvRef.current.setOpacity(volumeIndex, newOpacity);
        nvRef.current.updateGLVolume();

        // Update the images state to reflect the new opacity
        setImages(images.map((img, index) =>
          index === currentImageIndex ? { ...img, opacity: newOpacity } : img
        ));
      }
    }
  }

  const handleContrastMinChange = (newContrastMin: number) => {
    if (currentImageIndex !== null && nvRef.current) {
      const volumeIndex = nvRef.current.getVolumeIndexByID(images[currentImageIndex].id);
      if (volumeIndex >= 0) {
        const volume = nvRef.current.volumes[volumeIndex];
        volume.cal_min = newContrastMin;
        nvRef.current.updateGLVolume();

        // Update the images state to reflect the new contrast min
        setImages(images.map((img, index) =>
          index === currentImageIndex ? { ...img, contrastMin: newContrastMin } : img
        ));
      }
    }
  }

  const handleContrastMaxChange = (newContrastMax: number) => {
    if (currentImageIndex !== null && nvRef.current) {
      const volumeIndex = nvRef.current.getVolumeIndexByID(images[currentImageIndex].id);
      if (volumeIndex >= 0) {
        const volume = nvRef.current.volumes[volumeIndex];
        volume.cal_max = newContrastMax;
        nvRef.current.updateGLVolume();

        // Update the images state to reflect the new contrast max
        setImages(images.map((img, index) =>
          index === currentImageIndex ? { ...img, contrastMax: newContrastMax } : img
        ));
      }
    }
  }

  //const updateCurrentImageDetails = (index?: number) => {
  //  const imageIndex = index !== undefined ? index : currentImageIndex;
  //  if (imageIndex !== null && nvRef.current && nvRef.current.volumes[imageIndex]) {
  //    const currentImageDetails: ImageDetails = {
  //      colormap: nvRef.current.volumes[imageIndex].colormap,
  //      opacity: nvRef.current.volumes[imageIndex].opacity,
  //      contrastMin: nvRef.current.volumes[imageIndex].cal_min,
  //      contrastMax: nvRef.current.volumes[imageIndex].cal_max
  //    };
  //    console.log("updateCurrentImageDetails() -- ", currentImageDetails)
  //  }
  //}

  //const updateCurrentImageIndex = (id: number) => {
//
//    setCurrentImageIndex(id);
    //updateCurrentImageDetails(id); // Pass the new index directly
//  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">FreeBrowse 2.0</h1>
          <div className="bg-background p-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <ViewSelector currentView={viewMode} onViewChange={handleViewMode} />
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
                              <Checkbox
                                id={`select-${image.id}`}
                                checked={image.visible}
                                onCheckedChange={() => toggleImageVisibility(image.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{image.name}</p>
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
    </div>
  )
}
