import { useFreeBrowseStore } from "@/store";
import {
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { LabeledSliderWithInput } from "@/components/ui/labeled-slider-with-input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { rgba255ToHex } from "@/lib/niivue-helpers";
import type { Niivue } from "@niivue/niivue";

interface SurfaceDetailsTabProps {
  nvRef: React.RefObject<Niivue | null>;
  onToggleVisibility: (id: string) => void;
  onRemoveSurface: (index: number) => void;
  onAddSurfaceFiles: () => void;
  onOpacityChange: (value: number) => void;
  onColorChange: (hexColor: string) => void;
  onShaderChange: (shaderName: string) => void;
  getMeshShaderName: (index: number) => string;
}

export default function SurfaceDetailsTab({
  nvRef,
  onToggleVisibility,
  onRemoveSurface,
  onAddSurfaceFiles,
  onOpacityChange,
  onColorChange,
  onShaderChange,
  getMeshShaderName,
}: SurfaceDetailsTabProps) {
  const surfaces = useFreeBrowseStore((s) => s.surfaces);
  const currentSurfaceIndex = useFreeBrowseStore((s) => s.currentSurfaceIndex);
  const setCurrentSurfaceIndex = useFreeBrowseStore((s) => s.setCurrentSurfaceIndex);

  return (
    <>
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
                        onToggleVisibility(surface.id);
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
                        onRemoveSurface(index);
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
              onClick={onAddSurfaceFiles}
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
                onValueChange={onOpacityChange}
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
                    onChange={(e) => onColorChange(e.target.value)}
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
                  onChange={(e) => onShaderChange(e.target.value)}
                >
                  {nvRef.current?.meshShaderNames(true).map((shaderName: string) => (
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
    </>
  );
}
