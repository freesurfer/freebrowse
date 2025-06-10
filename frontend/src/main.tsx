// import { StrictMode } from 'react'
import React from 'react';
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SceneList, SceneProvider } from './Scenes';
import MedicalImageProcessor from './components/image-processor.tsx';

createRoot(document.getElementById('root')!).render(
  // disable strict mode for for better niivue development experience
  // <StrictMode>
  <SceneProvider>
    <div className="app-container">
      <div className="sidebar">
        <SceneList />
      </div>
      <div className="main-content">
        <MedicalImageProcessor />
      </div>
    </div>
  </SceneProvider>
  // </StrictMode>,

)
