import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../providers/sample_provider.dart';
import '../models/models.dart';
import '../services/label_printer.dart';
import 'batch_detail_screen.dart';

/// Re-batching: sort samples into a new (or existing) batch by scanning. Each
/// scanned/typed code is looked up via GET /samples/scan/:code and added to a
/// pending on-screen list; the user then commits the whole list at once.
///
/// Two modes:
///   • create  — make an empty batch (POST /batches) then add the pending list.
///   • add     — add the pending list to an already-open batch [targetBatchUuid].
/// Both reach POST /batches/:id/samples; the backend keeps each sample's origin
/// facility while moving its batch membership.
class BatchScanScreen extends StatefulWidget {
  const BatchScanScreen({
    super.key,
    this.targetBatchUuid,
    this.targetBatchLabel,
  });

  /// When set, the screen adds to this existing batch instead of creating one.
  final String? targetBatchUuid;
  final String? targetBatchLabel;

  bool get _isAddMode => targetBatchUuid != null;

  @override
  State<BatchScanScreen> createState() => _BatchScanScreenState();
}

class _BatchScanScreenState extends State<BatchScanScreen> {
  final _manualController = TextEditingController();
  final List<SampleModel> _pending = [];
  bool _cameraMode = false;
  bool _processing = false;
  bool _committing = false;
  String? _lastCode; // de-dupe rapid repeat detections

  @override
  void dispose() {
    _manualController.dispose();
    super.dispose();
  }

