import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

class DispatchProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  AuthProvider? _auth;
  List<DispatchModel> _dispatches = [];
  DispatchModel? _selectedDispatch;
  List<SampleModel> _dispatchSamples = [];
  List<dynamic> _riderStats = [];
  bool _isLoading = false;
  String? _error;

  List<DispatchModel> get dispatches => _dispatches;
  DispatchModel? get selectedDispatch => _selectedDispatch;
  List<SampleModel> get dispatchSamples => _dispatchSamples;
  List<dynamic> get riderStats => _riderStats;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
  }

  Future<void> loadDispatches({String? status, String? riderId}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final params = <String, String>{};
      if (status != null) params['status'] = status;
      if (riderId != null) params['riderId'] = riderId;

      final data = await _api.get('/dispatches', queryParams: params.isNotEmpty ? params : null);
      _dispatches = (data['data'] as List)
          .map((j) => DispatchModel.fromJson(j))
          .toList();
      _error = null;
    } catch (e) {
      _error = 'Failed to load dispatches';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadDispatch(String id) async {
    try {
      final data = await _api.get('/dispatches/$id');
      _selectedDispatch = DispatchModel.fromJson(data);
      notifyListeners();
    } catch (e) {
      _error = 'Failed to load dispatch';
    }
  }

  Future<bool> createDispatch(Map<String, dynamic> dispatchData) async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await _api.post('/dispatches', dispatchData);
      _selectedDispatch = DispatchModel.fromJson(data);
      _error = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to create dispatch';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateStatus(String id, String status) async {
    try {
      final data = await _api.patch('/dispatches/$id/status', {'status': status});
      _selectedDispatch = DispatchModel.fromJson(data);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to update dispatch';
      notifyListeners();
      return false;
    }
  }

  Future<void> loadDispatchSamples(String id) async {
    try {
      final data = await _api.get('/dispatches/$id/samples');
      _dispatchSamples = (data['data'] as List? ?? [])
          .map((j) => SampleModel.fromJson(j))
          .toList();
      notifyListeners();
    } catch (e) {
      _error = 'Failed to load samples';
    }
  }

  Future<void> loadRiderStats() async {
    try {
      final data = await _api.get('/dispatches/rider-stats');
      _riderStats = data['data'] ?? [];
      notifyListeners();
    } catch (_) {}
  }
}
