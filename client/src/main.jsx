import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tailwind.css'
import './styles/theme.css'
import App from './App.jsx'
import { CryptoProvider } from './context/CryptoContext'
import socket from './socket'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CryptoProvider socket={socket}>
      <App />
    </CryptoProvider>
  </StrictMode>,
)
