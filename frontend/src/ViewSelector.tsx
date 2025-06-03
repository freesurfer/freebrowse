"use client"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Layers, Layers3, SplitSquareVertical, Grid3X3 } from "lucide-react"

type ViewMode = "axial" | "coronal" | "sagittal" | "multi" | "render"

// const sliceTypeMap: {[type: string]: number} = {
//   "Axial": 0,
//   "Coronal": 1,
//   "Sagittal": 2,
//   "Render": 4,
//   "A+C+S+R": 3
// };

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
          <Layers className="h-4 w-4 mr-1" />
          <span className="sr-only sm:not-sr-only sm:inline-block text-xs">Axial</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="coronal" aria-label="Coronal view" title="Coronal view">
          <SplitSquareVertical className="h-4 w-4 mr-1" />
          <span className="sr-only sm:not-sr-only sm:inline-block text-xs">Coronal</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="sagittal" aria-label="Sagittal view" title="Sagittal view">
          <Layers3 className="h-4 w-4 mr-1" />
          <span className="sr-only sm:not-sr-only sm:inline-block text-xs">Sagittal</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="multi" aria-label="Multi view" title="Multi view">
          <Grid3X3 className="h-4 w-4 mr-1" />
          <span className="sr-only sm:not-sr-only sm:inline-block text-xs">Multi</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
