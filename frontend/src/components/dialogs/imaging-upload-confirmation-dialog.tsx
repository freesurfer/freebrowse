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

interface ImagingUploadConfirmationDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ImagingUploadConfirmationDialog({
  onConfirm,
  onCancel,
}: ImagingUploadConfirmationDialogProps) {
  const open = useFreeBrowseStore((s) => s.imagingUploadConfirmDialogOpen);
  const setOpen = useFreeBrowseStore((s) => s.setImagingUploadConfirmDialogOpen);
  const skip = useFreeBrowseStore((s) => s.skipImagingUploadConfirmation);
  const setSkip = useFreeBrowseStore((s) => s.setSkipImagingUploadConfirmation);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent onClose={onCancel}>
        <DialogHeader>
          <DialogTitle>Upload imaging data to backend?</DialogTitle>
          <DialogDescription>
            Warning: this operation will transfer imaging data to the backend
            server. Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="skip-imaging-upload-confirmation"
            checked={skip}
            onCheckedChange={(checked) => setSkip(checked === true)}
          />
          <Label
            htmlFor="skip-imaging-upload-confirmation"
            className="text-sm"
          >
            Don't ask me again to confirm imaging data uploads
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
