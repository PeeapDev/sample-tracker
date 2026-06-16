/* NSRTMS admin service worker — version-independent (no build plugin).
 * Goal: let the app *boot* with no network. We runtime-cache same-origin app
 * assets (the hashed JS/CSS, fonts, icons) as they're fetched, and fall back to
 * the cached index.html for navigations when offline. API data + offline writes
 * are handled separately in the app via IndexedDB (lib/idb.ts + lib/outbox.ts),
 * so this SW deliberately does NOT touch cross-origin API calls. */
const CACHE = 'nsrtms-shell-v1'

self.addEventListener('install', (event) => {
  // Pre-cache the shell entry so a cold offline load has something to boot.
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(['/', '/index.html']).catch(() => {})),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// --- Web Push -------------------------------------------------------------
// A push arrives even when the app (or browser) is closed. We surface it as an
// OS notification; clicking it focuses an open tab (deep-linking it to the
// related sample/dispatch) or opens a new one.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'NSRTMS'
  const url =
    data.url ||
    (data.dispatchId
      ? `/dispatches?open=${data.dispatchId}`
      : data.sampleId
        ? `/samples?open=${data.sampleId}`
        : '/')
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.type || 'nsrtms-notification',
      data: { url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  const full = new URL(target, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(full).catch(() => {})
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(full)
    }),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // Only handle our own origin — never the cross-origin API (auth'd, dynamic).
  if (url.origin !== self.location.origin) return

  // SPA navigations: network-first, fall back to the cached app shell so the
  // app opens offline and the client router takes over.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    )
    return
  }

  // Static assets: stale-while-revalidate — serve cache fast, refresh in the bg.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
