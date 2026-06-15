import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Search, RefreshCw, FlaskConical, Boxes, CheckSquare, Square, Loader2, X, Plus, Printer } from 'lucide-react'
import { api, apiError } from '../lib/api'
import { getCache, setCache, hasCache, clearCache } from '../lib/cache'
import { statusColor, statusLabel } from '../lib/ui'
import { printLabels } from '../lib/print'
import { useAuth } from '../lib/auth'
import { useRbac } from '../lib/rbac'
import { SampleDetailModal } from '../components/SampleDetailModal'
import { BatchDetailModal } from '../components/BatchDetailModal'

const SAMPLE_TYPES = ['Blood', 'Sputum', 'Stool', 'Urine', 'Nasal Swab', 'Tissue']
const PROGRAMS = ['HIV', 'Tuberculosis', 'Malaria', 'COVID-19', 'Hepatitis', 'Cholera']

interface SampleRow {
  id: string
  sampleId: string
  sampleType: string
  diseaseProgram: string
  status: string
  village?: string
  createdAt: string
  facility?: { name?: string } | null
  // List rows also carry stage timestamps used by the journey tracker.
  [key: string]: unknown
}

const STATUSES = [
  'collected',
  'picked_up',
  'hub_received',
  'in_transit',
  'lab_received',
  'completed',
  'lost',
]

const PAGE_SIZE = 25

