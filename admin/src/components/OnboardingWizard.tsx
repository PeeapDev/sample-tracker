import { useEffect, useState, type ComponentType } from 'react'
import {
  X,
  ArrowLeft,
  ArrowRight,
  Rocket,
  LayoutDashboard,
  TestTubes,
  Truck,
  Package,
  Map as MapIcon,
  ShieldCheck,
  CheckCircle2,
  ScanLine,
  QrCode,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { roleMeta } from '../lib/ui'

interface Step {
  icon: ComponentType<{ size?: number }>
  color: string
  title: string
  body: string
}

/**
 * Role-specific onboarding steps. Each step teaches one real action in THIS
 * console and references the actual sidebar nav labels from AdminLayout.
 */
function stepsFor(role: string, firstName?: string): Step[] {
  const hi = firstName ? `Welcome, ${firstName}!` : 'Welcome!'

  const welcome: Step = {
    icon: Sparkles,
    color: '#6366F1',
    title: hi,
    body: "This is the NSRTMS Admin Console — your window into every sample's journey across the network. Here's a quick tour of what you can do.",
  }
  const dashboard: Step = {
    icon: LayoutDashboard,
    color: '#3B82F6',
    title: 'Dashboard',
    body: 'Your home base. See live network metrics — samples in transit, turnaround times, and where things stand at a glance.',
  }
  const done: Step = {
    icon: CheckCircle2,
    color: '#22C55E',
    title: "You're all set",
    body: 'That\'s the tour! You can reopen it any time from the "How it works" button in the sidebar. Let\'s get started.',
  }

  switch (role) {
    case 'admin':
      return [
        welcome,
        dashboard,
        {
          icon: TestTubes,
          color: '#14B8A6',
          title: 'Samples',
          body: 'Track every sample\'s full journey. Open one and click a stage in the tracker to rate or review how that hand-off went.',
        },
        {
          icon: Truck,
          color: '#F97316',
          title: 'Dispatches',
          body: 'See every transport trip across the network — who is carrying what, and where each run is right now.',
        },
        {
          icon: Package,
          color: '#8B5CF6',
          title: 'Parcels',
          body: 'Manage return cargo — the parcels and supplies heading back out to collection sites and facilities.',
        },
        {
          icon: MapIcon,
          color: '#F59E0B',
          title: 'Live Map',
          body: 'Watch riders move in real time. Follow active dispatches on the map as samples make their way to the lab.',
        },
        {
          icon: ShieldCheck,
          color: '#6366F1',
          title: 'Roles & Permissions',
          body: 'You are the super admin. Under Administration, fine-tune what each role can see and do across the console.',
        },
        done,
      ]

    case 'hub_officer':
    case 'lab_officer':
      return [
        welcome,
        dashboard,
        {
          icon: CheckCircle2,
          color: '#14B8A6',
          title: 'Receive incoming samples',
          body: 'When a delivery arrives, hit Accept in the top bar (or open Samples) and scan the QR to confirm it was received here.',
        },
        {
          icon: Package,
          color: '#8B5CF6',
          title: 'Parcels',
          body: 'Check the return cargo and supplies coming in and out of your facility under Parcels.',
        },
        done,
      ]

    case 'dispatcher':
      return [
        welcome,
        dashboard,
        {
          icon: Truck,
          color: '#F97316',
          title: 'Dispatches',
          body: 'Your trips live here. See the samples assigned to you and the route for each run you are carrying.',
        },
        {
          icon: ScanLine,
          color: '#3B82F6',
          title: 'Scan to advance',
          body: 'At each stop, use Scan Sample to scan the QR — that moves the sample to its next stage and logs your location.',
        },
        done,
      ]

    case 'collector':
      return [
        welcome,
        dashboard,
        {
          icon: QrCode,
          color: '#3B82F6',
          title: 'Register & collect',
          body: 'Head to Samples to register a new collection. Each sample gets a QR code that follows it all the way to the lab.',
        },
        done,
      ]

    default:
      // Fallback for unknown roles — a generic 3-step welcome.
      return [
        welcome,
        dashboard,
        done,
      ]
  }
}

export function OnboardingWizard({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [i, setI] = useState(0)
  const steps = stepsFor(user?.role ?? '', user?.firstName)
  const last = i === steps.length - 1
  const step = steps[i]
  const Icon = step.icon
  const accent = roleMeta(user?.role ?? '').color

  // Close on Escape — treated as a skip (still marks onboarding complete).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && !last) setI((n) => n + 1)
      if (e.key === 'ArrowLeft' && i > 0) setI((n) => n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [i, last, onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="animate-fade-up relative w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-2xl dark:border-ink-700 dark:bg-ink-900"
      >
        {/* Skip — top-right */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-ink-800 dark:hover:text-slate-200"
        >
          Skip <X size={14} />
        </button>

        {/* Accent banner */}
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${accent}, ${step.color})` }}
        />

        {/* Slide body */}
        <div className="px-8 pb-6 pt-12 text-center">
          <div
            className="mx-auto grid h-20 w-20 place-items-center rounded-full"
            style={{ background: `${step.color}1f`, color: step.color }}
          >
            <Icon size={36} />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold tracking-tight">{step.title}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {step.body}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pb-6">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Go to step ${idx + 1}`}
              className="h-2 rounded-full transition-all"
              style={{
                width: idx === i ? 22 : 8,
                background: idx === i ? accent : undefined,
              }}
              data-active={idx === i}
            >
              {idx !== i && (
                <span className="block h-2 w-2 rounded-full bg-slate-300 dark:bg-ink-700" />
              )}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 border-t px-6 py-4 dark:border-ink-700">
          <button
            onClick={() => setI((n) => Math.max(0, n - 1))}
            disabled={i === 0}
            className="btn-ghost"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="text-xs font-medium text-slate-400">
            {i + 1} of {steps.length}
          </div>

          {last ? (
            <button onClick={onClose} className="btn-primary">
              <Rocket size={16} /> Get started
            </button>
          ) : (
            <button onClick={() => setI((n) => n + 1)} className="btn-primary">
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
