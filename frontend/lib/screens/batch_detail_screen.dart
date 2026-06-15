import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/sample_provider.dart';
import '../providers/auth_provider.dart';
import '../models/models.dart';
import '../services/label_printer.dart';
import 'sample_detail_screen.dart';
import 'batch_scan_screen.dart';

/// Box manifest — every sample in a batch, with printing and (for managers)
/// the "Add to this batch" re-batching action. Read-only printing is shown to
/// anyone; write actions are gated behind the `batches.manage` permission.
class BatchDetailScreen extends StatefulWidget {
  const BatchDetailScreen({
    super.key,
    required this.batchUuid,
    this.batchLabel,
  });

  final String batchUuid;
  final String? batchLabel;

  @override
  State<BatchDetailScreen> createState() => _BatchDetailScreenState();
}

class _BatchDetailScreenState extends State<BatchDetailScreen> {
  Map<String, dynamic>? _batch;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await context.read<SampleProvider>().loadBatch(widget.batchUuid);
    if (!mounted) return;
    setState(() {
      _batch = data;
      _loading = false;
    });
  }

  /// The manifest's samples as printable models.
  List<SampleModel> get _samples => ((_batch?['samples'] as List?) ?? const [])
      .map((j) => SampleModel.fromJson(j as Map<String, dynamic>))
      .toList();

  String get _batchId =>
      (_batch?['batchId'] ?? widget.batchLabel)?.toString() ?? 'Box';

  Future<void> _openAddToBatch() async {
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => BatchScanScreen(
          targetBatchUuid: widget.batchUuid,
          targetBatchLabel: _batchId,
        ),
      ),
    );
    if (changed == true) _load(); // refresh the manifest after sorting
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final canManage = context.watch<AuthProvider>().can('batches.manage');
    final samples = _samples;

    return Scaffold(
      appBar: AppBar(
        title: Text(_batchId),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: _loading ? null : _load,
          ),
        ],
      ),
      floatingActionButton: canManage
          ? FloatingActionButton.extended(
              onPressed: _openAddToBatch,
              icon: const Icon(Icons.playlist_add),
              label: const Text('Add to batch'),
            )
          : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Read-only printing — open to anyone who can view the box.
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text('Labels',
                              style: theme.textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          OutlinedButton.icon(
                            onPressed: () => LabelPrinter.printBatchLabel(
                              _batchId,
                              subtitle: '${samples.length} sample(s)',
                            ),
                            icon: const Icon(Icons.inventory_2_outlined),
                            label: const Text('Print box label'),
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton.icon(
                            onPressed: samples.isEmpty
                                ? null
                                : () => LabelPrinter.printSampleLabels(samples),
                            icon: const Icon(Icons.print_outlined),
                            label: Text('Print all labels (${samples.length})'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text('Samples (${samples.length})',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  if (samples.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Center(
                        child: Text('This box is empty',
                            style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant)),
                      ),
                    ),
                  ...samples.map((s) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(s.sampleId,
                              style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.w600)),
                          subtitle:
                              Text('${s.sampleType} · ${s.diseaseProgram}'),
                          trailing: Text(s.statusLabel,
                              style: TextStyle(
                                  color: s.statusColor,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12)),
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  SampleDetailScreen(sampleId: s.id),
                            ),
                          ),
                        ),
                      )),
                ],
              ),
            ),
    );
  }
}
