"use client"

import { useRef, useEffect, useState, useContext } from "react"
import { SceneContext } from '../Scenes';
import { Niivue, NVImage, SHOW_RENDER } from '@niivue/niivue'

interface ImageCanvasProps {
  viewMode: "axial" | "coronal" | "sagittal" | "ACS" | "ACSR" | "render"
  nvRef: Niivue
}

export const sliceTypeMap: {[type: string]: {sliceType: number, showRender: number}} = {
  "axial": { sliceType: 0, showRender: SHOW_RENDER.NEVER },
  "coronal": { sliceType: 1, showRender: SHOW_RENDER.NEVER },
  "sagittal": { sliceType: 2, showRender: SHOW_RENDER.NEVER },
  "ACS": { sliceType: 3, showRender: SHOW_RENDER.NEVER },
  "ACSR": { sliceType: 3, showRender: SHOW_RENDER.ALWAYS },
  "render": { sliceType: 4, showRender: SHOW_RENDER.ALWAYS }
};

export default function ImageCanvas({ viewMode, nvRef }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  // const nvRef = useRef<Niivue | null>(new Niivue())
  const { selectedScene } = useContext(SceneContext);

  useEffect(() => {
    const canvas = canvasRef.current
    const nv = nvRef
    console.log("Niivue attached to canvas", nv)
    if (!canvas) return
    if (!nv) return
    nv.attachToCanvas(canvas)
    nv.setSliceType(sliceTypeMap[viewMode]?.sliceType || 0) // Default to axial if viewMode is invalid;
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

  const renderMultiView = () => {
    // PW: disable for now
    return null

    if (viewMode !== "ACSR" && viewMode !== "ACS") return null

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
    if (viewMode === "ACSR" || viewMode === "ACS") return null
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
