import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import {
  PlusCircle,
  Bike,
  Warehouse,
  Truck,
  Microscope,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '../lib/ui'

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

export function SampleTracker({ sample }: { sample: Record<string, any> }) {
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

  return (
    <div>
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
          return (
            <div
              key={s.key}
              className="stage-node absolute top-5 z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${nodeLeft(i)}%` }}
            >
              <div
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-full border-2 transition-colors',
                  done && 'border-brand bg-brand text-white',
                  current && !lost && 'border-brand bg-brand/20 text-brand-600 dark:text-brand-400',
                  current && lost && 'border-red-500 bg-red-500/20 text-red-500',
                  !done && !current &&
                    'border-slate-200 bg-white text-slate-300 dark:border-ink-700 dark:bg-ink-850 dark:text-slate-600',
                )}
              >
                {current && lost ? <AlertTriangle size={17} /> : <Icon size={17} />}
              </div>
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
              <div
                className={cn(
                  'text-[11px] font-semibold',
                  reached ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400',
                )}
              >
                {s.label}
              </div>
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
    </div>
  )
}
