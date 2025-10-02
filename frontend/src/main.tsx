// import { StrictMode } from 'react'
import React from 'react';
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import FreeBrowse from './components/freebrowse.tsx';

createRoot(document.getElementById('root')!).render(
  // disable strict mode for for better niivue development experience
  // <StrictMode>
  <BrowserRouter>
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
