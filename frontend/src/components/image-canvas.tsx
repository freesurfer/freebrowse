"use client";

import { useRef, useEffect, useState } from "react";
import { NiiVue } from "@niivue/niivue";

interface ImageCanvasProps {
  viewMode: "axial" | "coronal" | "sagittal" | "ACS" | "ACSR" | "render";
  nvRef: NiiVue;
}

export default function ImageCanvas({ viewMode, nvRef }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const nv = nvRef;
    console.log("NiiVue attached to canvas", nv);
    if (!canvas) return;
    if (!nv) return;
    nv.attachToCanvas(canvas);
    // Deliberately no `nv.sliceType = ...` here: the view mode is owned by
    // use-viewer-options (app: pushed from the store on init; host-owned
    // instance: read FROM the instance). Setting it on canvas mount would
    // clobber a host's slice type with the store's stale value, because this
    // child effect runs before the parent's init effect.
    setImageLoaded(true);
    // Mount-once: attach the canvas exactly once. Later view-mode changes are
    // applied through use-viewer-options, never by re-attaching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderMultiView = () => {
    // PW: disable for now
    return null;

    if (viewMode !== "ACSR" && viewMode !== "ACS") return null;

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
    );
  };

  const getViewLabel = () => {
    if (viewMode === "ACSR" || viewMode === "ACS") return null;
    return (
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-medium">
        {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="niivue-canvas w-full h-full relative bg-[#111]"
    >
      <canvas ref={canvasRef}></canvas>
      {getViewLabel()}
      {renderMultiView()}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Loading image...
        </div>
      )}
    </div>
  );
}
