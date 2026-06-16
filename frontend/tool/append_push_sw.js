// Post-build step: append Web Push handlers to Flutter's generated service
// worker. `flutter build web` regenerates flutter_service_worker.js (caching
// only), so we tack on `push` + `notificationclick` listeners afterwards. The
// PWA subscribes against THIS same service worker, so push events land here.
//
// Run after `flutter build web`:  node tool/append_push_sw.js
const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'build', 'web', 'flutter_service_worker.js');
const MARKER = '/* NSRTMS web push */';

const HANDLERS = `

${MARKER}
self.addEventListener('push', function (event) {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const title = data.title || 'NSRTMS';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.sampleId || undefined,
    data: { url: data.url || '/', sampleId: data.sampleId },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
`;

if (!fs.existsSync(swPath)) {
  console.error('[append_push_sw] flutter_service_worker.js not found — run flutter build web first');
  process.exit(1);
}
let content = fs.readFileSync(swPath, 'utf8');
if (content.includes(MARKER)) {
  console.log('[append_push_sw] push handlers already present — skipping');
} else {
  fs.appendFileSync(swPath, HANDLERS);
  console.log('[append_push_sw] push handlers appended to flutter_service_worker.js');
}
