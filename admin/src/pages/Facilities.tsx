import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Plus,
  RefreshCw,
  Building2,
  Warehouse,
  Microscope,
  MapPin,
  Pencil,
  Loader2,
  X,
} from 'lucide-react'
import { api, apiError } from '../lib/api'
import { getCache, setCache, hasCache } from '../lib/cache'
import { cn } from '../lib/ui'

interface Facility {
  id: string
  code: string
  name: string
  type: string
  district: string
  chiefdom?: string
  address?: string
  phone?: string
  latitude?: number | string | null
  longitude?: number | string | null
  isActive: boolean
}

const TYPE_META: Record<string, { label: string; color: string; icon: typeof Building2 }> = {
  health_facility: { label: 'Health Facility', color: '#3B82F6', icon: Building2 },
  hub: { label: 'Hub', color: '#8B5CF6', icon: Warehouse },
  laboratory: { label: 'Laboratory', color: '#14B8A6', icon: Microscope },
}

const TYPES = Object.keys(TYPE_META)

export default function Facilities() {
  const [rows, setRows] = useState<Facility[]>(() => getCache<Facility[]>('facilities') ?? [])
  const [loading, setLoading] = useState(!hasCache('facilities'))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [editing, setEditing] = useState<Facility | 'new' | null>(null)

  async function load() {
    setRefreshing(true)
    try {
      const res = await api.get('/facilities')
      const arr = Array.isArray(res.data) ? res.data : []
      setRows(arr)
      setCache('facilities', arr)
      setError(null)
    } catch (e) {
      if (rows.length === 0) setError(apiError(e, 'Failed to load facilities'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () => (typeFilter === 'all' ? rows : rows.filter((f) => f.type === typeFilter)),
    [rows, typeFilter],
  )

  const counts = useMemo(
    () => ({
      hub: rows.filter((f) => f.type === 'hub').length,
      laboratory: rows.filter((f) => f.type === 'laboratory').length,
      health_facility: rows.filter((f) => f.type === 'health_facility').length,
    }),
    [rows],
  )

  function onSaved(saved: Facility) {
    setRows((prev) => {
      const exists = prev.some((f) => f.id === saved.id)
      const next = exists ? prev.map((f) => (f.id === saved.id ? saved : f)) : [saved, ...prev]
      setCache('facilities', next)
      return next
    })
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Facilities &amp; Hubs</h2>
          <p className="text-sm text-slate-400">Configure collection sites, hubs and labs — set their type and GPS location</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setEditing('new')} className="btn-primary">
            <Plus size={16} /> Add Facility
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Hubs" value={counts.hub} accent={TYPE_META.hub.color} />
        <Stat label="Laboratories" value={counts.laboratory} accent={TYPE_META.laboratory.color} />
        <Stat label="Health Facilities" value={counts.health_facility} accent={TYPE_META.health_facility.color} />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} label="All" />
        {TYPES.map((t) => (
          <FilterChip
            key={t}
            active={typeFilter === t}
            onClick={() => setTypeFilter(t)}
            label={TYPE_META[t].label}
          />
        ))}
      </div>

      {error ? (
        <div className="card text-sm text-red-400">{error}</div>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shimmer h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400 dark:border-ink-700">
                <th className="px-5 py-3 font-medium">Facility</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">District</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const meta = TYPE_META[f.type] ?? TYPE_META.health_facility
                const Icon = meta.icon
                const hasGps = f.latitude != null && f.longitude != null
                return (
                  <tr key={f.id} className="border-b last:border-0 dark:border-ink-700/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                          style={{ background: `${meta.color}22`, color: meta.color }}
                        >
                          <Icon size={16} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{f.name}</div>
                          <div className="font-mono text-xs text-slate-400">{f.code}</div>
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
                    <td className="px-5 py-3 text-slate-400">{f.district}</td>
                    <td className="px-5 py-3">
                      {hasGps ? (
                        <a
                          href={`https://www.google.com/maps?q=${f.latitude},${f.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline"
                        >
                          <MapPin size={12} />
                          {Number(f.latitude).toFixed(4)}, {Number(f.longitude).toFixed(4)}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={12} /> Not set
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                          f.isActive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-slate-500/15 text-slate-400',
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', f.isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
                        {f.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setEditing(f)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-ink-800"
                        title="Edit facility"
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-ink-800">
                        <Building2 size={22} />
                      </span>
                      <div className="font-semibold text-slate-500 dark:text-slate-300">No facilities here yet</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <FacilityModal facility={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={onSaved} />
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

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
        active
          ? 'bg-brand text-white'
          : 'border text-slate-500 hover:bg-slate-100 dark:border-ink-700 dark:text-slate-400 dark:hover:bg-ink-800',
      )}
    >
      {label}
    </button>
  )
}

function FacilityModal({
  facility,
  onClose,
  onSaved,
}: {
  facility: Facility | null
  onClose: () => void
  onSaved: (f: Facility) => void
}) {
  const isEdit = !!facility
  const [form, setForm] = useState({
    code: facility?.code ?? '',
    name: facility?.name ?? '',
    type: facility?.type ?? 'hub',
    district: facility?.district ?? '',
    chiefdom: facility?.chiefdom ?? '',
    address: facility?.address ?? '',
    phone: facility?.phone ?? '',
    latitude: facility?.latitude != null ? String(facility.latitude) : '',
    longitude: facility?.longitude != null ? String(facility.longitude) : '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [key]: v }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        type: form.type,
        district: form.district.trim(),
      }
      if (form.chiefdom.trim()) payload.chiefdom = form.chiefdom.trim()
      if (form.address.trim()) payload.address = form.address.trim()
      if (form.phone.trim()) payload.phone = form.phone.trim()
      if (form.latitude.trim()) payload.latitude = Number(form.latitude)
      if (form.longitude.trim()) payload.longitude = Number(form.longitude)

      let res
      if (isEdit) {
        res = await api.patch(`/facilities/${facility!.id}`, payload)
      } else {
        payload.code = form.code.trim()
        res = await api.post('/facilities', payload)
      }
      onSaved(res.data)
    } catch (e) {
      setError(apiError(e, 'Failed to save facility'))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl border bg-white p-6 dark:border-ink-700 dark:bg-ink-900"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold">{isEdit ? 'Edit Facility' : 'Add Facility'}</h3>
            <p className="text-sm text-slate-400">
              {isEdit ? 'Update details and GPS location' : 'Register a hub, lab or collection site'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Code">
            <input
              className="input disabled:opacity-50"
              value={form.code}
              onChange={(e) => set('code', e.target.value)}
              placeholder="HUB-002"
              disabled={isEdit}
              required={!isEdit}
            />
          </Field>
          <Field label="Type">
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_META[t].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Name" full>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>
          <Field label="District">
            <input className="input" value={form.district} onChange={(e) => set('district', e.target.value)} required />
          </Field>
          <Field label="Chiefdom">
            <input className="input" value={form.chiefdom} onChange={(e) => set('chiefdom', e.target.value)} />
          </Field>
          <Field label="Address" full>
            <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <div />
          <Field label="Latitude">
            <input
              className="input"
              inputMode="decimal"
              value={form.latitude}
              onChange={(e) => set('latitude', e.target.value)}
              placeholder="8.4657"
            />
          </Field>
          <Field label="Longitude">
            <input
              className="input"
              inputMode="decimal"
              value={form.longitude}
              onChange={(e) => set('longitude', e.target.value)}
              placeholder="-13.2317"
            />
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
            {busy ? <Loader2 size={16} className="animate-spin" /> : isEdit ? 'Save Changes' : 'Create Facility'}
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
