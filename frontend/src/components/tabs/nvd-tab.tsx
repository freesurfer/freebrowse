import { ScrollArea } from "@/components/ui/scroll-area";
import { FileList, type FileItem } from "@/components/file-list";
import { dataUrlFrom } from "@/lib/deployment-config";
import { useFreeBrowseConfig } from "@/lib/config-context";

interface NvdTabProps {
  onFileSelect: (file: FileItem) => void;
}

export default function NvdTab({ onFileSelect }: NvdTabProps) {
  const config = useFreeBrowseConfig();
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Backend: NiiVue Documents</h2>
        <p className="text-sm text-muted-foreground">
          Load complete scenes and visualizations
        </p>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 pb-6">
          <FileList
            endpoint={dataUrlFrom(config, "nvd")}
            onFileSelect={onFileSelect}
            emptyMessage="No niivue documents available."
          />
        </div>
      </ScrollArea>
    </div>
  );
}
