import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String _baseUrl = 'http://localhost:3000/api/v1';
  static const _storage = FlutterSecureStorage();

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

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? queryParams}) async {
    var uri = Uri.parse('$_baseUrl$path');
    if (queryParams != null) {
      uri = uri.replace(queryParameters: queryParams);
    }

    final response = await http.get(uri, headers: await _headers);
    final result = await _handleResponse(response);
    if (result['retry'] == true) {
      final retryResponse = await http.get(uri, headers: await _headers);
      return _handleResponse(retryResponse);
    }
    return result;
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
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
  }

  Future<Map<String, dynamic>> patch(String path, Map<String, dynamic> body) async {
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
