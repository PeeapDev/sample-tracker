import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './lib/auth'
import { ThemeProvider } from './lib/theme'
import { RbacProvider } from './lib/rbac'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RbacProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RbacProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
