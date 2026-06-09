import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class OfflineSyncService {
  static const _pendingKey = 'pending_sync_operations';
  final ApiService _api;

  OfflineSyncService(this._api);

  Future<void> queueOperation(String method, String path, Map<String, dynamic> body) async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList(_pendingKey) ?? [];
    pending.add(jsonEncode({
      'method': method,
      'path': path,
      'body': body,
      'timestamp': DateTime.now().toIso8601String(),
    }));
    await prefs.setStringList(_pendingKey, pending);
  }

  Future<List<Map<String, dynamic>>> getPendingOperations() async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList(_pendingKey) ?? [];
    return pending.map((s) => jsonDecode(s) as Map<String, dynamic>).toList();
  }

  Future<int> getPendingCount() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_pendingKey)?.length ?? 0;
  }

  Future<void> syncAll() async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList(_pendingKey) ?? [];
    if (pending.isEmpty) return;

    final remaining = <String>[];

    for (final op in pending) {
      try {
        final data = jsonDecode(op) as Map<String, dynamic>;
        final method = data['method'] as String;
        final path = data['path'] as String;
        final body = data['body'] as Map<String, dynamic>;

        switch (method) {
          case 'POST':
            await _api.post(path, body);
            break;
          case 'PATCH':
            await _api.patch(path, body);
            break;
        }
      } catch (_) {
        remaining.add(op);
      }
    }

    await prefs.setStringList(_pendingKey, remaining);
  }

  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_pendingKey);
  }
}
