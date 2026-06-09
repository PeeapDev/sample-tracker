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
