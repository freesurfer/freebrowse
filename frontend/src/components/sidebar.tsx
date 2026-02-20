import { useFreeBrowseStore } from "@/store";
import {
  FileText,
  Box,
  Brain,
  Database,
  Pencil,
  Star,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Niivue } from "@niivue/niivue";
import type { FileItem } from "@/components/file-list";
import type { SegState } from "@/hooks/use-segmentation";
import type { RatingState } from "@/hooks/use-rating";
import NvdTab from "@/components/tabs/nvd-tab";
import DataTab from "@/components/tabs/data-tab";
import SceneDetailsTab from "@/components/tabs/scene-details-tab";
import SurfaceDetailsTab from "@/components/tabs/surface-details-tab";
import DrawingTab from "@/components/tabs/drawing-tab";
import RatingTab from "@/components/tabs/rating-tab";

interface SidebarProps {
  nvRef: React.RefObject<Niivue | null>;
  serverlessMode: boolean;
  // File loading
  onNvdFileSelect: (file: FileItem) => void;
  onImagingFileSelect: (file: FileItem) => void;
  onAddMoreFiles: () => void;
  onAddSurfaceFiles: () => void;
  // Volume operations
  onToggleImageVisibility: (id: string) => void;
  onEditVolume: (index: number) => void;
  canEditVolume: (index: number) => boolean;
  onRemoveVolumeClick: (index: number) => void;
  onOpacityChange: (value: number) => void;
  onFrameChange: (value: number) => void;
  onContrastMinChange: (value: number) => void;
  onContrastMaxChange: (value: number) => void;
  onColormapChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  // Surface operations
  onToggleSurfaceVisibility: (id: string) => void;
  onRemoveSurfaceClick: (index: number) => void;
  onSurfaceOpacityChange: (value: number) => void;
  onSurfaceColorChange: (hexColor: string) => void;
  onMeshShaderChange: (shaderName: string) => void;
  getMeshShaderName: (index: number) => string;
  // Drawing operations
  onCreateDrawingLayer: () => void;
  onDrawModeChange: (mode: "none" | "pen" | "wand") => void;
  onPenFillChange: (checked: boolean) => void;
  onPenErasesChange: (checked: boolean) => void;
  onPenValueChange: (value: number) => void;
  onDrawingOpacityChange: (value: number) => void;
  onMagicWand2dOnlyChange: (checked: boolean) => void;
  onMagicWandMaxDistanceChange: (value: number) => void;
  onMagicWandThresholdChange: (value: number) => void;
  onDrawUndo: () => void;
  onSaveDrawing: () => void;
  // Save operations
  onSaveScene: (isDownload: boolean) => void;
  // Segmentation
  segState: SegState;
  voxelPromptText: string;
  onSendVoxelPrompt: () => void;
  onInitSegModel: () => void;
  onModelSelect: (modelName: string) => void;
  onClickModeChange: (mode: "positive" | "negative") => void;
  onRunSegmentation: () => void;
  onResetSession: () => void;
  onVoxelPromptTextChange: (text: string) => void;
  // Rating
  ratingState: RatingState;
  onRatingStateChange: (updater: (prev: RatingState) => RatingState) => void;
  onInitRatingSession: () => void;
  onSubmitRating: (rating: number) => void;
  onAdvanceToNextVolume: () => void;
  onEndRatingSession: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const activeTab = useFreeBrowseStore((s) => s.activeTab);
  const setActiveTab = useFreeBrowseStore((s) => s.setActiveTab);
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);

  return (
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
          {!props.serverlessMode && (
            <TabsTrigger
              value="nvds"
              className="data-[state=active]:bg-muted"
            >
              <FileText className="h-4 w-4 mr-2" />
            </TabsTrigger>
          )}
          {!props.serverlessMode && (
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
          {!props.serverlessMode && (
            <TabsTrigger
              value="rating"
              className="data-[state=active]:bg-muted"
            >
              <Star className="h-4 w-4 mr-2" />
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="nvds" className="flex-1 min-h-0 p-0">
          {!props.serverlessMode && (
            <NvdTab onFileSelect={props.onNvdFileSelect} />
          )}
        </TabsContent>

        <TabsContent value="data" className="flex-1 min-h-0 p-0">
          {!props.serverlessMode && (
            <DataTab onFileSelect={props.onImagingFileSelect} />
          )}
        </TabsContent>

        <TabsContent value="sceneDetails" className="flex-1 min-h-0 p-0">
          <SceneDetailsTab
            nvRef={props.nvRef}
            serverlessMode={props.serverlessMode}
            onToggleVisibility={props.onToggleImageVisibility}
            onEditVolume={props.onEditVolume}
            canEditVolume={props.canEditVolume}
            onRemoveVolume={props.onRemoveVolumeClick}
            onAddMoreFiles={props.onAddMoreFiles}
            onCreateDrawingLayer={props.onCreateDrawingLayer}
            onSaveScene={props.onSaveScene}
            onOpacityChange={props.onOpacityChange}
            onFrameChange={props.onFrameChange}
            onContrastMinChange={props.onContrastMinChange}
            onContrastMaxChange={props.onContrastMaxChange}
            onColormapChange={props.onColormapChange}
          />
        </TabsContent>

        <TabsContent value="surfaceDetails" className="flex-1 min-h-0 p-0">
          <SurfaceDetailsTab
            nvRef={props.nvRef}
            onToggleVisibility={props.onToggleSurfaceVisibility}
            onRemoveSurface={props.onRemoveSurfaceClick}
            onAddSurfaceFiles={props.onAddSurfaceFiles}
            onOpacityChange={props.onSurfaceOpacityChange}
            onColorChange={props.onSurfaceColorChange}
            onShaderChange={props.onMeshShaderChange}
            getMeshShaderName={props.getMeshShaderName}
          />
        </TabsContent>

        <TabsContent value="drawing" className="flex-1 min-h-0 p-0">
          <DrawingTab
            onDrawModeChange={props.onDrawModeChange}
            onPenFillChange={props.onPenFillChange}
            onPenErasesChange={props.onPenErasesChange}
            onPenValueChange={props.onPenValueChange}
            onDrawingOpacityChange={props.onDrawingOpacityChange}
            onMagicWand2dOnlyChange={props.onMagicWand2dOnlyChange}
            onMagicWandMaxDistanceChange={props.onMagicWandMaxDistanceChange}
            onMagicWandThresholdChange={props.onMagicWandThresholdChange}
            onDrawUndo={props.onDrawUndo}
            onSaveDrawing={props.onSaveDrawing}
            segState={props.segState}
            voxelPromptText={props.voxelPromptText}
            onSendVoxelPrompt={props.onSendVoxelPrompt}
            onInitSegModel={props.onInitSegModel}
            onModelSelect={props.onModelSelect}
            onClickModeChange={props.onClickModeChange}
            onRunSegmentation={props.onRunSegmentation}
            onResetSession={props.onResetSession}
            onVoxelPromptTextChange={props.onVoxelPromptTextChange}
          />
        </TabsContent>

        <TabsContent value="rating" className="flex-1 min-h-0 p-0">
          {!props.serverlessMode && (
            <RatingTab
              ratingState={props.ratingState}
              onRatingStateChange={props.onRatingStateChange}
              onInitSession={props.onInitRatingSession}
              onSubmitRating={props.onSubmitRating}
              onAdvance={props.onAdvanceToNextVolume}
              onEndSession={props.onEndRatingSession}
            />
          )}
        </TabsContent>
      </Tabs>
    </aside>
  );
}
