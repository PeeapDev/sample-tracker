import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
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
// An in-flight dispatch leg: samples on the move from one origin towards a
// destination (typically a hub). Drives the "convergence" layer so the map can
// show samples arriving at a hub from several different facilities at once.
interface Leg {
  dispatchId: string
  dispatchCode?: string
  status?: string | null
  sampleCount?: number | null
  riderName?: string | null
  origin?: Centre | null
  destination?: Centre | null
  current?: { latitude: number | null; longitude: number | null } | null
  hasLiveGps?: boolean
  etaMinutes?: number | null
  updatedAt?: string
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

// A pulsing ring with a sample-count badge marking an ACTIVE origin — a facility
// that currently has samples in flight toward a destination. Built per count so
// the badge stays correct without rebuilding on every poll.
const originIconCache: Record<string, L.DivIcon> = {}
function originIcon(count: number): L.DivIcon {
  const key = String(count)
  if (!originIconCache[key]) {
    originIconCache[key] = L.divIcon({
      className: 'origin-marker',
      html:
        `<div class="origin-ring"></div>` +
        (count > 0 ? `<div class="origin-badge">${count}</div>` : ''),
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    })
  }
  return originIconCache[key]
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

export default function LiveMap({ embedded = false }: { embedded?: boolean } = {}) {
  const [riders, setRiders] = useState<Rider[]>([])
  const [legs, setLegs] = useState<Leg[]>([])
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
      // Live riders (GPS) + active legs (sample convergence) in one poll. Legs
      // are best-effort: an older backend without /tracking/legs still shows
      // riders, so a legs failure must not blank the map.
      const [ridersRes, legsRes] = await Promise.all([
        api.get('/tracking/riders', { params: { withinMinutes: 10 } }),
        api.get('/tracking/legs', { params: { withinMinutes: 30 } }).catch(() => null),
      ])
      if (!activeRef.current) return
      const list = Array.isArray(ridersRes.data) ? ridersRes.data : ridersRes.data?.data ?? []
      setRiders(Array.isArray(list) ? list : [])
      if (legsRes) {
        const legList = Array.isArray(legsRes.data) ? legsRes.data : legsRes.data?.data ?? []
        setLegs(Array.isArray(legList) ? legList : [])
      }
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

  // Active legs whose origin we can place on the map. Each carries an `oLat/oLng`
  // (origin), and — where known — a destination and current position so we can
  // draw the origin → (current) → destination convergence path.
  const locatedLegs = useMemo(
    () =>
      legs
        .map((l) => ({
          ...l,
          oLat: num(l.origin?.latitude),
          oLng: num(l.origin?.longitude),
          dLat: num(l.destination?.latitude),
          dLng: num(l.destination?.longitude),
          cLat: num(l.current?.latitude),
          cLng: num(l.current?.longitude),
        }))
        .filter((l) => Number.isFinite(l.oLat) && Number.isFinite(l.oLng)),
    [legs],
  )

  // Group concurrent legs by destination so a hub's popup can show how many
  // samples are converging on it and from where.
  const convergence = useMemo(() => {
    const byDest = new Map<string, { name: string; samples: number; origins: Set<string> }>()
    locatedLegs.forEach((l) => {
      const name = l.destination?.name
      if (!name) return
      const e = byDest.get(name) ?? { name, samples: 0, origins: new Set<string>() }
      e.samples += l.sampleCount ?? 0
      if (l.origin?.name) e.origins.add(l.origin.name)
      byDest.set(name, e)
    })
    return byDest
  }, [locatedLegs])

  // Fit to riders + their destinations + every active leg's origin/destination,
  // so a hub plus all the facilities feeding it are framed together (not the
  // whole country).
  const fitPoints = useMemo<Array<[number, number]>>(() => {
    const pts: Array<[number, number]> = located.map((r) => [r.lat, r.lng])
    located.forEach((r) => {
      if (r.destination?.latitude != null && r.destination?.longitude != null) {
        pts.push([Number(r.destination.latitude), Number(r.destination.longitude)])
      }
    })
    locatedLegs.forEach((l) => {
      pts.push([l.oLat, l.oLng])
      if (Number.isFinite(l.dLat) && Number.isFinite(l.dLng)) pts.push([l.dLat, l.dLng])
    })
    return pts
  }, [located, locatedLegs])

  const inTransit = located.filter((r) => r.status === 'in_transit').length
  const legSamples = locatedLegs.reduce((sum, l) => sum + (l.sampleCount ?? 0), 0)
  const secondsAgo = lastUpdated ? Math.max(0, Math.round((Date.now() - lastUpdated) / 1000)) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={embedded ? 'text-lg font-bold' : 'text-2xl font-extrabold tracking-tight'}>
            {embedded ? 'Live rider map' : 'Live Map'}
          </h2>
          <p className="text-sm text-slate-400">
            {located.length} rider{located.length === 1 ? '' : 's'} broadcasting
            {inTransit > 0 ? ` · ${inTransit} en route` : ''}
            {legSamples > 0 ? ` · ${legSamples} sample${legSamples === 1 ? '' : 's'} in flight` : ''} ·
            last 10 minutes
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
        <span className="mx-1 h-3 w-px bg-slate-300 dark:bg-ink-700" />
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full ring-2 ring-amber-400" />
          Active origin (samples in flight)
        </span>
      </div>

      {error && located.length === 0 ? (
        <div className="card text-sm text-red-400">{error}</div>
      ) : (
        <div className={`relative ${embedded ? 'h-[480px]' : 'h-[calc(100vh-220px)] min-h-[420px]'} overflow-hidden rounded-2xl border dark:border-ink-700`}>
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
            {locatedFacilities.map((f) => {
              const inbound = convergence.get(f.name)
              return (
                <Marker key={f.id} position={[f.lat, f.lng]} icon={facilityIcon(facilityColor(f.type))}>
                  <Popup>
                    <div className="min-w-[160px] space-y-0.5">
                      <div className="text-sm font-bold text-slate-900">{f.name}</div>
                      <div className="text-xs capitalize text-slate-600">
                        {f.type.replace('_', ' ')}
                        {f.district ? ` · ${f.district}` : ''}
                      </div>
                      {inbound && inbound.samples > 0 && (
                        <div className="mt-1 flex items-center gap-1.5 rounded bg-violet-50 px-1.5 py-1 text-xs font-semibold text-violet-700">
                          <Boxes size={12} /> {inbound.samples} sample
                          {inbound.samples === 1 ? '' : 's'} inbound from {inbound.origins.size}{' '}
                          facilit{inbound.origins.size === 1 ? 'y' : 'ies'}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            })}

            {/* Convergence layer: each active leg's path origin → current →
                destination, with a counted ring at the origin. Shows samples
                funnelling into a hub from several facilities, even before the
                rider starts broadcasting GPS. */}
            {locatedLegs.map((l) => {
              const path: Array<[number, number]> = [[l.oLat, l.oLng]]
              if (Number.isFinite(l.cLat) && Number.isFinite(l.cLng)) path.push([l.cLat, l.cLng])
              if (Number.isFinite(l.dLat) && Number.isFinite(l.dLng)) path.push([l.dLat, l.dLng])
              return (
                <Fragment key={`leg-${l.dispatchId}`}>
                  {path.length > 1 && (
                    <Polyline
                      positions={path}
                      pathOptions={{
                        color: riderColor(l.status),
                        weight: 2,
                        dashArray: l.hasLiveGps ? undefined : '4 8',
                        opacity: 0.45,
                      }}
                    />
                  )}
                  <Marker position={[l.oLat, l.oLng]} icon={originIcon(l.sampleCount ?? 0)}>
                    <Popup>
                      <div className="min-w-[190px] space-y-1">
                        <div className="text-sm font-bold text-slate-900">
                          {l.origin?.name ?? 'Origin'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Truck size={12} /> {l.origin?.name ?? '—'} → {l.destination?.name ?? '—'}
                        </div>
                        {l.sampleCount != null && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <Boxes size={12} /> {l.sampleCount} sample
                            {l.sampleCount === 1 ? '' : 's'} in transit
                          </div>
                        )}
                        {l.riderName && (
                          <div className="text-xs text-slate-600">Rider: {l.riderName}</div>
                        )}
                        {l.etaMinutes != null && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Clock size={12} /> ETA ~{l.etaMinutes} min
                          </div>
                        )}
                        <div className="text-xs text-slate-500">
                          {l.hasLiveGps ? 'Live GPS' : 'Awaiting GPS — shown at origin'}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </Fragment>
              )
            })}

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
