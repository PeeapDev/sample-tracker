import 'dart:async';
import 'dart:convert';
import 'dart:js_interop';
import 'api_service.dart';

// Bound to window.nsrtmsSubscribePush / nsrtmsPushSupported in web/push.js.
@JS('nsrtmsSubscribePush')
external JSPromise<JSString?> _subscribePush(JSString vapidKey);

@JS('nsrtmsPushSupported')
external JSBoolean _pushSupported();

/// Web (PWA) implementation: fetch the VAPID key, ask the browser to subscribe,
/// and post the subscription to the backend so pushes reach this device.
Future<void> registerWebPush() async {
  try {
    if (!_pushSupported().toDart) return;

    final api = ApiService();
    final keyResp = await api.get('/notifications/vapid-public-key');
    final vapid = keyResp['publicKey'];
    if (vapid is! String || vapid.isEmpty) return;

    final result = await _subscribePush(vapid.toJS).toDart;
    final subJson = result?.toDart;
    if (subJson == null || subJson.isEmpty) return;

    final sub = jsonDecode(subJson) as Map<String, dynamic>;
    final keys = sub['keys'] as Map<String, dynamic>?;
    if (sub['endpoint'] == null || keys == null) return;

    await api.post('/notifications/subscribe', {
      'endpoint': sub['endpoint'],
      'keys': {'p256dh': keys['p256dh'], 'auth': keys['auth']},
    });
  } catch (_) {
    // best-effort — in-app notifications still work without push
  }
}
