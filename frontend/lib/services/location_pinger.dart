import 'dart:async';
import 'package:geolocator/geolocator.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';

/// Periodically reports the rider's GPS to the backend so the web console's
/// live map can show where they are right now. Honors "only on an active
/// dispatch": each tick it checks whether the signed-in dispatcher has a live
/// trip and stays quiet otherwise. Best-effort — a failed ping just drops one
/// point off the map.
class LocationPinger {
  LocationPinger({required this.auth, Duration? interval})
      : _interval = interval ?? const Duration(seconds: 20);

  final AuthProvider auth;
  final ApiService _api = ApiService();
  final Duration _interval;

  Timer? _timer;
  bool _busy = false;

  void start() {
    _timer ??= Timer.periodic(_interval, (_) => _tick());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  static const _activeStatuses = {'assigned', 'picked_up', 'in_transit'};

  Future<void> _tick() async {
    if (_busy) return;
    final user = auth.user;
    // Only signed-in riders (dispatchers) broadcast.
    if (user == null || auth.role != 'dispatcher') return;
    _busy = true;
    try {
      final dispatchId = await _activeDispatchId(user.id);
      if (dispatchId == null) return; // not on a trip → stay quiet
      final pos = await _position();
      if (pos == null) return;
      await _api.post('/tracking/ping', {
        'latitude': pos.latitude,
        'longitude': pos.longitude,
        'accuracy': pos.accuracy,
        'speed': pos.speed,
        'heading': pos.heading,
        'dispatchId': dispatchId,
      });
    } catch (_) {
      // swallow — best-effort telemetry
    } finally {
      _busy = false;
    }
  }

  Future<String?> _activeDispatchId(String riderId) async {
    try {
      final data =
          await _api.get('/dispatches', queryParams: {'riderId': riderId});
      final list = (data['data'] as List?) ?? const [];
      for (final d in list) {
        final m = d as Map<String, dynamic>;
        if (_activeStatuses.contains(m['status'])) {
          return m['id']?.toString();
        }
      }
    } catch (_) {}
    return null;
  }

  Future<Position?> _position() async {
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        return null;
      }
      return await Geolocator.getCurrentPosition();
    } catch (_) {
      return null;
    }
  }
}
