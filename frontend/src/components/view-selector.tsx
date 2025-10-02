"use client"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Layers, Layers3, SplitSquareVertical, Columns3, Grid2X2, Box } from "lucide-react"
import axialIcon from "/assets/images/axialSlice24.png";
import coronalIcon from "/assets/images/coronalSlice24.png";
import sagittalIcon from "/assets/images/sagittalSlice24.png";

export type ViewMode = "axial" | "coronal" | "sagittal" | "ACS" | "ACSR" | "render"

interface ViewSelectorProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

export default function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  return (
    <div className="flex items-center">
      <ToggleGroup
        type="single"
        value={currentView}
        onValueChange={(value) => value && onViewChange(value as ViewMode)}
      >
        <ToggleGroupItem value="axial" aria-label="Axial view" title="Axial view">
          <img src={axialIcon} alt="axial" />
          <span className="sr-only sm:not-sr-only sm:inline-block text-xs">Axial</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="coronal" aria-label="Coronal view" title="Coronal view">
          <img src={coronalIcon} alt="coronal" />
          <span className="sr-only sm:not-sr-only sm:inline-block text-xs">Coronal</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="sagittal" aria-label="Sagittal view" title="Sagittal view">
          <img src={sagittalIcon} alt="sagittal" />
          <span className="sr-only sm:not-sr-only sm:inline-block text-xs">Sagittal</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="render" aria-label="Render view" title="Render view">
          <Box className="h-4 w-4 mr-1" />
          <span className="sr-only sm:not-sr-only sm:inline-block text-xs">Render</span>
        </ToggleGroupItem>          
        <ToggleGroupItem value="ACS" aria-label="Multi view" title="Multi view">
          <Columns3 className="h-4 w-4 mr-1" />
          <span className="sr-only sm:not-sr-only sm:inline-block text-xs">ACS</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="ACSR" aria-label="Multi+Render" title="Multi+Render">
          <Grid2X2 className="h-4 w-4 mr-1" />
          <span className="sr-only sm:not-sr-only sm:inline-block text-xs">ACSR</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
