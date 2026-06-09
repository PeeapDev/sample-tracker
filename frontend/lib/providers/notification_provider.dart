import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

class NotificationProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  AuthProvider? _auth;
  List<NotificationModel> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;

  List<NotificationModel> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
  }

  Future<void> loadNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await _api.get('/notifications');
      _notifications = (data['data'] as List? ?? [])
          .map((j) => NotificationModel.fromJson(j))
          .toList();
    } catch (_) {}

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadUnreadCount() async {
    try {
      final data = await _api.get('/notifications/unread-count');
      _unreadCount = data['count'] ?? 0;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> markAsRead(String id) async {
    try {
      await _api.patch('/notifications/$id/read', {});
      final idx = _notifications.indexWhere((n) => n.id == id);
      if (idx != -1) {
        _notifications[idx] = NotificationModel(
          id: _notifications[idx].id,
          type: _notifications[idx].type,
          title: _notifications[idx].title,
          message: _notifications[idx].message,
          sampleId: _notifications[idx].sampleId,
          dispatchId: _notifications[idx].dispatchId,
          isRead: true,
          createdAt: _notifications[idx].createdAt,
        );
        _unreadCount = (_unreadCount - 1).clamp(0, 999);
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> markAllAsRead() async {
    try {
      await _api.patch('/notifications/read-all', {});
      _notifications = _notifications.map((n) => NotificationModel(
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        sampleId: n.sampleId,
        dispatchId: n.dispatchId,
        isRead: true,
        createdAt: n.createdAt,
      )).toList();
      _unreadCount = 0;
      notifyListeners();
    } catch (_) {}
  }
}
