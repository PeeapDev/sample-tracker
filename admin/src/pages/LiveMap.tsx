import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { RefreshCw, MapPin, Phone, Gauge, Truck, Radio, Clock, Boxes } from 'lucide-react'
import { api, apiError } from '../lib/api'
import { timeAgo } from '../lib/ui'

// Fix the well-known Leaflet + bundler broken default-marker-icon issue by
// pointing the icon URLs at the CDN-hosted assets.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Centre {
  name: string
  latitude: number | null
  longitude: number | null
}
interface Rider {
  riderId: string
  name: string
  phone?: string | null
  latitude: number | string
  longitude: number | string
  speed?: number | null
  dispatchId?: string | null
  updatedAt: string
  status?: string | null
  sampleCount?: number | null
  origin?: Centre | null
  destination?: Centre | null
  etaMinutes?: number | null
}
interface Facility {
  id: string
  name: string
  type: string
  district?: string
  latitude: number | string | null
  longitude: number | string | null
}

const SL_CENTER: [number, number] = [8.46, -11.78]
const SL_ZOOM = 8
const POLL_MS = 12_000

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : NaN
}

// Colour the bike by where the trip is: amber = picking up, blue = en route,
// green = delivered, slate = idle/no dispatch.
function riderColor(status?: string | null): string {
  switch (status) {
    case 'in_transit':
      return '#3B82F6'
    case 'assigned':
    case 'picked_up':
      return '#F59E0B'
    case 'delivered':
      return '#10B981'
    default:
      return '#64748B'
  }
}
function facilityColor(type: string): string {
  switch (type) {
    case 'hub':
      return '#8B5CF6'
    case 'laboratory':
      return '#14B8A6'
    default:
      return '#3B82F6' // health_facility
  }
}

// Cache icons by colour so the marker's DOM element persists across polls — only
// its position (transform) changes, which the `.rider-marker` CSS transition
// animates into a smooth glide (Google-Maps "approaching" feel).
const riderIconCache: Record<string, L.DivIcon> = {}
function riderIcon(color: string): L.DivIcon {
  if (!riderIconCache[color]) {
    riderIconCache[color] = L.divIcon({
      className: 'rider-marker',
      html: `<div class="rider-glyph" style="background:${color}">🏍️</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
  }
  return riderIconCache[color]
}
const facilityIconCache: Record<string, L.DivIcon> = {}
function facilityIcon(color: string): L.DivIcon {
  if (!facilityIconCache[color]) {
    facilityIconCache[color] = L.divIcon({
      className: 'facility-marker',
      html: `<div class="facility-pin" style="background:${color}"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 16],
    })
  }
  return facilityIconCache[color]
}

/** Fit the map to the given points the first time they appear / when riders move. */
function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13, { animate: true })
      return
    }
    map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 14 })
  }, [points, map])
  return null
}

