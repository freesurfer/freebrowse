"use client"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Move, Contrast, Ruler, MousePointer, Crosshair, CircleDot, Square, Maximize2 } from "lucide-react"
import { DRAG_MODE_SECONDARY } from '@niivue/niivue'

export type DragMode = keyof typeof DRAG_MODE_SECONDARY

interface DragModeSelectorProps {
  currentMode: DragMode
  onModeChange: (mode: DragMode) => void
  availableModes?: DragMode[]
}

const dragModeConfig: Record<DragMode, { icon: React.FC<{ className?: string }>, label: string, displayName: string }> = {
  none: { icon: MousePointer, label: "None", displayName: "none" },
  contrast: { icon: Contrast, label: "Contrast", displayName: "contrast" },
  measurement: { icon: Ruler, label: "Measurement", displayName: "measurement" },
  pan: { icon: Move, label: "Pan/Zoom", displayName: "pan/zoom" },
  slicer3D: { icon: Maximize2, label: "Slicer 3D", displayName: "slicer3D" },
  callbackOnly: { icon: CircleDot, label: "Callback Only", displayName: "callbackOnly" },
  roiSelection: { icon: Square, label: "ROI Selection", displayName: "roiSelection" }
}

const defaultAvailableModes: DragMode[] = Object.keys(DRAG_MODE_SECONDARY).filter(
  key => isNaN(Number(key))
) as DragMode[]

export default function DragModeSelector({ 
  currentMode, 
  onModeChange, 
  availableModes = defaultAvailableModes 
}: DragModeSelectorProps) {
  return (
    <div className="flex items-center">
      <ToggleGroup
        type="single"
        value={currentMode}
        onValueChange={(value) => value && onModeChange(value as DragMode)}
      >
        {availableModes.map((mode) => {
          const config = dragModeConfig[mode]
          const Icon = config.icon
          return (
            <ToggleGroupItem 
              key={mode}
              value={mode} 
              aria-label={config.label} 
              title={config.label}
            >
              <Icon className="h-4 w-4 mr-1" />
              <span className="sr-only sm:not-sr-only sm:inline-block text-xs">{config.displayName}</span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}