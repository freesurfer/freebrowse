import { useRef, useEffect, useContext } from 'react'
import { Niivue } from '@niivue/niivue'
import './App.css'
import { SceneContext } from './Scenes';

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
    async function loadScene() {
      if (!selectedScene || !nvRef.current) return;
      const nv = nvRef.current

      console.log(selectedScene.url)
      try {
        const response = await fetch(selectedScene.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();
        //console.log(jsonData.niivueParameters.volumeList)

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

      } catch (error) {
        console.error("Failed to load the scene:", error);
      }
    }

    loadScene();
  }, [selectedScene]);

  return (
    <div className="niivue-canvas">
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default App
