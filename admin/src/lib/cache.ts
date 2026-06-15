// Two-tier cache so pages behave like already-loaded browser tabs AND survive a
// full reload / loss of connectivity:
//   L1 — an in-memory Map for instant synchronous reads during a session.
//   L2 — localStorage, so the last-seen data is still there after a refresh or
//        when the device is offline. Pages render this stale copy immediately
//        and refresh in the background when the network is available.
//
// This is what gives the admin a basic offline-read story (the field app has
// its own offline sync). Keep payloads lean — localStorage caps around 5 MB,
// which is why list endpoints no longer ship base64 QR blobs.
const NS = 'nsrtms_cache_v1:'
const mem = new Map<string, unknown>()

function lsKey(key: string): string {
  return NS + key
}

export function getCache<T>(key: string): T | undefined {
  if (mem.has(key)) return mem.get(key) as T
  try {
    const raw = localStorage.getItem(lsKey(key))
    if (raw == null) return undefined
    const value = JSON.parse(raw) as T
    mem.set(key, value)
    return value
  } catch {
    return undefined
  }
}

export function setCache<T>(key: string, value: T): void {
  mem.set(key, value)
  try {
    localStorage.setItem(lsKey(key), JSON.stringify(value))
  } catch {
    // Quota exceeded or serialization failed — the in-memory copy still works
    // for this session; we just lose persistence for this key.
  }
}

export function hasCache(key: string): boolean {
  if (mem.has(key)) return true
  try {
    return localStorage.getItem(lsKey(key)) !== null
  } catch {
    return false
  }
}

export function clearCache(key?: string): void {
  if (key) {
    mem.delete(key)
    try {
      localStorage.removeItem(lsKey(key))
    } catch {
      /* ignore */
    }
    return
  }
  mem.clear()
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(NS))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}