export default function Samples() {
  // Search and status are now applied server-side and the list is paginated, so
  // a page only ever holds PAGE_SIZE rows — small payloads that are fast even
  // over a remote DB. The default first page is cached for an instant first
  // paint (and offline viewing).
  const [rows, setRows] = useState<SampleRow[]>(() => getCache<SampleRow[]>('samples') ?? [])
  const [total, setTotal] = useState<number>(() => getCache<SampleRow[]>('samples')?.length ?? 0)
  const [loading, setLoading] = useState(!hasCache('samples'))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [reloadNonce, setReloadNonce] = useState(0)
  const [selected, setSelected] = useState<SampleRow | null>(null)

  const { user } = useAuth()
  const { can } = useRbac()
  const canBatch = can(user?.role ?? '', 'samples.manage') || user?.role === 'admin'
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [newBatchId, setNewBatchId] = useState<string | null>(null)
  const [showCollect, setShowCollect] = useState(false)

  // The list rows omit the heavy qrCode blob, so fetch the full records for the
  // picked samples before printing their labels.
  async function printSelected() {
    if (picked.size === 0) return
    setPrinting(true)
    try {
      const full = await Promise.all(
        Array.from(picked).map((id) =>
          api.get(`/samples/${id}`).then((r) => r.data).catch(() => null),
        ),
      )
      printLabels(
        full.filter(Boolean).map((s: any) => ({
          code: s.sampleId,
          qrCode: s.qrCode,
          line2: [s.sampleType, s.diseaseProgram].filter(Boolean).join(' · '),
        })),
        'Sample labels',
      )
    } finally {
      setPrinting(false)
    }
  }

  function onSampleCreated(created: SampleRow) {
    setShowCollect(false)
    setSelected(created) // open the detail modal so the new QR is shown immediately
    // Return to the default first page (the new sample is newest, so it sorts to
    // the top) and refetch so the list reflects the server.
    setQuery('')
    setStatus('all')
    setPage(1)
    reload()
  }

  function togglePick(id: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function createBatch() {
    if (picked.size === 0) return
    setCreating(true)
    try {
      const res = await api.post('/batches', { sampleIds: Array.from(picked) })
      setPicked(new Set())
      setNewBatchId(res.data.id)
      reload()
    } catch (e) {
      setError(apiError(e, 'Failed to create batch'))
    } finally {
      setCreating(false)
    }
  }

  const filtersActive = !!debouncedQuery || status !== 'all'
  const isDefaultView = !debouncedQuery && status === 'all' && page === 1

  async function load() {
    setRefreshing(true)
    try {
      const params: Record<string, string | number> = { page, pageSize: PAGE_SIZE }
      if (debouncedQuery) params.search = debouncedQuery
      if (status !== 'all') params.status = status
      const res = await api.get('/samples', { params })
      const list = res.data?.data ?? res.data ?? []
      const arr = Array.isArray(list) ? list : []
      setRows(arr)
      setTotal(typeof res.data?.total === 'number' ? res.data.total : arr.length)
      // Only the default first page is cached as the instant/offline snapshot.
      if (isDefaultView) setCache('samples', arr)
      setError(null)
    } catch (e) {
      // Keep showing cached rows if we already have them.
      if (rows.length === 0) setError(apiError(e, 'Failed to load samples'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function reload() {
    setReloadNonce((n) => n + 1)
  }

  // Debounce the search box so typing fires one request, not one per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350)
    return () => clearTimeout(t)
  }, [query])

  // A new search term or status filter always returns to the first page.
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, status])

  // Refetch whenever the effective query / status / page changes, or on a
  // manual refresh (reloadNonce).
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, status, page, reloadNonce])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Samples</h2>
          <p className="text-sm text-slate-400">
            {total} samples · click a row to track its journey
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={reload} className="btn-ghost">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          {canBatch && (
            <button onClick={() => setShowCollect(true)} className="btn-primary">
              <Plus size={16} /> Collect Sample
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by ID, program or village"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="input max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
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
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400 dark:border-ink-700">
                {canBatch && <th className="w-10 pl-5" />}
                <th className="px-5 py-3 font-medium">Sample</th>
                <th className="px-5 py-3 font-medium">Program</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Facility</th>
                <th className="px-5 py-3 font-medium">Collected</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer border-b transition-colors last:border-0 hover:bg-slate-50 dark:border-ink-700/60 dark:hover:bg-ink-850/50"
                >
                  {canBatch && (
                    <td className="pl-5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => togglePick(s.id)}
                        className={picked.has(s.id) ? 'text-brand' : 'text-slate-300 hover:text-slate-400 dark:text-slate-600'}
                        title="Select for batch"
                      >
                        {picked.has(s.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>
                  )}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="grid h-8 w-8 place-items-center rounded-lg"
                        style={{ background: `${statusColor(s.status)}22`, color: statusColor(s.status) }}
                      >
                        <FlaskConical size={15} />
                      </span>
                      <div>
                        <div className="font-mono font-semibold">{s.sampleId}</div>
                        <div className="text-xs text-slate-400">{s.sampleType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{s.diseaseProgram}</td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: `${statusColor(s.status)}1f`, color: statusColor(s.status) }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor(s.status) }} />
                      {statusLabel(s.status)}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3 text-slate-400 md:table-cell">
                    {s.facility?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={canBatch ? 6 : 5} className="px-5 py-14">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-ink-800">
                        <FlaskConical size={22} />
                      </span>
                      <div>
                        <div className="font-semibold text-slate-500 dark:text-slate-300">
                          {!filtersActive ? 'No samples yet' : 'No samples match your filters'}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {!filtersActive
                            ? 'Samples collected in the field will appear here as they sync.'
                            : 'Try a different search term or status.'}
                        </div>
                      </div>
                      {filtersActive && (
                        <button
                          onClick={() => {
                            setQuery('')
                            setStatus('all')
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
        <SampleDetailModal
          sampleId={selected.id}
          fallback={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Floating action bar while packing a batch */}
      {canBatch && picked.size > 0 && (
        <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-xl dark:border-ink-700 dark:bg-ink-850">
            <Boxes size={18} className="text-violet-500" />
            <span className="text-sm font-semibold">{picked.size} selected</span>
            <button onClick={printSelected} disabled={printing} className="btn-ghost">
              {printing ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              Print labels
            </button>
            <button onClick={createBatch} disabled={creating} className="btn-primary">
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Boxes size={16} />}
              Create Batch
            </button>
            <button
              onClick={() => setPicked(new Set())}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800"
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {newBatchId && (
        <BatchDetailModal batchId={newBatchId} onClose={() => setNewBatchId(null)} onChanged={load} />
      )}

      {showCollect && (
        <CollectSampleModal onClose={() => setShowCollect(false)} onCreated={onSampleCreated} />
      )}
    </div>
  )
}

function CollectSampleModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (s: SampleRow) => void
}) {
  const [facilities, setFacilities] = useState<{ id: string; name: string; type: string }[]>([])
  const [batches, setBatches] = useState<{ id: string; batchId: string; sampleCount: number }[]>([])
  const [form, setForm] = useState({
    sampleType: 'Blood',
    diseaseProgram: 'HIV',
    quantity: '1',
    facilityId: '',
    village: '',
    patientAge: '',
    patientGender: '',
    notes: '',
  })
  // '' = single sample (no batch), a batch id = assign to that batch,
  // '__new__' = create a brand-new batch and drop this sample into it.
  const [batchChoice, setBatchChoice] = useState('')
  const [newBatchNote, setNewBatchNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/facilities')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : []
        setFacilities(list)
        // default to the first health facility, where collection happens
        const hf = list.find((f: any) => f.type === 'health_facility') ?? list[0]
        if (hf) setForm((f) => ({ ...f, facilityId: hf.id }))
      })
      .catch((e) => setError(apiError(e, 'Could not load facilities')))
    api
      .get('/batches')
      .then((res) => setBatches(Array.isArray(res.data) ? res.data : []))
      .catch(() => {
        /* batch assignment is optional — ignore load failure */
      })
  }, [])

  function set(key: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [key]: v }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form.facilityId) {
      setError('Pick a facility')
      return
    }
    setBusy(true)
    setError(null)
    try {
      // Resolve which batch (if any) this sample joins. "__new__" creates an
      // empty batch first; the sample is then collected straight into it, so the
      // batch's count starts at 1 (handled server-side).
      let batchId: string | undefined
      if (batchChoice === '__new__') {
        const b = await api.post('/batches', {
          sampleIds: [],
          facilityId: form.facilityId,
          ...(newBatchNote.trim() ? { notes: newBatchNote.trim() } : {}),
        })
        batchId = b.data.id
      } else if (batchChoice) {
        batchId = batchChoice
      }

      const payload: Record<string, unknown> = {
        sampleType: form.sampleType,
        diseaseProgram: form.diseaseProgram,
        quantity: Number(form.quantity) || 1,
        facilityId: form.facilityId,
      }
      if (form.village.trim()) payload.village = form.village.trim()
      if (form.patientAge.trim()) payload.patientAge = Number(form.patientAge)
      if (form.patientGender) payload.patientGender = form.patientGender
      if (form.notes.trim()) payload.notes = form.notes.trim()
      if (batchId) payload.batchId = batchId
      const res = await api.post('/samples', payload)
      clearCache('batches') // a new/updated batch should re-fetch on next visit
      onCreated(res.data)
    } catch (e) {
      setError(apiError(e, 'Failed to collect sample'))
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
            <h3 className="text-lg font-extrabold">Collect Sample</h3>
            <p className="text-sm text-slate-400">Register a new sample — a QR is generated on save</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sample type">
            <select className="input" value={form.sampleType} onChange={(e) => set('sampleType', e.target.value)}>
              {SAMPLE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Disease program">
            <select className="input" value={form.diseaseProgram} onChange={(e) => set('diseaseProgram', e.target.value)}>
              {PROGRAMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Facility" full>
            <select className="input" value={form.facilityId} onChange={(e) => set('facilityId', e.target.value)} required>
              <option value="" disabled>Select a facility</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Quantity">
            <input className="input" type="number" min={1} value={form.quantity} onChange={(e) => set('quantity', e.target.value)} required />
          </Field>
          <Field label="Village (optional)">
            <input className="input" value={form.village} onChange={(e) => set('village', e.target.value)} />
          </Field>
          <Field label="Patient age (optional)">
            <input className="input" type="number" min={0} value={form.patientAge} onChange={(e) => set('patientAge', e.target.value)} />
          </Field>
          <Field label="Patient gender (optional)">
            <select className="input" value={form.patientGender} onChange={(e) => set('patientGender', e.target.value)}>
              <option value="">—</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </Field>
          <Field label="Notes (optional)" full>
            <input className="input" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
          <Field label="Batch / box (optional)" full>
            <select
              className="input"
              value={batchChoice}
              onChange={(e) => setBatchChoice(e.target.value)}
            >
              <option value="">No batch — single sample</option>
              {batches.length > 0 && (
                <optgroup label="Add to existing batch">
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchId} · {b.sampleCount} sample{b.sampleCount === 1 ? '' : 's'}
                    </option>
                  ))}
                </optgroup>
              )}
              <option value="__new__">+ Create a new batch for this sample</option>
            </select>
          </Field>
          {batchChoice === '__new__' && (
            <Field label="New batch label (optional)" full>
              <input
                className="input"
                placeholder="e.g. Morning collection run"
                value={newBatchNote}
                onChange={(e) => setNewBatchNote(e.target.value)}
              />
              <span className="mt-1 block text-xs text-slate-400">
                A new box QR is generated and this sample is added to it. Find it later under Batches &amp; Boxes.
              </span>
            </Field>
          )}
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
            {busy ? <Loader2 size={16} className="animate-spin" /> : 'Collect & Generate QR'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={full ? 'col-span-2 block' : 'block'}>
      <span className="mb-1.5 block text-sm font-medium text-slate-500 dark:text-slate-300">{label}</span>
      {children}
    </label>
  )
}
