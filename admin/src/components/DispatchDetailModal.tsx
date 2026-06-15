import { useEffect, useState } from 'react'
import { X, Loader2, Truck, UserRound, Phone, MapPin, Boxes, CheckCircle2, Circle } from 'lucide-react'
import { api, apiError } from '../lib/api'

interface Rider {
  firstName?: string
  lastName?: string
  phone?: string | null
}
interface Facility {
  name?: string
}
interface DispatchSample {
  id: string
  collectedAt?: string | null
  pickedUpAt?: string | null
  hubReceivedAt?: string | null
  dispatchedAt?: string | null
  labReceivedAt?: string | null
  completedAt?: string | null
}
interface Dispatch {
  id: string
  dispatchId: string
  status: string
  sampleCount?: number
  createdAt?: string
  rider?: Rider | null
  originFacility?: Facility | null
  destinationFacility?: Facility | null
}

const DISPATCH_COLORS: Record<string, string> = {
  pending: '#94A3B8',
  assigned: '#3B82F6',
  picked_up: '#F97316',
  in_transit: '#F59E0B',
  delivered: '#22C55E',
  cancelled: '#EF4444',
}
function dispatchLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Aggregate a single journey across all the dispatch's samples: earliest entry
// into each stage, latest completion.
const STAGES: { key: keyof DispatchSample; label: string }[] = [
  { key: 'collectedAt', label: 'Collected' },
  { key: 'pickedUpAt', label: 'Picked up' },
  { key: 'hubReceivedAt', label: 'Hub received' },
  { key: 'dispatchedAt', label: 'In transit' },
  { key: 'labReceivedAt', label: 'Lab received' },
  { key: 'completedAt', label: 'Completed' },
]

function aggStage(samples: DispatchSample[], key: keyof DispatchSample, latest = false): number | null {
  const times = samples
    .map((s) => (s[key] ? new Date(s[key] as string).getTime() : null))
    .filter((t): t is number => t != null && Number.isFinite(t))
  if (times.length === 0) return null
  return latest ? Math.max(...times) : Math.min(...times)
}

function humanizeDuration(ms: number): string {
  if (ms < 0) ms = 0
  const m = Math.round(ms / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h < 24) return rem ? `${h}h ${rem}m` : `${h}h`
  const d = Math.floor(h / 24)
  const hh = h % 24
  return hh ? `${d}d ${hh}h` : `${d}d`
}

export function DispatchDetailModal({ dispatchId, onClose }: { dispatchId: string; onClose: () => void }) {
  const [dispatch, setDispatch] = useState<Dispatch | null>(null)
  const [samples, setSamples] = useState<DispatchSample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      api.get(`/dispatches/${dispatchId}`),
      api.get(`/dispatches/${dispatchId}/samples`).catch(() => ({ data: [] })),
    ])
      .then(([d, s]) => {
        if (!active) return
        setDispatch(d.data)
        setSamples(Array.isArray(s.data) ? s.data : [])
      })
      .catch((e) => active && setError(apiError(e, 'Failed to load dispatch')))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [dispatchId])

  const d = dispatch
  const color = d ? DISPATCH_COLORS[d.status] ?? '#94A3B8' : '#94A3B8'
  const riderName = d?.rider ? `${d.rider.firstName ?? ''} ${d.rider.lastName ?? ''}`.trim() : ''

  // Build the lifecycle from the samples' stage timestamps.
  const stamps = STAGES.map((st) => ({
    label: st.label,
    at: aggStage(samples, st.key, st.key === 'completedAt'),
  }))
  const collectedAt = stamps[0].at
  const completedAt = stamps[stamps.length - 1].at
  const isComplete = completedAt != null
  const totalMs =
    collectedAt != null ? (completedAt ?? Date.now()) - collectedAt : null

  // Duration of each reached stage from the previous reached one.
  let prev: number | null = null
  const lifecycle = stamps.map((s) => {
    const reached = s.at != null
    const delta = reached && prev != null ? s.at! - prev : null
    if (reached) prev = s.at
    return { label: s.label, reached, at: s.at, delta }
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-t-2xl border bg-white dark:border-ink-700 dark:bg-ink-900 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b p-4 dark:border-ink-700">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${color}22`, color }}>
              <Truck size={17} />
            </span>
            <div>
              <div className="font-mono text-sm font-extrabold">{d?.dispatchId ?? 'Dispatch'}</div>
              {d && (
                <span className="text-xs font-semibold" style={{ color }}>
                  {dispatchLabel(d.status)}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          {error ? (
            <div className="py-8 text-center text-sm text-red-400">{error}</div>
          ) : loading || !d ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <>
              {/* Current rider */}
              <div className="rounded-xl border bg-brand/5 p-3 dark:border-ink-700">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <UserRound size={12} /> Currently with
                </div>
                {riderName ? (
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-sm font-bold">{riderName}</span>
                    {d.rider?.phone && (
                      <a href={`tel:${d.rider.phone}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:underline">
                        <Phone size={12} /> {d.rider.phone}
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">No rider assigned yet.</div>
                )}
              </div>

              {/* Route + count */}
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <MapPin size={13} className="shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-200">{d.originFacility?.name ?? '—'}</span>
                →
                <span className="font-medium text-slate-700 dark:text-slate-200">{d.destinationFacility?.name ?? '—'}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <Boxes size={13} /> {d.sampleCount ?? samples.length} sample{(d.sampleCount ?? samples.length) === 1 ? '' : 's'}
              </div>

              {/* Lifecycle */}
              <div className="mb-2 mt-4 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Lifecycle</span>
                {totalMs != null && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ background: isComplete ? '#22C55E1f' : '#F59E0B1f', color: isComplete ? '#16A34A' : '#D97706' }}
                  >
                    {isComplete ? `Total ${humanizeDuration(totalMs)}` : `${humanizeDuration(totalMs)} elapsed`}
                  </span>
                )}
              </div>

              <ol className="space-y-0.5">
                {lifecycle.map((st, i) => (
                  <li key={st.label} className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center">
                      {st.reached ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <Circle size={16} className="text-slate-300 dark:text-slate-600" />
                      )}
                      {i < lifecycle.length - 1 && (
                        <span className={`my-0.5 h-5 w-px ${st.reached ? 'bg-emerald-500/40' : 'bg-slate-200 dark:bg-ink-700'}`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm ${st.reached ? 'font-semibold' : 'text-slate-400'}`}>{st.label}</span>
                        {st.delta != null && (
                          <span className="text-[11px] text-slate-400">+{humanizeDuration(st.delta)}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {st.at != null ? new Date(st.at).toLocaleString() : 'pending'}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
