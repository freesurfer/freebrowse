import { useFreeBrowseStore } from "@/store";
import { Button } from "@/components/ui/button";
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
import type { Niivue } from "@niivue/niivue";

interface SaveDialogProps {
  nvRef: React.RefObject<Niivue | null>;
  onConfirm: () => void;
  onCancel: () => void;
  onVolumeUrlChange: (index: number, url: string) => void;
  onVolumeCheckboxChange: (index: number, enabled: boolean) => void;
  onDocumentLocationChange: (location: string) => void;
  onDocumentCheckboxChange: (enabled: boolean) => void;
}

export default function SaveDialog({
  nvRef,
  onConfirm,
  onCancel,
  onVolumeUrlChange,
  onVolumeCheckboxChange,
  onDocumentLocationChange,
  onDocumentCheckboxChange,
}: SaveDialogProps) {
  const saveDialogOpen = useFreeBrowseStore((s) => s.saveDialogOpen);
  const setSaveDialogOpen = useFreeBrowseStore((s) => s.setSaveDialogOpen);
  const saveState = useFreeBrowseStore((s) => s.saveState);

  return (
    <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
      <DialogContent onClose={onCancel}>
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
              onCheckedChange={onDocumentCheckboxChange}
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
                onChange={(e) => onDocumentLocationChange(e.target.value)}
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
                        onVolumeCheckboxChange(index, checked === true)
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
                          onVolumeUrlChange(index, e.target.value)
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
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
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
  );
}
