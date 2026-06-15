import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { useRbac } from './lib/rbac'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'

// Code-split each page into its own chunk so heavy deps (recharts on the
// Dashboard, gsap on the trackers) load only when that page is visited,
// keeping the initial bundle — and first paint — small.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Users = lazy(() => import('./pages/Users'))
const Samples = lazy(() => import('./pages/Samples'))
const Scan = lazy(() => import('./pages/Scan'))
const Dispatches = lazy(() => import('./pages/Dispatches'))
const Batches = lazy(() => import('./pages/Batches'))
const ShelfScanning = lazy(() => import('./pages/ShelfScanning'))
const Facilities = lazy(() => import('./pages/Facilities'))
const Roles = lazy(() => import('./pages/Roles'))
const Settings = lazy(() => import('./pages/Settings'))

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
          path="/batches"
          element={
            <RequirePerm perm="samples.view">
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
  )
}
