import { useRef, useEffect, useContext } from 'react'
import { Niivue } from '@niivue/niivue'
import './App.css'
import { SceneContext } from './SceneContext';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nvRef = useRef<Niivue | null>(new Niivue())
  const { selectedScene } = useContext(SceneContext);

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
        //url: 'data/mni152.nii.gz',
        // this works
        url: 'public/mni152.nii.gz',
        colormap: 'gray',
        visible: true,
        opacity: 1
      }
    ]
    
    // Load the volumes
    nv.loadVolumes(volumeList)
    
  }, [])

  useEffect(() => {
    if (!selectedScene || !nvRef.current) return;

    // Here you update the volume when a new scene is selected.
    // Customize this object to use the appropriate data from selectedScene.
    console.log("HERE!!!")
  }, [selectedScene]);
  
  return (
    <div>
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default App
