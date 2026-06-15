import { useEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  FlaskConical,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Users as UsersIcon,
  Building2,
  Route,
  Boxes,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import { api, apiError } from '../lib/api'
import { getCache, setCache, hasCache } from '../lib/cache'
import {
  CHART_PALETTE,
  cn,
  compact,
  num,
  statusColor,
  statusLabel,
  timeAgo,
} from '../lib/ui'
import { useTheme } from '../lib/theme'
import { HoverCard } from '../components/HoverCard'
import { SampleDetailModal } from '../components/SampleDetailModal'

interface Dash {
  operational: Record<string, number>
  management: Record<string, number>
  collectionVolume: Array<{ date: string; count: string | number }>
  statusDistribution: Array<{ status: string; count: string | number }>
  programDistribution: Array<{ program: string; count: string | number }>
  recentActivity: Array<{
    event: string
    timestamp: string
    sample?: Record<string, unknown> | null
  }>
}

export default function Dashboard() {
  const { theme } = useTheme()
  const [data, setData] = useState<Dash | null>(() => getCache<Dash>('dashboard') ?? null)
  const [loading, setLoading] = useState(!hasCache('dashboard'))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tracked, setTracked] = useState<Record<string, unknown> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  async function load() {
    setRefreshing(true)
    try {
      const res = await api.get('/dashboard')
      setData(res.data)
      setCache('dashboard', res.data)
      setError(null)
    } catch (e) {
      if (!data) setError(apiError(e, 'Failed to load dashboard'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Stagger the sections in once data is available — but only the first time,
  // so a silent background refresh doesn't replay the animation and flash.
  const animatedRef = useRef(false)
  useEffect(() => {
    if (!data || !containerRef.current || animatedRef.current) return
    animatedRef.current = true
    const ctx = gsap.context(() => {
      gsap.from('.dash-section', {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.07,
        ease: 'power2.out',
      })
    }, containerRef)
    return () => ctx.revert()
  }, [data])

  if (loading && !data) return <DashboardSkeleton />
  if (error)
    return (
      <div className="card flex flex-col items-center gap-3 py-16 text-center">
        <AlertTriangle className="text-red-400" />
        <p className="text-slate-400">{error}</p>
        <button onClick={load} className="btn-ghost">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    )
  if (!data) return null

  const op = data.operational ?? {}
  const mg = data.management ?? {}
  const total = num(op.totalSamples)
  const completed = num(op.completed)
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0
  const axis = theme === 'dark' ? '#64748B' : '#94A3B8'
  const grid = theme === 'dark' ? '#222C38' : '#E2E8F0'

  const volume = data.collectionVolume.map((d) => ({
    date: d.date,
    label: shortDate(d.date),
    count: num(d.count),
  }))
  const statuses = data.statusDistribution
    .map((s) => ({ name: statusLabel(s.status), key: s.status, value: num(s.count) }))
    .filter((s) => s.value > 0)
  const statusTotal = statuses.reduce((a, b) => a + b.value, 0)
  const programs = data.programDistribution
    .map((p) => ({ name: String(p.program), value: num(p.count) }))
    .sort((a, b) => b.value - a.value)

  const empty = total === 0 && statuses.length === 0

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="dash-section flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Overview</h2>
          <p className="text-sm text-slate-400">Real-time sample monitoring across the network</p>
        </div>
        <button onClick={load} className="btn-ghost">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {empty && (
        <div className="dash-section rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500 dark:text-amber-400">
          No samples collected yet — metrics and charts will populate automatically as facilities
          begin collecting and dispatching samples across the network.
        </div>
      )}

      {/* KPI cards */}
      <div className="dash-section grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Total Samples"
          value={compact(total)}
          icon={<FlaskConical size={20} />}
          color="#3B82F6"
          delta={num(op.samplesToday) > 0 ? `+${compact(num(op.samplesToday))} today` : 'No new today'}
          up
        />
        <Kpi
          label="In Transit"
          value={compact(num(op.inTransit))}
          icon={<Truck size={20} />}
          color="#F59E0B"
          delta={num(op.delayed) > 0 ? `${num(op.delayed)} delayed >48h` : 'On schedule'}
          up={num(op.delayed) === 0}
        />
        <Kpi
          label="Completed"
          value={compact(completed)}
          icon={<CheckCircle2 size={20} />}
          color="#22C55E"
          delta={`${completedPct}% of total`}
          up
        />
        <Kpi
          label="Lost Rate"
          value={`${num(op.lostRate)}%`}
          icon={<AlertTriangle size={20} />}
          color="#EF4444"
          delta={`${compact(num(op.lost))} samples lost`}
          up={false}
        />
      </div>

      {/* Network strip */}
      <div className="dash-section grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Mini label="Active Users" value={compact(num(mg.totalUsers))} icon={<UsersIcon size={18} />} color="#6366F1" />
        <Mini label="Facilities" value={compact(num(mg.totalFacilities))} icon={<Building2 size={18} />} color="#14B8A6" />
        <Mini label="Active Dispatches" value={compact(num(mg.activeDispatches))} icon={<Route size={18} />} color="#F97316" />
        <Mini label="Total Dispatches" value={compact(num(mg.totalDispatches))} icon={<Boxes size={18} />} color="#8B5CF6" />
      </div>

      {/* Charts row 1 */}
      <div className="dash-section grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          title="Collection Volume"
          subtitle={`Daily samples collected · last ${volume.length} days`}
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={volume} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke={axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip suffix=" samples" />} cursor={{ stroke: grid }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#22C55E"
                strokeWidth={2.5}
                fill="url(#vol)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Status Distribution"
          subtitle="Current pipeline states"
        >
          {statuses.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="flex items-center gap-2">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={statuses}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {statuses.map((s) => (
                      <Cell key={s.key} fill={statusColor(s.key)} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                <div className="mb-1 text-2xl font-extrabold">{compact(statusTotal)}</div>
                <div className="-mt-2 mb-2 text-xs text-slate-400">total samples</div>
                {statuses.map((s) => (
                  <div key={s.key} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: statusColor(s.key) }} />
                    <span className="flex-1 text-slate-500 dark:text-slate-400">{s.name}</span>
                    <span className="font-semibold">{compact(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="dash-section grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard className="lg:col-span-2" title="Disease Programs" subtitle="Samples by program">
          {programs.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, programs.length * 46)}>
              <BarChart
                data={programs}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
                  {programs.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard className="lg:col-span-3" title="Recent Activity" subtitle="Latest sample events">
          {data.recentActivity.length === 0 ? (
            <EmptyChart />
          ) : (
            <ul className="space-y-1">
              {data.recentActivity.slice(0, 8).map((a, i) => {
                const clickable = !!a.sample?.id
                return (
                  <li
                    key={i}
                    onClick={() => clickable && setTracked(a.sample as Record<string, unknown>)}
                    className={cn(
                      '-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors',
                      clickable && 'cursor-pointer hover:bg-slate-100 dark:hover:bg-ink-850/60',
                    )}
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                      style={{ background: `${statusColor(a.event)}22`, color: statusColor(a.event) }}
                    >
                      <FlaskConical size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {String(a.sample?.sampleId ?? 'Unknown sample')}
                      </div>
                      <div className="text-xs text-slate-400">
                        <span style={{ color: statusColor(a.event) }}>{statusLabel(a.event)}</span>
                        {' · '}
                        {timeAgo(a.timestamp)}
                      </div>
                    </div>
                    {clickable && <ChevronRight size={16} className="shrink-0 text-slate-400" />}
                  </li>
                )
              })}
            </ul>
          )}
        </ChartCard>
      </div>

      {tracked && (
        <SampleDetailModal
          sampleId={String(tracked.id)}
          fallback={tracked}
          onClose={() => setTracked(null)}
        />
      )}
    </div>
  )
}

function Kpi({
  label,
  value,
  icon,
  color,
  delta,
  up,
}: {
  label: string
  value: string
  icon: ReactNode
  color: string
  delta: string
  up: boolean
}) {
  return (
    <HoverCard>
      <div className="flex items-center justify-between">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{ background: `${color}24`, color }}
        >
          {icon}
        </span>
        {up ? (
          <TrendingUp size={18} className="text-emerald-500" />
        ) : (
          <TrendingDown size={18} className="text-red-500" />
        )}
      </div>
      <div className="mt-4 text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="text-sm font-medium text-slate-400">{label}</div>
      <div className="mt-2.5 text-xs font-medium" style={{ color: up ? '#16A34A' : '#94A3B8' }}>
        {delta}
      </div>
    </HoverCard>
  )
}

function Mini({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: ReactNode
  color: string
}) {
  return (
    <HoverCard className="flex items-center gap-3 !p-4">
      <span
        className="grid h-10 w-10 place-items-center rounded-xl"
        style={{ background: `${color}24`, color }}
      >
        {icon}
      </span>
      <div>
        <div className="text-xl font-extrabold">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </HoverCard>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`card ${className ?? ''}`}>
      <div className="mb-4">
        <h3 className="font-bold">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function DarkTooltip({
  active,
  payload,
  label,
  suffix = '',
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
  suffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-850 px-3 py-2 text-xs shadow-lg">
      {label && <div className="mb-0.5 text-slate-400">{label}</div>}
      <div className="font-semibold text-slate-100">
        {compact(payload[0].value)}
        {suffix || ` ${payload[0].name}`}
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="grid h-[200px] place-items-center text-sm text-slate-400">No data yet</div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="shimmer h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="shimmer h-72 rounded-2xl lg:col-span-3" />
        <div className="shimmer h-72 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  )
}

function shortDate(iso: string): string {
  const parts = iso.split('-')
  if (parts.length === 3) return `${Number(parts[2])}/${Number(parts[1])}`
  return iso
}
