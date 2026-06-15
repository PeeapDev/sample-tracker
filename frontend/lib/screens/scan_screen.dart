import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../providers/sample_provider.dart';
import '../providers/auth_provider.dart';
import 'sample_detail_screen.dart';

/// Scan-to-advance screen. A scan (camera or manual) sends the sample to the
/// role-aware backend, which moves it to its next stage and logs GPS + time.
class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key, this.acceptMode = false});

  /// Launched from the "Accept" action: open straight into the camera and frame
  /// the flow as accepting/receiving a sample at this centre. The underlying
  /// scan-to-advance is identical — for a receiving officer it lands the sample
  /// in its "received" state and confirms the location.
  final bool acceptMode;

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final _manualController = TextEditingController();
  bool _cameraMode = false;
  bool _processing = false;
  String? _lastCode; // de-dupe rapid repeat detections

  @override
  void initState() {
    super.initState();
    // Accept = scan to receive: jump straight to the camera.
    _cameraMode = widget.acceptMode;
  }

  /// Roles that can scan-to-advance. Everyone else (e.g. collectors) can still
  /// scan, but only to look a sample up — they can't move it to the next stage.
  bool get _canAdvance {
    final role = context.read<AuthProvider>().role;
    return role == 'dispatcher' ||
        role == 'hub_officer' ||
        role == 'lab_officer' ||
        role == 'admin';
  }

  @override
  void dispose() {
    _manualController.dispose();
    super.dispose();
  }

  /// Look-up-only path for roles that can't advance: scan/enter a code, open
  /// the sample's details. Nothing changes server-side.
  Future<void> _lookupCode(String rawCode) async {
    final code = rawCode.trim();
    if (code.isEmpty || _processing) return;
    setState(() => _processing = true);

    final provider = context.read<SampleProvider>();
    final sample = await provider.scanSample(code);

    if (!mounted) return;
    setState(() => _processing = false);

    if (sample != null) {
      _manualController.clear();
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SampleDetailScreen(sampleId: sample.id),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Sample not found.'),
          backgroundColor: Colors.red.shade700,
        ),
      );
      _lastCode = null; // allow retry of the same code after an error
    }
  }

  /// Best-effort GPS — returns null if unavailable or denied (scan still works).
  Future<Position?> _currentPosition() async {
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        return null;
      }
      return await Geolocator.getCurrentPosition();
    } catch (_) {
      return null;
    }
  }

  Future<void> _handleCode(String rawCode) async {
    final code = rawCode.trim();
    if (code.isEmpty || _processing) return;

    // Collectors (and any non-advancing role) can only view, not advance.
    if (!_canAdvance) return _lookupCode(code);

    setState(() => _processing = true);

    final provider = context.read<SampleProvider>();
    final pos = await _currentPosition();

    // A BOX- code is a package/batch: advance every sample inside and show the
    // manifest. Anything else is an individual sample QR.
    if (code.toUpperCase().startsWith('BOX-')) {
      final batchResult = await provider.scanBatch(
        code,
        latitude: pos?.latitude,
        longitude: pos?.longitude,
      );
      if (!mounted) return;
      setState(() => _processing = false);
      if (batchResult != null) {
        _manualController.clear();
        _showBatchManifest(batchResult);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.error ?? 'Box scan failed.'),
            backgroundColor: Colors.red.shade700,
          ),
        );
        _lastCode = null;
      }
      return;
    }

    final result = await provider.scanAdvance(
      code,
      latitude: pos?.latitude,
      longitude: pos?.longitude,
    );

    if (!mounted) return;
    setState(() => _processing = false);

    if (result != null) {
      _showScanResult(result, pos);
      _manualController.clear();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Scan failed.'),
          backgroundColor: Colors.red.shade700,
        ),
      );
      // allow the same code to be retried after an error
      _lastCode = null;
    }
  }

  /// After a successful scan, show what changed plus where the sample now is:
  /// the hospital that just received it (the scanner's facility) and the GPS
  /// captured at the moment of the scan.
  void _showScanResult(Map<String, dynamic> result, Position? pos) {
    final sample = result['sample'] as Map<String, dynamic>?;
    final sampleId = sample?['id']?.toString();
    final code = sample?['sampleId']?.toString() ?? '';
    final newStatus = (result['newStatus']?.toString() ??
            sample?['status']?.toString() ??
            '')
        .replaceAll('_', ' ');
    final msg = result['message']?.toString() ?? 'Sample advanced.';
    final hospital = (context.read<AuthProvider>().user?.facility?['name'] ??
        sample?['facility']?['name']) as String?;

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green.shade600),
            const SizedBox(width: 8),
            Expanded(
              child: Text(code.isEmpty ? 'Scanned' : code,
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 16)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(msg),
            const SizedBox(height: 12),
            _resultRow(Icons.flag, 'Status', newStatus.isEmpty ? '—' : newStatus),
            _resultRow(Icons.location_city, 'Currently at', hospital ?? 'Unknown'),
            _resultRow(
              Icons.place,
              'Location',
              pos != null
                  ? '${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}'
                  : 'Not available',
            ),
          ],
        ),
        actions: [
          if (sampleId != null)
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => SampleDetailScreen(sampleId: sampleId),
                  ),
                );
              },
              child: const Text('View details'),
            ),
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  Widget _resultRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          SizedBox(
            width: 90,
            child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          ),
        ],
      ),
    );
  }

  /// Shows the box manifest — every sample inside, with the advance summary.
  void _showBatchManifest(Map<String, dynamic> result) {
    final batch = result['batch'] as Map<String, dynamic>?;
    final samples = (batch?['samples'] as List?) ?? const [];
    final message = result['message']?.toString() ?? '';
    final skipped = (result['skipped'] as List?) ?? const [];

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.inventory_2_outlined),
            const SizedBox(width: 8),
            Expanded(child: Text(result['batchId']?.toString() ?? 'Box')),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (message.isNotEmpty)
                Text(message,
                    style: const TextStyle(fontWeight: FontWeight.bold)),
              if (skipped.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text('Skipped ${skipped.length} (not scannable here)',
                      style: TextStyle(
                          fontSize: 12, color: Colors.orange.shade700)),
                ),
              const Divider(),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: samples.length,
                  itemBuilder: (_, i) {
                    final s = samples[i] as Map<String, dynamic>;
                    return ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      title: Text(s['sampleId']?.toString() ?? '',
                          style: const TextStyle(
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w600)),
                      subtitle: Text(
                          '${s['sampleType'] ?? ''} · ${s['diseaseProgram'] ?? ''}'),
                      trailing: Text(
                          (s['status']?.toString() ?? '').replaceAll('_', ' ')),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.acceptMode ? 'Accept Sample' : 'Scan Sample'),
        actions: [
          IconButton(
            tooltip: _cameraMode ? 'Manual entry' : 'Use camera',
            icon: Icon(_cameraMode ? Icons.keyboard : Icons.camera_alt),
            onPressed: () => setState(() => _cameraMode = !_cameraMode),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              !_canAdvance
                  ? 'Scan a sample QR to view its details and current status'
                  : widget.acceptMode
                      ? 'Scan the sample — or a box (BOX-…) — to accept it here. '
                          'Its arrival at this centre is confirmed and all parties are notified.'
                      : 'Scan a sample QR to advance it — or a box (BOX-…) to advance the whole package',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: _cameraMode ? _buildCamera(theme) : _buildManual(theme),
            ),
            if (_processing)
              const Padding(
                padding: EdgeInsets.only(top: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    SizedBox(width: 12),
                    Text('Processing scan…'),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCamera(ThemeData theme) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(
            onDetect: (capture) {
              final barcodes = capture.barcodes;
              if (barcodes.isEmpty) return;
              final code = barcodes.first.rawValue;
              if (code == null || code == _lastCode) return;
              _lastCode = code;
              _handleCode(code);
            },
            // On mobile web the camera fails if permission is denied or the page
            // isn't served over HTTPS — show why and let them switch to manual.
            errorBuilder: (context, error, child) => _buildCameraError(error),
          ),
          // viewfinder frame
          Center(
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white70, width: 3),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Friendly fallback when the camera can't start (denied permission, no
  /// camera, or an insecure-context browser). Common on phones using the web app.
  Widget _buildCameraError(MobileScannerException error) {
    return Container(
      color: Colors.black87,
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.no_photography, color: Colors.white70, size: 56),
            const SizedBox(height: 16),
            const Text(
              "Couldn't start the camera",
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            const Text(
              'Allow camera access for this site. On a phone the page must be '
              'opened over HTTPS for the camera to work.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () => setState(() => _cameraMode = false),
              icon: const Icon(Icons.keyboard),
              label: const Text('Enter ID manually'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildManual(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 140,
            height: 140,
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Icon(Icons.qr_code_2,
                size: 72, color: theme.colorScheme.onPrimaryContainer),
          ),
          const SizedBox(height: 28),
          TextField(
            controller: _manualController,
            textInputAction: TextInputAction.go,
            decoration: const InputDecoration(
              labelText: 'Sample ID',
              hintText: 'e.g., NSR-ABC123-XY12',
              prefixIcon: Icon(Icons.qr_code),
              border: OutlineInputBorder(),
            ),
            onSubmitted: _handleCode,
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: _processing
                ? null
                : () => _handleCode(_manualController.text),
            icon: Icon(_canAdvance ? Icons.bolt : Icons.search),
            label: Text(_canAdvance ? 'Scan & Advance' : 'Look up sample'),
            style: FilledButton.styleFrom(
              padding:
                  const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            ),
          ),
          // For advancing roles, offer a read-only look-up too. Non-advancing
          // roles already look up by default, so this would be redundant.
          if (_canAdvance) ...[
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: _processing
                  ? null
                  : () => _lookupCode(_manualController.text),
              icon: const Icon(Icons.search),
              label: const Text('Just look up (no change)'),
            ),
          ],
        ],
      ),
    );
  }
}
