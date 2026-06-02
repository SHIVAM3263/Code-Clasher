import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f0f1a',
              color: '#e8f4f8',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#00ff88', secondary: '#050508' },
            },
            error: {
              iconTheme: { primary: '#ff2d55', secondary: '#050508' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
