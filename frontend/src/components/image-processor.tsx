"use client"

import { useState } from "react"
import { ZoomIn, ZoomOut, Maximize, Minimize, PanelLeft, PanelRight, Send, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import ViewSelector from "@/components/view-selector"
import ProcessingHistory, { type ProcessingHistoryItem } from "@/components/processing-history"
import { cn } from "@/lib/utils"
import { useRef, useEffect, useContext } from 'react'
import { Niivue, NVImage } from '@niivue/niivue'
import '../App.css'
import ImageUploader from "./image-uploader"
import ImageCanvas from "./image-canvas"
import { sliceTypeMap } from "./image-canvas"
import { ViewMode } from "./view-selector"

type ImageFile = {
  id: string
  name: string
  url: string
  selected: boolean
}

type ProcessingTool = {
  id: string
  name: string
  description: string
}

const nv = new Niivue({
  loadingText: "Drag-drop images or Click File then Upload File",
  dragAndDropEnabled: true,
  textHeight: 0.02,
  backColor: [0, 0, 0, 1],
  crosshairColor: [244, 243, 238, 0.5],
  multiplanarForceRender: false
});

export default function MedicalImageProcessor() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [processingHistory, setProcessingHistory] = useState<ProcessingHistoryItem[]>([])
  const [viewMode, setViewMode] = useState<"axial" | "coronal" | "sagittal" | "multi" | "render">("axial")
  // const canvasRef = useRef<HTMLCanvasElement>(null)
  // const containerRef = useRef<HTMLDivElement>(null)
  const nvRef = useRef<Niivue | null>(nv)

  const processingTools: ProcessingTool[] = [
    { id: "segmentation", name: "Segmentation", description: "Segment different regions in the image" },
    { id: "registration", name: "Image Registration", description: "Align multiple images" },
  ]

  let handleFileUpload = async (files: File[]) => {
    if (!nvRef.current) return;
    const nv = nvRef.current
    console.log("nv", nv)
    files.forEach(async (file) => {
      const nvimage = await NVImage.loadFromFile({
        file: file,
      });
      console.log(`file imported ${nvimage}`);

      nv.addVolume(nvimage);
    })

    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      selected: false,
    }))

    setImages((prev) => [...prev, ...newImages])

    if (currentImageIndex === null && newImages.length > 0) {
      setCurrentImageIndex(images.length)
    }
  }

  const toggleImageSelection = (id: string) => {
    setImages(images.map((img) => (img.id === id ? { ...img, selected: !img.selected } : img)))
  }

  const handleProcessImages = () => {
    const selectedImages = images.filter((img) => img.selected)
    if (selectedImages.length === 0 || !selectedTool) {
      alert("Please select at least one image and a processing tool")
      return
    }

    // Get the tool name from the processing tools array
    const tool = processingTools.find((t) => t.id === selectedTool)

    // // Create a new history item
    const historyItem: ProcessingHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      imageNames: selectedImages.map((img) => img.name),
      toolName: tool?.name || selectedTool,
      status: "pending",
    }

    // // Add to history
    setProcessingHistory((prev) => [historyItem, ...prev])

    console.log("Processing images:", selectedImages, "with tool:", selectedTool)

    // Simulate processing with a timeout
    setTimeout(() => {
      setProcessingHistory((prev) =>
        prev.map((item) =>
          item.id === historyItem.id ? { ...item, status: "completed", result: "Result data URL or path" } : item,
        ),
      )
    }, 3000)
  }

  const handleViewResult = (item: ProcessingHistoryItem) => {
    console.log("Viewing result for", item)
    // Implement viewing the result
    alert(`Viewing result for ${item.toolName} processed on ${item.timestamp.toLocaleString()}`)
  }

  const handleDeleteHistoryItem = (id: string) => {
    setProcessingHistory((prev) => prev.filter((item) => item.id !== id))
  }

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all processing history?")) {
      setProcessingHistory([])
    }
  }

  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    if (nvRef.current) {
      nvRef.current.setSliceType(sliceTypeMap[mode] || 0) // Default to axial if mode is invalid
    }
  }

  const currentImage = currentImageIndex !== null ? images[currentImageIndex] : null

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Medical Image Processing</h1>
          <div className="flex items-center gap-2">
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
            {images.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <ImageUploader onUpload={handleFileUpload} />
              </div>
            ) : (
              <div className="relative flex h-full flex-col">
                <div className="flex-1 overflow-hidden">
                  {currentImage && <ImageCanvas imageUrl={currentImage.url} zoom={zoom} viewMode={viewMode} nvRef={nv}/>}
                </div>
                <div className="border-t bg-background p-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setZoom(Math.max(50, zoom - 10))}
                        disabled={zoom <= 50}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Slider
                        className="w-32"
                        value={[zoom]}
                        min={50}
                        max={200}
                        step={10}
                        onValueChange={(value) => setZoom(value[0])}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setZoom(Math.min(200, zoom + 10))}
                        disabled={zoom >= 200}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">{zoom}%</span>
                    </div>

                    <ViewSelector currentView={viewMode} onViewChange={handleViewMode} />

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => setZoom(100)}>
                        <Maximize className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setZoom(50)}>
                        <Minimize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {sidebarOpen && (
          <aside className={cn("border-l bg-background w-80 overflow-hidden flex flex-col")}>
            <Tabs defaultValue="images">
              <TabsList className="w-full justify-start border-b rounded-none px-2 h-12">
                <TabsTrigger value="images" className="data-[state=active]:bg-muted">
                  Images
                </TabsTrigger>
                <TabsTrigger value="tools" className="data-[state=active]:bg-muted">
                  Processing Tools
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-muted">
                  History
                  {processingHistory.length > 0 && (
                    <span className="ml-1 rounded-full bg-primary w-5 h-5 text-[10px] flex items-center justify-center text-primary-foreground">
                      {processingHistory.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="images" className="flex-1 p-0">
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
                                checked={image.selected}
                                onCheckedChange={() => toggleImageSelection(image.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden border bg-muted">
                              <img
                                src={image.url || "/placeholder.svg"}
                                alt={image.name}
                                className="h-full w-full object-cover"
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
                        <p>No images uploaded yet</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="tools" className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <RadioGroup value={selectedTool || ""} onValueChange={setSelectedTool}>
                      {processingTools.map((tool) => (
                        <div key={tool.id} className="flex items-start space-x-2 mb-4">
                          <RadioGroupItem value={tool.id} id={tool.id} />
                          <div className="grid gap-1.5">
                            <Label htmlFor={tool.id} className="font-medium">
                              {tool.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">{tool.description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="flex-1 p-0">
                <ProcessingHistory
                  history={processingHistory}
                  onViewResult={handleViewResult}
                  onDeleteItem={handleDeleteHistoryItem}
                  onClearHistory={handleClearHistory}
                />
              </TabsContent>
            </Tabs>

            <div className="border-t p-4 bg-background">
              <Button
                className="w-full"
                onClick={handleProcessImages}
                disabled={!images.some((img) => img.selected) || !selectedTool}
              >
                <Send className="mr-2 h-4 w-4" />
                Process Selected Images
              </Button>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
