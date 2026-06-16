import { useEffect, useRef, useState, type ComponentType } from 'react'
import {
  Bell,
  BellRing,
  CheckCheck,
  Loader2,
  AlertTriangle,
  PackageCheck,
  Truck,
  Building2,
  FlaskConical,
  PackageX,
  Sparkles,
} from 'lucide-react'
import { api, apiError } from '../lib/api'
import { timeAgo } from '../lib/ui'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  sampleId?: string
  dispatchId?: string
  isRead: boolean
  createdAt: string
  metadata?: Record<string, unknown>
}

const POLL_MS = 20_000

// Maps a notification `type` to an icon + accent color used for the row marker.
const TYPE_META: Record<
  string,
  { icon: ComponentType<{ size?: number }>; color: string }
> = {
  sample_registered: { icon: FlaskConical, color: '#3B82F6' },
  sample_picked_up: { icon: Truck, color: '#F97316' },
  hub_arrival: { icon: Building2, color: '#8B5CF6' },
  lab_arrival: { icon: PackageCheck, color: '#14B8A6' },
  sample_delayed: { icon: AlertTriangle, color: '#F59E0B' },
  sample_lost: { icon: PackageX, color: '#EF4444' },
}

function typeMeta(type: string) {
  return TYPE_META[type] ?? { icon: Bell, color: '#94A3B8' }
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const activeRef = useRef(true)

  async function loadCount() {
    try {
      const res = await api.get('/notifications/unread-count')
      if (activeRef.current) setUnread(Number(res.data?.count ?? 0))
    } catch {
      /* keep last known count */
    }
  }

  async function loadList() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/notifications')
      if (activeRef.current) setItems(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      if (activeRef.current) setError(apiError(e, 'Could not load notifications'))
    } finally {
      if (activeRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    activeRef.current = true
    loadCount()
    const poll = setInterval(loadCount, POLL_MS)
    return () => {
      activeRef.current = false
      clearInterval(poll)
    }
  }, [])

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) loadList()
  }

  async function markRead(n: Notification) {
    if (n.isRead) return
    // Optimistic local update + badge decrement.
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)))
    setUnread((c) => Math.max(0, c - 1))
    try {
      await api.patch(`/notifications/${n.id}/read`, {})
    } catch {
      /* leave optimistic state; next poll will reconcile the count */
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all', {})
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnread(0)
    } catch (e) {
      setError(apiError(e, 'Could not mark all as read'))
    }
  }

  const hasUnread = unread > 0

  return (
    <div ref={wrapRef} className="relative">
      <button
        data-tour="notifications"
        onClick={toggle}
        title="Notifications"
        aria-label="Notifications"
        className="relative rounded-lg border p-2.5 text-slate-500 hover:bg-slate-100 dark:border-ink-700 dark:text-slate-300 dark:hover:bg-ink-800"
      >
        {hasUnread ? <BellRing size={18} /> : <Bell size={18} />}
        {hasUnread && (
          <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-ink-900">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border bg-white shadow-xl dark:border-ink-700 dark:bg-ink-900 sm:w-96">
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-ink-700">
            <div className="text-sm font-bold">Notifications</div>
            {hasUnread && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center">
                <AlertTriangle size={22} className="mx-auto mb-2 text-amber-500" />
                <div className="text-sm text-slate-500 dark:text-slate-400">{error}</div>
                <button
                  onClick={loadList}
                  className="mt-3 text-xs font-medium text-brand-500 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand-500">
                  <Sparkles size={22} />
                </div>
                <div className="text-sm font-semibold">You&apos;re all caught up</div>
                <div className="mt-1 text-xs text-slate-400">No new notifications right now.</div>
              </div>
            ) : (
              <ul className="divide-y dark:divide-ink-700/60">
                {items.map((n) => {
                  const meta = typeMeta(n.type)
                  const Icon = meta.icon
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => markRead(n)}
                        className={
                          'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-ink-800/60 ' +
                          (n.isRead ? '' : 'bg-brand/5')
                        }
                      >
                        <span
                          className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full"
                          style={{ background: meta.color + '22', color: meta.color }}
                        >
                          <Icon size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={
                                'truncate text-sm font-semibold ' +
                                (n.isRead ? 'text-slate-500 dark:text-slate-400' : '')
                              }
                            >
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {n.message}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            {n.createdAt ? timeAgo(n.createdAt) : ''}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
