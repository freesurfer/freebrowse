import { useRef } from "react";
import { useViewerOptions } from "@/hooks/use-viewer-options";
import { useLocation } from "@/hooks/use-location";
import { useVolumes } from "@/hooks/use-volumes";
import { useSurfaces } from "@/hooks/use-surfaces";
import { useMeshLayers } from "@/hooks/use-mesh-layers";
import { useDrawing } from "@/hooks/use-drawing";
import { useSave } from "@/hooks/use-save";
import { useFileLoading } from "@/hooks/use-file-loading";
import { Niivue } from "@niivue/niivue";
import "../App.css";
import ViewerShell from "./viewer-shell";
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
    layerFileInputRef,
    getLayers,
    removeLayer: removeLayerFromMesh,
    handleLayerOpacityChange,
    handleLayerCalMinChange,
    handleLayerCalMaxChange,
    handleLayerColormapChange,
    handleLayerUseNegativeCmapChange,
    handleAddLayerFiles,
    handleLayerFileChange,
  } = useMeshLayers(nvRef);
  const {
    updateImageDetails,
    toggleImageVisibility,
    handleOpacityChange,
    handleFrameChange,
    handleContrastMinChange,
    handleContrastMaxChange,
    handleColormapChange,
    handleLabelVolumeChange,
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

  return (
    <ViewerShell
      nvInstance={nv}
      viewMode={viewerOptions.viewMode}
      onFileUpload={handleFileUpload}
      sidebar={
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
          onLabelVolumeChange={handleLabelVolumeChange}
          onToggleSurfaceVisibility={toggleSurfaceVisibility}
          onRemoveSurfaceClick={handleRemoveSurfaceClick}
          onSurfaceOpacityChange={handleSurfaceOpacityChange}
          onSurfaceColorChange={handleSurfaceColorChange}
          onMeshShaderChange={handleMeshShaderChange}
          getMeshShaderName={getMeshShaderName}
          getLayers={getLayers}
          onAddLayerFiles={handleAddLayerFiles}
          onRemoveLayer={removeLayerFromMesh}
          onLayerOpacityChange={handleLayerOpacityChange}
          onLayerCalMinChange={handleLayerCalMinChange}
          onLayerCalMaxChange={handleLayerCalMaxChange}
          onLayerColormapChange={handleLayerColormapChange}
          onLayerUseNegativeCmapChange={handleLayerUseNegativeCmapChange}
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
        />
      }
      dialogs={
        <>
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
        </>
      }
      hiddenInputs={
        <>
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
          <input
            type="file"
            ref={layerFileInputRef}
            onChange={handleLayerFileChange}
            multiple
            className="hidden"
          />
        </>
      }
    />
  );
}
