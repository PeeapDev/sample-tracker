import 'offline_sync_service.dart';

/// Decides which mutating requests are safe to queue when the device is offline,
/// and shapes the "queued" result the UI recognises.
///
/// This sits in front of [OfflineSyncService] (the durable SharedPreferences
/// outbox the [SyncEngine] drains). Only *create/advance*-style writes that the
/// backend will happily apply later are queued; idempotency-sensitive or
/// auth-only calls (login, logout, refresh) are never queued — they just fail
/// online-only as before.
class OfflineQueue {
  OfflineQueue(this._store);

  final OfflineSyncService _store;

  /// Paths whose POST/PATCH we replay offline. Matched as a prefix so id-bearing
  /// routes (e.g. `/samples/<uuid>/status`, `/batches/<uuid>/samples`) are
  /// covered. Keep this an explicit allowlist so we never queue something the
  /// server can't safely re-apply.
  static const List<String> _queueablePrefixes = [
    '/samples/scan', // scan-to-advance a single sample
    '/samples', // create sample / per-sample status & lost (PATCH /samples/:id/...)
    '/batches/scan', // box scan-to-advance
    '/batches', // create batch / add samples to batch
    '/parcels/scan', // parcel scan-to-advance
    '/parcels', // register parcel
  ];

  /// Returns true if a failed [method] [path] write should be queued offline.
  bool shouldQueue(String method, String path) {
    if (method != 'POST' && method != 'PATCH') return false;
    // Never queue auth flows — a stale offline login/refresh is meaningless.
    if (path.startsWith('/auth')) return false;
    for (final prefix in _queueablePrefixes) {
      if (path == prefix || path.startsWith('$prefix/')) return true;
    }
    return false;
  }

  /// Enqueue and return the recognizable "queued" envelope. Callers (and the UI)
  /// can check `result['queued'] == true` to show "Saved offline — will sync".
  Future<Map<String, dynamic>> enqueue(
    String method,
    String path,
    Map<String, dynamic> body,
  ) async {
    await _store.queueOperation(method, path, body);
    return {
      'queued': true,
      'offline': true,
      'message': 'Saved offline — will sync when back online.',
      // Echo the body so optimistic UI can read back what was submitted.
      'request': {'method': method, 'path': path, 'body': body},
    };
  }

  Future<int> pendingCount() => _store.getPendingCount();
}

/// True for the envelope returned by [OfflineQueue.enqueue].
bool isQueuedResult(Map<String, dynamic>? result) =>
    result != null && result['queued'] == true;
