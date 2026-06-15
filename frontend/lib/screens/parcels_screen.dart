import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/parcel_provider.dart';
import '../services/api_service.dart';

/// Return parcels (letters/supplies sent back from the center to a facility).
/// Center staff register them here; riders then scan them (PCL-…) to advance.
class ParcelsScreen extends StatefulWidget {
  const ParcelsScreen({super.key});

  @override
  State<ParcelsScreen> createState() => _ParcelsScreenState();
}

class _ParcelsScreenState extends State<ParcelsScreen> {
  final ApiService _api = ApiService();
  List<Map<String, dynamic>> _facilities = [];
  List<Map<String, dynamic>> _riders = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ParcelProvider>().loadParcels();
    });
    _loadRefData();
  }

  Future<void> _loadRefData() async {
    try {
      final f = await _api.get('/facilities');
      final u = await _api.get('/users', queryParams: {'role': 'dispatcher'});
      if (!mounted) return;
      setState(() {
        _facilities = ((f['data'] as List?) ?? const []).cast<Map<String, dynamic>>();
        _riders = ((u['data'] as List?) ?? const []).cast<Map<String, dynamic>>()
            .where((x) => x['role'] == 'dispatcher')
            .toList();
      });
    } catch (_) {/* form still works; dropdowns just stay empty */}
  }

  static const _statusColors = {
    'registered': Color(0xFF64748B),
    'picked_up': Color(0xFFF59E0B),
    'in_transit': Color(0xFF3B82F6),
    'delivered': Color(0xFF16A34A),
    'lost': Color(0xFFDC2626),
  };

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ParcelProvider>();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Return Parcels'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => provider.loadParcels(),
          ),
        ],
      ),
      floatingActionButton: provider.canRegister
          ? FloatingActionButton.extended(
              onPressed: _openRegister,
              icon: const Icon(Icons.add),
              label: const Text('Register'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: () => provider.loadParcels(),
        child: Builder(
          builder: (_) {
            if (provider.isLoading && provider.parcels.isEmpty) {
              return const Center(child: CircularProgressIndicator());
            }
            if (provider.parcels.isEmpty) {
              return ListView(
                children: [
                  const SizedBox(height: 120),
                  Icon(Icons.local_shipping_outlined,
                      size: 64, color: theme.colorScheme.onSurfaceVariant),
                  const SizedBox(height: 16),
                  Center(
                    child: Text('No return parcels yet',
                        style: theme.textTheme.titleMedium),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: Text(
                      provider.canRegister
                          ? 'Tap Register to log letters/supplies going back to a facility.'
                          : 'Parcels the center sends back will appear here.',
                      style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: provider.parcels.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => _parcelTile(provider.parcels[i], theme),
            );
          },
        ),
      ),
    );
  }

  Widget _parcelTile(Map<String, dynamic> p, ThemeData theme) {
    final status = p['status']?.toString() ?? '';
    final color = _statusColors[status] ?? Colors.grey;
    final dest = (p['destinationFacility']?['name'] ?? '').toString();
    final type = (p['type']?.toString() ?? '').replaceAll('_', ' ');
    return Card(
      margin: EdgeInsets.zero,
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.15),
          child: Icon(Icons.local_shipping, color: color, size: 20),
        ),
        title: Text(p['parcelId']?.toString() ?? '',
            style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w600)),
        subtitle: Text(
          [type, if (dest.isNotEmpty) '→ $dest', if (p['description'] != null) p['description']]
              .where((s) => s != null && s.toString().isNotEmpty)
              .join(' · '),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(status.replaceAll('_', ' '),
              style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }

  void _openRegister() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _RegisterParcelSheet(
        facilities: _facilities,
        riders: _riders,
      ),
    );
  }
}

class _RegisterParcelSheet extends StatefulWidget {
  const _RegisterParcelSheet({required this.facilities, required this.riders});
  final List<Map<String, dynamic>> facilities;
  final List<Map<String, dynamic>> riders;

  @override
  State<_RegisterParcelSheet> createState() => _RegisterParcelSheetState();
}

class _RegisterParcelSheetState extends State<_RegisterParcelSheet> {
  String _type = 'supply';
  String? _destId;
  String? _riderId;
  final _desc = TextEditingController();
  final _qty = TextEditingController(text: '1');
  bool _saving = false;

  static const _types = ['letter', 'supply', 'document', 'equipment', 'other'];

  @override
  void dispose() {
    _desc.dispose();
    _qty.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_destId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pick a destination facility.')),
      );
      return;
    }
    setState(() => _saving = true);
    final body = <String, dynamic>{
      'type': _type,
      'destinationFacilityId': _destId,
      'quantity': int.tryParse(_qty.text.trim()) ?? 1,
      if (_desc.text.trim().isNotEmpty) 'description': _desc.text.trim(),
      if (_riderId != null) 'riderId': _riderId,
    };
    final created = await context.read<ParcelProvider>().createParcel(body);
    if (!mounted) return;
    setState(() => _saving = false);
    if (created != null) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Registered ${created['parcelId'] ?? 'parcel'}')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.read<ParcelProvider>().error ?? 'Failed to register'),
          backgroundColor: Colors.red.shade700,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Register Return Parcel',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _type,
            decoration: const InputDecoration(labelText: 'Type', border: OutlineInputBorder()),
            items: _types
                .map((t) => DropdownMenuItem(value: t, child: Text(t[0].toUpperCase() + t.substring(1))))
                .toList(),
            onChanged: (v) => setState(() => _type = v ?? 'supply'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _destId,
            isExpanded: true,
            decoration: const InputDecoration(
                labelText: 'Destination facility', border: OutlineInputBorder()),
            items: widget.facilities
                .map((f) => DropdownMenuItem(
                      value: f['id']?.toString(),
                      child: Text(f['name']?.toString() ?? '—',
                          overflow: TextOverflow.ellipsis),
                    ))
                .toList(),
            onChanged: (v) => setState(() => _destId = v),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _desc,
            decoration: const InputDecoration(
                labelText: 'Description (optional)', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              SizedBox(
                width: 110,
                child: TextField(
                  controller: _qty,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                      labelText: 'Qty', border: OutlineInputBorder()),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _riderId,
                  isExpanded: true,
                  decoration: const InputDecoration(
                      labelText: 'Assign rider (optional)',
                      border: OutlineInputBorder()),
                  items: widget.riders
                      .map((r) => DropdownMenuItem(
                            value: r['id']?.toString(),
                            child: Text(
                                '${r['firstName'] ?? ''} ${r['lastName'] ?? ''}'.trim(),
                                overflow: TextOverflow.ellipsis),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _riderId = v),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _saving ? null : _submit,
            child: _saving
                ? const SizedBox(
                    height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Register parcel'),
          ),
        ],
      ),
    );
  }
}
