import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../providers/sample_provider.dart';
import '../providers/auth_provider.dart';
import 'batch_detail_screen.dart';
import 'batch_scan_screen.dart';

/// Boxes / batches browser — lists every box (GET /batches) as a tappable row
/// that opens its manifest. Viewing is open to anyone who can see samples;
/// creating a new box by scanning is gated behind the `batches.manage`
/// permission, mirroring samples_list_screen.dart.
class BatchListScreen extends StatefulWidget {
  const BatchListScreen({super.key});

  @override
  State<BatchListScreen> createState() => _BatchListScreenState();
}

class _BatchListScreenState extends State<BatchListScreen> {
  List<Map<String, dynamic>> _batches = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await context.read<SampleProvider>().fetchBatches();
    if (!mounted) return;
    setState(() {
      _batches = data;
      _loading = false;
    });
  }

  /// Open the new-box scan flow (create mode), refreshing the list on return.
  Future<void> _openNewBatch() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const BatchScanScreen()),
    );
    if (mounted) _load();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // Re-batching (creating a new box by scanning) is a write action.
    final canBatch = context.watch<AuthProvider>().can('batches.manage');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Boxes'),
        actions: [
          if (canBatch)
            IconButton(
              tooltip: 'New batch — sort by scan',
              icon: const Icon(Icons.inventory_2_outlined),
              onPressed: _openNewBatch,
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loading ? null : _load,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _batches.isEmpty
                  ? ListView(
                      children: [
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.6,
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.inventory_2_outlined,
                                    size: 64,
                                    color: theme.colorScheme.onSurfaceVariant
                                        .withValues(alpha: 0.4)),
                                const SizedBox(height: 16),
                                Text('No boxes yet',
                                    style: theme.textTheme.bodyLarge),
                                const SizedBox(height: 4),
                                Text(
                                  canBatch
                                      ? 'Tap the box icon above to sort samples into one.'
                                      : 'Boxes appear here once samples are sorted into one.',
                                  textAlign: TextAlign.center,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                      color:
                                          theme.colorScheme.onSurfaceVariant),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _batches.length,
                      itemBuilder: (_, i) => _buildBatchCard(theme, _batches[i]),
                    ),
            ),
    );
  }

  Widget _buildBatchCard(ThemeData theme, Map<String, dynamic> batch) {
    final batchId = (batch['batchId'] ?? batch['id'])?.toString() ?? 'Box';
    final uuid = batch['id']?.toString();
    final count = batch['sampleCount'] ?? 0;
    final facility = (batch['facility'] as Map<String, dynamic>?)?['name']
            ?.toString() ??
        'N/A';
    final created = batch['createdAt']?.toString();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: uuid == null
            ? null
            : () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => BatchDetailScreen(
                      batchUuid: uuid,
                      batchLabel: batchId,
                    ),
                  ),
                ),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.inventory_2,
                    color: theme.colorScheme.primary, size: 22),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      batchId,
                      style: theme.textTheme.titleMedium?.copyWith(
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.science_outlined,
                            size: 16,
                            color: theme.colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text('$count sample(s)',
                            style: theme.textTheme.bodySmall),
                        const SizedBox(width: 16),
                        Icon(Icons.location_on_outlined,
                            size: 16,
                            color: theme.colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            facility,
                            style: theme.textTheme.bodySmall,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    if (created != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        _formatDate(created),
                        style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ],
                ),
              ),
              Icon(Icons.chevron_right,
                  color: theme.colorScheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }

  /// Friendly date for the created-at ISO string; falls back to the raw value.
  String _formatDate(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    return DateFormat('d MMM y').format(dt.toLocal());
  }
}
