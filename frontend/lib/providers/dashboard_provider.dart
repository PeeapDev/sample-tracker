import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

class DashboardProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  AuthProvider? _auth;
  DashboardModel? _dashboard;
  Map<String, dynamic>? _operational;
  Map<String, dynamic>? _management;
  List<dynamic> _collectionVolume = [];
  List<dynamic> _statusDistribution = [];
  List<dynamic> _programDistribution = [];
  List<dynamic> _recentActivity = [];
  bool _isLoading = false;
  String? _error;

  DashboardModel? get dashboard => _dashboard;
  Map<String, dynamic>? get operational => _operational;
  Map<String, dynamic>? get management => _management;
  List<dynamic> get collectionVolume => _collectionVolume;
  List<dynamic> get statusDistribution => _statusDistribution;
  List<dynamic> get programDistribution => _programDistribution;
  List<dynamic> get recentActivity => _recentActivity;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
  }

  Future<void> loadFullDashboard() async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await _api.get('/dashboard');
      _dashboard = DashboardModel.fromJson(data);
      _operational = _dashboard!.operational;
      _management = _dashboard!.management;
      _collectionVolume = _dashboard!.collectionVolume;
      _statusDistribution = _dashboard!.statusDistribution;
      _programDistribution = _dashboard!.programDistribution;
      _recentActivity = _dashboard!.recentActivity;
      _error = null;
    } catch (e) {
      _error = 'Failed to load dashboard';
    }

    _isLoading = false;
    notifyListeners();
  }

  void loadDemo() {
    final now = DateTime.now();
    _operational = {
      'totalSamples': 1284,
      'samplesToday': 38,
      'samplesThisWeek': 214,
      'inTransit': 47,
      'delayed': 6,
      'lost': 12,
      'completed': 1156,
      'lostRate': 0.93,
    };
    _management = {
      'totalUsers': 86,
      'totalFacilities': 24,
      'activeDispatches': 9,
      'totalDispatches': 412,
    };
    _statusDistribution = [
      {'status': 'collected', 'count': 32},
      {'status': 'picked_up', 'count': 21},
      {'status': 'hub_received', 'count': 18},
      {'status': 'in_transit', 'count': 26},
      {'status': 'lab_received', 'count': 19},
      {'status': 'completed', 'count': 1156},
      {'status': 'lost', 'count': 12},
    ];
    _programDistribution = [
      {'program': 'HIV', 'count': 412},
      {'program': 'Tuberculosis', 'count': 318},
      {'program': 'Malaria', 'count': 256},
      {'program': 'COVID-19', 'count': 174},
      {'program': 'Hepatitis', 'count': 124},
    ];
    // 14 days of collection volume, trending gently upward with weekly dips.
    const volume = [28, 34, 31, 40, 22, 18, 36, 44, 39, 47, 33, 25, 41, 38];
    _collectionVolume = List.generate(volume.length, (i) {
      final day = now.subtract(Duration(days: volume.length - 1 - i));
      return {
        'date':
            '${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}',
        'count': volume[i],
      };
    });
    _recentActivity = [
      {'sample': {'sampleId': 'NSR-A1B2C3-XY12'}, 'event': 'completed', 'timestamp': now.subtract(const Duration(minutes: 8)).toIso8601String()},
      {'sample': {'sampleId': 'NSR-D4E5F6-ZW34'}, 'event': 'lab_received', 'timestamp': now.subtract(const Duration(minutes: 25)).toIso8601String()},
      {'sample': {'sampleId': 'NSR-G7H8I9-PQ56'}, 'event': 'in_transit', 'timestamp': now.subtract(const Duration(hours: 1)).toIso8601String()},
      {'sample': {'sampleId': 'NSR-J1K2L3-RS78'}, 'event': 'hub_received', 'timestamp': now.subtract(const Duration(hours: 2)).toIso8601String()},
      {'sample': {'sampleId': 'NSR-M4N5O6-TU90'}, 'event': 'picked_up', 'timestamp': now.subtract(const Duration(hours: 3)).toIso8601String()},
    ];
    _error = null;
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadOperationalMetrics() async {
    try {
      _operational = await _api.get('/dashboard/operational');
      notifyListeners();
    } catch (_) {}
  }

  Future<void> loadManagementMetrics() async {
    try {
      _management = await _api.get('/dashboard/management');
      notifyListeners();
    } catch (_) {}
  }
}
