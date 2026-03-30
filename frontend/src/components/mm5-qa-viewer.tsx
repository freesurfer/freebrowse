import { useRef } from "react";
import { useViewerOptions } from "@/hooks/use-viewer-options";
import { useLocation } from "@/hooks/use-location";
import { useVolumes } from "@/hooks/use-volumes";
import { useFileLoading } from "@/hooks/use-file-loading";
import { useMM5Qa } from "@/hooks/use-mm5-qa";
import { Niivue } from "@niivue/niivue";
import { ClipboardCheck } from "lucide-react";
import "../App.css";
import ViewerShell from "./viewer-shell";
import MM5QaSidebar from "./mm5-qa-sidebar";
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

export default function MM5QaViewer() {
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
    handleFileUpload,
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
    mm5QaState,
    setMM5QaState,
    initSession,
    submitRating,
    advanceToNextSample,
    toggleSegOverlay,
    handleEndSession,
    handleContrastMinChange,
    handleContrastMaxChange,
  } = useMM5Qa(nvRef);

  return (
    <ViewerShell
      nvInstance={nv}
      viewMode={viewerOptions.viewMode}
      onFileUpload={handleFileUpload}
      sidebar={
        <MM5QaSidebar
          mm5QaState={mm5QaState}
          onMM5QaStateChange={setMM5QaState}
          onInitSession={initSession}
          onSubmitRating={submitRating}
          onAdvance={advanceToNextSample}
          onToggleSegOverlay={toggleSegOverlay}
          onEndSession={handleEndSession}
          onContrastMinChange={handleContrastMinChange}
          onContrastMaxChange={handleContrastMaxChange}
        />
      }
      dialogs={<SettingsDialog nvRef={nvRef} />}
      nvCanvasEmptyState={
        <div className="flex flex-col items-center justify-center gap-4 text-center max-w-xl mx-auto">
          <div className="rounded-full bg-background p-3 shadow-sm">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold">Initiate MM5 QA using the sidebar on the right</p>
        </div>
      }
    />
  );
}
