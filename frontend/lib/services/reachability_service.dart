import 'dart:async';
import 'package:http/http.dart' as http;

/// Detects whether the backend is *actually* reachable right now.
///
/// `connectivity_plus` only tells us whether a network interface exists — a
/// laptop on captive-portal WiFi or a dead hotspot reports "connected" while
/// having no real internet. This probe sends the cheapest possible request to
/// the API and treats *any* HTTP response (even a 404) as proof the server is
/// reachable; only a timeout or socket error counts as offline.
class ReachabilityService {
  ReachabilityService({
    required this.baseUrl,
    this.timeout = const Duration(seconds: 4),
  });

  /// e.g. http://localhost:3000/api/v1
  final String baseUrl;
  final Duration timeout;

  /// Returns true if the API server answered at all within [timeout].
  Future<bool> check() async {
    final uri = Uri.parse('$baseUrl/health');
    try {
      // HEAD is the lightest verb; if the server rejects HEAD we still got a
      // response, which is all we need to know it's reachable.
      final res = await http.head(uri).timeout(timeout);
      // Any status code means the TCP/TLS round-trip succeeded.
      return res.statusCode > 0;
    } on TimeoutException {
      return false;
    } catch (_) {
      // SocketException / connection refused / DNS failure => no internet.
      return false;
    }
  }
}
