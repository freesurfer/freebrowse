"use client"

import * as React from "react"
import { Label } from "./label"
import { Slider } from "./slider"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface LabeledSliderWithInputProps {
  label: string
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  decimalPlaces?: number
  className?: string
  disabled?: boolean
  scaleTo100?: boolean
}

const LabeledSliderWithInput = React.forwardRef<HTMLDivElement, LabeledSliderWithInputProps>(
  ({ 
    label, 
    value, 
    onValueChange, 
    min = 0, 
    max = 100, 
    step = 1, 
    decimalPlaces = 2,
    className,
    disabled = false,
    scaleTo100 = false,
    ...props 
  }, ref) => {
    
    const toDisplay = (v: number) => {
      if (!scaleTo100) return v
      const range = max - min
      return range > 0 ? ((v - min) / range) * 100 : 0
    }

    const toInternal = (d: number) => {
      if (!scaleTo100) return d
      const range = max - min
      return range > 0 ? min + (d / 100) * range : min
    }

    const [localValue, setLocalValue] = React.useState(toDisplay(value))
    const timeoutRef = React.useRef<NodeJS.Timeout>(undefined)

    const formatValue = (val: number) => {
      return Number(val.toFixed(decimalPlaces))
    }

    React.useEffect(() => {
      setLocalValue(toDisplay(value))
    }, [value, scaleTo100, min, max])
    
    const debouncedOnValueChange = React.useCallback((newValue: number) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        onValueChange(newValue)
      }, 50) // 50ms debounce
    }, [onValueChange])
    
    const handleSliderChange = (values: number[]) => {
      const displayValue = values[0]
      setLocalValue(displayValue)
      debouncedOnValueChange(toInternal(displayValue))
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value)
      if (!isNaN(parsed)) {
        const displayMin = scaleTo100 ? 0 : min
        const displayMax = scaleTo100 ? 100 : max
        const clamped = Math.min(Math.max(parsed, displayMin), displayMax)
        setLocalValue(clamped)
        debouncedOnValueChange(toInternal(clamped))
      }
    }

    const handleInputBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value)
      const displayMin = scaleTo100 ? 0 : min
      const displayMax = scaleTo100 ? 100 : max
      if (isNaN(parsed) || parsed < displayMin || parsed > displayMax) {
        setLocalValue(localValue)
        e.target.value = localValue.toString()
      }
    }

    return (
      <div 
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        <Label className="text-sm font-medium">{label}</Label>
        
        <div className="flex items-center space-x-3">
          <Slider
            value={[localValue]}
            onValueChange={handleSliderChange}
            min={scaleTo100 ? 0 : min}
            max={scaleTo100 ? 100 : max}
            step={scaleTo100 ? 0.1 : step}
            disabled={disabled}
            className="flex-1"
          />

          <Input
            type="number"
            value={formatValue(localValue)}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={scaleTo100 ? 0 : min}
            max={scaleTo100 ? 100 : max}
            step={scaleTo100 ? 0.1 : step}
            disabled={disabled}
            className="w-20 text-center"
          />
        </div>
      </div>
    )
  }
)

LabeledSliderWithInput.displayName = "LabeledSliderWithInput"

export { LabeledSliderWithInput }