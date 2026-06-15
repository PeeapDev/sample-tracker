import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/sample_provider.dart';
import '../providers/auth_provider.dart';
import '../models/models.dart';
import 'sample_detail_screen.dart';
import 'create_sample_screen.dart';
import 'batch_scan_screen.dart';

class SamplesListScreen extends StatefulWidget {
  const SamplesListScreen({super.key});

  @override
  State<SamplesListScreen> createState() => _SamplesListScreenState();
}

class _SamplesListScreenState extends State<SamplesListScreen> {
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SampleProvider>().loadSamples();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final samples = context.watch<SampleProvider>();
    final auth = context.watch<AuthProvider>();
    final canCreate = auth.role == 'collector' || auth.role == 'admin';
    // Re-batching (sorting samples into a new box by scanning) is a write action.
    final canBatch = auth.can('batches.manage');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Samples'),
        actions: [
          if (canBatch)
            IconButton(
              tooltip: 'New batch — sort by scan',
              icon: const Icon(Icons.inventory_2_outlined),
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const BatchScanScreen()),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterSheet(context),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => samples.loadSamples(status: _statusFilter),
          ),
        ],
      ),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CreateSampleScreen()),
                );
                if (result == true) {
                  samples.loadSamples(status: _statusFilter);
                }
              },
              icon: const Icon(Icons.add),
              label: const Text('Register Sample'),
            )
          : null,
      body: samples.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => samples.loadSamples(status: _statusFilter),
              child: samples.samples.isEmpty
                  ? ListView(
                      children: [
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.6,
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.science_outlined, size: 64, color: theme.colorScheme.onSurfaceVariant.withOpacity(0.4)),
                                const SizedBox(height: 16),
                                Text('No samples found', style: theme.textTheme.bodyLarge),
                              ],
                            ),
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: samples.samples.length,
                      itemBuilder: (_, i) => _buildSampleCard(theme, samples.samples[i]),
                    ),
            ),
    );
  }

  Widget _buildSampleCard(ThemeData theme, SampleModel sample) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => SampleDetailScreen(sampleId: sample.id),
            ),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: sample.statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      sample.statusLabel,
                      style: TextStyle(
                        color: sample.statusColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Icon(Icons.chevron_right, color: theme.colorScheme.onSurfaceVariant),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                sample.sampleId,
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                '${sample.sampleType} • ${sample.diseaseProgram}',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.inventory_2, size: 16, color: theme.colorScheme.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Text('Qty: ${sample.quantity}', style: theme.textTheme.bodySmall),
                  const SizedBox(width: 16),
                  Icon(Icons.location_on_outlined, size: 16, color: theme.colorScheme.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      sample.facility?['name'] ?? sample.village ?? 'N/A',
                      style: theme.textTheme.bodySmall,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Filter by Status', style: Theme.of(ctx).textTheme.titleMedium),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _filterChip(ctx, null, 'All'),
                  _filterChip(ctx, 'collected', 'Collected'),
                  _filterChip(ctx, 'picked_up', 'Picked Up'),
                  _filterChip(ctx, 'hub_received', 'Hub Received'),
                  _filterChip(ctx, 'in_transit', 'In Transit'),
                  _filterChip(ctx, 'lab_received', 'Lab Received'),
                  _filterChip(ctx, 'completed', 'Completed'),
                  _filterChip(ctx, 'lost', 'Lost'),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _filterChip(BuildContext ctx, String? value, String label) {
    final isSelected = _statusFilter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) {
        setState(() => _statusFilter = value);
        Navigator.pop(ctx);
        context.read<SampleProvider>().loadSamples(status: _statusFilter);
      },
    );
  }
}
