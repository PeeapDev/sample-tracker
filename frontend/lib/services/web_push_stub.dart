/// Non-web (Android/desktop) builds don't use Web Push — this is a no-op.
/// Native push would go through FCM instead, which isn't wired here.
Future<void> registerWebPush() async {}
