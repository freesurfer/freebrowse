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

interface SessionDeleteConfirmationDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SessionDeleteConfirmationDialog({
  onConfirm,
  onCancel,
}: SessionDeleteConfirmationDialogProps) {
  const open = useFreeBrowseStore((s) => s.sessionDeleteConfirmDialogOpen);
  const setOpen = useFreeBrowseStore((s) => s.setSessionDeleteConfirmDialogOpen);
  const skip = useFreeBrowseStore((s) => s.skipSessionDeleteConfirmation);
  const setSkip = useFreeBrowseStore((s) => s.setSkipSessionDeleteConfirmation);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent onClose={onCancel}>
        <DialogHeader>
          <DialogTitle>Delete this session?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this session? The session folder
            and its contents will be removed from the backend.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="skip-session-delete-confirmation"
            checked={skip}
            onCheckedChange={(checked) => setSkip(checked === true)}
          />
          <Label
            htmlFor="skip-session-delete-confirmation"
            className="text-sm"
          >
            Don't ask me to confirm session deletions
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
