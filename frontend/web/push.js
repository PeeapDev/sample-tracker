// Browser-side Web Push helper. Dart (web build) calls window.nsrtmsSubscribePush
// with the VAPID public key; we ask permission, subscribe via the Flutter
// service worker's PushManager, and hand the subscription JSON back to Dart,
// which posts it to the backend. Keeping the Push API bits in JS avoids fighting
// Dart's evolving interop for the SW registration.

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Returns the subscription as a JSON string, or null if unavailable/denied.
window.nsrtmsSubscribePush = async function (vapidKey) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    if (!vapidKey) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }
    return JSON.stringify(sub);
  } catch (e) {
    console.warn('[nsrtms] push subscribe failed', e);
    return null;
  }
};

// Lets Dart check whether it's even worth attempting (avoids prompting where
// push can't work, e.g. a non-installed iOS browser).
window.nsrtmsPushSupported = function () {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};
