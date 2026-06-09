import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/dashboard_provider.dart';
import '../providers/auth_provider.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardProvider>().loadFullDashboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dashboard = context.watch<DashboardProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => dashboard.loadFullDashboard(),
          ),
        ],
      ),
      body: dashboard.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => dashboard.loadFullDashboard(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    'Welcome, ${auth.user?.firstName ?? ''}',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    auth.user?.roleLabel ?? '',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 24),

                  if (dashboard.operational != null) ...[
                    _buildMetricCards(theme, dashboard),
                    const SizedBox(height: 24),
                    _buildStatusChart(theme, dashboard),
                    const SizedBox(height: 24),
                    _buildRecentActivity(theme, dashboard),
                  ] else if (dashboard.error != null) ...[
                    Center(
                      child: Column(
                        children: [
                          Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
                          const SizedBox(height: 16),
                          Text(dashboard.error!, style: TextStyle(color: theme.colorScheme.error)),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildMetricCards(ThemeData theme, DashboardProvider dashboard) {
    final op = dashboard.operational!;
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _metricCard(theme, 'Total Samples', '${op['totalSamples'] ?? 0}', Icons.science, Colors.blue),
        _metricCard(theme, 'In Transit', '${op['inTransit'] ?? 0}', Icons.local_shipping, Colors.orange),
        _metricCard(theme, 'Completed', '${op['completed'] ?? 0}', Icons.check_circle, Colors.green),
        _metricCard(theme, 'Lost Rate', '${op['lostRate'] ?? 0}%', Icons.warning, Colors.red),
      ],
    );
  }

  Widget _metricCard(ThemeData theme, String label, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: color),
                const Spacer(),
              ],
            ),
            const Spacer(),
            Text(
              value,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChart(ThemeData theme, DashboardProvider dashboard) {
    final dist = dashboard.statusDistribution;
    if (dist.isEmpty) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Sample Status Distribution', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: PieChart(
                PieChartData(
                  sections: dist.map((d) {
                    final status = d['status'] ?? '';
                    final count = (d['count'] ?? 0) as num;
                    return PieChartSectionData(
                      value: count.toDouble(),
                      title: '$count',
                      color: _statusColor(status),
                      radius: 60,
                      titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: dist.map<Widget>((d) {
                final status = (d['status'] ?? '').toString();
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(width: 12, height: 12, decoration: BoxDecoration(color: _statusColor(status), shape: BoxShape.circle)),
                    const SizedBox(width: 4),
                    Text(_statusLabel(status), style: theme.textTheme.bodySmall),
                  ],
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentActivity(ThemeData theme, DashboardProvider dashboard) {
    final activity = dashboard.recentActivity;
    if (activity.isEmpty) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Recent Activity', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...activity.take(5).map((a) {
              final sample = a['sample'];
              final event = a['event'] ?? '';
              final timestamp = a['timestamp'] ?? '';
              return ListTile(
                dense: true,
                leading: CircleAvatar(
                  radius: 16,
                  backgroundColor: _statusColor(event.toString()),
                  child: const Icon(Icons.science, size: 16, color: Colors.white),
                ),
                title: Text(
                  sample?['sampleId'] ?? 'Unknown',
                  style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  '${_statusLabel(event.toString())} • ${_formatTimestamp(timestamp.toString())}',
                  style: theme.textTheme.bodySmall,
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
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

  String _statusLabel(String status) {
    switch (status) {
      case 'collected': return 'Collected';
      case 'picked_up': return 'Picked Up';
      case 'hub_received': return 'Hub Received';
      case 'in_transit': return 'In Transit';
      case 'lab_received': return 'Lab Received';
      case 'completed': return 'Completed';
      case 'lost': return 'Lost';
      default: return status;
    }
  }

  String _formatTimestamp(String ts) {
    try {
      final dt = DateTime.parse(ts);
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (_) {
      return ts;
    }
  }
}
