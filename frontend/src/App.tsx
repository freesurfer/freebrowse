import { useRef, useEffect } from 'react'
import { Niivue } from '@niivue/niivue'
import './App.css'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nvRef = useRef<Niivue | null>(new Niivue())

  useEffect(() => {
    const canvas = canvasRef.current
    const nv = nvRef.current
    if (!canvas) return
    if (!nv) return
    nv.attachToCanvas(canvas)
    
    // Define the volume list
    var volumeList = [
      {
        // this doesn't work
        //url: 'images/mni152.nii.gz',
        // this works
        //url: 'https://niivue.github.io/niivue/images/mni152.nii.gz',
        colormap: 'gray',
        visible: true,
        opacity: 1
      }
    ]
    
    // Load the volumes
    nv.loadVolumes(volumeList)
    
  }, [])

  return (
    <div>
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default App
