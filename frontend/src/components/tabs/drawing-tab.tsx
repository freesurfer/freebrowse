import { useFreeBrowseStore } from "@/store";
import {
  Save,
  Pencil,
  Undo,
  Loader2,
  Zap,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LabeledSliderWithInput } from "@/components/ui/labeled-slider-with-input";
import { Select } from "@/components/ui/select";
import type { SegState } from "@/hooks/use-segmentation";

interface DrawingTabProps {
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
  // Segmentation props
  segState: SegState;
  voxelPromptText: string;
  onSendVoxelPrompt: () => void;
  onInitSegModel: () => void;
  onModelSelect: (modelName: string) => void;
  onClickModeChange: (mode: "positive" | "negative") => void;
  onRunSegmentation: () => void;
  onResetSession: () => void;
  onVoxelPromptTextChange: (text: string) => void;
}

export default function DrawingTab({
  onDrawModeChange,
  onPenFillChange,
  onPenErasesChange,
  onPenValueChange,
  onDrawingOpacityChange,
  onMagicWand2dOnlyChange,
  onMagicWandMaxDistanceChange,
  onMagicWandThresholdChange,
  onDrawUndo,
  onSaveDrawing,
  segState,
  voxelPromptText,
  onSendVoxelPrompt,
  onInitSegModel,
  onModelSelect,
  onClickModeChange,
  onRunSegmentation,
  onResetSession,
  onVoxelPromptTextChange,
}: DrawingTabProps) {
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);
  const setDrawingOptions = useFreeBrowseStore((s) => s.setDrawingOptions);

  return (
    <>
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Drawing Tools</h2>
        <p className="text-sm text-muted-foreground">
          Edit annotations
        </p>
      </div>

      {/* VoxelPrompt Section */}
      <div className="border-b px-4 py-3">
        <Label className="text-sm font-medium">VoxelPrompt</Label>
        <div className="flex gap-2 mt-2">
          <Input
            type="text"
            value={voxelPromptText}
            onChange={(e) => onVoxelPromptTextChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSendVoxelPrompt()}
            placeholder="Enter prompt..."
          />
          <Button size="sm" onClick={onSendVoxelPrompt}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
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
                onValueChange={onDrawingOpacityChange}
                min={0}
                max={1}
                step={0.01}
              />

              {/* Draw Mode Selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Draw Mode
                </Label>
                <Select
                  value={drawingOptions.mode}
                  onChange={(e) =>
                    onDrawModeChange(
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
                  onClick={onDrawUndo}
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
                        onCheckedChange={onPenFillChange}
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
                        onCheckedChange={onPenErasesChange}
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
                        onCheckedChange={onMagicWand2dOnlyChange}
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
                      onValueChange={onMagicWandMaxDistanceChange}
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
                      onValueChange={onMagicWandThresholdChange}
                      min={0.0}
                      max={1.0}
                      step={0.01}
                    />
                  )}

                  {/* Pen Value Slider */}
                  <LabeledSliderWithInput
                    label="Pen Value"
                    value={drawingOptions.penValue}
                    onValueChange={onPenValueChange}
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
                onClick={onSaveDrawing}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Drawing
              </Button>

              {/* ScribblePrompt 3D Section */}
              <div className="space-y-3 border-t pt-4 mt-4">
                <Label className="text-sm font-medium">
                  ScribblePrompt 3D
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onInitSegModel}
                  disabled={segState.loading}
                >
                  {segState.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Models...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Load Models
                    </>
                  )}
                </Button>
                {segState.error && (
                  <p className="text-sm text-red-500">{segState.error}</p>
                )}
                {segState.modelsLoaded && segState.models.length > 0 && (
                  <Select
                    value={segState.selectedModel ?? ""}
                    onChange={(e) => onModelSelect(e.target.value)}
                  >
                    {segState.models.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.name}
                      </option>
                    ))}
                  </Select>
                )}

                {/* Click mode toggle */}
                {segState.modelsLoaded && (
                  <div className="space-y-1">
                    <Label className="text-xs">Click Mode</Label>
                    <div className="flex gap-1">
                      <Button
                        variant={
                          segState.clickMode === "positive"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="flex-1"
                        onClick={() => onClickModeChange("positive")}
                      >
                        + Positive
                      </Button>
                      <Button
                        variant={
                          segState.clickMode === "negative"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="flex-1"
                        onClick={() => onClickModeChange("negative")}
                      >
                        - Negative
                      </Button>
                    </div>
                  </div>
                )}

                {/* Run Segmentation button */}
                {segState.modelsLoaded && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={onRunSegmentation}
                    disabled={segState.loading || !segState.selectedModel}
                  >
                    {segState.loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {segState.progress}%
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Run Segmentation
                      </>
                    )}
                  </Button>
                )}

                {/* Reset button */}
                {segState.previousLogits && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={onResetSession}
                  >
                    <Undo className="mr-2 h-4 w-4" />
                    Reset Session
                  </Button>
                )}
              </div>
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
    </>
  );
}
