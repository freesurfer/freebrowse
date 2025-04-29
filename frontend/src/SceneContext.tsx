import React, { createContext, useState, ReactNode } from 'react'

export interface Scene {
  filename: string;
  url: string;
}

interface SceneContextProps {
  selectedScene: Scene | null;
  setSelectedScene: (scene: Scene) => void;
}

export const SceneContext = createContext<SceneContextProps>({
  selectedScene: null,
  setSelectedScene: () => {},
});

export const SceneProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);

  return (
    <SceneContext.Provider value={{ selectedScene, setSelectedScene }}>
      {children}
    </SceneContext.Provider>
  );
};
