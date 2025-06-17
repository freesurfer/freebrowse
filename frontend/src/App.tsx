import { useRef, useEffect, useContext } from 'react'
import { Niivue } from '@niivue/niivue'
import './App.css'
import { SceneContext } from './Scenes';

// This should probably live somewhere else
const sliceTypeMap: {[type: string]: number} = {
  "Axial": 0,
  "Coronal": 1,
  "Sagittal": 2,
  "Render": 4,
  "A+C+S+R": 3
};

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

        let niiVueSliceType = sliceTypeMap[jsonData.niivueParameters.sliceType]
        //console.log(niiVueSliceType)
        if (niiVueSliceType < 0 || niiVueSliceType > 4) {
          console.log("warning: invalid niiVueSliceType")
          console.log(niiVueSliceType)
          niiVueSliceType = 0
        }


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

  return (
    <div className="niivue-canvas">
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default App
