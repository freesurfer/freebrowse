import { useFreeBrowseStore } from "@/store";
import { useViewerOptions } from "@/hooks/use-viewer-options";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LabeledSliderWithInput } from "@/components/ui/labeled-slider-with-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Niivue } from "@niivue/niivue";

interface SettingsDialogProps {
  nvRef: React.RefObject<Niivue | null>;
}

export default function SettingsDialog({ nvRef }: SettingsDialogProps) {
  const settingsDialogOpen = useFreeBrowseStore((s) => s.settingsDialogOpen);
  const setSettingsDialogOpen = useFreeBrowseStore((s) => s.setSettingsDialogOpen);
  const skipRemoveConfirmation = useFreeBrowseStore((s) => s.skipRemoveConfirmation);
  const setSkipRemoveConfirmation = useFreeBrowseStore((s) => s.setSkipRemoveConfirmation);

  const {
    viewerOptions,
    handleCrosshairWidthChange,
    handleCrosshairGapChange,
    handleInterpolateVoxelsChange,
    handleCrosshairVisibleChange,
    handleCrosshairColorChange,
    handleOverlayOutlineWidthChange,
  } = useViewerOptions(nvRef);

  return (
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
  );
}
