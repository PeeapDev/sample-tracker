import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './lib/auth'
import { ThemeProvider } from './lib/theme'
import { RbacProvider } from './lib/rbac'
import { wireAutoFlush } from './lib/outbox'

// Boot offline: register the service worker (caches the app shell) and start the
// outbox auto-flusher (replays queued writes when connectivity returns).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW is a progressive enhancement — ignore registration failures */
    })
  })
}
wireAutoFlush()

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
