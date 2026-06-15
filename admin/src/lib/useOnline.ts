import { useEffect, useState } from 'react'

// Tracks browser connectivity so pages can tell the user when they're looking
// at saved (cached) data rather than live data. Note: navigator.onLine only
// reflects whether the device has a network, not whether the API is reachable —
// actual fetch failures are still surfaced per-request via apiError().
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}
