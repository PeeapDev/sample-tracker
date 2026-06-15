export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/** Coerce Postgres count strings / nulls to a number. */
export function num(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

export function compact(v: number): string {
  return Math.round(v).toLocaleString('en-US')
}

export const STATUS_COLORS: Record<string, string> = {
  collected: '#3B82F6',
  picked_up: '#F97316',
  hub_received: '#8B5CF6',
  in_transit: '#F59E0B',
  lab_received: '#14B8A6',
  analysis_queue: '#6366F1',
  completed: '#22C55E',
  lost: '#EF4444',
}

export function statusColor(s: string) {
  return STATUS_COLORS[s] ?? '#94A3B8'
}

export function statusLabel(s: string) {
  const map: Record<string, string> = {
    collected: 'Collected',
    picked_up: 'Picked Up',
    hub_received: 'Hub Received',
    in_transit: 'In Transit',
    lab_received: 'Lab Received',
    analysis_queue: 'Analysis Queue',
    completed: 'Completed',
    lost: 'Lost',
  }
  return map[s] ?? s
}

export const CHART_PALETTE = [
  '#3B82F6',
  '#22C55E',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#6366F1',
]

export const ROLES = [
  { value: 'admin', label: 'Administrator', color: '#6366F1' },
  { value: 'collector', label: 'Sample Collector', color: '#3B82F6' },
  { value: 'dispatcher', label: 'Dispatcher', color: '#F97316' },
  { value: 'hub_officer', label: 'Hub Officer', color: '#8B5CF6' },
  { value: 'lab_officer', label: 'Lab Officer', color: '#14B8A6' },
]

export function roleMeta(role: string) {
  return ROLES.find((r) => r.value === role) ?? { value: role, label: role, color: '#94A3B8' }
}

export function timeAgo(ts: string): string {
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
