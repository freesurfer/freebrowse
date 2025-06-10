"use client"

import type React from "react"

import { useRef, useEffect, useState, useContext } from "react"
import { cn } from "@/lib/utils"
import { SceneContext } from '../Scenes';
import { Niivue, NVImage } from '@niivue/niivue'

interface ImageCanvasProps {
  imageUrl: string
  zoom: number
  viewMode: "axial" | "coronal" | "sagittal" | "multi" | "render"
  nvRef: Niivue
}

export const sliceTypeMap: {[type: string]: number} = {
  "axial": 0,
  "coronal": 1,
  "sagittal": 2,
  "multi": 3,
  "render": 4
};

export default function ImageCanvas({ imageUrl, zoom, viewMode, nvRef }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)
  // const nvRef = useRef<Niivue | null>(new Niivue())
  const { selectedScene } = useContext(SceneContext);

  useEffect(() => {
    const canvas = canvasRef.current
    const nv = nvRef
    console.log("Niivue attached to canvas", nv)
    if (!canvas) return
    if (!nv) return
    nv.attachToCanvas(canvas)
    nv.setSliceType(sliceTypeMap[viewMode] || 0) // Default to axial if viewMode is invalid;
    setImageLoaded(true)
  }, [])

  useEffect(() => {
    async function loadScene() {
      if (!selectedScene || !nvRef) return;
      const nv = nvRef

      console.log(selectedScene.url)
      try {
        const response = await fetch(selectedScene.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();
        console.log(jsonData.niivueParameters.volumeList)

        const niiVueVolumeList = jsonData.niivueParameters.volumeList;
        //console.log(volumeList)

        const niiVueMeshList = jsonData.niivueParameters.meshList;
        //console.log(meshList)

        const niiVueOptions = jsonData.niivueParameters.options;
        //console.log(options)

        // let niiVueSliceType = sliceTypeMap[jsonData.niivueParameters.sliceType]
        // //console.log(niiVueSliceType)
        // if (niiVueSliceType < 0 || niiVueSliceType > 4) {
        //   console.log("warning: invalid niiVueSliceType")
        //   console.log(niiVueSliceType)
        //   niiVueSliceType = 0
        // }


        niiVueVolumeList ? nv.loadVolumes(niiVueVolumeList) : nv.loadVolumes([])
        niiVueMeshList ? nv.loadMeshes(niiVueMeshList) : nv.loadMeshes([])
        //available options: https://niivue.github.io/niivue/devdocs/types/NVConfigOptions.html
        niiVueOptions ? nv.setDefaults(niiVueOptions) : nv.setDefaults({})
        // niiVueSliceType ? nv.setSliceType(niiVueSliceType) : nv.setSliceType(-1)

      } catch (error) {
        console.error("Failed to load the scene:", error);
      }
    }

    loadScene();
  }, [selectedScene]);

  // Load the image
  // useEffect(() => {
  //   const image = new Image()
  //   image.crossOrigin = "anonymous"
  //   image.src = imageUrl

  //   image.onload = () => {
  //     imageRef.current = image
  //     setImageLoaded(true)
  //     setPosition({ x: 0, y: 0 }) // Reset position when new image is loaded
  //     drawImage()
  //   }

  //   return () => {
  //     if (imageRef.current) {
  //       imageRef.current.onload = null
  //     }
  //   }
  // }, [imageUrl])

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
    <div ref={containerRef} className="niivue-canvas w-full h-full relative bg-[#111]">
        <canvas ref={canvasRef}></canvas>
      {getViewLabel()}
      {renderMultiView()}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white">Loading image...</div>
      )}
    </div>
  )
}
