import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import {
  ScanLine,
  Camera,
  Search,
  Zap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Clock,
  FlaskConical,
  Building2,
  Boxes,
  MapPin,
  History,
  Trash2,
} from 'lucide-react'
import { api, apiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { statusColor, statusLabel } from '../lib/ui'

interface Sample {
  id: string
  sampleId: string
  sampleType?: string
  diseaseProgram?: string
  status: string
  facility?: { name?: string } | null
}

interface Box {
  id: string
  batchId: string
  sampleCount?: number
  facility?: { name?: string } | null
  samples: Sample[]
}

type Result =
  | { kind: 'sample'; sample: Sample }
  | { kind: 'box'; box: Box }

// One row in the session scan log shown beside the scanner. `accepted` means a
// scan that actually advanced the item (a receipt); otherwise it was a look-up.
interface ScanEntry {
  key: number
  code: string
  kind: 'sample' | 'box'
  status: string
  accepted: boolean
  at: Date
}

// Terminal states have no further scan step.
const TERMINAL = new Set(['completed', 'lost'])

// The collection → lab journey: each stage, where it heads next, and which role
// performs that next scan. Mirrors the backend SCAN_FLOW so the UI only offers
// the action when it's actually this user's turn.
const FLOW: Record<string, { next: string; destination: string; by: string; role: string }> = {
  collected: { next: 'picked_up', destination: 'Picked up by a dispatcher → en route to the Hub', by: 'Dispatcher', role: 'dispatcher' },
  picked_up: { next: 'hub_received', destination: 'Received at the Regional Hub', by: 'Hub Officer', role: 'hub_officer' },
  hub_received: { next: 'in_transit', destination: 'Dispatched → en route to the Laboratory', by: 'Dispatcher', role: 'dispatcher' },
  in_transit: { next: 'lab_received', destination: 'Received at the Laboratory', by: 'Lab Officer', role: 'lab_officer' },
  lab_received: { next: 'analysis_queue', destination: 'Queued for analysis', by: 'Lab Officer', role: 'lab_officer' },
  analysis_queue: { next: 'completed', destination: 'Analysis complete — results ready', by: 'Lab Officer', role: 'lab_officer' },
}

// Can this role perform the next scan for a sample at the given status? Admin
// can always scan; otherwise the role must match the stage's responsible role.
function canRoleAdvance(role: string, status: string): boolean {
  return role === 'admin' || FLOW[status]?.role === role
}

const SCANNER_ID = 'qr-scanner-region'

export default function Scan() {
  // Reached via the header "Accept" button (?accept=1): a receiving officer
  // confirming goods handed over by a dispatcher/rider. Same scan-to-advance,
  // just framed as accepting/receiving rather than generic scanning.
  const [searchParams] = useSearchParams()
  const acceptMode = searchParams.get('accept') === '1'
  const myRole = useAuth().user?.role ?? ''

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastCodeRef = useRef<string>('')

  const [cameraOn, setCameraOn] = useState(false)
  const [starting, setStarting] = useState(false)
  const [camError, setCamError] = useState<string | null>(null)

  const [manual, setManual] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Running log of this session's scans, newest first. Cleared on reload.
  const [history, setHistory] = useState<ScanEntry[]>([])
  const historyId = useRef(0)

  function logScan(entry: Omit<ScanEntry, 'key' | 'at'>) {
    historyId.current += 1
    const row: ScanEntry = { ...entry, key: historyId.current, at: new Date() }
    setHistory((h) => [row, ...h].slice(0, 50))
  }

  // Open the camera as soon as the page loads, and stop it on the way out.
  useEffect(() => {
    void startCamera()
    return () => {
      void stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startCamera() {
    if (scannerRef.current) return // already running
    setCamError(null)
    setStarting(true)
    try {
      const scanner = new Html5Qrcode(SCANNER_ID, /* verbose */ false)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' }, // rear camera on phones
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => onDetect(decoded),
        () => {
          /* per-frame "not found" — ignored */
        },
      )
      setCameraOn(true)
    } catch {
      scannerRef.current = null
      setCamError(
        'Could not start the camera. Allow camera access for this site — and note phones only grant the camera over HTTPS (or localhost).',
      )
    } finally {
      setStarting(false)
    }
  }

  async function stopCamera() {
    const s = scannerRef.current
    scannerRef.current = null
    if (s) {
      try {
        await s.stop()
      } catch {
        /* already stopped */
      }
      try {
        s.clear()
      } catch {
        /* ignore */
      }
    }
    setCameraOn(false)
  }

  function onDetect(code: string) {
    // De-dupe the rapid repeat detections html5-qrcode emits for one QR.
    if (!code || code === lastCodeRef.current || busy) return
    lastCodeRef.current = code
    void lookup(code)
  }

  // Any QR is accepted: a BOX- code resolves to a package manifest, anything
  // else to an individual sample.
  async function lookup(rawCode: string) {
    const code = rawCode.trim()
    if (!code) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      if (code.toUpperCase().startsWith('BOX-')) {
        const res = await api.get(`/batches/scan/${encodeURIComponent(code)}`)
        const box: Box = res.data
        setResult({ kind: 'box', box })
        const statuses = Array.from(new Set((box.samples ?? []).map((s) => s.status)))
        logScan({
          code: box.batchId,
          kind: 'box',
          status: statuses.length === 1 ? statuses[0] : 'mixed',
          accepted: false,
        })
      } else {
        const res = await api.get(`/samples/scan/${encodeURIComponent(code)}`)
        const sample: Sample = res.data
        setResult({ kind: 'sample', sample })
        logScan({ code: sample.sampleId, kind: 'sample', status: sample.status, accepted: false })
      }
    } catch (e) {
      setResult(null)
      setError(apiError(e, `Nothing found for "${code}"`))
      lastCodeRef.current = '' // allow re-scanning the same code after a miss
    } finally {
      setBusy(false)
    }
  }

  // Best-effort GPS so the advance is location-stamped like the field app.
  function getPosition(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) return resolve(null)
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => resolve(null),
        { timeout: 5000, maximumAge: 60000 },
      )
    })
  }

  async function advanceSample(sample: Sample) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const pos = await getPosition()
      const res = await api.post('/samples/scan', {
        sampleId: sample.sampleId,
        action: 'advance',
        ...(pos ?? {}),
      })
      const next: Sample = res.data.sample ?? sample
      setResult({ kind: 'sample', sample: next })
      setMessage(res.data.message ?? 'Sample advanced to its next stage.')
      logScan({ code: next.sampleId, kind: 'sample', status: next.status, accepted: true })
    } catch (e) {
      setError(apiError(e, 'Could not advance this sample'))
    } finally {
      setBusy(false)
    }
  }

  async function advanceBox(box: Box) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const pos = await getPosition()
      const res = await api.post('/batches/scan', {
        batchId: box.batchId,
        action: 'advance',
        ...(pos ?? {}),
      })
      const nextBox: Box = res.data.batch ?? box
      if (res.data.batch) setResult({ kind: 'box', box: nextBox })
      const skipped = res.data.skippedCount ?? 0
      setMessage(
        (res.data.message ?? 'Box advanced.') +
          (skipped ? ` ${skipped} not movable from here were skipped.` : ''),
      )
      const statuses = Array.from(new Set((nextBox.samples ?? []).map((s) => s.status)))
      logScan({
        code: nextBox.batchId,
        kind: 'box',
        status: statuses.length === 1 ? statuses[0] : 'mixed',
        accepted: true,
      })
    } catch (e) {
      setError(apiError(e, 'Could not advance this box'))
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    lastCodeRef.current = ''
    setResult(null)
    setError(null)
    setMessage(null)
    setManual('')
  }

  function clearHistory() {
    setHistory([])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <ScanLine className="text-brand" /> {acceptMode ? 'Accept a Delivery' : 'Scan a Sample or Box'}
        </h2>
        {acceptMode && (
          <p className="text-sm text-slate-400">
            Scan what the dispatcher or rider hands over to confirm it arrived at your facility.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
       <div className="grid flex-1 gap-6 lg:grid-cols-2">
        {/* Scanner / input */}
        <div className="card space-y-4">
          {/* The scanner div is owned by html5-qrcode (it injects the <video>),
              so React must not render children into it. The overlay below is a
              sibling, to avoid DOM-reconciliation conflicts. Camera auto-starts. */}
          <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl bg-slate-900">
            <div
              id={SCANNER_ID}
              className="h-full w-full [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
            />
            {!cameraOn && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
                <div className="space-y-3">
                  <ScanLine size={40} className="mx-auto text-slate-500" />
                  <p className="text-sm text-slate-400">
                    {camError ? 'Camera unavailable' : 'Starting camera…'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {camError && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                <span>{camError}</span>
              </div>
              <button onClick={() => void startCamera()} disabled={starting} className="btn-ghost w-full">
                <Camera size={16} /> {starting ? 'Starting…' : 'Try again'}
              </button>
            </div>
          )}

          {/* Manual fallback */}
          <div className="border-t pt-4 dark:border-ink-700">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Or enter a sample / box ID
            </label>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="e.g. NSR-ABC123-XY12 or BOX-…"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void lookup(manual)
                }}
              />
              <button
                onClick={() => void lookup(manual)}
                disabled={busy || !manual.trim()}
                className="btn-primary shrink-0"
              >
                <Search size={16} /> Look up
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="card">
          {!result && !error && (
            <div className="grid h-full min-h-[16rem] place-items-center text-center text-slate-400">
              <div className="space-y-2">
                <Search size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm">Scan or enter a code to see its details and route here.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-500">
              <XCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {result?.kind === 'sample' && (
            <SampleResult
              sample={result.sample}
              busy={busy}
              acceptMode={acceptMode}
              myRole={myRole}
              onAdvance={() => void advanceSample(result.sample)}
              onReset={reset}
            />
          )}

          {result?.kind === 'box' && (
            <BoxResult
              box={result.box}
              busy={busy}
              acceptMode={acceptMode}
              myRole={myRole}
              onAdvance={() => void advanceBox(result.box)}
              onReset={reset}
            />
          )}
        </div>
      </div>

      {/* Session scan log — what was scanned this session and whether it moved. */}
      {history.length > 0 && (
        <div className="card xl:w-80 xl:shrink-0">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <History size={15} /> This session
            </h3>
            <button
              onClick={clearHistory}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
          <div className="divide-y dark:divide-ink-700">
            {history.map((h) => (
              <div key={h.key} className="flex items-center gap-3 py-2 text-sm">
                {h.kind === 'box' ? (
                  <Boxes size={16} className="shrink-0 text-slate-400" />
                ) : (
                  <FlaskConical size={16} className="shrink-0 text-slate-400" />
                )}
                <span className="font-mono">{h.code}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{ background: `${statusColor(h.status)}1f`, color: statusColor(h.status) }}
                >
                  {statusLabel(h.status)}
                </span>
                {h.accepted && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                    <CheckCircle2 size={13} /> advanced
                  </span>
                )}
                <span className="ml-auto text-xs text-slate-400">
                  {h.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

/** "Where it's going" — current stage → next stop, with the responsible role. */
function RouteStrip({ status }: { status: string }) {
  const step = FLOW[status]
  return (
    <div className="rounded-xl border border-brand/20 bg-brand/5 p-3 text-sm">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <MapPin size={13} /> Where it's going
      </div>
      {step ? (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
              style={{ background: `${statusColor(status)}1f`, color: statusColor(status) }}
            >
              {statusLabel(status)}
            </span>
            <ArrowRight size={15} className="text-slate-400" />
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
              style={{ background: `${statusColor(step.next)}1f`, color: statusColor(step.next) }}
            >
              {statusLabel(step.next)}
            </span>
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            {step.destination} · advanced by a <span className="font-medium">{step.by}</span>
          </div>
        </div>
      ) : (
        <div className="font-medium text-slate-500 dark:text-slate-400">
          {status === 'completed'
            ? 'Journey complete — analysis finished. No further step.'
            : 'Marked lost — no further step.'}
        </div>
      )}
    </div>
  )
}

function SampleResult({
  sample,
  busy,
  acceptMode,
  myRole,
  onAdvance,
  onReset,
}: {
  sample: Sample
  busy: boolean
  acceptMode?: boolean
  myRole: string
  onAdvance: () => void
  onReset: () => void
}) {
  const active = !TERMINAL.has(sample.status)
  // Only offer the action when this sample is actually at this user's stage.
  const myTurn = canRoleAdvance(myRole, sample.status)
  const canAdvance = active && myTurn
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-lg font-bold">{sample.sampleId}</div>
          <div className="text-xs text-slate-400">Sample</div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ background: `${statusColor(sample.status)}1f`, color: statusColor(sample.status) }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor(sample.status) }} />
          {statusLabel(sample.status)}
        </span>
      </div>

      <dl className="space-y-2.5 text-sm">
        <Row icon={FlaskConical} label="Type">
          {sample.sampleType ?? '—'}
          {sample.diseaseProgram ? ` · ${sample.diseaseProgram}` : ''}
        </Row>
        <Row icon={Building2} label="From">
          {sample.facility?.name ?? '—'}
        </Row>
      </dl>

      <RouteStrip status={sample.status} />

      {active && !myTurn ? (
        <div className="space-y-3 border-t pt-4 dark:border-ink-700">
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-600 dark:text-amber-400">
            <Clock size={16} className="mt-0.5 shrink-0" />
            <span>
              Not your step yet — this sample is at <b>{statusLabel(sample.status)}</b>. Its next
              scan is done by a <b>{FLOW[sample.status]?.by ?? 'different role'}</b>, so you can't
              advance it from here.
            </span>
          </div>
          <button onClick={onReset} className="btn-ghost w-full">
            <RotateCcw size={16} /> New scan
          </button>
        </div>
      ) : (
        <Actions
          canAdvance={canAdvance}
          busy={busy}
          status={sample.status}
          advanceLabel={acceptMode ? 'Accept here' : 'Advance to next stage'}
          onAdvance={onAdvance}
          onReset={onReset}
        />
      )}
    </div>
  )
}

function BoxResult({
  box,
  busy,
  acceptMode,
  myRole,
  onAdvance,
  onReset,
}: {
  box: Box
  busy: boolean
  acceptMode?: boolean
  myRole: string
  onAdvance: () => void
  onReset: () => void
}) {
  const samples = box.samples ?? []
  const statuses = Array.from(new Set(samples.map((s) => s.status)))
  const active = samples.some((s) => !TERMINAL.has(s.status))
  // The box advances if any sample inside is at this user's stage.
  const myTurn = samples.some((s) => canRoleAdvance(myRole, s.status))
  const canAdvance = active && myTurn

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-lg font-bold">{box.batchId}</div>
          <div className="text-xs text-slate-400">Box · {samples.length} samples</div>
        </div>
        <Boxes size={22} className="text-slate-400" />
      </div>

      <dl className="space-y-2.5 text-sm">
        <Row icon={Building2} label="From">
          {box.facility?.name ?? '—'}
        </Row>
      </dl>

      {/* If the whole box is at one stage, show a single route; if mixed,
          show the route for each distinct stage present. */}
      {statuses.length === 0 ? (
        <p className="text-sm text-slate-400">This box has no samples.</p>
      ) : (
        statuses.map((st) => <RouteStrip key={st} status={st} />)
      )}

      {/* Manifest — each sample and where it's headed next. */}
      {samples.length > 0 && (
        <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border p-2 dark:border-ink-700">
          {samples.map((s) => {
            const step = FLOW[s.status]
            return (
              <div key={s.id} className="flex items-center justify-between gap-2 px-1 py-1 text-sm">
                <span className="font-mono">{s.sampleId}</span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span style={{ color: statusColor(s.status) }}>{statusLabel(s.status)}</span>
                  {step && (
                    <>
                      <ArrowRight size={12} />
                      <span style={{ color: statusColor(step.next) }}>{statusLabel(step.next)}</span>
                    </>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {active && !myTurn ? (
        <div className="space-y-3 border-t pt-4 dark:border-ink-700">
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-600 dark:text-amber-400">
            <Clock size={16} className="mt-0.5 shrink-0" />
            <span>Not your step — none of the samples in this box are waiting on you to scan.</span>
          </div>
          <button onClick={onReset} className="btn-ghost w-full">
            <RotateCcw size={16} /> New scan
          </button>
        </div>
      ) : (
        <Actions
          canAdvance={canAdvance}
          busy={busy}
          status={statuses.length === 1 ? statuses[0] : 'mixed'}
          advanceLabel={acceptMode ? 'Accept whole box' : 'Advance whole box'}
          onAdvance={onAdvance}
          onReset={onReset}
        />
      )}
    </div>
  )
}

function Actions({
  canAdvance,
  busy,
  status,
  advanceLabel = 'Advance to next stage',
  onAdvance,
  onReset,
}: {
  canAdvance: boolean
  busy: boolean
  status: string
  advanceLabel?: string
  onAdvance: () => void
  onReset: () => void
}) {
  return (
    <div className="flex gap-2 border-t pt-4 dark:border-ink-700">
      {canAdvance ? (
        <button onClick={onAdvance} disabled={busy} className="btn-primary flex-1">
          <Zap size={16} /> {busy ? 'Working…' : advanceLabel}
        </button>
      ) : (
        <span className="flex-1 self-center text-center text-sm text-slate-400">
          No further scan step for a {statusLabel(status).toLowerCase()} item.
        </span>
      )}
      <button onClick={onReset} className="btn-ghost shrink-0">
        <RotateCcw size={16} /> New scan
      </button>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="shrink-0 text-slate-400" />
      <dt className="w-16 shrink-0 text-slate-400">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}
