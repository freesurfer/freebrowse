"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ImageCanvasProps {
  imageUrl: string
  zoom: number
  viewMode: "axial" | "coronal" | "sagittal" | "multi"
}

export default function ImageCanvas({ imageUrl, zoom, viewMode }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Load the image
  useEffect(() => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src = imageUrl

    image.onload = () => {
      imageRef.current = image
      setImageLoaded(true)
      setPosition({ x: 0, y: 0 }) // Reset position when new image is loaded
      drawImage()
    }

    return () => {
      if (imageRef.current) {
        imageRef.current.onload = null
      }
    }
  }, [imageUrl])

  // Redraw when zoom or position changes
  useEffect(() => {
    if (imageLoaded) {
      drawImage()
    }
  }, [zoom, position, imageLoaded])

  const drawImage = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const image = imageRef.current

    if (!canvas || !ctx || !image) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate scaled dimensions
    const scale = zoom / 100
    const scaledWidth = image.width * scale
    const scaledHeight = image.height * scale

    // Center the image initially
    const centerX = (canvas.width - scaledWidth) / 2
    const centerY = (canvas.height - scaledHeight) / 2

    // Draw with position offset
    ctx.drawImage(image, centerX + position.x, centerY + position.y, scaledWidth, scaledHeight)
  }

  // Handle canvas resize
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current
      const container = containerRef.current

      if (canvas && container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight

        if (imageLoaded) {
          drawImage()
        }
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [imageLoaded])

  // Mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPosition({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    setPosition({
      x: e.clientX - startPosition.x,
      y: e.clientY - startPosition.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const renderMultiView = () => {
    if (viewMode !== "multi") return null

    return (
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-1 absolute top-0 left-0 pointer-events-none">
        <div className="border border-primary/30 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">Axial</span>
        </div>
        <div className="border border-primary/30 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">Coronal</span>
        </div>
        <div className="border border-primary/30 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">Sagittal</span>
        </div>
        <div className="border border-primary/30 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">3D</span>
        </div>
      </div>
    )
  }

  const getViewLabel = () => {
    if (viewMode === "multi") return null
    return (
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-medium">
        {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#111]">
      <canvas
        ref={canvasRef}
        className={cn("w-full h-full", isDragging ? "cursor-grabbing" : "cursor-grab")}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {getViewLabel()}
      {renderMultiView()}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white">Loading image...</div>
      )}
    </div>
  )
}
