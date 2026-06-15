import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

/// Admin-only management of platform users, backed by `/users`.
///
/// Works against the live backend when signed in with a real admin account.
/// In demo mode it keeps an in-memory list so the screen is fully interactive
/// without a server.
class AdminUsersProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  bool _demo = false;

  List<Map<String, dynamic>> _users = [];
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get users => _users;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isDemo => _demo;

  void updateAuth(AuthProvider auth) {
    _demo = auth.user?.id.startsWith('demo-') == true;
  }

  Future<void> loadUsers() async {
    if (_demo) {
      _loadDemo();
      return;
    }
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await _api.get('/users');
      final list = (data['data'] ?? data['users'] ?? []) as List;
      _users = list.cast<Map<String, dynamic>>();
      _error = null;
    } on ApiException catch (e) {
      _error = e.message;
    } catch (_) {
      _error = 'Failed to load users';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<String?> createUser(Map<String, dynamic> payload) async {
    if (_demo) {
      _users.insert(0, {
        'id': 'demo-${DateTime.now().microsecondsSinceEpoch}',
        ...payload,
        'isActive': true,
        'facility': null,
      }..remove('password'));
      notifyListeners();
      return null;
    }
    try {
      final created = await _api.post('/users', payload);
      _users.insert(0, created);
      notifyListeners();
      return null;
    } on ApiException catch (e) {
      return e.message;
    } catch (_) {
      return 'Failed to create user';
    }
  }

  Future<void> setActive(String id, bool active) async {
    final idx = _users.indexWhere((u) => u['id'] == id);
    if (idx == -1) return;

    if (_demo) {
      _users[idx] = {..._users[idx], 'isActive': active};
      notifyListeners();
      return;
    }
    // Optimistic update.
    final previous = _users[idx]['isActive'];
    _users[idx] = {..._users[idx], 'isActive': active};
    notifyListeners();
    try {
      if (active) {
        await _api.patch('/users/$id/activate', {});
      } else {
        await _api.delete('/users/$id');
      }
    } catch (_) {
      _users[idx] = {..._users[idx], 'isActive': previous};
      notifyListeners();
    }
  }

  void _loadDemo() {
    _users = [
      {
        'id': 'demo-u1',
        'email': 'admin@nsrtms.gov.sl',
        'phone': '+232-76-100001',
        'firstName': 'System',
        'lastName': 'Administrator',
        'role': 'admin',
        'isActive': true,
        'facility': {'name': 'Freetown Central Hospital'},
      },
      {
        'id': 'demo-u2',
        'email': 'collector@nsrtms.gov.sl',
        'phone': '+232-76-100002',
        'firstName': 'Aminata',
        'lastName': 'Kamara',
        'role': 'collector',
        'isActive': true,
        'facility': {'name': 'Freetown Central Hospital'},
      },
      {
        'id': 'demo-u3',
        'email': 'rider@nsrtms.gov.sl',
        'phone': '+232-76-100003',
        'firstName': 'Mohamed',
        'lastName': 'Sesay',
        'role': 'dispatcher',
        'isActive': true,
        'facility': {'name': 'Freetown Regional Hub'},
      },
      {
        'id': 'demo-u4',
        'email': 'hub@nsrtms.gov.sl',
        'phone': '+232-76-100004',
        'firstName': 'Fatmata',
        'lastName': 'Bangura',
        'role': 'hub_officer',
        'isActive': true,
        'facility': {'name': 'Freetown Regional Hub'},
      },
      {
        'id': 'demo-u5',
        'email': 'lab@nsrtms.gov.sl',
        'phone': '+232-76-100005',
        'firstName': 'Ibrahim',
        'lastName': 'Koroma',
        'role': 'lab_officer',
        'isActive': false,
        'facility': {'name': 'Central Public Health Laboratory'},
      },
    ];
    _error = null;
    _isLoading = false;
    notifyListeners();
  }
}
