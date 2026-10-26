// import { StrictMode } from 'react'
import React from 'react';
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import FreeBrowse from './components/freebrowse.tsx';
import QaViewer from './components/qa-viewer.tsx';
import { deploymentConfig } from './lib/deployment-config';
import { applyExportLockdown } from './lib/disable-export';
import {
  createFreeBrowseInstance,
  QA_VIEWER_NIIVUE_OPTIONS,
} from './lib/default-niivue-options';

// Secure deployments: neutralize niivue's save-to-disk API before the app mounts.
if (deploymentConfig.downloadDisabled) {
  applyExportLockdown();
}

// Get base path from Vite's base config (import.meta.env.BASE_URL)
// This is automatically set by Vite based on the `base` config option
const basename = import.meta.env.BASE_URL;

// Use HashRouter for serverless mode (file:// protocol compatibility).
// `deploymentConfig` derives this from VITE_SERVERLESS (lib/deployment-config.ts).
const isServerless = deploymentConfig.serverless;
const Router = isServerless ? HashRouter : BrowserRouter;

// The app owns its NiiVue instances (a library host would pass its own).
const nv = createFreeBrowseInstance();
const qaNv = isServerless ? null : createFreeBrowseInstance(QA_VIEWER_NIIVUE_OPTIONS);

createRoot(document.getElementById('root')!).render(
  // disable strict mode for for better niivue development experience
  // <StrictMode>
  <Router basename={isServerless ? undefined : basename}>
    <Routes>
      <Route path="/" element={
         <div className="app-container">
           <div className="main-content">
             <FreeBrowse nv={nv} />
           </div>
         </div>
      } />
      {qaNv && (
        <Route path="/qa" element={
          <div className="app-container">
            <div className="main-content">
              <QaViewer nv={qaNv} />
            </div>
          </div>
        } />
      )}
    </Routes>
  </Router>
  // </StrictMode>,

)
