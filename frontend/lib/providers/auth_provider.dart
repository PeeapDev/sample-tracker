import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  UserModel? _user;
  bool _isLoading = false;
  String? _error;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  String get role => _user?.role ?? '';

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

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout', {});
    } catch (_) {}
    await _api.clearTokens();
    _user = null;
    notifyListeners();
  }

  Future<void> _loadUser() async {
    try {
      final data = await _api.get('/users/me');
      _user = UserModel.fromJson(data);
      notifyListeners();
    } catch (_) {
      await _api.clearTokens();
    }
  }
}
