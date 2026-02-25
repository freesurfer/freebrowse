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
    ...props 
  }, ref) => {
    
    const [localValue, setLocalValue] = React.useState(value)
    const timeoutRef = React.useRef<NodeJS.Timeout>(undefined)
    
    // Helper function to format the displayed value
    const formatValue = (val: number) => {
      return Number(val.toFixed(decimalPlaces))
    }
    
    // Sync local value when external value changes
    React.useEffect(() => {
      setLocalValue(value)
    }, [value])
    
    const debouncedOnValueChange = React.useCallback((newValue: number) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        onValueChange(newValue)
      }, 50) // 50ms debounce
    }, [onValueChange])
    
    const handleSliderChange = (values: number[]) => {
      const newValue = values[0]
      setLocalValue(newValue)
      debouncedOnValueChange(newValue)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = parseFloat(e.target.value)
      if (!isNaN(inputValue)) {
        // Clamp the value between min and max
        const clampedValue = Math.min(Math.max(inputValue, min), max)
        setLocalValue(clampedValue)
        debouncedOnValueChange(clampedValue)
      }
    }

    const handleInputBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Ensure the input shows the clamped value if user entered something out of range
      const inputValue = parseFloat(e.target.value)
      if (isNaN(inputValue) || inputValue < min || inputValue > max) {
        // Reset to current valid value
        setLocalValue(value)
        e.target.value = value.toString()
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
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="flex-1"
          />
          
          <Input
            type="number"
            value={formatValue(localValue)}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={min}
            max={max}
            step={step}
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