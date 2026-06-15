import { Fragment, useMemo, useState } from 'react'
import { ShieldCheck, Check, RotateCcw, Info, Lock } from 'lucide-react'
import { PERMISSIONS, RBAC_ROLES, useRbac } from '../lib/rbac'
import { cn } from '../lib/ui'

export default function Roles() {
  const { can, toggle, reset, serverSynced } = useRbac()
  const [confirmReset, setConfirmReset] = useState(false)

  const groups = useMemo(() => {
    const map = new Map<string, typeof PERMISSIONS>()
    for (const p of PERMISSIONS) {
      const arr = map.get(p.group) ?? []
      arr.push(p)
      map.set(p.group, arr)
    }
    return Array.from(map.entries())
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <ShieldCheck className="text-brand" /> Roles &amp; Permissions
          </h2>
          <p className="text-sm text-slate-400">
            Define what each role can access across the platform
          </p>
        </div>
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Reset to defaults?</span>
            <button
              onClick={() => {
                reset()
                setConfirmReset(false)
              }}
              className="btn-primary !py-2"
            >
              Confirm
            </button>
            <button onClick={() => setConfirmReset(false)} className="btn-ghost !py-2">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)} className="btn-ghost">
            <RotateCcw size={16} /> Reset defaults
          </button>
        )}
      </div>

      {serverSynced ? (
        <div className="flex items-start gap-3 rounded-2xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand-600 dark:text-brand-400">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-semibold">Server-enforced.</span> Changes are saved to the database
            and applied on every API request — the backend rejects calls a role isn't permitted to
            make. Super Admin always retains full access.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500 dark:text-amber-400">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p>
            Working offline from a local copy — sign in to sync with the server-enforced matrix.
          </p>
        </div>
      )}

      {/* Role summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {RBAC_ROLES.map((role) => {
          const count = PERMISSIONS.filter((p) => can(role.key, p.key)).length
          return (
            <div key={role.key} className="card !p-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: role.color }} />
                <span className="truncate text-sm font-semibold">{role.label}</span>
              </div>
              <div className="mt-2 text-2xl font-extrabold">
                {count}
                <span className="text-sm font-medium text-slate-400">/{PERMISSIONS.length}</span>
              </div>
              <div className="text-xs text-slate-400">permissions</div>
              {role.system && (
                <div className="mt-2 inline-flex items-center gap-1 rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-400">
                  <Lock size={10} /> System
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Permission matrix */}
      <div className="relative">
        <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b text-left dark:border-ink-700">
              <th className="px-5 py-3 font-medium text-slate-400">Permission</th>
              {RBAC_ROLES.map((role) => (
                <th key={role.key} className="px-3 py-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: role.color }} />
                    <span className="text-xs font-semibold">{role.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([group, perms]) => (
              <Fragment key={group}>
                <tr className="bg-slate-50 dark:bg-ink-850/60">
                  <td
                    colSpan={RBAC_ROLES.length + 1}
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    {group}
                  </td>
                </tr>
                {perms.map((perm) => (
                  <tr key={perm.key} className="border-b last:border-0 dark:border-ink-700/60">
                    <td className="px-5 py-3">
                      <div className="font-medium">{perm.label}</div>
                      <div className="font-mono text-xs text-slate-400">{perm.key}</div>
                    </td>
                    {RBAC_ROLES.map((role) => {
                      const active = can(role.key, perm.key)
                      const locked = role.system
                      return (
                        <td key={role.key} className="px-3 py-3 text-center">
                          <button
                            disabled={locked}
                            onClick={() => toggle(role.key, perm.key)}
                            title={locked ? 'System role — always full access' : 'Toggle'}
                            className={cn(
                              'inline-grid h-6 w-6 place-items-center rounded-md border transition',
                              active
                                ? 'border-brand bg-brand text-white'
                                : 'border-slate-300 bg-transparent dark:border-ink-600',
                              locked ? 'cursor-not-allowed opacity-70' : 'hover:border-brand',
                            )}
                          >
                            {active && <Check size={14} strokeWidth={3} />}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
        </div>
        {/* Right-edge fade hints that the matrix scrolls sideways on narrow screens. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 rounded-r-2xl bg-gradient-to-l from-white to-transparent dark:from-ink-900 xl:hidden" />
      </div>
    </div>
  )
}
