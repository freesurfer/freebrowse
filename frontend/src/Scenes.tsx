import React, { useEffect, useState, useContext } from 'react'
import { SceneContext } from './SceneContext';
import { Scene } from './SceneContext';

const SceneList: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const { setSelectedScene } = useContext(SceneContext);

  useEffect(() => {
    // Define an async function to fetch scene data
    const fetchScenes = async () => {
      setLoading(true)
      try {
        // Adjust the URL to match the backend endpoint you've set up.
        const response = await fetch('/scenes')
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        // Assume the backend returns an array of scenes.
        const data: Scene[] = await response.json()
        console.log(data)
        setScenes(data)
      } catch (err: any) {
        console.error('Error fetching scenes:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchScenes()
  }, [])

  return (
    <div>
      <h2>Niivue Scenes</h2>
      {loading && <p>Loading scenes...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && (scenes.length > 0 ? (
        <ul>
          {scenes.map((scene, index) => (
            <li
              key={index}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedScene(scene)}
            >
              {scene.filename}
            </li>
          ))}
        </ul>
      ) : (
        <p>No scenes available.</p>
      ))}
    </div>
  )
}

export default SceneList
