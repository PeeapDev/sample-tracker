import { useState, type ReactNode } from 'react'
import { Moon, Sun, Server, Info, RotateCcw } from 'lucide-react'
import { useTheme } from '../lib/theme'
import { useRbac } from '../lib/rbac'
import { API_BASE } from '../lib/api'
import { cn } from '../lib/ui'

export default function Settings() {
  const { theme, toggle } = useTheme()
  const { reset } = useRbac()
  const [resetDone, setResetDone] = useState(false)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Settings</h2>
        <p className="text-sm text-slate-400">Console preferences and system information</p>
      </div>

      {/* Appearance */}
      <section className="card space-y-4">
        <div>
          <h3 className="font-bold">Appearance</h3>
          <p className="text-xs text-slate-400">Choose how the console looks</p>
        </div>
        <div className="flex gap-3">
          <ThemeOption
            active={theme === 'light'}
            onClick={() => theme === 'dark' && toggle()}
            icon={<Sun size={18} />}
            label="Light"
          />
          <ThemeOption
            active={theme === 'dark'}
            onClick={() => theme === 'light' && toggle()}
            icon={<Moon size={18} />}
            label="Dark"
          />
        </div>
      </section>

      {/* API */}
      <section className="card space-y-3">
        <div className="flex items-center gap-2">
          <Server size={18} className="text-brand" />
          <h3 className="font-bold">API Connection</h3>
        </div>
        <Row label="Base URL" value={API_BASE} mono />
        <Row label="Environment" value={import.meta.env.MODE} />
      </section>

      {/* About */}
      <section className="card space-y-3">
        <div className="flex items-center gap-2">
          <Info size={18} className="text-brand" />
          <h3 className="font-bold">About</h3>
        </div>
        <Row label="Application" value="NSRTMS Admin Console" />
        <Row label="System" value="National Sample Collection & Real-Time Monitoring System" />
        <Row label="Version" value="1.0.0" />
      </section>

      {/* Danger zone */}
      <section className="card space-y-3 border-red-500/30">
        <div>
          <h3 className="font-bold text-red-500">Danger Zone</h3>
          <p className="text-xs text-slate-400">Restore role permissions to their defaults</p>
        </div>
        <button
          onClick={() => {
            reset()
            setResetDone(true)
            setTimeout(() => setResetDone(false), 2500)
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/10"
        >
          <RotateCcw size={16} /> {resetDone ? 'Permissions reset ✓' : 'Reset RBAC to defaults'}
        </button>
      </section>
    </div>
  )
}

function ThemeOption({
  active,
  onClick,
  icon,
  label,
  disabled,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-1 flex-col items-center gap-2 rounded-xl border py-4 text-sm font-medium transition',
        active
          ? 'border-brand bg-brand/10 text-brand-600 dark:text-brand-400'
          : 'border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-ink-700 dark:text-slate-400 dark:hover:bg-ink-800',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 last:border-0 dark:border-ink-700/60">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={cn('truncate text-sm', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  )
}
