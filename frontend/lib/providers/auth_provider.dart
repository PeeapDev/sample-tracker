import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  UserModel? _user;
  bool _isLoading = false;
  String? _error;
  Set<String> _permissions = {};

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  String get role => _user?.role ?? '';

  /// True if the current user's role is granted [permission] in the RBAC matrix.
  /// Admin always has everything (mirrors the backend).
  bool can(String permission) =>
      role == 'admin' || _permissions.contains(permission);

  /// Default role → permission map — mirrors the backend's DEFAULT_MATRIX. Used
  /// for demo accounts and as an offline fallback before the server matrix loads.
  static const Map<String, List<String>> _defaultMatrix = {
    'collector': ['dashboard.view', 'samples.view', 'samples.manage', 'samples.scan', 'batches.manage'],
    'dispatcher': ['dashboard.view', 'samples.view', 'samples.scan', 'dispatches.view', 'dispatches.manage'],
    'hub_officer': ['dashboard.view', 'samples.view', 'samples.scan', 'batches.manage', 'dispatches.view'],
    'lab_officer': ['dashboard.view', 'samples.view', 'samples.scan', 'batches.manage'],
  };

  /// Fetch the authoritative RBAC matrix and keep this user's permissions.
  /// Falls back to the default matrix if the request fails (e.g. offline).
  Future<void> _loadPermissions() async {
    final fallback = _defaultMatrix[role]?.toSet() ?? <String>{};
    try {
      final data = await _api.get('/permissions');
      final matrix = data['matrix'] as Map<String, dynamic>?;
      final mine = matrix?[role];
      _permissions = mine is List ? mine.map((e) => e.toString()).toSet() : fallback;
    } catch (_) {
      _permissions = fallback;
    }
  }

  Future<void> init() async {
    await _api.loadTokens();
    if (_api.isAuthenticated) {
      await _loadUser();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _api.post('/auth/login', {
        'email': email,
        'password': password,
      });

      await _api.setTokens(data['accessToken'], data['refreshToken']);
      _user = UserModel.fromJson(data['user']);
      await _loadPermissions();
      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Connection failed. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> pinLogin(String userId, String pin) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _api.post('/auth/pin-login', {
        'userId': userId,
        'pin': pin,
      });

      await _api.setTokens(data['accessToken'], data['refreshToken']);
      _user = UserModel.fromJson(data['user']);
      await _loadPermissions();
      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Connection failed. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void demoLogin(String role) {
    final names = {
      'admin': ['System', 'Administrator'],
      'collector': ['Aminata', 'Kamara'],
      'dispatcher': ['Mohamed', 'Sesay'],
      'hub_officer': ['Fatmata', 'Bangura'],
      'lab_officer': ['Ibrahim', 'Koroma'],
    };
    final name = names[role] ?? ['Demo', 'User'];
    _user = UserModel(
      id: 'demo-$role',
      email: '$role@nsrtms.gov.sl',
      phone: '+232-76-100000',
      firstName: name[0],
      lastName: name[1],
      role: role,
      facility: {'name': 'Freetown Central Hospital'},
    );
    _permissions = _defaultMatrix[role]?.toSet() ?? <String>{};
    _error = null;
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout', {});
    } catch (_) {}
    await _api.clearTokens();
    _user = null;
    _permissions = {};
    notifyListeners();
  }

  Future<void> _loadUser() async {
    try {
      final data = await _api.get('/users/me');
      _user = UserModel.fromJson(data);
      await _loadPermissions();
      notifyListeners();
    } catch (_) {
      await _api.clearTokens();
    }
  }
}
