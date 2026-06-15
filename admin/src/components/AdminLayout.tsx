import { useState, type ComponentType } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users as UsersIcon,
  FlaskConical,
  TestTubes,
  Truck,
  Boxes,
  Building2,
  ShieldCheck,
  Settings as SettingsIcon,
  ScanLine,
  QrCode,
  CheckCircle2,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  CloudOff,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import { useRbac } from '../lib/rbac'
import { useOnline } from '../lib/useOnline'
import { cn, roleMeta } from '../lib/ui'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number }>
  perm: string
  end?: boolean
  section: 'main' | 'admin'
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard.view', end: true, section: 'main' },
  { to: '/samples', label: 'Samples', icon: TestTubes, perm: 'samples.view', section: 'main' },
  { to: '/scan', label: 'Scan Sample', icon: QrCode, perm: 'samples.scan', section: 'main' },
  { to: '/dispatches', label: 'Dispatches', icon: Truck, perm: 'dispatches.view', section: 'main' },
  { to: '/batches', label: 'Batches & Boxes', icon: Boxes, perm: 'samples.view', section: 'main' },
  { to: '/users', label: 'Users', icon: UsersIcon, perm: 'users.view', section: 'main' },
  { to: '/facilities', label: 'Facilities & Hubs', icon: Building2, perm: 'settings.manage', section: 'admin' },
  { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck, perm: 'roles.manage', section: 'admin' },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, perm: 'settings.manage', section: 'admin' },
]

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/samples': 'Samples',
  '/scan': 'Scan a Sample',
  '/dispatches': 'Dispatches',
  '/batches': 'Batches & Boxes',
  '/shelf': 'Shelf Scanning',
  '/users': 'User Management',
  '/facilities': 'Facilities & Hubs',
  '/roles': 'Roles & Permissions',
  '/settings': 'Settings',
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const { can } = useRbac()
  const online = useOnline()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  // Receiving officers accept a delivery by scanning it in — same scan-to-advance
  // flow, surfaced as a prominent header action so it's always one click away.
  const canAccept = can(user?.role ?? '', 'samples.scan')
  const meta = roleMeta(user?.role ?? '')
  const isSuper = user?.role === 'admin'

  const visible = NAV.filter((n) => can(user?.role ?? '', n.perm))
  const mainItems = visible.filter((n) => n.section === 'main')
  const adminItems = visible.filter((n) => n.section === 'admin')

  function renderLink(item: NavItem) {
    const Icon = item.icon
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={() => setOpen(false)}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
            isActive
              ? 'bg-brand/15 text-brand-600 dark:text-brand-400'
              : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-ink-800',
          )
        }
      >
        <Icon size={18} />
        {item.label}
      </NavLink>
    )
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
          <FlaskConical size={20} />
        </div>
        <div>
          <div className="text-lg font-extrabold tracking-tight">NSRTMS</div>
          <div className="text-xs text-slate-400">Admin Console</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {mainItems.map(renderLink)}
        {/* Shelf Scanning — not built yet; the link opens an explainer page. */}
        <NavLink
          to="/shelf"
          onClick={() => setOpen(false)}
          title="Coming soon — manage what's on the shelf by scanning"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
              isActive
                ? 'bg-brand/15 text-brand-600 dark:text-brand-400'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-ink-800',
            )
          }
        >
          <ScanLine size={18} />
          <span>Shelf Scanning</span>
          <span className="ml-auto rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Soon
          </span>
        </NavLink>
        {adminItems.length > 0 && (
          <>
            <div className="px-3.5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Administration
            </div>
            {adminItems.map(renderLink)}
          </>
        )}
      </nav>

      <div className="border-t p-4 dark:border-ink-700">
        <div className="flex items-center gap-3">
          <div
            className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white"
            style={{ background: meta.color }}
          >
            {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="flex items-center gap-1.5">
              {isSuper && (
                <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-400">
                  Super
                </span>
              )}
              <span className="truncate text-xs text-slate-400">{meta.label}</span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-ink-800"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  )

  const title = TITLES[location.pathname] ?? 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-64 shrink-0 border-r bg-white dark:border-ink-700 dark:bg-ink-900 lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r bg-white dark:border-ink-700 dark:bg-ink-900">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-white/80 px-4 py-3 backdrop-blur dark:border-ink-700 dark:bg-ink-900/80 sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-ink-800 lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-lg font-bold sm:text-xl">{title}</h1>
          {!online && (
            <span
              title="You're offline — pages are showing the last saved data"
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400"
            >
              <CloudOff size={14} /> Offline — saved data
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {canAccept && (
              <button
                onClick={() => navigate('/scan')}
                title="Accept a delivery — scan the sample or box to confirm it arrived here"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <CheckCircle2 size={18} />
                <span className="hidden sm:inline">Accept</span>
              </button>
            )}
            <button
              onClick={toggle}
              title="Toggle theme"
              className="rounded-lg border p-2.5 text-slate-500 hover:bg-slate-100 dark:border-ink-700 dark:text-slate-300 dark:hover:bg-ink-800"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
