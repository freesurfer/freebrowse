import React, { createContext, useState, useContext, ReactNode } from 'react'
import { FileList, type FileItem } from './file-list'

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
    <NvdContext.Provider value={{ selectedNvd, setSelectedNvd }}>
      {children}
    </NvdContext.Provider>
  );
};

export const NvdList: React.FC = () => {
  const { setSelectedNvd } = useContext(NvdContext);

  return (
    <FileList
      endpoint="/nvd"
      onFileSelect={(file: FileItem) => setSelectedNvd(file)}
      emptyMessage="No niivue documents available."
    />
  )
}

export default NvdList
