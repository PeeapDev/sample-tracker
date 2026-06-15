import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../providers/sample_provider.dart';
import '../providers/auth_provider.dart';
import '../models/models.dart';

class SampleDetailScreen extends StatefulWidget {
  final String sampleId;
  const SampleDetailScreen({super.key, required this.sampleId});

  @override
  State<SampleDetailScreen> createState() => _SampleDetailScreenState();
}

class _SampleDetailScreenState extends State<SampleDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<SampleProvider>();
      provider.loadSample(widget.sampleId);
      provider.loadTimeline(widget.sampleId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final samples = context.watch<SampleProvider>();
    final auth = context.watch<AuthProvider>();
    final sample = samples.selectedSample;

    if (sample == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Sample Detail')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    // "Currently at" = facility / GPS of the most recent scan event (timeline is
    // oldest→newest), falling back to the collection facility.
    EventLogModel? latestFacilityEvent;
    EventLogModel? latestGpsEvent;
    for (final e in samples.timeline) {
      if (e.facility?['name'] != null) latestFacilityEvent = e;
      if (e.latitude != null && e.longitude != null) latestGpsEvent = e;
    }
    final currentFacility =
        (latestFacilityEvent?.facility?['name'] ?? sample.facility?['name']) as String?;

    return Scaffold(
      appBar: AppBar(
        title: Text(sample.sampleId),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              samples.loadSample(widget.sampleId);
              samples.loadTimeline(widget.sampleId);
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  if (sample.qrCode != null)
                    QrImageView(
                      data: sample.sampleId,
                      version: QrVersions.auto,
                      size: 180,
                    ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: sample.statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      sample.statusLabel,
                      style: TextStyle(
                        color: sample.statusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.location_city, color: theme.colorScheme.primary, size: 20),
                      const SizedBox(width: 8),
                      Text('Currently At', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    currentFacility ?? 'Unknown location',
                    style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.place, size: 16, color: theme.colorScheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          latestGpsEvent != null
                              ? 'GPS ${latestGpsEvent.latitude!.toStringAsFixed(4)}, ${latestGpsEvent.longitude!.toStringAsFixed(4)}'
                              : 'Location not captured yet',
                          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Sample Information', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _infoRow('Sample ID', sample.sampleId),
                  _infoRow('Type', sample.sampleType),
                  _infoRow('Disease Program', sample.diseaseProgram),
                  _infoRow('Quantity', '${sample.quantity}'),
                  if (sample.village != null) _infoRow('Village', sample.village!),
                  if (sample.patientAge != null) _infoRow('Patient Age', '${sample.patientAge}'),
                  if (sample.patientGender != null) _infoRow('Gender', sample.patientGender!),
                  if (sample.facility != null) _infoRow('Facility', sample.facility!['name'] ?? ''),
                  if (sample.collectedBy != null)
                    _infoRow('Collected By', '${sample.collectedBy!['firstName']} ${sample.collectedBy!['lastName']}'),
                  if (sample.dispatcher != null)
                    _infoRow('Dispatcher', '${sample.dispatcher!['firstName']} ${sample.dispatcher!['lastName']}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Timeline', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ...samples.timeline.map((event) => _timelineItem(theme, event)),
                  if (samples.timeline.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Center(
                        child: Text('No events yet', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          if (_canUpdateStatus(auth.role, sample.status)) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Update Status', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    ..._getAvailableActions(auth.role, sample.status).map(
                      (action) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: OutlinedButton.icon(
                          onPressed: () => _handleAction(samples, sample, action['status']!, action['label']!),
                          icon: Icon(action['icon'] as IconData),
                          label: Text(action['label'] as String),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 13)),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
        ],
      ),
    );
  }

  Widget _timelineItem(ThemeData theme, EventLogModel event) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: _eventColor(event.event),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_eventLabel(event.event), style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
                Text(
                  _formatTime(event.timestamp),
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
                if (event.facility?['name'] != null || (event.latitude != null && event.longitude != null))
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      [
                        if (event.facility?['name'] != null) event.facility!['name'],
                        if (event.latitude != null && event.longitude != null)
                          '📍 ${event.latitude!.toStringAsFixed(4)}, ${event.longitude!.toStringAsFixed(4)}',
                      ].join('  ·  '),
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool _canUpdateStatus(String role, String status) {
    if (role == 'admin') return status != 'completed' && status != 'lost';
    if (role == 'dispatcher' && (status == 'collected' || status == 'picked_up')) return true;
    if (role == 'hub_officer' && (status == 'picked_up' || status == 'hub_received')) return true;
    if (role == 'lab_officer' && (status == 'in_transit' || status == 'lab_received')) return true;
    return false;
  }

  List<Map<String, dynamic>> _getAvailableActions(String role, String status) {
    final actions = <Map<String, dynamic>>[];
    if (role == 'admin' || role == 'dispatcher') {
      if (status == 'collected') {
        actions.add({'status': 'picked_up', 'label': 'Confirm Pickup', 'icon': Icons.local_shipping});
      }
    }
    if (role == 'admin' || role == 'hub_officer') {
      if (status == 'picked_up') {
        actions.add({'status': 'hub_received', 'label': 'Receive at Hub', 'icon': Icons.warehouse});
      }
      if (status == 'hub_received') {
        actions.add({'status': 'in_transit', 'label': 'Dispatch to Lab', 'icon': Icons.departure_board});
      }
    }
    if (role == 'admin' || role == 'lab_officer') {
      if (status == 'in_transit') {
        actions.add({'status': 'lab_received', 'label': 'Receive at Lab', 'icon': Icons.biotech});
      }
      if (status == 'lab_received') {
        actions.add({'status': 'analysis_queue', 'label': 'Queue for Analysis', 'icon': Icons.queue});
        actions.add({'status': 'completed', 'label': 'Mark Completed', 'icon': Icons.check_circle});
      }
    }
    if (role == 'admin') {
      actions.add({'status': 'lost', 'label': 'Mark as Lost', 'icon': Icons.report_problem});
    }
    return actions;
  }

  Future<void> _handleAction(SampleProvider samples, SampleModel sample, String status, String label) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(label),
        content: Text('Confirm status change to "$label"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Confirm')),
        ],
      ),
    );

    if (confirm == true) {
      final success = await samples.updateStatus(sample.id, status);
      if (success && mounted) {
        samples.loadTimeline(widget.sampleId);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Status updated to $label'), backgroundColor: Colors.green),
        );
      }
    }
  }

  Color _eventColor(String event) {
    switch (event) {
      case 'collected': return Colors.blue;
      case 'picked_up': return Colors.orange;
      case 'hub_received': return Colors.purple;
      case 'in_transit': return Colors.amber;
      case 'lab_received': return Colors.teal;
      case 'completed': return Colors.green;
      case 'lost': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _eventLabel(String event) {
    switch (event) {
      case 'collected': return 'Sample Collected';
      case 'picked_up': return 'Picked Up by Dispatcher';
      case 'hub_received': return 'Received at Hub';
      case 'in_transit': return 'Dispatched to Laboratory';
      case 'lab_received': return 'Received at Laboratory';
      case 'analysis_queue': return 'Queued for Analysis';
      case 'completed': return 'Analysis Completed';
      case 'lost': return 'Marked as Lost';
      default: return event;
    }
  }

  String _formatTime(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
