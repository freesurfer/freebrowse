import { useRef } from "react";
import { useViewerOptions } from "@/hooks/use-viewer-options";
import { useLocation } from "@/hooks/use-location";
import { useVolumes } from "@/hooks/use-volumes";
import { useFileLoading } from "@/hooks/use-file-loading";
import { useElucidQa } from "@/hooks/use-elucid-qa";
import { Niivue } from "@niivue/niivue";
import { PanelRight } from "lucide-react";
import "../App.css";
import ViewerShell from "./viewer-shell";
import ElucidQaSidebar from "./elucid-qa-sidebar";
import SettingsDialog from "./dialogs/settings-dialog";

const nv = new Niivue({
  loadingText: "",
  dragAndDropEnabled: false,
  textHeight: 0.02,
  backColor: [0, 0, 0, 1],
  crosshairColor: [1.0, 0.88, 0.88, 1.0],
  crosshairWidth: 0.3,
  crosshairGap: 10,
  multiplanarForceRender: false,
});

const noopSurface = () => {};

export default function ElucidQaViewer() {
  const nvRef = useRef<Niivue | null>(nv);

  const {
    viewerOptions,
    applyViewerOptions,
    syncViewerOptionsFromNiivue,
    debouncedGLUpdate,
  } = useViewerOptions(nvRef);
  const { handleLocationChange } = useLocation(nvRef);
  const { updateImageDetails } = useVolumes(
    nvRef,
    debouncedGLUpdate,
    handleLocationChange,
    noopSurface,
  );
  const {
    fileInputRef,
    handleFileUpload,
    handleFileChange,
  } = useFileLoading(
    nvRef,
    applyViewerOptions,
    syncViewerOptionsFromNiivue,
    updateImageDetails,
    () => {},
    handleLocationChange,
    () => {},
  );
  const {
    elucidQaState,
    setElucidQaState,
    initSession,
    submitRating,
    advanceToNextVolume,
    handleEndSession,
  } = useElucidQa(nvRef);

  return (
    <ViewerShell
      nvInstance={nv}
      viewMode={viewerOptions.viewMode}
      onFileUpload={handleFileUpload}
      sidebar={
        <ElucidQaSidebar
          elucidQaState={elucidQaState}
          onElucidQaStateChange={setElucidQaState}
          onInitSession={initSession}
          onSubmitRating={submitRating}
          onAdvance={advanceToNextVolume}
          onEndSession={handleEndSession}
        />
      }
      dialogs={<SettingsDialog nvRef={nvRef} />}
      nvCanvasEmptyState={
        <div className="flex flex-col items-center justify-center gap-4 text-center max-w-xl mx-auto">
          <div className="rounded-full bg-background p-3 shadow-sm">
            <PanelRight className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold">Initiate Elucid QA using the sidebar on the right</p>
        </div>
      }
    />
  );
}
