import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

/// Return parcels (letters/supplies the rider brings back from the center).
/// Mirrors SampleProvider: list, register, scan-to-advance, look-up.
class ParcelProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  AuthProvider? _auth;

  List<Map<String, dynamic>> _parcels = [];
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get parcels => _parcels;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
  }

  Future<void> loadParcels({String? status}) async {
    _isLoading = true;
    notifyListeners();
    try {
      final params = <String, String>{};
      if (status != null) params['status'] = status;
      final data =
          await _api.get('/parcels', queryParams: params.isEmpty ? null : params);
      _parcels = ((data['data'] as List?) ?? const [])
          .cast<Map<String, dynamic>>();
      _error = null;
    } catch (e) {
      _error = e is ApiException ? e.message : 'Failed to load parcels';
    }
    _isLoading = false;
    notifyListeners();
  }

  /// Register a return parcel at the center. Returns the created parcel or null.
  Future<Map<String, dynamic>?> createParcel(Map<String, dynamic> body) async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _api.post('/parcels', body);
      _error = null;
      _isLoading = false;
      notifyListeners();
      await loadParcels();
      return data;
    } catch (e) {
      _error = e is ApiException ? e.message : 'Failed to register parcel';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  /// Scan-to-advance a parcel (PCL-...). Returns the server's
  /// {parcel, previousStatus, newStatus, message} or null.
  Future<Map<String, dynamic>?> scanAdvance(
    String parcelId, {
    double? latitude,
    double? longitude,
    String action = 'advance',
    String? notes,
  }) async {
    try {
      final body = <String, dynamic>{'parcelId': parcelId, 'action': action};
      if (latitude != null) body['latitude'] = latitude;
      if (longitude != null) body['longitude'] = longitude;
      if (notes != null) body['notes'] = notes;
      final data = await _api.post('/parcels/scan', body);
      _error = null;
      return data;
    } catch (e) {
      _error = e is ApiException ? e.message : 'Parcel scan failed';
      notifyListeners();
      return null;
    }
  }

  /// Read-only look-up by parcelId (QR), no state change.
  Future<Map<String, dynamic>?> lookupParcel(String parcelId) async {
    try {
      return await _api.get('/parcels/scan/$parcelId');
    } catch (e) {
      _error = e is ApiException ? e.message : 'Parcel not found';
      notifyListeners();
      return null;
    }
  }

  bool get canRegister {
    final role = _auth?.role;
    return role == 'hub_officer' || role == 'lab_officer' || role == 'admin';
  }
}
