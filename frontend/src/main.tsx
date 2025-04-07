// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Scenes from './Scenes.tsx'

createRoot(document.getElementById('root')!).render(
  // disable strict mode for for better niivue development experience
  // <StrictMode>
  <div>
    <App />
    <Scenes />
  </div>
  // </StrictMode>,
)
