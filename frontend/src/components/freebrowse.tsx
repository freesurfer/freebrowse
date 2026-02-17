import { useEffect, useRef } from "react";
import { useFreeBrowseStore } from "@/store";
import { useViewerOptions } from "@/hooks/use-viewer-options";
import { useLocation } from "@/hooks/use-location";
import { useVolumes } from "@/hooks/use-volumes";
import { useSurfaces } from "@/hooks/use-surfaces";
import { useDrawing } from "@/hooks/use-drawing";
import { useSave } from "@/hooks/use-save";
import { useFileLoading } from "@/hooks/use-file-loading";
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
import DragModeSelector from "@/components/drag-mode-selector";
import { cn } from "@/lib/utils";
import {
  Niivue,
  cmapper,
} from "@niivue/niivue";
import "../App.css";
import ImageUploader from "./image-uploader";
import ImageCanvas from "./image-canvas";
import { rgba255ToHex } from "@/lib/niivue-helpers";
import { FileList } from "./file-list";

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
  // --- Zustand store (only what's needed directly in JSX) ---
  const images = useFreeBrowseStore((s) => s.images);
  const showUploader = useFreeBrowseStore((s) => s.showUploader);
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
  const skipRemoveConfirmation = useFreeBrowseStore((s) => s.skipRemoveConfirmation);
  const setSkipRemoveConfirmation = useFreeBrowseStore((s) => s.setSkipRemoveConfirmation);
  const saveDialogOpen = useFreeBrowseStore((s) => s.saveDialogOpen);
  const setSaveDialogOpen = useFreeBrowseStore((s) => s.setSaveDialogOpen);
  const saveState = useFreeBrowseStore((s) => s.saveState);
  const settingsDialogOpen = useFreeBrowseStore((s) => s.settingsDialogOpen);
  const setSettingsDialogOpen = useFreeBrowseStore((s) => s.setSettingsDialogOpen);
  const locationData = useFreeBrowseStore((s) => s.locationData);
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);
  const setDrawingOptions = useFreeBrowseStore((s) => s.setDrawingOptions);
  const surfaces = useFreeBrowseStore((s) => s.surfaces);
  const currentSurfaceIndex = useFreeBrowseStore((s) => s.currentSurfaceIndex);
  const setCurrentSurfaceIndex = useFreeBrowseStore((s) => s.setCurrentSurfaceIndex);
  const surfaceToRemove = useFreeBrowseStore((s) => s.surfaceToRemove);

  // --- Component-local state ---
  const nvRef = useRef<Niivue | null>(nv);

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
  const { handleLocationChange } = useLocation(nvRef);
  const {
    updateSurfaceDetails,
    toggleSurfaceVisibility,
    removeSurface,
    handleRemoveSurfaceClick,
    handleSurfaceOpacityChange,
    handleSurfaceColorChange,
    handleMeshShaderChange,
    getMeshShaderName,
  } = useSurfaces(nvRef, debouncedGLUpdate);
  const {
    updateImageDetails,
    toggleImageVisibility,
    handleOpacityChange,
    handleFrameChange,
    handleContrastMinChange,
    handleContrastMaxChange,
    handleColormapChange,
    handleRemoveVolumeClick,
    handleEditVolume,
    canEditVolume,
    handleConfirmRemove,
    handleCancelRemove,
  } = useVolumes(nvRef, debouncedGLUpdate, handleLocationChange, removeSurface);
  const {
    syncDrawingOptionsFromNiivue,
    handleCreateDrawingLayer,
    handleDrawModeChange,
    handlePenFillChange,
    handlePenErasesChange,
    handlePenValueChange,
    handleDrawingOpacityChange,
    handleMagicWand2dOnlyChange,
    handleMagicWandMaxDistanceChange,
    handleMagicWandThresholdChange,
    handleDrawUndo,
    handleSaveDrawing,
  } = useDrawing(nvRef, debouncedGLUpdate, updateImageDetails);
  const {
    handleSaveScene,
    handleConfirmSave,
    handleCancelSave,
    handleVolumeUrlChange,
    handleVolumeCheckboxChange,
    handleDocumentLocationChange,
    handleDocumentCheckboxChange,
  } = useSave(nvRef);
  const {
    serverlessMode,
    fileInputRef,
    surfaceFileInputRef,
    handleFileUpload,
    handleImagingFileSelect,
    handleNvdFileSelect,
    handleFileChange,
    handleAddMoreFiles,
    handleAddSurfaceFiles,
    handleSurfaceFileChange,
  } = useFileLoading(
    nvRef,
    applyViewerOptions,
    syncViewerOptionsFromNiivue,
    updateImageDetails,
    updateSurfaceDetails,
    handleLocationChange,
    syncDrawingOptionsFromNiivue,
  );

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