  /// Look the code up and add it to the pending list (de-duped). Nothing is
  /// committed server-side until the user taps the commit button.
  Future<void> _addCode(String rawCode) async {
    final code = rawCode.trim();
    if (code.isEmpty || _processing) return;

    // De-dupe against what's already staged (match on human code or uuid).
    final already = _pending.any(
      (s) => s.sampleId == code || s.id == code,
    );
    if (already) {
      _manualController.clear();
      _lastCode = null;
      return;
    }

    setState(() => _processing = true);
    final provider = context.read<SampleProvider>();
    final sample = await provider.scanSample(code);

    if (!mounted) return;
    setState(() => _processing = false);

    if (sample != null) {
      setState(() => _pending.add(sample));
      _manualController.clear();
      _lastCode = null; // allow the next (different) code right away
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

  /// Commit the pending list: create a batch then add (create mode), or add to
  /// the open batch (add mode). Shows the added/skipped summary either way.
  Future<void> _commit() async {
    if (_pending.isEmpty || _committing) return;
    setState(() => _committing = true);
    final provider = context.read<SampleProvider>();
    final codes = _pending.map((s) => s.sampleId).toList();

    String? batchUuid = widget.targetBatchUuid;
    if (batchUuid == null) {
      batchUuid = await provider.createBatch();
      if (batchUuid == null) {
        if (!mounted) return;
        setState(() => _committing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.error ?? 'Could not create the batch'),
            backgroundColor: Colors.red.shade700,
          ),
        );
        return;
      }
    }

    final result = await provider.addSamplesToBatch(batchUuid, codes);

    if (!mounted) return;
    setState(() => _committing = false);

    if (result == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Could not sort the samples.'),
          backgroundColor: Colors.red.shade700,
        ),
      );
      return;
    }

    _showResult(result, batchUuid);
  }

  /// Result summary: how many were added/skipped, the option to print the new
  /// batch's labels, and a way out (back to caller / open the batch).
  void _showResult(Map<String, dynamic> result, String batchUuid) {
    final added = (result['added'] as List?) ?? const [];
    final skipped = (result['skipped'] as List?) ?? const [];
    final batch = result['batch'] as Map<String, dynamic>?;
    final batchId = (result['batchId'] ?? batch?['batchId'])?.toString() ?? '';
    final message = result['message']?.toString() ??
        'Sorted ${added.length} sample(s) into the batch.';
    // Build SampleModels from the manifest so the labels are printable.
    final manifest = ((batch?['samples'] as List?) ?? const [])
        .map((j) => SampleModel.fromJson(j as Map<String, dynamic>))
        .toList();

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green.shade600),
            const SizedBox(width: 8),
            Expanded(child: Text(batchId.isEmpty ? 'Batch updated' : batchId)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message),
            const SizedBox(height: 8),
            Text('Added: ${added.length}'),
            if (skipped.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Skipped: ${skipped.length}',
                  style: TextStyle(color: Colors.orange.shade700),
                ),
              ),
          ],
        ),
        actions: [
          if (manifest.isNotEmpty)
            TextButton.icon(
              onPressed: () => LabelPrinter.printSampleLabels(manifest),
              icon: const Icon(Icons.print_outlined),
              label: const Text('Print labels'),
            ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context); // close dialog
              if (widget._isAddMode) {
                Navigator.pop(context, true); // back to the batch detail
              } else {
                // Replace this scan screen with the new batch's manifest.
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (_) => BatchDetailScreen(
                      batchUuid: batchUuid,
                      batchLabel: batchId.isEmpty ? null : batchId,
                    ),
                  ),
                );
              }
            },
            child: Text(widget._isAddMode ? 'Done' : 'Open batch'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final title = widget._isAddMode
        ? 'Add to ${widget.targetBatchLabel ?? 'batch'}'
        : 'New batch — sort by scan';

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            tooltip: _cameraMode ? 'Manual entry' : 'Use camera',
            icon: Icon(_cameraMode ? Icons.keyboard : Icons.camera_alt),
            onPressed: () => setState(() => _cameraMode = !_cameraMode),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
            child: Text(
              'Scan or type each sample to stage it, then '
              '${widget._isAddMode ? 'add the list to this batch.' : 'create the batch.'}',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
          ),
          // The scan input — camera or manual, mirroring scan_screen.dart.
          SizedBox(
            height: _cameraMode ? 280 : null,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: _cameraMode ? _buildCamera(theme) : _buildManual(theme),
            ),
          ),
          if (_processing)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    height: 16,
                    width: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 12),
                  Text('Looking up…'),
                ],
              ),
            ),
          const Divider(height: 24),
          // The staged list — de-duped, each removable before committing.
          Expanded(child: _buildPendingList(theme)),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton.icon(
            onPressed: _pending.isEmpty || _committing ? null : _commit,
            icon: _committing
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(widget._isAddMode ? Icons.playlist_add : Icons.inventory_2),
            label: Text(widget._isAddMode
                ? 'Add ${_pending.length} to batch'
                : 'Create batch (${_pending.length})'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPendingList(ThemeData theme) {
    if (_pending.isEmpty) {
      return Center(
        child: Text(
          'No samples staged yet',
          style: theme.textTheme.bodyMedium
              ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      itemCount: _pending.length,
      itemBuilder: (_, i) {
        final s = _pending[i];
        return ListTile(
          dense: true,
          title: Text(
            s.sampleId,
            style: const TextStyle(
                fontFamily: 'monospace', fontWeight: FontWeight.w600),
          ),
          subtitle: Text('${s.sampleType} · ${s.diseaseProgram} · '
              '${s.statusLabel}'),
          trailing: IconButton(
            tooltip: 'Remove',
            icon: const Icon(Icons.close),
            onPressed: () => setState(() => _pending.removeAt(i)),
          ),
        );
      },
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
              _addCode(code);
            },
            // On mobile web the camera fails if permission is denied or the page
            // isn't served over HTTPS — show why and let them switch to manual.
            errorBuilder: (context, error, child) => _buildCameraError(error),
          ),
          Center(
            child: Container(
              width: 180,
              height: 180,
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
            const Icon(Icons.no_photography, color: Colors.white70, size: 48),
            const SizedBox(height: 12),
            const Text(
              "Couldn't start the camera",
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            const Text(
              'Allow camera access for this site. On a phone the page must be '
              'opened over HTTPS for the camera to work.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 16),
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
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        TextField(
          controller: _manualController,
          textInputAction: TextInputAction.go,
          decoration: const InputDecoration(
            labelText: 'Sample ID',
            hintText: 'e.g., NSR-ABC123-XY12',
            prefixIcon: Icon(Icons.qr_code),
            border: OutlineInputBorder(),
          ),
          onSubmitted: _addCode,
        ),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed:
              _processing ? null : () => _addCode(_manualController.text),
          icon: const Icon(Icons.add),
          label: const Text('Add to list'),
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
          ),
        ),
      ],
    );
  }
}
