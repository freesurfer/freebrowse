import { ScrollArea } from "@/components/ui/scroll-area";
import { FileList, type FileItem } from "@/components/file-list";

interface NvdTabProps {
  onFileSelect: (file: FileItem) => void;
}

export default function NvdTab({ onFileSelect }: NvdTabProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">NiiVue Documents</h2>
        <p className="text-sm text-muted-foreground">
          Load complete scenes and visualizations
        </p>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 pb-6">
          <FileList
            endpoint="/data/nvd"
            onFileSelect={onFileSelect}
            emptyMessage="No niivue documents available."
          />
        </div>
      </ScrollArea>
    </div>
  );
}
