import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  X,
  Camera,
  CameraOff,
  Plus,
  Trash2,
  Boxes,
  Loader2,
  CheckCircle2,
  Printer,
} from 'lucide-react'
import { api, apiError } from '../lib/api'
import { statusColor, statusLabel } from '../lib/ui'
import { printLabels } from '../lib/print'

interface PendingSample {
  id: string
  sampleId: string
  sampleType?: string
  diseaseProgram?: string
  status: string
  qrCode?: string
}

const SCANNER_ID = 'rebatch-scanner-region'

/**
 * Sort samples into a batch by scanning. In "create" mode it spins up a brand
 * new box; in "add" mode it tops up an existing one. Either way you scan or type
 * sample codes into a pending list, then commit — the backend moves each sample
 * out of any prior box (keeping its origin) and logs the move.
 */
export function RebatchModal({
  mode,
  batchId,
  batchLabel,
  onClose,
  onDone,
}: {
  mode: 'create' | 'add'
  batchId?: string
  batchLabel?: string
  onClose: () => void
  onDone?: () => void
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastCodeRef = useRef<string>('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [pending, setPending] = useState<PendingSample[]>([])
  const [manual, setManual] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [starting, setStarting] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [done, setDone] = useState<{ added: number; skipped: number; label: string } | null>(null)

  // Keep the wedge/typing input focused — many labs use handheld scanners that
  // act as keyboards and need a focused field to receive the scan.
  useEffect(() => {
    inputRef.current?.focus()
    return () => {
      void stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startCamera() {
    setError(null)
    setStarting(true)
    try {
      const scanner = new Html5Qrcode(SCANNER_ID, false)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => onDetect(decoded),
        () => {},
      )
      setCameraOn(true)
    } catch {
      scannerRef.current = null
      setError('Could not start the camera. Allow camera access (phones need HTTPS or localhost).')
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
    if (!code || code === lastCodeRef.current) return
    lastCodeRef.current = code
    void addCode(code)
    // Allow the same physical code to be re-read after a short gap.
    setTimeout(() => {
      if (lastCodeRef.current === code) lastCodeRef.current = ''
    }, 1200)
  }

  async function addCode(raw: string) {
    const code = raw.trim()
    if (!code) return
    setError(null)
    setHint(null)
    if (pending.some((p) => p.sampleId === code || p.id === code)) {
      setHint(`${code} is already in the list.`)
      return
    }
    try {
      const res = await api.get(`/samples/scan/${encodeURIComponent(code)}`)
      const s = res.data as PendingSample
      if (pending.some((p) => p.id === s.id)) {
        setHint(`${s.sampleId} is already in the list.`)
        return
      }
      setPending((prev) => [s, ...prev])
      setManual('')
    } catch (e) {
      setError(apiError(e, `Nothing found for "${code}"`))
    }
  }

  function remove(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id))
  }

  async function commit() {
    if (pending.length === 0) return
    setBusy(true)
    setError(null)
    try {
      let targetId = batchId
      let label = batchLabel ?? ''
      if (mode === 'create') {
        const created = await api.post('/batches', {
          sampleIds: [],
          ...(note.trim() ? { notes: note.trim() } : {}),
        })
        targetId = created.data.id
        label = created.data.batchId
      }
      const res = await api.post(`/batches/${targetId}/samples`, {
        sampleIds: pending.map((p) => p.sampleId),
      })
      await stopCamera()
      setDone({
        added: res.data.addedCount ?? pending.length,
        skipped: res.data.skippedCount ?? 0,
        label: res.data.batchId ?? label,
      })
      onDone?.()
    } catch (e) {
      setError(apiError(e, 'Could not sort these samples into the batch'))
    } finally {
      setBusy(false)
    }
  }

  function printPending() {
    printLabels(
      pending.map((p) => ({
        code: p.sampleId,
        qrCode: p.qrCode,
        line2: [p.sampleType, p.diseaseProgram].filter(Boolean).join(' · '),
      })),
      'Batch labels',
    )
  }

  const title = mode === 'create' ? 'New batch — sort by scanning' : `Add samples to ${batchLabel ?? 'batch'}`

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border bg-white dark:border-ink-700 dark:bg-ink-900 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b p-5 dark:border-ink-700">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-500">
              <Boxes size={20} />
            </span>
            <div>
              <div className="text-lg font-extrabold">{title}</div>
              <div className="text-xs text-slate-400">
                Scan or type each sample code — it keeps its original collection facility
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
                <CheckCircle2 size={28} />
              </span>
              <div className="text-lg font-bold">Sorted into {done.label}</div>
              <div className="text-sm text-slate-400">
                Added {done.added} sample{done.added === 1 ? '' : 's'}
                {done.skipped > 0 ? ` · skipped ${done.skipped}` : ''}
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={printPending} className="btn-ghost">
                  <Printer size={16} /> Print labels
                </button>
                <button onClick={onClose} className="btn-primary">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Camera scan */}
              <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-2xl bg-slate-900">
                <div id={SCANNER_ID} className="h-full w-full [&>video]:h-full [&>video]:w-full [&>video]:object-cover" />
                {!cameraOn && (
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center text-sm text-slate-400">
                    {starting ? 'Starting camera…' : 'Camera off — type codes or start the camera'}
                  </div>
                )}
              </div>
              <div className="mb-3 flex gap-2">
                {cameraOn ? (
                  <button onClick={() => void stopCamera()} className="btn-ghost flex-1">
                    <CameraOff size={16} /> Stop camera
                  </button>
                ) : (
                  <button onClick={() => void startCamera()} disabled={starting} className="btn-ghost flex-1">
                    <Camera size={16} /> Start camera
                  </button>
                )}
              </div>

              {/* Manual / handheld-scanner input */}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  className="input"
                  placeholder="Scan or type a sample ID, then Enter"
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void addCode(manual)
                  }}
                />
                <button onClick={() => void addCode(manual)} disabled={!manual.trim()} className="btn-primary shrink-0">
                  <Plus size={16} /> Add
                </button>
              </div>

              {hint && <div className="mt-2 text-xs text-amber-500">{hint}</div>}
              {error && <div className="mt-2 text-sm text-red-400">{error}</div>}

              {mode === 'create' && (
                <input
                  className="input mt-3"
                  placeholder="New batch label (optional) — e.g. Hub sort, Tue AM"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              )}

              {/* Pending list */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <span>{pending.length} sample{pending.length === 1 ? '' : 's'} ready</span>
                  {pending.length > 0 && (
                    <button onClick={() => setPending([])} className="text-slate-400 hover:text-red-500">
                      Clear
                    </button>
                  )}
                </div>
                {pending.length === 0 ? (
                  <p className="rounded-xl border border-dashed py-6 text-center text-sm text-slate-400 dark:border-ink-700">
                    Scanned samples will appear here.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {pending.map((p) => {
                      const c = statusColor(p.status)
                      return (
                        <li
                          key={p.id}
                          className="flex items-center gap-3 rounded-xl border px-3 py-2 dark:border-ink-700"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-mono text-sm font-semibold">{p.sampleId}</div>
                            <div className="truncate text-xs text-slate-400">
                              {[p.sampleType, p.diseaseProgram].filter(Boolean).join(' · ') || '—'}
                            </div>
                          </div>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ background: `${c}1f`, color: c }}
                          >
                            {statusLabel(p.status)}
                          </span>
                          <button
                            onClick={() => remove(p.id)}
                            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-ink-800"
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {!done && (
          <div className="flex items-center gap-2 border-t p-4 dark:border-ink-700">
            <button onClick={commit} disabled={busy || pending.length === 0} className="btn-primary flex-1">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Boxes size={16} />}
              {mode === 'create'
                ? `Create batch (${pending.length})`
                : `Add ${pending.length} to ${batchLabel ?? 'batch'}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
