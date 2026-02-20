import { useEffect, useRef } from "react";
import { useFreeBrowseStore } from "@/store";
import { useViewerOptions } from "@/hooks/use-viewer-options";
import { useLocation } from "@/hooks/use-location";
import { useVolumes } from "@/hooks/use-volumes";
import { useSurfaces } from "@/hooks/use-surfaces";
import { useDrawing } from "@/hooks/use-drawing";
import { useSave } from "@/hooks/use-save";
import { useFileLoading } from "@/hooks/use-file-loading";
import { useSegmentation } from "@/hooks/use-segmentation";
import { useRating } from "@/hooks/use-rating";
import { Niivue } from "@niivue/niivue";
import "../App.css";
import Header from "./header";
import Footer from "./footer";
import CanvasArea from "./canvas-area";
import Sidebar from "./sidebar";
import RemoveDialog from "./dialogs/remove-dialog";
import SaveDialog from "./dialogs/save-dialog";
import SettingsDialog from "./dialogs/settings-dialog";

const nv = new Niivue({
  loadingText: "Drag-drop images",
  dragAndDropEnabled: true,
  textHeight: 0.02,
  backColor: [0, 0, 0, 1],
  crosshairColor: [1.0, 0.0, 0.0, 0.5],
  multiplanarForceRender: false,
});

export default function FreeBrowse() {
  const sidebarOpen = useFreeBrowseStore((s) => s.sidebarOpen);
  const footerOpen = useFreeBrowseStore((s) => s.footerOpen);
  const darkMode = useFreeBrowseStore((s) => s.darkMode);

  const nvRef = useRef<Niivue | null>(nv);

  // --- Hooks ---
  const {
    viewerOptions,
    applyViewerOptions,
    syncViewerOptionsFromNiivue,
    debouncedGLUpdate,
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
  const {
    segState,
    setSegState,
    voxelPromptText,
    setVoxelPromptText,
    initSegModel,
    runSegmentation,
    sendVoxelPrompt,
    handleClickModeChange,
    handleResetSession,
  } = useSegmentation(nvRef, updateImageDetails);
  const {
    ratingState,
    setRatingState,
    initRatingSession,
    submitRating,
    advanceToNextVolume,
    handleEndSession,
  } = useRating(nvRef);

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
      <Header nvRef={nvRef} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col min-h-0">
          <CanvasArea
            nvInstance={nv}
            viewMode={viewerOptions.viewMode}
            onFileUpload={handleFileUpload}
          />

          {footerOpen && <Footer />}
        </div>

        {sidebarOpen && (
          <Sidebar
            nvRef={nvRef}
            serverlessMode={serverlessMode}
            onNvdFileSelect={handleNvdFileSelect}
            onImagingFileSelect={handleImagingFileSelect}
            onAddMoreFiles={handleAddMoreFiles}
            onAddSurfaceFiles={handleAddSurfaceFiles}
            onToggleImageVisibility={toggleImageVisibility}
            onEditVolume={handleEditVolume}
            canEditVolume={canEditVolume}
            onRemoveVolumeClick={handleRemoveVolumeClick}
            onOpacityChange={handleOpacityChange}
            onFrameChange={handleFrameChange}
            onContrastMinChange={handleContrastMinChange}
            onContrastMaxChange={handleContrastMaxChange}
            onColormapChange={handleColormapChange}
            onToggleSurfaceVisibility={toggleSurfaceVisibility}
            onRemoveSurfaceClick={handleRemoveSurfaceClick}
            onSurfaceOpacityChange={handleSurfaceOpacityChange}
            onSurfaceColorChange={handleSurfaceColorChange}
            onMeshShaderChange={handleMeshShaderChange}
            getMeshShaderName={getMeshShaderName}
            onCreateDrawingLayer={handleCreateDrawingLayer}
            onDrawModeChange={handleDrawModeChange}
            onPenFillChange={handlePenFillChange}
            onPenErasesChange={handlePenErasesChange}
            onPenValueChange={handlePenValueChange}
            onDrawingOpacityChange={handleDrawingOpacityChange}
            onMagicWand2dOnlyChange={handleMagicWand2dOnlyChange}
            onMagicWandMaxDistanceChange={handleMagicWandMaxDistanceChange}
            onMagicWandThresholdChange={handleMagicWandThresholdChange}
            onDrawUndo={handleDrawUndo}
            onSaveDrawing={handleSaveDrawing}
            onSaveScene={handleSaveScene}
            segState={segState}
            voxelPromptText={voxelPromptText}
            onSendVoxelPrompt={sendVoxelPrompt}
            onInitSegModel={initSegModel}
            onModelSelect={(name) =>
              setSegState((prev) => ({ ...prev, selectedModel: name }))
            }
            onClickModeChange={handleClickModeChange}
            onRunSegmentation={runSegmentation}
            onResetSession={handleResetSession}
            onVoxelPromptTextChange={setVoxelPromptText}
            ratingState={ratingState}
            onRatingStateChange={setRatingState}
            onInitRatingSession={initRatingSession}
            onSubmitRating={submitRating}
            onAdvanceToNextVolume={advanceToNextVolume}
            onEndRatingSession={handleEndSession}
          />
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

      <RemoveDialog
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
      <SaveDialog
        nvRef={nvRef}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
        onVolumeUrlChange={handleVolumeUrlChange}
        onVolumeCheckboxChange={handleVolumeCheckboxChange}
        onDocumentLocationChange={handleDocumentLocationChange}
        onDocumentCheckboxChange={handleDocumentCheckboxChange}
      />
      <SettingsDialog nvRef={nvRef} />
    </div>
  );
}
