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

  void loadDemo() {
    final now = DateTime.now();
    final data = [
      {'id': 's1', 'sampleId': 'NSR-A1B2C3-XY12', 'sampleType': 'Blood', 'status': 'completed', 'diseaseProgram': 'Malaria', 'quantity': 2, 'village': 'Waterloo', 'patientAge': 34, 'patientGender': 'Female', 'facility': {'name': 'Freetown Central Hospital'}, 'createdAt': now.subtract(const Duration(days: 2)).toIso8601String()},
      {'id': 's2', 'sampleId': 'NSR-D4E5F6-ZW34', 'sampleType': 'Sputum', 'status': 'in_transit', 'diseaseProgram': 'TB', 'quantity': 1, 'village': 'Kissy', 'patientAge': 52, 'patientGender': 'Male', 'facility': {'name': 'Bo Government Hospital'}, 'createdAt': now.subtract(const Duration(hours: 6)).toIso8601String()},
      {'id': 's3', 'sampleId': 'NSR-G7H8I9-PQ56', 'sampleType': 'Blood', 'status': 'hub_received', 'diseaseProgram': 'HIV', 'quantity': 3, 'village': 'Makeni', 'patientAge': 28, 'patientGender': 'Female', 'facility': {'name': 'Makeni Regional Hospital'}, 'createdAt': now.subtract(const Duration(hours: 10)).toIso8601String()},
      {'id': 's4', 'sampleId': 'NSR-J1K2L3-RS78', 'sampleType': 'Stool', 'status': 'collected', 'diseaseProgram': 'Cholera', 'quantity': 1, 'village': 'Kenema', 'patientAge': 7, 'patientGender': 'Male', 'facility': {'name': 'Kenema Government Hospital'}, 'createdAt': now.subtract(const Duration(hours: 1)).toIso8601String()},
      {'id': 's5', 'sampleId': 'NSR-M4N5O6-TU90', 'sampleType': 'Blood', 'status': 'lost', 'diseaseProgram': 'Malaria', 'quantity': 2, 'village': 'Port Loko', 'patientAge': 45, 'patientGender': 'Female', 'facility': {'name': 'Freetown Central Hospital'}, 'createdAt': now.subtract(const Duration(days: 1)).toIso8601String()},
    ];
    _samples = data.map((j) => SampleModel.fromJson(j)).toList();
    _error = null;
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

  /// Scan-to-advance: sends the scanned sampleId (+ GPS) to the role-aware
  /// backend, which moves the sample to its next stage and logs the location.
  /// Returns the server's {sample, previousStatus, newStatus, message} or null.
  Future<Map<String, dynamic>?> scanAdvance(
    String sampleId, {
    double? latitude,
    double? longitude,
    String action = 'advance',
    String? notes,
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      final body = <String, dynamic>{'sampleId': sampleId, 'action': action};
      if (latitude != null) body['latitude'] = latitude;
      if (longitude != null) body['longitude'] = longitude;
      if (notes != null) body['notes'] = notes;

      final data = await _api.post('/samples/scan', body);
      if (data['sample'] != null) {
        _selectedSample = SampleModel.fromJson(data['sample']);
      }
      _error = null;
      _isLoading = false;
      notifyListeners();
      return data;
    } catch (e) {
      // Surface the backend's reason (e.g. wrong role / terminal state).
      _error = e is ApiException ? e.message : 'Scan failed';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  /// Scan a box QR (BOX-...) → bulk-advance every sample inside (role-aware,
  /// GPS-logged). Returns {batchId, advanced, skipped, message, batch:{samples}}.
  Future<Map<String, dynamic>?> scanBatch(
    String batchId, {
    double? latitude,
    double? longitude,
    String action = 'advance',
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      final body = <String, dynamic>{'batchId': batchId, 'action': action};
      if (latitude != null) body['latitude'] = latitude;
      if (longitude != null) body['longitude'] = longitude;

      final data = await _api.post('/batches/scan', body);
      _error = null;
      _isLoading = false;
      notifyListeners();
      return data;
    } catch (e) {
      _error = e is ApiException ? e.message : 'Box scan failed';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  /// Look up a box manifest without changing anything.
  Future<Map<String, dynamic>?> scanBatchManifest(String batchId) async {
    try {
      return await _api.get('/batches/scan/$batchId');
    } catch (e) {
      _error = e is ApiException ? e.message : 'Box not found';
      notifyListeners();
      return null;
    }
  }

  /// Existing batches/boxes, so a sample can be collected straight into one.
  Future<List<Map<String, dynamic>>> fetchBatches() async {
    try {
      final data = await _api.get('/batches');
      final list = (data['data'] as List?) ?? const [];
      return list.cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  /// Create a new (initially empty) batch and return its uuid, so the just-
  /// collected sample can be dropped into it.
  Future<String?> createBatch({String? facilityId, String? notes}) async {
    try {
      final body = <String, dynamic>{'sampleIds': <String>[]};
      if (facilityId != null && facilityId.isNotEmpty) body['facilityId'] = facilityId;
      if (notes != null && notes.trim().isNotEmpty) body['notes'] = notes.trim();
      final data = await _api.post('/batches', body);
      return data['id'] as String?;
    } catch (e) {
      _error = e is ApiException ? e.message : 'Failed to create batch';
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
