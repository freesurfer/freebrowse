import React, { useEffect, useState } from 'react'

interface Scene {
  filename: string
7}

const SceneList: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

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
            <li key={index}>{scene.name}</li>
          ))}
        </ul>
      ) : (
        <p>No scenes available.</p>
      ))}
    </div>
  )
}

export default SceneList
