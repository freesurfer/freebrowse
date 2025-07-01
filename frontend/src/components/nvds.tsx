import React, { createContext, useEffect, useState, useContext, ReactNode } from 'react'

export interface Nvd {
  filename: string;
  url: string;
}

interface NvdContextProps {
  selectedNvd: Nvd | null;
  setSelectedNvd: (nvd: Nvd) => void;
}

export const NvdContext = createContext<NvdContextProps>({
  selectedNvd: null,
  setSelectedNvd: () => {},
});

export const NvdProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedNvd, setSelectedNvd] = useState<Nvd | null>(null);

  return (
    <SceneContext.Provider value={{ selectedScene, setSelectedScene }}>
      {children}
    </SceneContext.Provider>
  );
};

export const NvdList: React.FC = () => {
  const [nvds, setNvds] = useState<Nvd[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const { setSelectedNvd } = useContext(NvdContext);

  useEffect(() => {
    // Define an async function to fetch scene data
    const fetchNvds = async () => {
      setLoading(true)
      try {
        // Adjust the URL to match the backend endpoint you've set up.
        const response = await fetch('/nvd')
        console.log(response)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        // Assume the backend returns an array of niivue documents.
        const data: Nvd[] = await response.json()
        console.log(data)
        setNvds(data)
      } catch (err: any) {
        console.error('Error fetching scenes:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchNvds()
  }, [])

  return (
    <div>
      <h2 >Niivue Documents</h2>
      {loading && <p>Loading List...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && (nvds.length > 0 ? (
        <ul>
          {nvds.map((nvd, index) => (
            <li
              key={index}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedNvd(nvd)}
            >
              {nvd.filename}
            </li>
          ))}
        </ul>
      ) : (
        <p>No niivue documents available.</p>
      ))}
    </div>
  )
}

export default NvdList
