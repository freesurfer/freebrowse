import { useEffect, useRef } from "react";
import { registerNiiVueEvents } from "@/store/niivue-sync";
import { createStoreSyncTarget } from "@/store/niivue-store-sync";
import { useViewerOptions } from "@/hooks/use-viewer-options";
import { useVolumes } from "@/hooks/use-volumes";
import { useFileLoading } from "@/hooks/use-file-loading";
import type { NiiVue } from "@niivue/niivue";
import { PanelRight } from "lucide-react";
import ViewerShell from "./viewer-shell";
import QaSidebar from "./qa-sidebar";
import SettingsDialog from "./dialogs/settings-dialog";

const noopSurface = () => {};

export interface QaViewerProps {
  /** Instance for the QA route; the app builds it with `QA_VIEWER_NIIVUE_OPTIONS`. */
  nv: NiiVue;
}

export default function QaViewer({ nv }: QaViewerProps) {
  const nvRef = useRef<NiiVue | null>(nv);
  nvRef.current = nv;

  // Event-driven store sync for this viewer's instance (see FreeBrowse).
  useEffect(() => {
    return registerNiiVueEvents(nv, createStoreSyncTarget(nv));
  }, [nv]);

  const {
    viewerOptions,
    applyViewerOptions,
    syncViewerOptionsFromNiiVue,
    debouncedGLUpdate,
  } = useViewerOptions(nvRef, "apply");
  useVolumes(nvRef, debouncedGLUpdate, noopSurface);
  const { handleFileUpload } = useFileLoading(
    nvRef,
    applyViewerOptions,
    syncViewerOptionsFromNiiVue,
    () => {},
  );

  return (
    <ViewerShell
      nvInstance={nv}
      viewMode={viewerOptions.viewMode}
      onFileUpload={handleFileUpload}
      sidebar={<QaSidebar />}
      dialogs={<SettingsDialog nvRef={nvRef} />}
      nvCanvasEmptyState={
        <div className="flex flex-col items-center justify-center gap-4 text-center max-w-xl mx-auto">
          <div className="rounded-full bg-background p-3 shadow-sm">
            <PanelRight className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold">
            Initiate QA process using the sidebar on the right
          </p>
        </div>
      }
    />
  );
}
