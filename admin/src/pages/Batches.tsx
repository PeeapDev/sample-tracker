import { useEffect, useState } from 'react'
import { RefreshCw, Boxes, ChevronRight } from 'lucide-react'
import { api, apiError } from '../lib/api'
import { getCache, setCache, hasCache } from '../lib/cache'
import { BatchDetailModal } from '../components/BatchDetailModal'

interface BatchRow {
  id: string
  batchId: string
  sampleCount: number
  notes?: string
  createdAt: string
  facility?: { name?: string } | null
}

export default function Batches() {
  const [rows, setRows] = useState<BatchRow[]>(() => getCache<BatchRow[]>('batches_list') ?? [])
  const [loading, setLoading] = useState(!hasCache('batches_list'))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  async function load() {
    setRefreshing(true)
    try {
      const res = await api.get('/batches')
      const arr = Array.isArray(res.data) ? res.data : []
      setRows(arr)
      setCache('batches_list', arr)
      setError(null)
    } catch (e) {
      if (rows.length === 0) setError(apiError(e, 'Failed to load batches'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Batches &amp; Boxes</h2>
          <p className="text-sm text-slate-400">
            {rows.length} package boxes · scan a box to view its manifest or advance every sample inside
          </p>
        </div>
        <button onClick={load} className="btn-ghost">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error ? (
        <div className="card text-sm text-red-400">{error}</div>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shimmer h-16 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-ink-800">
            <Boxes size={22} />
          </span>
          <div>
            <div className="font-semibold text-slate-500 dark:text-slate-300">No batches yet</div>
            <div className="mt-0.5 text-xs text-slate-400">
              Go to Samples, select several, and choose “Create Batch” to pack a box.
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((b) => (
            <button
              key={b.id}
              onClick={() => setOpenId(b.id)}
              className="card flex items-center gap-4 text-left transition hover:border-brand/50"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-500">
                <Boxes size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-mono font-bold">{b.batchId}</div>
                <div className="truncate text-xs text-slate-400">
                  {b.sampleCount} samples
                  {b.facility?.name ? ` · ${b.facility.name}` : ''}
                  {b.createdAt ? ` · ${new Date(b.createdAt).toLocaleDateString()}` : ''}
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      )}

      {openId && (
        <BatchDetailModal batchId={openId} onClose={() => setOpenId(null)} onChanged={load} />
      )}
    </div>
  )
}
