import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { timeAgo } from '../lib/ui'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  metadata?: Record<string, any>
}

const POLL_MS = 20_000

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const activeRef = useRef(true)

  async function loadCount() {
    try {
      const res = await api.get('/notifications/unread-count')
      if (activeRef.current) setUnread(Number(res.data?.count ?? 0))
    } catch {
      /* keep last count */
    }
  }

  async function loadList() {
    setLoading(true)
    try {
      const res = await api.get('/notifications')
      if (activeRef.current) setItems(Array.isArray(res.data) ? res.data : [])
    } catch {
      /* ignore */
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

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) loadList()
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all', {})
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnread(0)
    } catch {
      /* ignore */
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={toggle}
        title="Notifications"
        className="relative rounded-lg border p-2.5 text-slate-500 hover:bg-slate-100 dark:border-ink-700 dark:text-slate-300 dark:hover:bg-ink-800"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border bg-white shadow-xl dark:border-ink-700 dark:bg-ink-900">
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-ink-700">
            <div className="text-sm font-bold">Notifications</div>
            {unread > 0 && (
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
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet.</div>
            ) : (
              <ul className="divide-y dark:divide-ink-700/60">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={n.isRead ? 'px-4 py-3' : 'bg-brand/5 px-4 py-3'}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{n.title}</div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{n.message}</div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          {n.createdAt ? timeAgo(n.createdAt) : ''}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
