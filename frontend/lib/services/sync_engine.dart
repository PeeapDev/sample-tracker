import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'offline_sync_service.dart';
import 'reachability_service.dart';

enum SyncStatus { offline, idle, syncing }

/// Always-on background sync loop.
///
/// While the app process is alive — foreground *or* minimized — this keeps a
/// low-cost watch on whether the backend is reachable and flushes any queued
/// offline writes the moment a connection appears. The user can shut the lid,
/// reopen the laptop later, and the first time real internet is detected the
/// pending work syncs automatically with no manual action.
///
/// Two independent triggers make sure we never miss a window:
///  1. A periodic timer (cheap HEAD probe) — fires even when the OS doesn't
///     report a connectivity change (e.g. flaky uplink that comes and goes).
///  2. `connectivity_plus` change events — fire instantly when the machine
///     wakes from sleep or rejoins WiFi, so we don't wait for the next tick.
class SyncEngine extends ChangeNotifier {
  SyncEngine({
    required OfflineSyncService offline,
    required ReachabilityService reachability,
    this.activeInterval = const Duration(seconds: 15),
    this.idleInterval = const Duration(seconds: 60),
  })  : _offline = offline,
        _reach = reachability;

  final OfflineSyncService _offline;
  final ReachabilityService _reach;

  /// Poll cadence while there is pending work or we're offline (want to catch
  /// the connection ASAP). Short, but a single HEAD request is negligible.
  final Duration activeInterval;

  /// Poll cadence when fully synced and online — back off to save battery.
  final Duration idleInterval;

  Timer? _timer;
  StreamSubscription<ConnectivityResult>? _connSub;
  bool _running = false;
  bool _tickInFlight = false;

  SyncStatus _status = SyncStatus.idle;
  bool _online = false;
  int _pending = 0;
  DateTime? _lastSyncAt;
  String? _lastError;

  SyncStatus get status => _status;
  bool get online => _online;
  int get pending => _pending;
  DateTime? get lastSyncAt => _lastSyncAt;
  String? get lastError => _lastError;

  /// Callbacks run after a successful reconnect+drain, so providers can pull
  /// fresh server data. Register with [onSynced]; returns a disposer.
  final List<Future<void> Function()> _afterSync = [];
  VoidCallback onSynced(Future<void> Function() cb) {
    _afterSync.add(cb);
    return () => _afterSync.remove(cb);
  }

  void start() {
    if (_running) return;
    _running = true;
    _connSub = Connectivity().onConnectivityChanged.listen((_) {
      // Network state flipped (wake-from-sleep, WiFi rejoin). Probe now.
      _tick();
    });
    _scheduleNext(immediate: true);
  }

  void stop() {
    _running = false;
    _timer?.cancel();
    _timer = null;
    _connSub?.cancel();
    _connSub = null;
  }

  /// Force a sync attempt right now (e.g. a manual "Sync" button).
  Future<void> syncNow() => _tick();

  void _scheduleNext({bool immediate = false}) {
    if (!_running) return;
    _timer?.cancel();
    if (immediate) {
      _tick();
      return;
    }
    // Stay in active cadence whenever there's something to push or we're down.
    final interval =
        (_pending > 0 || !_online) ? activeInterval : idleInterval;
    _timer = Timer(interval, _tick);
  }

  Future<void> _tick() async {
    if (!_running || _tickInFlight) return;
    _tickInFlight = true;
    try {
      _pending = await _offline.getPendingCount();

      final reachable = await _reach.check();
      if (reachable != _online) {
        _online = reachable;
        notifyListeners();
      }

      if (!reachable) {
        _setStatus(SyncStatus.offline);
        return;
      }

      if (_pending > 0) {
        _setStatus(SyncStatus.syncing);
        try {
          await _offline.syncAll();
          _pending = await _offline.getPendingCount();
          _lastSyncAt = DateTime.now();
          _lastError = null;
          for (final cb in List.of(_afterSync)) {
            try {
              await cb();
            } catch (_) {/* a failed pull shouldn't break the loop */}
          }
        } catch (e) {
          _lastError = e.toString();
        }
      } else {
        _lastSyncAt ??= DateTime.now();
      }

      _setStatus(SyncStatus.idle);
    } finally {
      _tickInFlight = false;
      _scheduleNext();
    }
  }

  void _setStatus(SyncStatus s) {
    if (_status == s) return;
    _status = s;
    notifyListeners();
  }

  @override
  void dispose() {
    stop();
    super.dispose();
  }
}
