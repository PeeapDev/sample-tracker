import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Last-known-good read cache for GET responses.
///
/// Every successful GET in [ApiService] is persisted here keyed by its full
/// path+query, so when the device later goes offline the same screen (samples,
/// batches, dashboard, notifications…) can render the last data we saw instead
/// of erroring. Payloads are JSON-encoded under a namespaced key; the newest
/// write for a given key wins.
class OfflineStore {
  static const _prefix = 'read_cache:';

  String _key(String cacheKey) => '$_prefix$cacheKey';

  Future<void> put(String cacheKey, Map<String, dynamic> json) async {
    final prefs = await SharedPreferences.getInstance();
    // Guard against pathologically large blobs (e.g. base64 QR images) bloating
    // prefs — skip caching anything over ~512 KB.
    final encoded = jsonEncode(json);
    if (encoded.length > 512 * 1024) return;
    await prefs.setString(_key(cacheKey), encoded);
  }

  Future<Map<String, dynamic>?> get(String cacheKey) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key(cacheKey));
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw);
      return decoded is Map<String, dynamic> ? decoded : {'data': decoded};
    } catch (_) {
      return null;
    }
  }

  /// Wipe the read cache (e.g. on logout) so a different account can't see the
  /// previous user's cached lists.
  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys().where((k) => k.startsWith(_prefix)).toList();
    for (final k in keys) {
      await prefs.remove(k);
    }
  }
}
