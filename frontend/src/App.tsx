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
  }, [])

  useEffect(() => {
    async function loadSceneVolumes() {
      if (!selectedScene || !nvRef.current) return;
      const nv = nvRef.current
      
      console.log(selectedScene.url)
      try {
        const response = await fetch(selectedScene.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        console.log(jsonData.entries.volumeList)
        // Extract volumeList from the JSON data (assuming JSON structure is { entries: { volumeList: [...] } })
        const volumeList = jsonData.entries.volumeList;

        // Pass the volume list to Niivue
        nv.loadVolumes(volumeList);
      } catch (error) {
        console.error("Failed to load the scene volume list:", error);
      }
    }

    loadSceneVolumes();
  }, [selectedScene]);
  
  return (
    <div>
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default App
