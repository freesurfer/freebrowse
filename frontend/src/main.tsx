// import { StrictMode } from 'react'
import React from 'react';
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { SceneList, SceneProvider } from './Scenes';
import MedicalImageProcessor from './components/image-processor.tsx';
import NvdViewer from './components/nvd-viewer.tsx';

createRoot(document.getElementById('root')!).render(
  // disable strict mode for for better niivue development experience
  // <StrictMode>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={
        <SceneProvider>
          <div className="app-container">
            <div className="main-content">
              <MedicalImageProcessor />
            </div>
          </div>
        </SceneProvider>
      } />
      <Route path="/ui" element={
         <div className="app-container">
           <div className="main-content">
             <NvdViewer />
           </div>
         </div>
      } />
    </Routes>
  </BrowserRouter>
  // </StrictMode>,

)
