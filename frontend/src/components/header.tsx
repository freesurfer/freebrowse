import { useFreeBrowseStore } from "@/store";
import { useViewerOptions } from "@/hooks/use-viewer-options";
import {
  PanelLeft,
  PanelRight,
  PanelBottom,
  Settings,
  Moon,
  Sun,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ViewSelector from "@/components/view-selector";
import DragModeSelector from "@/components/drag-mode-selector";
import { cn } from "@/lib/utils";
import type { Niivue } from "@niivue/niivue";

interface HeaderProps {
  nvRef: React.RefObject<Niivue | null>;
}

export default function Header({ nvRef }: HeaderProps) {
  const sidebarOpen = useFreeBrowseStore((s) => s.sidebarOpen);
  const setSidebarOpen = useFreeBrowseStore((s) => s.setSidebarOpen);
  const footerOpen = useFreeBrowseStore((s) => s.footerOpen);
  const setFooterOpen = useFreeBrowseStore((s) => s.setFooterOpen);
  const darkMode = useFreeBrowseStore((s) => s.darkMode);
  const setDarkMode = useFreeBrowseStore((s) => s.setDarkMode);
  const setSettingsDialogOpen = useFreeBrowseStore((s) => s.setSettingsDialogOpen);

  const {
    viewerOptions,
    setViewerOptions,
    handleViewMode,
  } = useViewerOptions(nvRef);

  return (
    <header className="border-b bg-background px-6 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center">
          <Brain className="h-6 w-6 mr-2" />
          <a href="https://github.com/freesurfer/freebrowse" target="_blank" rel="noopener noreferrer">FreeBrowse {__APP_VERSION__}</a>
        </h1>
        <div className="bg-background p-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-1">
              <span className="text-sm font-medium">View:</span>
              <ViewSelector
                currentView={viewerOptions.viewMode}
                onViewChange={handleViewMode}
              />
            </div>
            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-1">
              <span className="text-sm font-medium">Right drag:</span>
              <DragModeSelector
                currentMode={viewerOptions.dragMode}
                onModeChange={(mode) =>
                  setViewerOptions((prev) => ({ ...prev, dragMode: mode }))
                }
                availableModes={["contrast", "pan"]}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelRight className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
            <span className="ml-2 sr-only md:not-sr-only md:inline-block">
              {/*sidebarOpen ? "Hide Sidebar" : "Show Sidebar"*/}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFooterOpen(!footerOpen)}
          >
            <PanelBottom
              className={cn("h-4 w-4", !footerOpen && "rotate-180")}
            />
            <span className="ml-2 sr-only md:not-sr-only md:inline-block">
              {/*footerOpen ? "Hide Footer" : "Show Footer"*/}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
            className="h-8 w-8 p-0"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsDialogOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