export default function LiveMap() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [, setTick] = useState(0)
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
    // Centres rarely change — fetch once.
    api
      .get('/facilities')
      .then((res) => {
        if (activeRef.current) setFacilities(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        /* facilities are context only — ignore */
      })
    const poll = setInterval(load, POLL_MS)
    const ticker = setInterval(() => setTick((t) => t + 1), 1000)
    return () => {
      activeRef.current = false
      clearInterval(poll)
      clearInterval(ticker)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const located = useMemo(
    () =>
      riders
        .map((r) => ({ ...r, lat: num(r.latitude), lng: num(r.longitude) }))
        .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng)),
    [riders],
  )

  const locatedFacilities = useMemo(
    () =>
      facilities
        .map((f) => ({ ...f, lat: num(f.latitude), lng: num(f.longitude) }))
        .filter((f) => Number.isFinite(f.lat) && Number.isFinite(f.lng)),
    [facilities],
  )

  // Fit to riders + their destinations (not every facility, which would zoom out
  // to the whole country on each poll).
  const fitPoints = useMemo<Array<[number, number]>>(() => {
    const pts: Array<[number, number]> = located.map((r) => [r.lat, r.lng])
    located.forEach((r) => {
      if (r.destination?.latitude != null && r.destination?.longitude != null) {
        pts.push([Number(r.destination.latitude), Number(r.destination.longitude)])
      }
    })
    return pts
  }, [located])

  const inTransit = located.filter((r) => r.status === 'in_transit').length
  const secondsAgo = lastUpdated ? Math.max(0, Math.round((Date.now() - lastUpdated) / 1000)) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Live Map</h2>
          <p className="text-sm text-slate-400">
            {located.length} rider{located.length === 1 ? '' : 's'} broadcasting
            {inTransit > 0 ? ` · ${inTransit} en route` : ''} · last 10 minutes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <Radio size={13} className="text-emerald-500" />
            {secondsAgo == null ? 'Connecting…' : `Updated ${secondsAgo}s ago`}
          </span>
          <button onClick={load} className="btn-ghost">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
        <Legend color="#F59E0B" label="Picking up" />
        <Legend color="#3B82F6" label="En route" />
        <Legend color="#10B981" label="Delivered" />
        <Legend color="#64748B" label="Idle" />
        <span className="mx-1 h-3 w-px bg-slate-300 dark:bg-ink-700" />
        <Legend color="#8B5CF6" label="Hub" pin />
        <Legend color="#14B8A6" label="Lab" pin />
        <Legend color="#3B82F6" label="Facility" pin />
      </div>

      {error && located.length === 0 ? (
        <div className="card text-sm text-red-400">{error}</div>
      ) : (
        <div className="relative h-[calc(100vh-220px)] min-h-[420px] overflow-hidden rounded-2xl border dark:border-ink-700">
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
            <FitBounds points={fitPoints} />

            {/* Centres */}
            {locatedFacilities.map((f) => (
              <Marker key={f.id} position={[f.lat, f.lng]} icon={facilityIcon(facilityColor(f.type))}>
                <Popup>
                  <div className="min-w-[160px] space-y-0.5">
                    <div className="text-sm font-bold text-slate-900">{f.name}</div>
                    <div className="text-xs capitalize text-slate-600">
                      {f.type.replace('_', ' ')}
                      {f.district ? ` · ${f.district}` : ''}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Route line rider → destination */}
            {located.map((r) =>
              r.destination?.latitude != null && r.destination?.longitude != null ? (
                <Polyline
                  key={`line-${r.riderId}`}
                  positions={[
                    [r.lat, r.lng],
                    [Number(r.destination.latitude), Number(r.destination.longitude)],
                  ]}
                  pathOptions={{ color: riderColor(r.status), weight: 2, dashArray: '6 8', opacity: 0.7 }}
                />
              ) : null,
            )}

            {/* Riders — animated bikes */}
            {located.map((r) => (
              <Marker key={r.riderId} position={[r.lat, r.lng]} icon={riderIcon(riderColor(r.status))}>
                <Popup>
                  <div className="min-w-[200px] space-y-1.5">
                    <div className="text-sm font-bold text-slate-900">{r.name || 'Rider'}</div>
                    {r.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Phone size={12} /> {r.phone}
                      </div>
                    )}
                    {r.status && (
                      <div className="text-xs font-semibold capitalize" style={{ color: riderColor(r.status) }}>
                        {r.status.replace('_', ' ')}
                      </div>
                    )}
                    {(r.origin?.name || r.destination?.name) && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Truck size={12} />
                        <span>
                          {r.origin?.name ?? '—'} → {r.destination?.name ?? '—'}
                        </span>
                      </div>
                    )}
                    {r.etaMinutes != null && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Clock size={12} /> ETA ~{r.etaMinutes} min
                      </div>
                    )}
                    {r.sampleCount != null && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Boxes size={12} /> {r.sampleCount} sample{r.sampleCount === 1 ? '' : 's'}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Gauge size={12} />{' '}
                      {r.speed != null && Number.isFinite(num(r.speed))
                        ? `${(num(r.speed) * 3.6).toFixed(1)} km/h`
                        : 'speed n/a'}
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
                  Riders appear here while on an active dispatch. Centres are shown as pins.
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

function Legend({ color, label, pin }: { color: string; label: string; pin?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 border border-white/80 shadow"
        style={{ background: color, borderRadius: pin ? '9999px 9999px 9999px 1px' : '9999px' }}
      />
      {label}
    </span>
  )
}
