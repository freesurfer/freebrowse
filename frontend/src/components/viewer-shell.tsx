import { useRef } from "react";
import { useFreeBrowseStore } from "@/store";
import { cn } from "@/lib/utils";
import type { NiiVue } from "@niivue/niivue";
import type { ViewMode } from "@/store/types";
import Header from "./header";
import Footer from "./footer";
import CanvasArea from "./canvas-area";

interface ViewerShellProps {
  nvInstance: NiiVue;
  viewMode: ViewMode;
  onFileUpload: (files: File[]) => Promise<void>;
  sidebar?: React.ReactNode;
  dialogs?: React.ReactNode;
  hiddenInputs?: React.ReactNode;
  nvCanvasEmptyState?: React.ReactNode;
}

export default function ViewerShell({
  nvInstance,
  viewMode,
  onFileUpload,
  sidebar,
  dialogs,
  hiddenInputs,
  nvCanvasEmptyState,
}: ViewerShellProps) {
  const sidebarOpen = useFreeBrowseStore((s) => s.sidebarOpen);
  const footerOpen = useFreeBrowseStore((s) => s.footerOpen);
  const darkMode = useFreeBrowseStore((s) => s.darkMode);

  const nvRef = useRef<NiiVue | null>(nvInstance);
  nvRef.current = nvInstance;

  // `freebrowse-root` scopes every style (tokens, reset, the `dark:` variant —
  // see styles/lib.css) and `relative` contains the dialogs' absolute overlay,
  // so an embedding host's page is never touched. Dark mode is a class on THIS
  // element, not on <html>.
  return (
    <div
      className={cn(
        "freebrowse-root relative flex h-full flex-col",
        darkMode && "dark",
      )}
    >
      <Header nvRef={nvRef} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col min-h-0">
          <CanvasArea
            nvInstance={nvInstance}
            viewMode={viewMode}
            onFileUpload={onFileUpload}
            nvCanvasEmptyState={nvCanvasEmptyState}
          />

          {footerOpen && <Footer />}
        </div>

        {sidebarOpen && sidebar}
      </div>

      {hiddenInputs}
      {dialogs}
    </div>
  );
}
