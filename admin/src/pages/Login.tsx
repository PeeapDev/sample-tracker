import { useState, type FormEvent, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FlaskConical,
  Loader2,
  ShieldCheck,
  TestTubes,
  Truck,
  Boxes,
  Microscope,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { apiError } from '../lib/api'
import { roleMeta } from '../lib/ui'

interface DemoAccount {
  role: string
  email: string
  name: string
  icon: ComponentType<{ size?: number }>
}

// One-click demo logins — every account uses the seeded password. Clicking a
// card signs in instantly so the presenter can jump between role dashboards.
const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'admin', email: 'admin@nsrtms.gov.sl', name: 'System Administrator', icon: ShieldCheck },
  { role: 'collector', email: 'collector@nsrtms.gov.sl', name: 'Aminata Kamara', icon: TestTubes },
  { role: 'dispatcher', email: 'dispatcher@nsrtms.gov.sl', name: 'Mariama Conteh', icon: Truck },
  { role: 'hub_officer', email: 'hub@nsrtms.gov.sl', name: 'Fatmata Bangura', icon: Boxes },
  { role: 'lab_officer', email: 'lab@nsrtms.gov.sl', name: 'Ibrahim Koroma', icon: Microscope },
]

const DEMO_PASSWORD = 'password123'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [busyRole, setBusyRole] = useState<string | null>(null)

  if (user) {
    navigate('/', { replace: true })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(apiError(err, 'Invalid credentials'))
    } finally {
      setBusy(false)
    }
  }

  async function quickLogin(acc: DemoAccount) {
    if (busy || busyRole) return
    setBusyRole(acc.role)
    setError(null)
    try {
      await login(acc.email, DEMO_PASSWORD)
      navigate('/', { replace: true })
    } catch (err) {
      setError(apiError(err, 'Login failed'))
      setBusyRole(null)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
            <FlaskConical size={28} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">NSRTMS</h1>
          <p className="mt-1 text-sm text-slate-400">Admin Console — sign in to continue</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nsrtms.gov.sl"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        {/* One-click demo logins */}
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-700" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Quick login by role
            </span>
            <span className="h-px flex-1 bg-ink-700" />
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const meta = roleMeta(acc.role)
              const Icon = acc.icon
              const initials = acc.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
              const loading = busyRole === acc.role
              return (
                <button
                  key={acc.role}
                  onClick={() => quickLogin(acc)}
                  disabled={busy || busyRole !== null}
                  className="group flex w-full items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 px-3.5 py-3 text-left transition hover:border-ink-600 hover:bg-ink-850 disabled:opacity-60"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                    style={{ background: meta.color }}
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{acc.name}</span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Icon size={12} />
                      {meta.label}
                    </span>
                  </span>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-400"
                  />
                </button>
              )
            })}
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            All demo accounts use password <span className="text-slate-400">password123</span>
          </p>
        </div>
      </div>
    </div>
  )
}
