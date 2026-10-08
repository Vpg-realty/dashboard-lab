import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { IS_LAB } from './data/config.js'

// Lab: say so in the browser tab too, so it's easy to tell from the live board (Luke, Oct 8).
if (IS_LAB) document.title = 'LAB · VPG KPI Dashboard'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
