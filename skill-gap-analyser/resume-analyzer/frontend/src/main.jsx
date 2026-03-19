import React from 'react'
import ReactDOM from 'react-dom/client'

// Styles
import './styles/theme.css'
import './index.css'

// Contexts
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>,
)
