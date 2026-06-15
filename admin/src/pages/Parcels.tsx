import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  Search,
  RefreshCw,
  Package,
  Plus,
  X,
  Loader2,
  FileText,
  Boxes,
  Mail,
  Wrench,
  Printer,
  MapPin,
  ScanLine,
  CheckCircle2,
} from 'lucide-react'
import { api, apiError } from '../lib/api'
import { getCache, setCache, hasCache } from '../lib/cache'
import { cn } from '../lib/ui'
import { useAuth } from '../lib/auth'
import { useRbac } from '../lib/rbac'

interface ParcelRow {
  id: string
  parcelId: string
  type: string
  status: string
  description?: string | null
  quantity?: number | null
  originFacility?: { name?: string } | null
  destinationFacility?: { name?: string } | null
  rider?: { firstName?: string; lastName?: string } | null
  createdAt: string
  registeredAt?: string | null
  pickedUpAt?: string | null
  inTransitAt?: string | null
  deliveredAt?: string | null
}

interface ParcelStats {
  total: number
  registered: number
  inTransit: number
  delivered: number
  lost: number
}

const PARCEL_STATUS_COLORS: Record<string, string> = {
  registered: '#94A3B8',
  picked_up: '#F97316',
  in_transit: '#F59E0B',
  delivered: '#22C55E',
  lost: '#EF4444',
}

const TYPE_META: Record<string, { label: string; color: string; icon: typeof Package }> = {
  letter: { label: 'Letter', color: '#3B82F6', icon: Mail },
  supply: { label: 'Supply', color: '#8B5CF6', icon: Boxes },
  document: { label: 'Document', color: '#14B8A6', icon: FileText },
  equipment: { label: 'Equipment', color: '#F97316', icon: Wrench },
  other: { label: 'Other', color: '#94A3B8', icon: Package },
}

const PARCEL_STATUSES = ['registered', 'picked_up', 'in_transit', 'delivered', 'lost']
const PARCEL_TYPES = Object.keys(TYPE_META)

function parcelStatusColor(s: string) {
  return PARCEL_STATUS_COLORS[s] ?? '#94A3B8'
}

function parcelStatusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function typeMeta(t: string) {
  return TYPE_META[t] ?? TYPE_META.other
}

const PAGE_SIZE = 25

