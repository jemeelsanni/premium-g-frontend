import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ScreenSizeGuard } from './components/ScreenSizeGuard'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ScreenSizeGuard>
      <App />
    </ScreenSizeGuard>
  </React.StrictMode>,
)