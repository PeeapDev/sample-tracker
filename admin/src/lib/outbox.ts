import axios from 'axios'
import { API_BASE, getAccessToken } from './api'
import { outboxAdd, outboxAll, outboxDelete, type OutboxItem } from './idb'

// A write that failed because we're offline is parked here and replayed, in
// order, when connectivity returns. Listeners (the header indicator) are
// notified so the pending count + "synced" toasts stay live.

type Listener = () => void
const listeners = new Set<Listener>()
let flushing = false

export function onOutboxChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function emit() {
  listeners.forEach((fn) => fn())
}

export async function enqueue(item: Omit<OutboxItem, 'id' | 'createdAt'>): Promise<void> {
  await outboxAdd({ ...item, createdAt: Date.now() })
  emit()
}

export async function pendingCount(): Promise<number> {
  return (await outboxAll()).length
}

/**
 * Replay every queued write in creation order. Each item is removed on a 2xx;
 * on a 4xx (server rejected it — e.g. the sample already moved) it's dropped
 * with a console note rather than retried forever; a network error stops the
 * run so we try again on the next reconnect.
 */
export async function flush(): Promise<{ synced: number; dropped: number }> {
  if (flushing) return { synced: 0, dropped: 0 }
  flushing = true
  let synced = 0
  let dropped = 0
  try {
    const items = (await outboxAll()).sort((a, b) => a.createdAt - b.createdAt)
    for (const item of items) {
      const token = getAccessToken()
      try {
        await axios.request({
          baseURL: API_BASE,
          url: item.url,
          method: item.method,
          data: item.body,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        await outboxDelete(item.id!)
        synced++
        emit()
      } catch (e) {
        const status = axios.isAxiosError(e) ? e.response?.status : undefined
        if (status && status >= 400 && status < 500) {
          // Permanently rejected — drop it so it can't wedge the queue.
          await outboxDelete(item.id!)
          dropped++
          emit()
        } else {
          // Network/5xx — stop; retry on the next reconnect.
          break
        }
      }
    }
  } finally {
    flushing = false
  }
  if (synced > 0 || dropped > 0) emit()
  return { synced, dropped }
}

// Auto-flush when the browser regains connectivity.
let wired = false
export function wireAutoFlush(): void {
  if (wired) return
  wired = true
  window.addEventListener('online', () => {
    void flush()
  })
  // Best-effort flush on load in case we start online with a backlog.
  if (navigator.onLine) void flush()
}
