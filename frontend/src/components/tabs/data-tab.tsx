import { ScrollArea } from "@/components/ui/scroll-area";
import { FileList, type FileItem } from "@/components/file-list";

interface DataTabProps {
  onFileSelect: (file: FileItem) => void;
}

export default function DataTab({ onFileSelect }: DataTabProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Backend: Imaging Data</h2>
        <p className="text-sm text-muted-foreground">
          Add individual volumes to the current scene
        </p>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 pb-6">
          <FileList
            endpoint="/data/vol"
            onFileSelect={onFileSelect}
            emptyMessage="No imaging files available."
          />
        </div>
      </ScrollArea>
    </div>
  );
}