export default function Parcels() {
  const [rows, setRows] = useState<ParcelRow[]>(() => getCache<ParcelRow[]>('parcels') ?? [])
  const [total, setTotal] = useState<number>(() => getCache<ParcelRow[]>('parcels')?.length ?? 0)
  const [stats, setStats] = useState<ParcelStats | null>(() => getCache<ParcelStats>('parcels_stats') ?? null)
  const [loading, setLoading] = useState(!hasCache('parcels'))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [reloadNonce, setReloadNonce] = useState(0)
  const [selected, setSelected] = useState<ParcelRow | null>(null)
  const [showRegister, setShowRegister] = useState(false)

  const { user } = useAuth()
  const { can } = useRbac()
  const canManage = can(user?.role ?? '', 'samples.manage') || user?.role === 'admin'

  const filtersActive = !!debouncedQuery || status !== 'all' || typeFilter !== 'all'
  const isDefaultView =
    !debouncedQuery && status === 'all' && typeFilter === 'all' && page === 1

  async function loadStats() {
    try {
      const res = await api.get('/parcels/stats')
      if (res.data && typeof res.data === 'object') {
        setStats(res.data)
        setCache('parcels_stats', res.data)
      }
    } catch {
      /* stats are best-effort */
    }
  }

  async function load() {
    setRefreshing(true)
    try {
      const params: Record<string, string | number> = { page, pageSize: PAGE_SIZE }
      if (debouncedQuery) params.search = debouncedQuery
      if (status !== 'all') params.status = status
      if (typeFilter !== 'all') params.type = typeFilter
      const res = await api.get('/parcels', { params })
      const list = res.data?.data ?? res.data ?? []
      const arr = Array.isArray(list) ? list : []
      setRows(arr)
      setTotal(typeof res.data?.total === 'number' ? res.data.total : arr.length)
      if (isDefaultView) setCache('parcels', arr)
      setError(null)
    } catch (e) {
      if (rows.length === 0) setError(apiError(e, 'Failed to load parcels'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function reload() {
    setReloadNonce((n) => n + 1)
  }

  function onRegistered(created: ParcelRow) {
    setShowRegister(false)
    setSelected(created)
    setQuery('')
    setStatus('all')
    setTypeFilter('all')
    setPage(1)
    reload()
    loadStats()
  }

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, status, typeFilter])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, status, typeFilter, page, reloadNonce])

  useEffect(() => {
    loadStats()
  }, [reloadNonce])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Parcels</h2>
          <p className="text-sm text-slate-400">
            Return cargo riders bring back from the center · click a row to track it
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={reload} className="btn-ghost">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          {canManage && (
            <button onClick={() => setShowRegister(true)} className="btn-primary">
              <Plus size={16} /> Register Parcel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Total" value={stats?.total ?? 0} accent="#6366F1" />
        <Stat label="Registered" value={stats?.registered ?? 0} accent={PARCEL_STATUS_COLORS.registered} />
        <Stat label="In Transit" value={stats?.inTransit ?? 0} accent={PARCEL_STATUS_COLORS.in_transit} />
        <Stat label="Delivered" value={stats?.delivered ?? 0} accent={PARCEL_STATUS_COLORS.delivered} />
        <Stat label="Lost" value={stats?.lost ?? 0} accent={PARCEL_STATUS_COLORS.lost} />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by parcel ID or description"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="input max-w-[180px]" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All types</option>
          {PARCEL_TYPES.map((t) => (
            <option key={t} value={t}>
              {typeMeta(t).label}
            </option>
          ))}
        </select>
        <select className="input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {PARCEL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {parcelStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="card text-sm text-red-400">{error}</div>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400 dark:border-ink-700">
                <th className="px-5 py-3 font-medium">Parcel</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Route</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Rider</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const meta = typeMeta(p.type)
                const Icon = meta.icon
                const color = parcelStatusColor(p.status)
                const rider = p.rider
                  ? `${p.rider.firstName ?? ''} ${p.rider.lastName ?? ''}`.trim()
                  : null
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-slate-50 dark:border-ink-700/60 dark:hover:bg-ink-850/50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                          style={{ background: `${meta.color}22`, color: meta.color }}
                        >
                          <Icon size={15} />
                        </span>
                        <div className="min-w-0">
                          <div className="font-mono font-semibold">{p.parcelId}</div>
                          {p.description && (
                            <div className="truncate text-xs text-slate-400">{p.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: `${meta.color}1f`, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {p.originFacility?.name ?? '—'} → {p.destinationFacility?.name ?? '—'}
                    </td>
                    <td className="hidden px-5 py-3 text-slate-400 md:table-cell">{rider ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: `${color}1f`, color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                        {parcelStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-ink-800">
                        <Package size={22} />
                      </span>
                      <div>
                        <div className="font-semibold text-slate-500 dark:text-slate-300">
                          {!filtersActive ? 'No parcels yet' : 'No parcels match your filters'}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {!filtersActive
                            ? 'Cargo registered for the return run appears here.'
                            : 'Try a different search term, type or status.'}
                        </div>
                      </div>
                      {filtersActive && (
                        <button
                          onClick={() => {
                            setQuery('')
                            setStatus('all')
                            setTypeFilter('all')
                          }}
                          className="btn-ghost text-xs"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && total > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 px-1 text-sm text-slate-400">
          <span>
            Showing {showingFrom}–{showingTo} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || refreshing}
              className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-slate-500 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || refreshing}
              className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selected && (
        <ParcelDetailModal parcelId={selected.id} fallback={selected} onClose={() => setSelected(null)} />
      )}

      {showRegister && (
        <RegisterParcelModal onClose={() => setShowRegister(false)} onCreated={onRegistered} />
      )}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="card !p-4">
      <div className="text-2xl font-extrabold" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}

function ParcelDetailModal({
  parcelId,
  fallback,
  onClose,
}: {
  parcelId: string
  fallback?: ParcelRow
  onClose: () => void
}) {
  const [parcel, setParcel] = useState<Record<string, any> | null>(fallback ?? null)
  const [timeline, setTimeline] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .get(`/parcels/${parcelId}`)
      .then((res) => {
        if (active) setParcel(res.data)
      })
      .catch((e) => {
        if (active && !fallback) setError(apiError(e, 'Failed to load parcel'))
      })
      .finally(() => active && setLoading(false))
    api
      .get(`/parcels/${parcelId}/timeline`)
      .then((res) => {
        if (active) setTimeline(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        /* timeline is best-effort */
      })
    return () => {
      active = false
    }
  }, [parcelId])

  const p = parcel
  const color = p ? parcelStatusColor(String(p.status)) : '#94A3B8'
  const meta = p ? typeMeta(String(p.type)) : typeMeta('other')

  function printQr() {
    if (!p?.qrCode) return
    const w = window.open('', '_blank', 'width=420,height=520')
    if (!w) return
    w.document.write(
      `<html><head><title>${p.parcelId}</title></head>` +
        `<body style="text-align:center;font-family:sans-serif;padding:24px;margin:0">` +
        `<img src="${p.qrCode}" style="width:260px;height:260px"/>` +
        `<div style="font-family:monospace;font-size:22px;font-weight:700;margin-top:12px">${p.parcelId}</div>` +
        `<div style="color:#555;margin-top:4px">${meta.label}${p.description ? ` &middot; ${p.description}` : ''}</div>` +
        `</body></html>`,
    )
    w.document.close()
    w.focus()
    w.print()
  }

  const rider = p?.rider
    ? `${p.rider.firstName ?? ''} ${p.rider.lastName ?? ''}`.trim()
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border bg-white dark:border-ink-700 dark:bg-ink-900 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b p-5 dark:border-ink-700">
          <div>
            <div className="font-mono text-lg font-extrabold">{p?.parcelId ?? parcelId}</div>
            {p && (
              <span
                className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: `${color}1f`, color }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                {parcelStatusLabel(String(p.status))}
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {error ? (
            <div className="py-10 text-center text-sm text-red-400">{error}</div>
          ) : !p ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Route</div>
              <div className="mb-5 rounded-xl border p-3.5 text-sm dark:border-ink-700">
                <span className="font-semibold">{p.originFacility?.name ?? 'Origin'}</span>
                <span className="px-2 text-slate-400">→</span>
                <span className="font-semibold">{p.destinationFacility?.name ?? 'Destination'}</span>
              </div>

              {p.qrCode && (
                <div className="mb-6 flex items-center gap-4 rounded-xl border p-4 dark:border-ink-700">
                  <img
                    src={p.qrCode}
                    alt={p.parcelId}
                    className="h-24 w-24 shrink-0 rounded-lg border bg-white p-1 dark:border-ink-700"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Parcel QR</div>
                    <div className="mt-0.5 font-mono text-sm font-semibold">{p.parcelId}</div>
                    <div className="text-xs text-slate-400">
                      Print &amp; attach to the parcel — scanned to advance at every stage
                    </div>
                  </div>
                  <button onClick={printQr} className="btn-ghost shrink-0">
                    <Printer size={16} /> Print
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Detail label="Type" value={meta.label} />
                <Detail label="Quantity" value={String(p.quantity ?? '—')} />
                <Detail label="Rider" value={rider ?? '—'} />
                <Detail label="Description" value={p.description ?? '—'} />
                <Detail label="Origin" value={p.originFacility?.name ?? '—'} />
                <Detail label="Destination" value={p.destinationFacility?.name ?? '—'} />
                <Detail
                  label="Registered"
                  value={p.registeredAt ? new Date(p.registeredAt).toLocaleString() : p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
                />
                <Detail
                  label="Delivered"
                  value={p.deliveredAt ? new Date(p.deliveredAt).toLocaleString() : '—'}
                />
              </div>

              {timeline.length > 0 && (
                <div className="mt-6 border-t pt-4 dark:border-ink-700">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Timeline</div>
                  <ol className="space-y-3">
                    {timeline.map((e, i) => {
                      const evt = String(e.event ?? '')
                      const c = parcelStatusColor(evt)
                      const actor = e.actor
                        ? typeof e.actor === 'string'
                          ? e.actor
                          : `${e.actor.firstName ?? ''} ${e.actor.lastName ?? ''}`.trim()
                        : null
                      const hasGps = e.latitude != null && e.longitude != null
                      return (
                        <li key={e.id ?? i} className="flex gap-3">
                          <span
                            className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white"
                            style={{ background: c }}
                          >
                            {evt === 'delivered' ? <CheckCircle2 size={12} /> : <ScanLine size={12} />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 text-sm">
                              <span className="font-semibold">{parcelStatusLabel(evt) || 'Event'}</span>
                              <span className="text-xs text-slate-400">
                                {e.timestamp ? new Date(e.timestamp).toLocaleString() : ''}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                              {actor && <span>by {actor}</span>}
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
                              ) : null}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )}

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

function RegisterParcelModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (p: ParcelRow) => void
}) {
  const [facilities, setFacilities] = useState<{ id: string; name: string; type: string }[]>([])
  const [riders, setRiders] = useState<{ id: string; firstName?: string; lastName?: string }[]>([])
  const [form, setForm] = useState({
    type: 'letter',
    description: '',
    quantity: '1',
    originFacilityId: '',
    destinationFacilityId: '',
    riderId: '',
    notes: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/facilities')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : []
        setFacilities(list)
      })
      .catch((e) => setError(apiError(e, 'Could not load facilities')))
    api
      .get('/users', { params: { role: 'dispatcher' } })
      .then((res) => {
        const list = res.data?.data ?? res.data ?? []
        const arr = Array.isArray(list) ? list : []
        setRiders(arr.filter((u: any) => u.role === 'dispatcher'))
      })
      .catch(() => {
        /* riders optional */
      })
  }, [])

  function set(key: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [key]: v }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form.destinationFacilityId) {
      setError('Pick a destination facility')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        type: form.type,
        destinationFacilityId: form.destinationFacilityId,
      }
      if (form.description.trim()) payload.description = form.description.trim()
      if (form.quantity.trim()) payload.quantity = Number(form.quantity) || 1
      if (form.originFacilityId) payload.originFacilityId = form.originFacilityId
      if (form.riderId) payload.riderId = form.riderId
      if (form.notes.trim()) payload.notes = form.notes.trim()
      const res = await api.post('/parcels', payload)
      onCreated(res.data)
    } catch (e) {
      setError(apiError(e, 'Failed to register parcel'))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-white p-6 dark:border-ink-700 dark:bg-ink-900"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold">Register Parcel</h3>
            <p className="text-sm text-slate-400">Log return cargo for a rider — a QR is generated on save</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {PARCEL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {typeMeta(t).label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity">
            <input
              className="input"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => set('quantity', e.target.value)}
            />
          </Field>
          <Field label="Description (optional)" full>
            <input className="input" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Origin facility (optional)" full>
            <select
              className="input"
              value={form.originFacilityId}
              onChange={(e) => set('originFacilityId', e.target.value)}
            >
              <option value="">— No origin</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Destination facility" full>
            <select
              className="input"
              value={form.destinationFacilityId}
              onChange={(e) => set('destinationFacilityId', e.target.value)}
              required
            >
              <option value="" disabled>
                Select a destination
              </option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rider (optional)" full>
            <select className="input" value={form.riderId} onChange={(e) => set('riderId', e.target.value)}>
              <option value="">— Unassigned</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {`${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || r.id}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes (optional)" full>
            <input className="input" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? <Loader2 size={16} className="animate-spin" /> : 'Register & Generate QR'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={cn('block', full && 'col-span-2')}>
      <span className="mb-1.5 block text-sm font-medium text-slate-500 dark:text-slate-300">{label}</span>
      {children}
    </label>
  )
}
