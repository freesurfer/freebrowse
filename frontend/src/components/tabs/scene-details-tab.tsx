import { useFreeBrowseStore } from "@/store";
import {
  ImageIcon,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Edit,
  Pencil,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { LabeledSliderWithInput } from "@/components/ui/labeled-slider-with-input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Niivue } from "@niivue/niivue";

interface SceneDetailsTabProps {
  nvRef: React.RefObject<Niivue | null>;
  serverlessMode: boolean;
  onToggleVisibility: (id: string) => void;
  onEditVolume: (index: number) => void;
  canEditVolume: (index: number) => boolean;
  onRemoveVolume: (index: number) => void;
  onAddMoreFiles: () => void;
  onCreateDrawingLayer: () => void;
  onSaveScene: (isDownload: boolean) => void;
  onOpacityChange: (value: number) => void;
  onFrameChange: (value: number) => void;
  onContrastMinChange: (value: number) => void;
  onContrastMaxChange: (value: number) => void;
  onColormapChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function SceneDetailsTab({
  nvRef,
  serverlessMode,
  onToggleVisibility,
  onEditVolume,
  canEditVolume,
  onRemoveVolume,
  onAddMoreFiles,
  onCreateDrawingLayer,
  onSaveScene,
  onOpacityChange,
  onFrameChange,
  onContrastMinChange,
  onContrastMaxChange,
  onColormapChange,
}: SceneDetailsTabProps) {
  const images = useFreeBrowseStore((s) => s.images);
  const currentImageIndex = useFreeBrowseStore((s) => s.currentImageIndex);
  const setCurrentImageIndex = useFreeBrowseStore((s) => s.setCurrentImageIndex);
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);

  return (
    <>
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
                        onToggleVisibility(image.id);
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
                        onEditVolume(index);
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
                        onRemoveVolume(index);
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
              onClick={onAddMoreFiles}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload files
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onCreateDrawingLayer}
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
                onClick={() => onSaveScene(false)}
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
                onClick={() => onSaveScene(true)}
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
                  onValueChange={onFrameChange}
                  min={0}
                  max={(images[currentImageIndex]?.nFrame4D || 1) - 1}
                  step={1}
                />
              )}
              <LabeledSliderWithInput
                label="Opacity"
                value={images[currentImageIndex]?.opacity || 1}
                onValueChange={onOpacityChange}
                min={0}
                max={1}
                step={0.01}
              />
              <LabeledSliderWithInput
                label="Contrast Min"
                value={images[currentImageIndex]?.contrastMin || 0}
                onValueChange={onContrastMinChange}
                min={images[currentImageIndex]?.globalMin ?? 0}
                max={images[currentImageIndex]?.globalMax ?? 255}
                step={0.1}
                decimalPlaces={1}
              />
              <LabeledSliderWithInput
                label="Contrast Max"
                value={images[currentImageIndex]?.contrastMax || 100}
                onValueChange={onContrastMaxChange}
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
                  onChange={onColormapChange}
                >
                  {nvRef.current?.colormaps().map((colormap: string) => (
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
    </>
  );
}
