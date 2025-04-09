// import { StrictMode } from 'react'
import React from 'react';
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import SceneList from './Scenes';
import { SceneProvider } from './SceneContext';

createRoot(document.getElementById('root')!).render(
  // disable strict mode for for better niivue development experience
  // <StrictMode>
  //<div>
  //  <App />
  //  <Scenes />
  //</div>
  // </StrictMode>,

  // disable strict mode for for better niivue development experience
  // <StrictMode>
  <SceneProvider>
    <div>
      <App />
      <SceneList />
    </div>
  </SceneProvider>
  // </StrictMode>,

)
