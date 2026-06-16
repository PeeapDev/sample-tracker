import { useEffect, useState } from 'react'
import { CloudOff, RefreshCcw, Check, Loader2 } from 'lucide-react'
import { useOnline } from '../lib/useOnline'
import { onOutboxChange, pendingCount, flush } from '../lib/outbox'

// Compact header indicator: shows offline state and how many writes are queued
// for sync, with a manual "sync now" when back online.
export function SyncStatus() {
  const online = useOnline()
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  async function refresh() {
    setPending(await pendingCount())
  }

  useEffect(() => {
    refresh()
    const off = onOutboxChange(refresh)
    return off
  }, [])

  // When we come back online with a backlog, surface a brief "synced" tick.
  useEffect(() => {
    if (online && pending > 0) void doFlush()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online])

  async function doFlush() {
    if (syncing) return
    setSyncing(true)
    try {
      const { synced } = await flush()
      await refresh()
      if (synced > 0) {
        setJustSynced(true)
        setTimeout(() => setJustSynced(false), 2500)
      }
    } finally {
      setSyncing(false)
    }
  }

  // Nothing to show when online with an empty queue (avoid header clutter).
  if (online && pending === 0 && !justSynced) return null

  if (!online) {
    return (
      <span
        title={pending > 0 ? `${pending} change(s) will sync when you're back online` : 'You are offline — showing saved data'}
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400"
      >
        <CloudOff size={14} />
        Offline{pending > 0 ? ` · ${pending} queued` : ''}
      </span>
    )
  }

  if (pending > 0) {
    return (
      <button
        onClick={doFlush}
        disabled={syncing}
        title="Sync queued changes now"
        className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400"
      >
        {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
        {pending} to sync
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      <Check size={14} /> Synced
    </span>
  )
}
