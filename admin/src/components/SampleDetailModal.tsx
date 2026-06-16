import { useEffect, useState } from 'react'
import {
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ScanLine,
  Printer,
  Building2,
  Boxes,
  UserRound,
} from 'lucide-react'
import { api, apiError } from '../lib/api'
import { statusColor, statusLabel, roleMeta } from '../lib/ui'
import { useAuth } from '../lib/auth'
import { useRbac } from '../lib/rbac'
import { SampleTracker } from './SampleTracker'

const NEXT: Record<string, { status: string; label: string }> = {
  collected: { status: 'picked_up', label: 'Picked Up' },
  picked_up: { status: 'hub_received', label: 'Hub Received' },
  hub_received: { status: 'in_transit', label: 'In Transit' },
  in_transit: { status: 'lab_received', label: 'Lab Received' },
  lab_received: { status: 'completed', label: 'Completed' },
  analysis_queue: { status: 'completed', label: 'Completed' },
}

export function SampleDetailModal({
  sampleId,
  fallback,
  onClose,
}: {
  sampleId: string
  fallback?: Record<string, any>
  onClose: () => void
}) {
  const { user } = useAuth()
  const { can } = useRbac()
  const canManage = can(user?.role ?? '', 'samples.manage')
  const [sample, setSample] = useState<Record<string, any> | null>(fallback ?? null)
  const [timeline, setTimeline] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function loadTimeline() {
    try {
      const res = await api.get(`/samples/${sampleId}/timeline`)
      setTimeline(Array.isArray(res.data) ? res.data : [])
    } catch {
      /* timeline is best-effort */
    }
  }

  async function refresh() {
    const res = await api.get(`/samples/${sampleId}`)
    setSample(res.data)
    await loadTimeline()
  }

  async function markLost() {
    setBusy(true)
    setActionError(null)
    try {
      await api.patch(`/samples/${sampleId}/lost`, { notes: 'Marked lost from admin console' })
      await refresh()
    } catch (e) {
      setActionError(apiError(e, 'Failed to mark lost'))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    let active = true
    api
      .get(`/samples/${sampleId}`)
      .then((res) => {
        if (active) setSample(res.data)
      })
      .catch((e) => {
        if (active && !fallback) setError(apiError(e, 'Failed to load sample'))
      })
      .finally(() => active && setLoading(false))
    loadTimeline()
    return () => {
      active = false
    }
  }, [sampleId])

  const s = sample
  const color = s ? statusColor(String(s.status)) : '#94A3B8'

  // "Currently at" = the facility / GPS of the most recent scan event (the
  // timeline is ordered oldest→newest), falling back to the collection facility.
  const latestFacilityEvent = [...timeline].reverse().find((e) => e?.facility?.name)
  const currentFacility = latestFacilityEvent?.facility?.name ?? s?.facility?.name ?? null
  const latestGpsEvent = [...timeline].reverse().find(
    (e) => e?.latitude != null && e?.longitude != null,
  )

  function printQr() {
    if (!s?.qrCode) return
    const w = window.open('', '_blank', 'width=420,height=520')
    if (!w) return
    w.document.write(
      `<html><head><title>${s.sampleId}</title></head>` +
        `<body style="text-align:center;font-family:sans-serif;padding:24px;margin:0">` +
        `<img src="${s.qrCode}" style="width:260px;height:260px"/>` +
        `<div style="font-family:monospace;font-size:22px;font-weight:700;margin-top:12px">${s.sampleId}</div>` +
        `<div style="color:#555;margin-top:4px">${s.sampleType ?? ''} &middot; ${s.diseaseProgram ?? ''}</div>` +
        `</body></html>`,
    )
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border bg-white dark:border-ink-700 dark:bg-ink-900 sm:max-h-[90vh] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b p-5 dark:border-ink-700">
          <div>
            <div className="font-mono text-lg font-extrabold">{s?.sampleId ?? sampleId}</div>
            {s && (
              <span
                className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: `${color}1f`, color }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                {statusLabel(String(s.status))}
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error ? (
            <div className="py-10 text-center text-sm text-red-400">{error}</div>
          ) : !s ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <>
              {/* Where the sample is right now — derived from the latest scan */}
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border p-3.5 dark:border-ink-700">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand-500">
                    <Building2 size={17} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Currently at
                    </div>
                    <div className="truncate text-sm font-semibold">{currentFacility ?? 'Unknown'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border p-3.5 dark:border-ink-700">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
                    <MapPin size={17} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Last known location
                    </div>
                    {latestGpsEvent ? (
                      <a
                        href={`https://www.google.com/maps?q=${latestGpsEvent.latitude},${latestGpsEvent.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm font-semibold text-brand-500 hover:underline"
                      >
                        {Number(latestGpsEvent.latitude).toFixed(4)}, {Number(latestGpsEvent.longitude).toFixed(4)}
                      </a>
                    ) : (
                      <div className="truncate text-sm font-semibold text-slate-400">Not captured yet</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Origin collector — an immutable snapshot taken at collection. */}
              {(s.collectorName || s.collectedBy) && (
                <div className="mb-5 rounded-xl border p-3.5 dark:border-ink-700">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <UserRound size={14} /> Origin — collected by
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                    <Detail
                      label="Name"
                      value={
                        s.collectorName ||
                        (s.collectedBy
                          ? `${s.collectedBy.firstName ?? ''} ${s.collectedBy.lastName ?? ''}`.trim()
                          : '—')
                      }
                    />
                    <Detail
                      label="Role"
                      value={
                        s.collectorRole
                          ? roleMeta(String(s.collectorRole)).label
                          : s.collectedBy?.role
                            ? roleMeta(String(s.collectedBy.role)).label
                            : '—'
                      }
                    />
                    <Detail label="Phone" value={s.collectorPhone || s.collectedBy?.phone || '—'} />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Captured at collection — fixed to this sample's origin, even if the account changes.
                  </div>
                </div>
              )}

              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Journey
              </div>
              <SampleTracker sample={s} timeline={timeline} />

              {/* Sample QR — generated at collection, scanned at every stage */}
              {s.qrCode && (
                <div className="mt-6 flex items-center gap-4 rounded-xl border p-4 dark:border-ink-700">
                  <img
                    src={s.qrCode}
                    alt={s.sampleId}
                    className="h-24 w-24 shrink-0 rounded-lg border bg-white p-1 dark:border-ink-700"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Sample QR
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-semibold">{s.sampleId}</div>
                    <div className="text-xs text-slate-400">
                      Print &amp; attach to the vial — scanned to advance at every stage
                    </div>
                  </div>
                  <button onClick={printQr} className="btn-ghost shrink-0">
                    <Printer size={16} /> Print
                  </button>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Detail label="Type" value={s.sampleType} />
                <Detail label="Program" value={s.diseaseProgram} />
                <Detail label="Quantity" value={String(s.quantity ?? '—')} />
                <Detail label="Village" value={s.village ?? '—'} />
                <Detail
                  label="Patient"
                  value={[s.patientAge && `${s.patientAge}y`, s.patientGender].filter(Boolean).join(', ') || '—'}
                />
                <Detail label="Facility" value={s.facility?.name ?? '—'} />
                <Detail label="Batch" value={s.batch?.batchId ?? '—'} />
                <Detail
                  label="Registered"
                  value={s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}
                />
              </div>

              {/* Chain of custody — every scan, with actor, location & GPS */}
              {timeline.length > 0 && (
                <div className="mt-6 border-t pt-4 dark:border-ink-700">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Chain of Custody
                  </div>
                  <ol className="space-y-3">
                    {timeline.map((e) => {
                      const rebatch = e.metadata?.rebatch
                      const c = rebatch ? '#8B5CF6' : statusColor(String(e.event))
                      const actor = e.actor
                        ? `${e.actor.firstName ?? ''} ${e.actor.lastName ?? ''}`.trim()
                        : null
                      const hasGps = e.latitude != null && e.longitude != null
                      const title = rebatch
                        ? `Sorted into ${rebatch.to}${rebatch.from ? ` (from ${rebatch.from})` : ''}`
                        : statusLabel(String(e.event))
                      return (
                        <li key={e.id} className="flex gap-3">
                          <span
                            className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white"
                            style={{ background: c }}
                          >
                            {rebatch ? (
                              <Boxes size={12} />
                            ) : e.metadata?.scanned ? (
                              <ScanLine size={12} />
                            ) : (
                              <CheckCircle2 size={12} />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 text-sm">
                              <span className="font-semibold">{title}</span>
                              <span className="text-xs text-slate-400">
                                {e.timestamp ? new Date(e.timestamp).toLocaleString() : ''}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                              {actor && <span>by {actor}</span>}
                              {e.facility?.name && <span>· {e.facility.name}</span>}
                              {hasGps ? (
                                <a
                                  href={`https://www.google.com/maps?q=${e.latitude},${e.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-brand-500 hover:underline"
                                >
                                  <MapPin size={11} />
                                  {Number(e.latitude).toFixed(4)}, {Number(e.longitude).toFixed(4)}
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-500">
                                  <MapPin size={11} /> no GPS
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )}

              {canManage && (
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t pt-4 dark:border-ink-700">
                  {String(s.status) === 'completed' ? (
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-500">
                      <CheckCircle2 size={16} /> Journey complete
                    </span>
                  ) : String(s.status) !== 'lost' && NEXT[String(s.status)] ? (
                    // Status advances only by scanning the sample's QR — no manual edits.
                    <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                      <ScanLine size={16} /> Advances to {NEXT[String(s.status)].label} when scanned
                    </span>
                  ) : null}
                  {String(s.status) !== 'completed' && String(s.status) !== 'lost' && (
                    <button
                      onClick={markLost}
                      disabled={busy}
                      className="ml-auto inline-flex items-center gap-2 rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 disabled:opacity-60"
                    >
                      <AlertTriangle size={16} /> Mark Lost
                    </button>
                  )}
                </div>
              )}

              {actionError && <div className="mt-3 text-sm text-red-400">{actionError}</div>}

              {loading && (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 size={12} className="animate-spin" /> Refreshing details…
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
    </div>
  )
}
