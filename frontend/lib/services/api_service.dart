import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'offline_store.dart';
import 'offline_queue.dart';
import 'offline_sync_service.dart';

class ApiService {
  /// Backend API root. Override at build time with
  /// `--dart-define=API_BASE=https://...` for a deployed/cloud backend.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://localhost:3000/api/v1',
  );
  static const String _baseUrl = baseUrl;
  static const _storage = FlutterSecureStorage();

  // Offline support. These are thin wrappers over the (singleton) shared-prefs
  // store, so it's fine that every `ApiService()` makes its own.
  final OfflineStore _cache = OfflineStore();
  late final OfflineQueue _queue = OfflineQueue(OfflineSyncService(this));

  String? _accessToken;
  String? _refreshToken;

  Future<Map<String, String>> get _headers async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (_accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }
    return headers;
  }

  Future<void> setTokens(String accessToken, String refreshToken) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<void> loadTokens() async {
    _accessToken = await _storage.read(key: 'access_token');
    _refreshToken = await _storage.read(key: 'refresh_token');
  }

  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
    await _storage.deleteAll();
    // Don't leak one user's cached lists to the next sign-in.
    await _cache.clear();
  }

  bool get isAuthenticated => _accessToken != null;

  Future<Map<String, dynamic>> _handleResponse(http.Response response) async {
    final body = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body is Map<String, dynamic> ? body : {'data': body};
    }

    if (response.statusCode == 401 && _refreshToken != null) {
      final refreshed = await _refreshAccessToken();
      if (refreshed) {
        return {'retry': true};
      }
    }

    throw ApiException(
      statusCode: response.statusCode,
      message: body['message'] ?? 'Request failed',
    );
  }

  Future<bool> _refreshAccessToken() async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/refresh'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_refreshToken',
        },
        body: jsonEncode({'refreshToken': _refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await setTokens(data['accessToken'], data['refreshToken']);
        return true;
      }
    } catch (_) {}
    return false;
  }

  /// True when [e] means "the server was unreachable" (no internet, DNS/socket
  /// failure, timeout) as opposed to the server answering with an error status.
  static bool _isOffline(Object e) =>
      e is SocketException ||
      e is TimeoutException ||
      e is http.ClientException;

  /// Number of writes waiting to be replayed when connectivity returns.
  Future<int> pendingSyncCount() => _queue.pendingCount();

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? queryParams}) async {
    var uri = Uri.parse('$_baseUrl$path');
    if (queryParams != null) {
      uri = uri.replace(queryParameters: queryParams);
    }
    final cacheKey = uri.toString().replaceFirst(_baseUrl, '');

    try {
      final response = await http.get(uri, headers: await _headers);
      var result = await _handleResponse(response);
      if (result['retry'] == true) {
        final retryResponse = await http.get(uri, headers: await _headers);
        result = await _handleResponse(retryResponse);
      }
      // Cache the last good payload so this screen can render offline later.
      await _cache.put(cacheKey, result);
      return result;
    } catch (e) {
      // Offline → serve the last cached copy if we have one.
      if (_isOffline(e)) {
        final cached = await _cache.get(cacheKey);
        if (cached != null) {
          return {...cached, 'fromCache': true};
        }
      }
      rethrow;
    }
  }

  /// [queueIfOffline] is set false when the SyncEngine is *replaying* the
  /// outbox, so a transient failure during replay doesn't re-enqueue the item.
  Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body, {
    bool queueIfOffline = true,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl$path'),
        headers: await _headers,
        body: jsonEncode(body),
      );
      final result = await _handleResponse(response);
      if (result['retry'] == true) {
        final retryResponse = await http.post(
          Uri.parse('$_baseUrl$path'),
          headers: await _headers,
          body: jsonEncode(body),
        );
        return _handleResponse(retryResponse);
      }
      return result;
    } catch (e) {
      if (queueIfOffline && _isOffline(e) && _queue.shouldQueue('POST', path)) {
        return _queue.enqueue('POST', path, body);
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> patch(
    String path,
    Map<String, dynamic> body, {
    bool queueIfOffline = true,
  }) async {
    try {
      final response = await http.patch(
        Uri.parse('$_baseUrl$path'),
        headers: await _headers,
        body: jsonEncode(body),
      );
      final result = await _handleResponse(response);
      if (result['retry'] == true) {
        final retryResponse = await http.patch(
          Uri.parse('$_baseUrl$path'),
          headers: await _headers,
          body: jsonEncode(body),
        );
        return _handleResponse(retryResponse);
      }
      return result;
    } catch (e) {
      if (queueIfOffline && _isOffline(e) && _queue.shouldQueue('PATCH', path)) {
        return _queue.enqueue('PATCH', path, body);
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> delete(String path) async {
    final response = await http.delete(
      Uri.parse('$_baseUrl$path'),
      headers: await _headers,
    );
    return _handleResponse(response);
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException({required this.statusCode, required this.message});

  @override
  String toString() => 'ApiException($statusCode): $message';
}
