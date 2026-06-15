import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  UserPlus,
  Search,
  RefreshCw,
  MoreVertical,
  ShieldCheck,
  Shield,
  Building2,
  Loader2,
  X,
} from 'lucide-react'
import { api, apiError } from '../lib/api'
import { getCache, setCache, hasCache } from '../lib/cache'
import { ROLES, roleMeta, cn } from '../lib/ui'

interface UserRow {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  phone?: string
  isActive: boolean
  facility?: { name?: string } | null
}

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>(() => getCache<UserRow[]>('users') ?? [])
  const [loading, setLoading] = useState(!hasCache('users'))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)

  async function load() {
    setRefreshing(true)
    try {
      const res = await api.get('/users')
      const arr = Array.isArray(res.data) ? res.data : []
      setUsers(arr)
      setCache('users', arr)
      setError(null)
    } catch (e) {
      if (users.length === 0) setError(apiError(e, 'Failed to load users'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!query) return true
      const q = query.toLowerCase()
      return (
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    })
  }, [users, query, roleFilter])

  async function setActive(u: UserRow, active: boolean) {
    setMenuId(null)
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: active } : x)))
    try {
      if (active) await api.patch(`/users/${u.id}/activate`, {})
      else await api.delete(`/users/${u.id}`)
    } catch {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: !active } : x)))
    }
  }

  const total = users.length
  const active = users.filter((u) => u.isActive).length
  const admins = users.filter((u) => u.role === 'admin').length

  return (
    <div className="space-y-6" onClick={() => setMenuId(null)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Users</h2>
          <p className="text-sm text-slate-400">Manage platform accounts and access</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total Users" value={total} />
        <Stat label="Active" value={active} accent="#22C55E" />
        <Stat label="Admins" value={admins} accent="#F59E0B" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input max-w-[200px]"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="card text-sm text-red-400">{error}</div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400 dark:border-ink-700">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Facility</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const meta = roleMeta(u.role)
                return (
                  <tr key={u.id} className="border-b last:border-0 dark:border-ink-700/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                          style={{ background: meta.color }}
                        >
                          {(u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="truncate text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: `${meta.color}1f`, color: meta.color }}
                      >
                        {u.role === 'admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                        {meta.label}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3 text-slate-400 md:table-cell">
                      {u.facility?.name ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 size={13} /> {u.facility.name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                          u.isActive
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-slate-500/15 text-slate-400',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            u.isActive ? 'bg-emerald-500' : 'bg-slate-400',
                          )}
                        />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="relative px-5 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuId(menuId === u.id ? null : u.id)
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuId === u.id && (
                        <div
                          className="absolute right-5 top-12 z-10 w-40 rounded-xl border bg-white py-1 shadow-xl dark:border-ink-700 dark:bg-ink-850"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setActive(u, !u.isActive)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-ink-800"
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-14">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-ink-800">
                        <Search size={22} />
                      </span>
                      <div>
                        <div className="font-semibold text-slate-500 dark:text-slate-300">
                          No users match your filters
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          Try a different name, email or role.
                        </div>
                      </div>
                      {(query || roleFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setQuery('')
                            setRoleFilter('all')
                          }}
                          className="btn-ghost text-xs"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onCreated={(u) => {
            setUsers((prev) => [u, ...prev])
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="card !p-4">
      <div className="text-2xl font-extrabold" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}

function AddUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (u: UserRow) => void
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'collector',
    password: '',
    pin: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [key]: v }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload: Record<string, string> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      }
      if (form.phone.trim()) payload.phone = form.phone.trim()
      if (form.pin.trim()) payload.pin = form.pin.trim()
      const res = await api.post('/users', payload)
      onCreated(res.data)
    } catch (e) {
      setError(apiError(e, 'Failed to create user'))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl border bg-white p-6 dark:border-ink-700 dark:bg-ink-900"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold">Add User</h3>
            <p className="text-sm text-slate-400">Create a new account on the platform</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input className="input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
          </Field>
          <Field label="Last name">
            <input className="input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
          </Field>
          <Field label="Email" full>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </Field>
          <Field label="Phone (optional)">
            <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Role">
            <select className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Password">
            <input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} minLength={6} required />
          </Field>
          <Field label="PIN (optional)">
            <input className="input" inputMode="numeric" value={form.pin} onChange={(e) => set('pin', e.target.value)} maxLength={6} />
          </Field>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? <Loader2 size={16} className="animate-spin" /> : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={cn('block', full && 'col-span-2')}>
      <span className="mb-1.5 block text-sm font-medium text-slate-500 dark:text-slate-300">{label}</span>
      {children}
    </label>
  )
}
