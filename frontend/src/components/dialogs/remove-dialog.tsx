import { useFreeBrowseStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface RemoveDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RemoveDialog({ onConfirm, onCancel }: RemoveDialogProps) {
  const removeDialogOpen = useFreeBrowseStore((s) => s.removeDialogOpen);
  const setRemoveDialogOpen = useFreeBrowseStore((s) => s.setRemoveDialogOpen);
  const skipRemoveConfirmation = useFreeBrowseStore((s) => s.skipRemoveConfirmation);
  const setSkipRemoveConfirmation = useFreeBrowseStore((s) => s.setSkipRemoveConfirmation);
  const surfaceToRemove = useFreeBrowseStore((s) => s.surfaceToRemove);

  return (
    <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
      <DialogContent onClose={onCancel}>
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
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
