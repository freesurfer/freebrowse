import React, { useEffect, useState } from 'react'

export interface FileItem {
  filename: string;
  url: string;
}

interface FileListProps {
  endpoint: string;
  onFileSelect: (file: FileItem) => void;
  emptyMessage?: string;
}

export const FileList: React.FC<FileListProps> = ({ 
  endpoint, 
  onFileSelect,
  emptyMessage = "No files available."
}) => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // Define an async function to fetch file list
    const fetchFiles = async () => {
      setLoading(true)
      try {
        const response = await fetch(endpoint)
        console.log(`Fetching from ${endpoint}:`, response)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data: FileItem[] = await response.json()
        console.log(`Files from ${endpoint}:`, data)
        setFiles(data)
      } catch (err: any) {
        console.error(`Error fetching files from ${endpoint}:`, err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchFiles()
  }, [endpoint])

  return (
    <div>
      {loading && <p>Loading List...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && (files.length > 0 ? (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li
              key={index}
              className="cursor-pointer px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => onFileSelect(file)}
            >
              {file.filename}
            </li>
          ))}
        </ul>
      ) : (
        <p>{emptyMessage}</p>
      ))}
    </div>
  )
}

export default FileList