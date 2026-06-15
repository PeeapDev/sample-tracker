import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { RefreshCw, MapPin, Phone, Gauge, Truck, Radio } from 'lucide-react'
import { api, apiError } from '../lib/api'
import { timeAgo } from '../lib/ui'

// Fix the well-known Leaflet + bundler broken default-marker-icon issue by
// pointing the icon URLs at the CDN-hosted assets (Vite doesn't resolve the
// images Leaflet references by relative path out of node_modules).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Rider {
  riderId: string
  name: string
  phone?: string | null
  latitude: number | string
  longitude: number | string
  accuracy?: number | null
  speed?: number | null
  heading?: number | null
  dispatchId?: string | null
  updatedAt: string
}

// Sierra Leone centroid — the default view before any riders are located.
const SL_CENTER: [number, number] = [8.46, -11.78]
const SL_ZOOM = 8
const POLL_MS = 12_000

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : NaN
}

/** Fit the map to the riders' bounds whenever the set of positions changes. */
function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13, { animate: true })
      return
    }
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
  }, [points, map])
  return null
}

export default function LiveMap() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [tick, setTick] = useState(0) // drives the "Xs ago" indicator
  const activeRef = useRef(true)

  async function load() {
    setRefreshing(true)
    try {
      const res = await api.get('/tracking/riders', { params: { withinMinutes: 10 } })
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? []
      if (!activeRef.current) return
      setRiders(Array.isArray(list) ? list : [])
      setLastUpdated(Date.now())
      setError(null)
    } catch (e) {
      if (activeRef.current && riders.length === 0) {
        setError(apiError(e, 'Failed to load rider positions'))
      }
    } finally {
      if (activeRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }

  useEffect(() => {
    activeRef.current = true
    load()
    const poll = setInterval(load, POLL_MS)
    const ticker = setInterval(() => setTick((t) => t + 1), 1000)
    return () => {
      activeRef.current = false
      clearInterval(poll)
      clearInterval(ticker)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep only riders with usable coordinates.
  const located = useMemo(
    () =>
      riders
        .map((r) => ({ ...r, lat: num(r.latitude), lng: num(r.longitude) }))
        .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng)),
    [riders],
  )

  const points = useMemo<Array<[number, number]>>(
    () => located.map((r) => [r.lat, r.lng] as [number, number]),
    [located],
  )

  const secondsAgo = lastUpdated ? Math.max(0, Math.round((Date.now() - lastUpdated) / 1000)) : null
  // touch `tick` so the indicator re-renders each second
  void tick

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Live Map</h2>
          <p className="text-sm text-slate-400">
            {located.length} rider{located.length === 1 ? '' : 's'} broadcasting · positions in the last 10 minutes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <Radio size={13} className={refreshing ? 'animate-pulse text-emerald-500' : 'text-emerald-500'} />
            {secondsAgo == null ? 'Connecting…' : `Updated ${secondsAgo}s ago`}
          </span>
          <button onClick={load} className="btn-ghost">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && located.length === 0 ? (
        <div className="card text-sm text-red-400">{error}</div>
      ) : (
        <div className="relative h-[calc(100vh-200px)] min-h-[420px] overflow-hidden rounded-2xl border dark:border-ink-700">
          <MapContainer
            center={SL_CENTER}
            zoom={SL_ZOOM}
            scrollWheelZoom
            className="h-full w-full"
            style={{ background: '#0b1220' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={points} />
            {located.map((r) => (
              <Marker key={r.riderId} position={[r.lat, r.lng]}>
                <Popup>
                  <div className="min-w-[180px] space-y-1.5">
                    <div className="text-sm font-bold text-slate-900">{r.name || 'Rider'}</div>
                    {r.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Phone size={12} /> {r.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Gauge size={12} />{' '}
                      {r.speed != null && Number.isFinite(num(r.speed))
                        ? `${(num(r.speed) * 3.6).toFixed(1)} km/h`
                        : 'speed n/a'}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Truck size={12} />{' '}
                      {r.dispatchId ? (
                        <span className="font-mono">{r.dispatchId}</span>
                      ) : (
                        'no active dispatch'
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={12} /> last seen {r.updatedAt ? timeAgo(r.updatedAt) : 'unknown'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {!loading && located.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-[400] grid place-items-center p-6">
              <div className="pointer-events-auto max-w-sm rounded-2xl border bg-white/95 px-6 py-6 text-center shadow-xl backdrop-blur dark:border-ink-700 dark:bg-ink-900/95">
                <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-ink-800">
                  <MapPin size={22} />
                </span>
                <div className="font-semibold">No riders are broadcasting right now.</div>
                <p className="mt-1 text-sm text-slate-400">
                  Riders appear here while on an active dispatch.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 z-[400] grid place-items-center bg-white/60 dark:bg-ink-950/60">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
