import { useEffect, useState } from 'react'
import { RefreshCw, Truck, PackageOpen } from 'lucide-react'
import { api, apiError } from '../lib/api'
import { getCache, setCache, hasCache } from '../lib/cache'
import { cn } from '../lib/ui'

interface DispatchRow {
  id: string
  dispatchId: string
  status: string
  sampleCount: number
  coolerId?: string
  createdAt: string
  originFacility?: { name?: string } | null
  destinationFacility?: { name?: string } | null
}

const DISPATCH_COLORS: Record<string, string> = {
  pending: '#94A3B8',
  assigned: '#3B82F6',
  picked_up: '#F97316',
  in_transit: '#F59E0B',
  delivered: '#22C55E',
  cancelled: '#EF4444',
}

function dispatchLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function Dispatches() {
  const [rows, setRows] = useState<DispatchRow[]>(() => getCache<DispatchRow[]>('dispatches') ?? [])
  const [loading, setLoading] = useState(!hasCache('dispatches'))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setRefreshing(true)
    try {
      const res = await api.get('/dispatches')
      const list = res.data?.data ?? res.data ?? []
      const arr = Array.isArray(list) ? list : []
      setRows(arr)
      setCache('dispatches', arr)
      setError(null)
    } catch (e) {
      if (rows.length === 0) setError(apiError(e, 'Failed to load dispatches'))
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
          <h2 className="text-2xl font-extrabold tracking-tight">Dispatches</h2>
          <p className="text-sm text-slate-400">{rows.length} dispatch runs</p>
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
            <div key={i} className="shimmer h-14 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <PackageOpen size={40} className="text-slate-400" />
          <div>
            <div className="font-semibold">No dispatches yet</div>
            <p className="text-sm text-slate-400">
              Dispatch runs appear here once hub officers assign riders to move samples.
            </p>
          </div>
        </div>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400 dark:border-ink-700">
                <th className="px-5 py-3 font-medium">Dispatch</th>
                <th className="px-5 py-3 font-medium">Route</th>
                <th className="px-5 py-3 font-medium">Samples</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const color = DISPATCH_COLORS[d.status] ?? '#94A3B8'
                return (
                  <tr key={d.id} className="border-b last:border-0 dark:border-ink-700/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="grid h-8 w-8 place-items-center rounded-lg"
                          style={{ background: `${color}22`, color }}
                        >
                          <Truck size={15} />
                        </span>
                        <span className="font-mono font-semibold">{d.dispatchId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {d.originFacility?.name ?? '—'} → {d.destinationFacility?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3">{d.sampleCount ?? 0}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                        )}
                        style={{ background: `${color}1f`, color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                        {dispatchLabel(d.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
