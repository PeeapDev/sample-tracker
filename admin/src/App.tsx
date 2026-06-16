import { Component, lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { useRbac } from './lib/rbac'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'

// A failed dynamic import almost always means a stale chunk hash after a new
// deploy: the open tab references chunk filenames the server no longer has, so
// the import 404s. Reload ONCE (guarded against loops) to pull the fresh
// index.html + current chunks, instead of dark-blanking the app.
function lazyWithRetry(factory: () => Promise<{ default: ComponentType<any> }>) {
  const KEY = 'nsrtms-chunk-reloaded'
  return lazy(async () => {
    try {
      const mod = await factory()
      sessionStorage.removeItem(KEY) // success → let a future deploy reload again
      return mod
    } catch (err) {
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1')
        window.location.reload()
        return new Promise<{ default: ComponentType<any> }>(() => {}) // hang during reload
      }
      throw err
    }
  })
}

// Catches anything that still slips through (e.g. a chunk failure after the
// one-shot reload) so the user gets a Reload button, never a blank dark page.
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="grid h-screen place-items-center text-slate-400">
          <div className="text-center">
            <p className="mb-3">Something went wrong loading this page.</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Code-split each page into its own chunk so heavy deps (recharts on the
// Dashboard, gsap on the trackers) load only when that page is visited,
// keeping the initial bundle — and first paint — small.
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'))
const Users = lazyWithRetry(() => import('./pages/Users'))
const Samples = lazyWithRetry(() => import('./pages/Samples'))
const Scan = lazyWithRetry(() => import('./pages/Scan'))
const Dispatches = lazyWithRetry(() => import('./pages/Dispatches'))
const Parcels = lazyWithRetry(() => import('./pages/Parcels'))
const LiveMap = lazyWithRetry(() => import('./pages/LiveMap'))
const Batches = lazyWithRetry(() => import('./pages/Batches'))
const ShelfScanning = lazyWithRetry(() => import('./pages/ShelfScanning'))
const Facilities = lazyWithRetry(() => import('./pages/Facilities'))
const Roles = lazyWithRetry(() => import('./pages/Roles'))
const Settings = lazyWithRetry(() => import('./pages/Settings'))

function PageSpinner() {
  return (
    <div className="grid h-[60vh] place-items-center text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  )
}

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="grid h-screen place-items-center text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequirePerm({ perm, children }: { perm: string; children: ReactNode }) {
  const { user } = useAuth()
  const { can } = useRbac()
  if (!can(user?.role ?? '', perm)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protected>
            <AdminLayout />
          </Protected>
        }
      >
        <Route
          path="/"
          element={
            <Suspense fallback={<PageSpinner />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/samples"
          element={
            <RequirePerm perm="samples.view">
              <Suspense fallback={<PageSpinner />}>
                <Samples />
              </Suspense>
            </RequirePerm>
          }
        />
        <Route
          path="/scan"
          element={
            <RequirePerm perm="samples.scan">
              <Suspense fallback={<PageSpinner />}>
                <Scan />
              </Suspense>
            </RequirePerm>
          }
        />
        <Route
          path="/dispatches"
          element={
            <RequirePerm perm="dispatches.view">
              <Suspense fallback={<PageSpinner />}>
                <Dispatches />
              </Suspense>
            </RequirePerm>
          }
        />
        <Route
          path="/parcels"
          element={
            <RequirePerm perm="parcels.view">
              <Suspense fallback={<PageSpinner />}>
                <Parcels />
              </Suspense>
            </RequirePerm>
          }
        />
        <Route
          path="/live-map"
          element={
            <RequirePerm perm="livemap.view">
              <Suspense fallback={<PageSpinner />}>
                <LiveMap />
              </Suspense>
            </RequirePerm>
          }
        />
        <Route
          path="/batches"
          element={
            <RequirePerm perm="batches.manage">
              <Suspense fallback={<PageSpinner />}>
                <Batches />
              </Suspense>
            </RequirePerm>
          }
        />
        <Route
          path="/shelf"
          element={
            <Suspense fallback={<PageSpinner />}>
              <ShelfScanning />
            </Suspense>
          }
        />
        <Route
          path="/users"
          element={
            <RequirePerm perm="users.view">
              <Suspense fallback={<PageSpinner />}>
                <Users />
              </Suspense>
            </RequirePerm>
          }
        />
        <Route
          path="/facilities"
          element={
            <RequirePerm perm="settings.manage">
              <Suspense fallback={<PageSpinner />}>
                <Facilities />
              </Suspense>
            </RequirePerm>
          }
        />
        <Route
          path="/roles"
          element={
            <RequirePerm perm="roles.manage">
              <Suspense fallback={<PageSpinner />}>
                <Roles />
              </Suspense>
            </RequirePerm>
          }
        />
        <Route
          path="/settings"
          element={
            <RequirePerm perm="settings.manage">
              <Suspense fallback={<PageSpinner />}>
                <Settings />
              </Suspense>
            </RequirePerm>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  )
}
