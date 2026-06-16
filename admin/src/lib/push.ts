import { api } from './api'

// VAPID keys are base64url; the Push API wants the applicationServerKey as bytes
// backed by a plain ArrayBuffer (not a SharedArrayBuffer — hence the explicit
// buffer, which keeps newer TS lib types happy).
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const arr = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function pushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return pushSupported() ? Notification.permission : 'unsupported'
}

// Subscribe this browser for web push and register the subscription with the
// API. Safe to call repeatedly — it reuses an existing subscription and only
// proceeds when permission is already granted (so it never prompts; call
// requestAndSubscribe from a click to prompt). Returns true once registered.
export async function ensurePushSubscription(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      const { data } = await api.get('/notifications/vapid-public-key')
      const key: string | undefined = data?.publicKey
      if (!key) return false
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })
    }
    const json = sub.toJSON()
    await api.post('/notifications/subscribe', {
      endpoint: sub.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      userAgent: navigator.userAgent,
    })
    return true
  } catch {
    // Best-effort: a failed subscribe just means no background pushes; the
    // in-app bell still works.
    return false
  }
}

// Prompt for notification permission (MUST be called from a user gesture so the
// browser shows the prompt) and then subscribe. No-ops if already decided.
export async function requestAndSubscribe(): Promise<boolean> {
  if (!pushSupported()) return false
  if (Notification.permission === 'default') {
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return false
  } else if (Notification.permission !== 'granted') {
    return false
  }
  return ensurePushSubscription()
}
