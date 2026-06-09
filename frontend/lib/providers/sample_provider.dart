import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

class SampleProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  AuthProvider? _auth;
  List<SampleModel> _samples = [];
  SampleModel? _selectedSample;
  List<EventLogModel> _timeline = [];
  Map<String, dynamic>? _stats;
  bool _isLoading = false;
  String? _error;

  List<SampleModel> get samples => _samples;
  SampleModel? get selectedSample => _selectedSample;
  List<EventLogModel> get timeline => _timeline;
  Map<String, dynamic>? get stats => _stats;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
  }

  Future<void> loadSamples({String? status, String? facilityId}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final params = <String, String>{};
      if (status != null) params['status'] = status;
      if (facilityId != null) params['facilityId'] = facilityId;

      final data = await _api.get('/samples', queryParams: params.isNotEmpty ? params : null);
      _samples = (data['data'] as List)
          .map((j) => SampleModel.fromJson(j))
          .toList();
      _error = null;
    } catch (e) {
      _error = 'Failed to load samples';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadSample(String id) async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await _api.get('/samples/$id');
      _selectedSample = SampleModel.fromJson(data);
      _error = null;
    } catch (e) {
      _error = 'Failed to load sample';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<SampleModel?> scanSample(String sampleId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await _api.get('/samples/scan/$sampleId');
      _selectedSample = SampleModel.fromJson(data);
      _error = null;
      _isLoading = false;
      notifyListeners();
      return _selectedSample;
    } catch (e) {
      _error = 'Sample not found';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> createSample(Map<String, dynamic> sampleData) async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await _api.post('/samples', sampleData);
      final sample = SampleModel.fromJson(data);
      _samples.insert(0, sample);
      _error = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to create sample';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateStatus(String id, String status, {String? dispatcherId, String? dispatchId, String? pin}) async {
    try {
      final body = <String, dynamic>{'status': status};
      if (dispatcherId != null) body['dispatcherId'] = dispatcherId;
      if (dispatchId != null) body['dispatchId'] = dispatchId;
      if (pin != null) body['pin'] = pin;

      final data = await _api.patch('/samples/$id/status', body);
      _selectedSample = SampleModel.fromJson(data);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to update status';
      notifyListeners();
      return false;
    }
  }

  Future<void> loadTimeline(String id) async {
    try {
      final data = await _api.get('/samples/$id/timeline');
      _timeline = (data['data'] as List? ?? [])
          .map((j) => EventLogModel.fromJson(j))
          .toList();
      notifyListeners();
    } catch (e) {
      _error = 'Failed to load timeline';
    }
  }

  Future<void> loadStats() async {
    try {
      _stats = await _api.get('/samples/stats');
      notifyListeners();
    } catch (_) {}
  }

  Future<bool> markLost(String id, String notes) async {
    try {
      final data = await _api.patch('/samples/$id/lost', {'notes': notes});
      _selectedSample = SampleModel.fromJson(data);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to mark as lost';
      notifyListeners();
      return false;
    }
  }
}
