import { useEffect, useRef } from "react";
import { useFreeBrowseStore } from "@/store";
import type { Niivue } from "@niivue/niivue";
import type { ViewMode } from "@/store/types";
import Header from "./header";
import Footer from "./footer";
import CanvasArea from "./canvas-area";

interface ViewerShellProps {
  nvInstance: Niivue;
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

  const nvRef = useRef<Niivue | null>(nvInstance);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="flex h-full flex-col">
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
