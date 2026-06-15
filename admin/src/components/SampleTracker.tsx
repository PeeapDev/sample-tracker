import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import {
  PlusCircle,
  Bike,
  Warehouse,
  Truck,
  Microscope,
  CheckCircle2,
  AlertTriangle,
  X,
  MapPin,
  UserRound,
  Building2,
  Star,
  Loader2,
  Send,
  Clock,
} from 'lucide-react'
import { api, apiError } from '../lib/api'
import { cn, statusLabel } from '../lib/ui'

interface Stage {
  key: string
  label: string
  icon: typeof Truck
  ts: string
}

const STAGES: Stage[] = [
  { key: 'collected', label: 'Collected', icon: PlusCircle, ts: 'collectedAt' },
  { key: 'picked_up', label: 'Picked Up', icon: Bike, ts: 'pickedUpAt' },
  { key: 'hub_received', label: 'Hub', icon: Warehouse, ts: 'hubReceivedAt' },
  { key: 'in_transit', label: 'In Transit', icon: Truck, ts: 'dispatchedAt' },
  { key: 'lab_received', label: 'Lab', icon: Microscope, ts: 'labReceivedAt' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, ts: 'completedAt' },
]

const INSET = 8 // % padding on each side so edge labels don't clip
const SPAN = 100 - INSET * 2

const CONDITIONS = ['intact', 'compromised', 'damaged', 'leaking'] as const
type Condition = (typeof CONDITIONS)[number]

interface Feedback {
  id: string
  riderRating?: number
  sampleCondition?: string
  comment?: string
  stage?: string
  rater?: { firstName?: string; lastName?: string; role?: string }
  createdAt: string
}

type TimelineEvent = Record<string, any>

