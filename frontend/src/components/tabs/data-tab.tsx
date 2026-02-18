import { ScrollArea } from "@/components/ui/scroll-area";
import { FileList, type FileItem } from "@/components/file-list";

interface DataTabProps {
  onFileSelect: (file: FileItem) => void;
}

export default function DataTab({ onFileSelect }: DataTabProps) {
  return (
    <>
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Imaging Data</h2>
        <p className="text-sm text-muted-foreground">
          Add individual volumes to the current scene
        </p>
      </div>
      <ScrollArea className="h-full">
        <div className="p-4 pb-6">
          <FileList
            endpoint="/imaging"
            onFileSelect={onFileSelect}
            emptyMessage="No imaging files available."
          />
        </div>
      </ScrollArea>
    </>
  );
}
