// import { StrictMode } from 'react'
import React from 'react';
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import FreeBrowse from './components/freebrowse.tsx';

// Get base path from Vite's base config (import.meta.env.BASE_URL)
// This is automatically set by Vite based on the `base` config option
const basename = import.meta.env.BASE_URL;

createRoot(document.getElementById('root')!).render(
  // disable strict mode for for better niivue development experience
  // <StrictMode>
  <BrowserRouter basename={basename}>
    <Routes>
      <Route path="/" element={
         <div className="app-container">
           <div className="main-content">
             <FreeBrowse />
           </div>
         </div>
      } />
    </Routes>
  </BrowserRouter>
  // </StrictMode>,

)
