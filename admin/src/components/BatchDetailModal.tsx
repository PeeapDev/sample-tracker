import { useEffect, useState } from 'react'
import { X, Loader2, Boxes, ScanLine, Printer, Plus } from 'lucide-react'
import { api, apiError } from '../lib/api'
import { statusColor, statusLabel } from '../lib/ui'
import { useAuth } from '../lib/auth'
import { useRbac } from '../lib/rbac'
import { printLabels } from '../lib/print'
import { RebatchModal } from './RebatchModal'

interface BatchSample {
  id: string
  sampleId: string
  sampleType: string
  diseaseProgram: string
  status: string
  qrCode?: string
}

interface Batch {
  id: string
  batchId: string
  qrCode?: string
  sampleCount: number
  notes?: string
  createdAt?: string
  facility?: { name?: string } | null
  samples?: BatchSample[]
}

export function BatchDetailModal({ batchId, onClose, onChanged }: { batchId: string; onClose: () => void; onChanged?: () => void }) {
  const { user } = useAuth()
  const { can } = useRbac()
  const canScan = can(user?.role ?? '', 'samples.manage') || user?.role === 'admin'
  const canBatch = can(user?.role ?? '', 'batches.manage') || user?.role === 'admin'
  const [batch, setBatch] = useState<Batch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ message: string; advanced: any[]; skipped: any[] } | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  function printBoxLabel() {
    if (!batch) return
    printLabels([{ code: batch.batchId, qrCode: batch.qrCode, line2: `${batch.sampleCount} samples` }], batch.batchId)
  }

  function printAllLabels() {
    if (!batch?.samples?.length) return
    printLabels(
      batch.samples.map((s) => ({
        code: s.sampleId,
        qrCode: s.qrCode,
        line2: [s.sampleType, s.diseaseProgram].filter(Boolean).join(' · '),
        line3: batch.batchId, // stamp the box number on each sample label
      })),
      `${batch.batchId} labels`,
    )
  }

  async function load() {
    try {
      const res = await api.get(`/batches/${batchId}`)
      setBatch(res.data)
      setError(null)
    } catch (e) {
      setError(apiError(e, 'Failed to load batch'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [batchId])

  async function scanAdvanceAll() {
    if (!batch) return
    setBusy(true)
    setResult(null)
    try {
      const res = await api.post('/batches/scan', { batchId: batch.batchId })
      setResult(res.data)
      await load()
      onChanged?.()
    } catch (e) {
      setError(apiError(e, 'Bulk scan failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-t-2xl border bg-white dark:border-ink-700 dark:bg-ink-900 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b p-5 dark:border-ink-700">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-500">
              <Boxes size={20} />
            </span>
            <div>
              <div className="font-mono text-lg font-extrabold">{batch?.batchId ?? 'Batch'}</div>
              <div className="text-xs text-slate-400">{batch?.sampleCount ?? 0} samples in this box</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {error ? (
            <div className="py-8 text-center text-sm text-red-400">{error}</div>
          ) : loading || !batch ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                {batch.qrCode && (
                  <div className="rounded-xl border bg-white p-2 dark:border-ink-700">
                    <img src={batch.qrCode} alt={batch.batchId} className="h-32 w-32" />
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <div className="text-sm text-slate-400">Box label — print &amp; attach to the package</div>
                  <div className="mt-1 font-mono text-xl font-bold">{batch.batchId}</div>
                  {batch.facility?.name && (
                    <div className="mt-2 text-sm">
                      <span className="text-slate-400">Facility: </span>
                      {batch.facility.name}
                    </div>
                  )}
                  {batch.notes && <div className="mt-1 text-sm text-slate-400">{batch.notes}</div>}
                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <button onClick={printBoxLabel} className="btn-ghost text-xs">
                      <Printer size={14} /> Print box label
                    </button>
                    {batch.samples && batch.samples.length > 0 && (
                      <button onClick={printAllLabels} className="btn-ghost text-xs">
                        <Printer size={14} /> Print all labels ({batch.samples.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Manifest
              </div>
              <div className="overflow-hidden rounded-xl border dark:border-ink-700">
                <table className="w-full text-sm">
                  <tbody>
                    {batch.samples?.map((s) => {
                      const c = statusColor(s.status)
                      return (
                        <tr key={s.id} className="border-b last:border-0 dark:border-ink-700/60">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              {s.qrCode ? (
                                <img
                                  src={s.qrCode}
                                  alt={s.sampleId}
                                  className="h-10 w-10 shrink-0 rounded border bg-white p-0.5 dark:border-ink-700"
                                />
                              ) : (
                                <span className="h-10 w-10 shrink-0 rounded border bg-slate-100 dark:border-ink-700 dark:bg-ink-800" />
                              )}
                              <div className="min-w-0">
                                <div className="font-mono font-semibold">{s.sampleId}</div>
                                <div className="text-xs text-slate-400">{s.sampleType} · {s.diseaseProgram}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                              style={{ background: `${c}1f`, color: c }}
                            >
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                              {statusLabel(s.status)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {result && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-sm">
                  <div className="font-semibold text-emerald-500">{result.message}</div>
                  {result.skipped.length > 0 && (
                    <div className="mt-1 text-xs text-amber-500">
                      Skipped {result.skipped.length}: {result.skipped.map((s: any) => s.sampleId).join(', ')}
                    </div>
                  )}
                </div>
              )}

              {(canScan || canBatch) && (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4 dark:border-ink-700">
                  {canScan && (
                    <button onClick={scanAdvanceAll} disabled={busy} className="btn-primary">
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                      Scan box → advance all
                    </button>
                  )}
                  {canBatch && (
                    <button onClick={() => setShowAdd(true)} className="btn-ghost">
                      <Plus size={16} /> Add samples (scan)
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAdd && batch && (
        <RebatchModal
          mode="add"
          batchId={batch.id}
          batchLabel={batch.batchId}
          onClose={() => setShowAdd(false)}
          onDone={() => {
            load()
            onChanged?.()
          }}
        />
      )}
    </div>
  )
}