export function SampleTracker({
  sample,
  timeline = [],
}: {
  sample: Record<string, any>
  /** Chain-of-custody events; used to populate the per-stage info popup. */
  timeline?: TimelineEvent[]
}) {
  const status = String(sample.status ?? '')
  const lost = status === 'lost'
  const n = STAGES.length
  // analysis_queue sits between lab_received and completed → treat as lab stage.
  const normalized = status === 'analysis_queue' ? 'lab_received' : status
  const currentIndex = lost
    ? Math.max(0, STAGES.findIndex((s) => s.ts && sample[s.ts]))
    : Math.max(0, STAGES.findIndex((s) => s.key === normalized))

  const nodeLeft = (i: number) => INSET + (i / (n - 1)) * SPAN
  const targetPct = (currentIndex / (n - 1)) * SPAN

  const lineRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Which stage popup is open (index into STAGES), or null when closed.
  const [activeStage, setActiveStage] = useState<number | null>(null)

  // Pop the stage nodes in once, on mount.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stage-node', {
        scale: 0,
        opacity: 0,
        stagger: 0.07,
        duration: 0.4,
        ease: 'back.out(2)',
        delay: 0.1,
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  // Animate the progress line + marker from their CURRENT position to the new
  // target — so advancing a status glides the truck forward, not from zero.
  useEffect(() => {
    const tweens: gsap.core.Tween[] = []
    if (lineRef.current) {
      tweens.push(
        gsap.to(lineRef.current, { width: `${targetPct}%`, duration: 1.2, ease: 'power2.inOut' }),
      )
    }
    if (!lost && markerRef.current) {
      tweens.push(
        gsap.to(markerRef.current, {
          left: `${INSET + targetPct}%`,
          duration: 1.2,
          ease: 'power2.inOut',
        }),
      )
    }
    return () => tweens.forEach((t) => t.kill())
  }, [targetPct, lost])

  // Continuous bob while the sample is actively in transit.
  useEffect(() => {
    if (!markerRef.current) return
    if (status !== 'in_transit') {
      gsap.set(markerRef.current, { y: 0 })
      return
    }
    const t = gsap.to(markerRef.current, {
      y: -4,
      duration: 0.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1.2,
    })
    return () => {
      t.kill()
      if (markerRef.current) gsap.set(markerRef.current, { y: 0 })
    }
  }, [status])

  const fmt = (v: unknown) => {
    if (!v) return ''
    try {
      const d = new Date(v as string)
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  // The timeline event matching a stage (analysis_queue counts toward the lab
  // stage so its scan still surfaces).
  const eventForStage = (key: string): TimelineEvent | undefined =>
    timeline.find((e) => {
      const ev = String(e?.event ?? '')
      return ev === key || (key === 'lab_received' && ev === 'analysis_queue')
    })

  const sampleUuid = String(sample.id ?? '')

  return (
    <div className="relative">
      <div ref={containerRef} className="relative h-12">
        {/* base track */}
        <div
          className="absolute top-5 h-1.5 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-ink-700"
          style={{ left: `${INSET}%`, right: `${INSET}%` }}
        />
        {/* animated progress */}
        <div
          ref={lineRef}
          className={cn(
            'absolute top-5 h-1.5 -translate-y-1/2 rounded-full',
            lost ? 'bg-red-500' : 'bg-gradient-to-r from-brand-600 to-brand',
          )}
          style={{ left: `${INSET}%`, width: '0%' }}
        />

        {/* traveling marker */}
        {!lost && (
          <div
            ref={markerRef}
            className="absolute top-5 z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${INSET}%` }}
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/40 ring-4 ring-brand/20">
              <Truck size={15} />
            </div>
          </div>
        )}

        {/* stage nodes */}
        {STAGES.map((s, i) => {
          const Icon = s.icon
          const done = i < currentIndex
          const current = i === currentIndex
          const open = activeStage === i
          return (
            <div
              key={s.key}
              className="stage-node absolute top-5 z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${nodeLeft(i)}%` }}
            >
              <button
                type="button"
                aria-label={`${s.label} stage details`}
                aria-expanded={open}
                onClick={() => setActiveStage((p) => (p === i ? null : i))}
                className={cn(
                  'grid h-10 w-10 cursor-pointer place-items-center rounded-full border-2 transition-colors',
                  'outline-none focus-visible:ring-2 focus-visible:ring-brand/50 hover:scale-105 hover:shadow-md',
                  open && 'ring-2 ring-brand/50',
                  done && 'border-brand bg-brand text-white',
                  current && !lost && 'border-brand bg-brand/20 text-brand-600 dark:text-brand-400',
                  current && lost && 'border-red-500 bg-red-500/20 text-red-500',
                  !done && !current &&
                    'border-slate-200 bg-white text-slate-300 dark:border-ink-700 dark:bg-ink-850 dark:text-slate-600',
                )}
              >
                {current && lost ? <AlertTriangle size={17} /> : <Icon size={17} />}
              </button>
            </div>
          )
        })}
      </div>

      {/* labels */}
      <div className="relative mt-1 h-10">
        {STAGES.map((s, i) => {
          const reached = i <= currentIndex
          return (
            <div
              key={s.key}
              className="absolute -translate-x-1/2 text-center"
              style={{ left: `${nodeLeft(i)}%`, width: 80 }}
            >
              <button
                type="button"
                onClick={() => setActiveStage((p) => (p === i ? null : i))}
                className={cn(
                  'cursor-pointer text-[11px] font-semibold hover:underline',
                  reached ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400',
                )}
              >
                {s.label}
              </button>
              <div className="text-[10px] text-slate-400">{fmt(sample[s.ts])}</div>
            </div>
          )
        })}
      </div>

      {lost && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          <AlertTriangle size={16} /> This sample was reported lost in transit.
        </div>
      )}

      {activeStage != null && (
        <StagePopup
          stage={STAGES[activeStage]}
          leftPct={nodeLeft(activeStage)}
          event={eventForStage(STAGES[activeStage].key)}
          sampleUuid={sampleUuid}
          onClose={() => setActiveStage(null)}
        />
      )}
    </div>
  )
}

/** Anchored info + rating panel for a single stage node. */
function StagePopup({
  stage,
  leftPct,
  event,
  sampleUuid,
  onClose,
}: {
  stage: Stage
  leftPct: number
  event?: TimelineEvent
  sampleUuid: string
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loadingFb, setLoadingFb] = useState(true)

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [condition, setCondition] = useState<Condition | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = !submitting && (rating > 0 || condition != null || comment.trim().length > 0)

  // Close on outside-click / Escape.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  async function loadFeedback() {
    if (!sampleUuid) {
      setLoadingFb(false)
      return
    }
    setLoadingFb(true)
    try {
      const res = await api.get(`/samples/${sampleUuid}/feedback`)
      setFeedback(Array.isArray(res.data) ? res.data : [])
    } catch {
      /* feedback is best-effort */
    } finally {
      setLoadingFb(false)
    }
  }

  useEffect(() => {
    loadFeedback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sampleUuid])

  // Pop the panel in.
  useEffect(() => {
    if (!panelRef.current) return
    const t = gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: -6, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'back.out(1.6)' },
    )
    return () => {
      t.kill()
    }
  }, [])

  async function submit() {
    if (!canSubmit || !sampleUuid) return
    setSubmitting(true)
    setError(null)
    try {
      await api.post(`/samples/${sampleUuid}/feedback`, {
        ...(rating > 0 ? { riderRating: rating } : {}),
        ...(condition ? { sampleCondition: condition } : {}),
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      })
      setSubmitted(true)
      setRating(0)
      setHover(0)
      setCondition(null)
      setComment('')
      await loadFeedback()
      setTimeout(() => setSubmitted(false), 2200)
    } catch (e) {
      setError(apiError(e, 'Failed to submit feedback'))
    } finally {
      setSubmitting(false)
    }
  }

  const actor = (() => {
    const a = event?.actor
    if (!a) return null
    if (typeof a === 'string') return a
    return `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim() || null
  })()
  const facility = event?.facility?.name ?? null
  const hasGps = event?.latitude != null && event?.longitude != null

  // Keep the panel from spilling off either edge.
  const clampedLeft = Math.min(82, Math.max(18, leftPct))

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`${stage.label} stage details`}
      className="absolute top-[88px] z-30 w-[320px] max-w-[92vw] -translate-x-1/2 rounded-2xl border bg-white p-4 shadow-2xl dark:border-ink-700 dark:bg-ink-900"
      style={{ left: `${clampedLeft}%` }}
    >
      {/* little arrow toward the node */}
      <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t bg-white dark:border-ink-700 dark:bg-ink-900" />

      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/15 text-brand-500">
            <stage.icon size={15} />
          </span>
          <div className="text-sm font-bold">{stage.label}</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800"
        >
          <X size={16} />
        </button>
      </div>

      {/* Stage info */}
      {event ? (
        <div className="space-y-1.5 rounded-xl border p-3 text-xs dark:border-ink-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
            <Clock size={13} className="shrink-0 text-slate-400" />
            <span>{event.timestamp ? new Date(event.timestamp).toLocaleString() : '—'}</span>
          </div>
          {actor && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
              <UserRound size={13} className="shrink-0 text-slate-400" />
              <span className="truncate">{actor}</span>
            </div>
          )}
          {facility && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
              <Building2 size={13} className="shrink-0 text-slate-400" />
              <span className="truncate">{facility}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin size={13} className="shrink-0 text-slate-400" />
            {hasGps ? (
              <a
                href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-brand-500 hover:underline"
              >
                {Number(event.latitude).toFixed(4)}, {Number(event.longitude).toFixed(4)}
              </a>
            ) : (
              <span className="text-slate-400">No GPS captured</span>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-3 text-center text-xs text-slate-400 dark:border-ink-700">
          Not reached yet
        </div>
      )}

      {/* Rating control */}
      <div className="mt-3 border-t pt-3 dark:border-ink-700">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Rider delivery rating
        </div>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((v) => {
            const filled = (hover || rating) >= v
            return (
              <button
                key={v}
                type="button"
                aria-label={`${v} star${v > 1 ? 's' : ''}`}
                onMouseEnter={() => setHover(v)}
                onClick={() => setRating((p) => (p === v ? 0 : v))}
                className="rounded p-0.5 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                <Star
                  size={20}
                  className={cn(
                    filled ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600',
                  )}
                  fill={filled ? 'currentColor' : 'none'}
                />
              </button>
            )
          })}
        </div>

        <div className="mb-1.5 mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Sample condition
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((c) => {
            const on = condition === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCondition((p) => (p === c ? null : c))}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-semibold capitalize transition',
                  on
                    ? 'border-brand bg-brand text-white'
                    : 'border-slate-200 text-slate-500 hover:border-brand/50 dark:border-ink-700 dark:text-slate-300',
                )}
              >
                {c}
              </button>
            )
          })}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Add a comment (optional)…"
          className="input mt-3 resize-none text-xs"
        />

        {error && <div className="mt-2 text-xs text-red-400">{error}</div>}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="btn-primary mt-3 w-full justify-center text-sm disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : submitted ? (
            <CheckCircle2 size={15} />
          ) : (
            <Send size={15} />
          )}
          {submitted ? 'Submitted' : 'Submit feedback'}
        </button>
      </div>

      {/* Existing feedback */}
      <div className="mt-3 border-t pt-3 dark:border-ink-700">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Feedback
        </div>
        {loadingFb ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 size={12} className="animate-spin" /> Loading…
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-xs text-slate-400">No feedback yet.</div>
        ) : (
          <ul className="max-h-36 space-y-2 overflow-y-auto pr-1">
            {feedback.map((f) => {
              const name =
                `${f.rater?.firstName ?? ''} ${f.rater?.lastName ?? ''}`.trim() || 'Anonymous'
              return (
                <li key={f.id} className="rounded-lg border p-2 text-xs dark:border-ink-700">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{name}</span>
                    <span className="text-[10px] text-slate-400">
                      {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {f.riderRating != null && (
                      <span className="inline-flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <Star
                            key={v}
                            size={11}
                            fill={v <= (f.riderRating ?? 0) ? 'currentColor' : 'none'}
                            className={v <= (f.riderRating ?? 0) ? '' : 'text-slate-300 dark:text-slate-600'}
                          />
                        ))}
                      </span>
                    )}
                    {f.sampleCondition && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize text-slate-500 dark:bg-ink-800 dark:text-slate-300">
                        {f.sampleCondition}
                      </span>
                    )}
                    {f.stage && (
                      <span className="text-[10px] text-slate-400">{statusLabel(f.stage)}</span>
                    )}
                  </div>
                  {f.comment && <div className="mt-1 text-slate-500 dark:text-slate-300">{f.comment}</div>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
