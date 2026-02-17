import { useFreeBrowseStore } from "@/store";
import ImageUploader from "./image-uploader";
import ImageCanvas from "./image-canvas";
import type { ViewMode } from "@/store/types";
import type { Niivue } from "@niivue/niivue";

interface CanvasAreaProps {
  nvInstance: Niivue;
  viewMode: ViewMode;
  onFileUpload: (files: File[]) => void;
}

export default function CanvasArea({ nvInstance, viewMode, onFileUpload }: CanvasAreaProps) {
  const showUploader = useFreeBrowseStore((s) => s.showUploader);

  return (
    <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
      {showUploader ? (
        <div className="flex flex-1 items-center justify-center">
          <ImageUploader onUpload={onFileUpload} />
        </div>
      ) : (
        <div className="flex flex-1">
          <ImageCanvas viewMode={viewMode} nvRef={nvInstance} />
        </div>
      )}
    </main>
  );
}
