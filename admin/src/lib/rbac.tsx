import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import { useAuth } from './auth'

export interface Permission {
  key: string
  label: string
  group: string
}

export const PERMISSIONS: Permission[] = [
  { key: 'dashboard.view', label: 'View dashboard & analytics', group: 'Dashboard' },
  { key: 'samples.view', label: 'View samples', group: 'Samples' },
  { key: 'samples.manage', label: 'Register & update samples', group: 'Samples' },
  { key: 'samples.scan', label: 'Scan samples (camera/QR)', group: 'Samples' },
  { key: 'dispatches.view', label: 'View dispatches', group: 'Dispatches' },
  { key: 'dispatches.manage', label: 'Create & update dispatches', group: 'Dispatches' },
  { key: 'users.view', label: 'View users', group: 'Users' },
  { key: 'users.manage', label: 'Create, edit & deactivate users', group: 'Users' },
  { key: 'roles.manage', label: 'Manage roles & permissions', group: 'Administration' },
  { key: 'settings.manage', label: 'Manage system settings', group: 'Administration' },
]

export interface RbacRole {
  key: string
  label: string
  color: string
  system?: boolean
}

export const RBAC_ROLES: RbacRole[] = [
  { key: 'admin', label: 'Super Admin', color: '#6366F1', system: true },
  { key: 'collector', label: 'Sample Collector', color: '#3B82F6' },
  { key: 'dispatcher', label: 'Dispatcher', color: '#F97316' },
  { key: 'hub_officer', label: 'Hub Officer', color: '#8B5CF6' },
  { key: 'lab_officer', label: 'Lab Officer', color: '#14B8A6' },
]

export type Matrix = Record<string, string[]>

const DEFAULT_MATRIX: Matrix = {
  admin: PERMISSIONS.map((p) => p.key),
  collector: ['dashboard.view', 'samples.view', 'samples.manage', 'samples.scan'],
  dispatcher: ['dashboard.view', 'samples.view', 'samples.scan', 'dispatches.view', 'dispatches.manage'],
  hub_officer: ['dashboard.view', 'samples.view', 'samples.scan', 'dispatches.view'],
  lab_officer: ['dashboard.view', 'samples.view', 'samples.scan'],
}

interface RbacState {
  matrix: Matrix
  serverSynced: boolean
  can: (role: string, perm: string) => boolean
  toggle: (role: string, perm: string) => void
  reset: () => void
}

const RbacContext = createContext<RbacState>(null as unknown as RbacState)

export function RbacProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [matrix, setMatrix] = useState<Matrix>(() => {
    try {
      const stored = localStorage.getItem('nsrtms_rbac')
      if (stored) return { ...DEFAULT_MATRIX, ...JSON.parse(stored) }
    } catch {
      /* ignore */
    }
    return DEFAULT_MATRIX
  })
  const [serverSynced, setServerSynced] = useState(false)

  // Load the authoritative matrix from the backend once authenticated.
  useEffect(() => {
    if (!user) {
      setServerSynced(false)
      return
    }
    let active = true
    api
      .get('/permissions')
      .then((res) => {
        if (!active) return
        const m = (res.data?.matrix ?? res.data) as Matrix
        if (m && typeof m === 'object') {
          setMatrix({ ...DEFAULT_MATRIX, ...m })
          setServerSynced(true)
          localStorage.setItem('nsrtms_rbac', JSON.stringify(m))
        }
      })
      .catch(() => {
        /* keep local/default copy */
      })
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem('nsrtms_rbac', JSON.stringify(matrix))
  }, [matrix])

  // Super Admin always has every permission — guards against locking yourself out.
  const can = (role: string, perm: string) =>
    role === 'admin' ? true : matrix[role]?.includes(perm) ?? false

  async function toggle(role: string, perm: string) {
    if (role === 'admin') return
    const prev = matrix
    const current = new Set(matrix[role] ?? [])
    if (current.has(perm)) current.delete(perm)
    else current.add(perm)
    const nextPerms = Array.from(current)
    setMatrix({ ...matrix, [role]: nextPerms }) // optimistic

    if (!serverSynced) return
    try {
      const res = await api.put(`/permissions/${role}`, { permissions: nextPerms })
      const m = (res.data?.matrix ?? res.data) as Matrix
      if (m && typeof m === 'object') setMatrix({ ...DEFAULT_MATRIX, ...m })
    } catch {
      setMatrix(prev) // revert on failure
    }
  }

  async function reset() {
    if (serverSynced) {
      try {
        const res = await api.post('/permissions/reset', {})
        const m = (res.data?.matrix ?? res.data) as Matrix
        if (m && typeof m === 'object') {
          setMatrix({ ...DEFAULT_MATRIX, ...m })
          return
        }
      } catch {
        /* fall through to local reset */
      }
    }
    setMatrix(DEFAULT_MATRIX)
  }

  return (
    <RbacContext.Provider value={{ matrix, serverSynced, can, toggle, reset }}>
      {children}
    </RbacContext.Provider>
  )
}

export function useRbac() {
  return useContext(RbacContext)
}
