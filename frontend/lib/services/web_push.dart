// Registers this device for Web Push when running on the web (PWA), and is a
// no-op everywhere else. Safe to call after login — it quietly does nothing if
// push is unsupported or the user declines permission.
export 'web_push_stub.dart' if (dart.library.html) 'web_push_web.dart';
