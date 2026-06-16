import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../providers/dashboard_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../theme/responsive.dart';
import 'scan_screen.dart';

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
      final auth = context.read<AuthProvider>();
      if (auth.user?.id.startsWith('demo-') == true) {
        context.read<DashboardProvider>().loadDemo();
      } else {
        context.read<DashboardProvider>().loadFullDashboard();
      }
    });
  }

  void _refresh() {
    final auth = context.read<AuthProvider>();
    if (auth.user?.id.startsWith('demo-') == true) {
      context.read<DashboardProvider>().loadDemo();
    } else {
      context.read<DashboardProvider>().loadFullDashboard();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dashboard = context.watch<DashboardProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final isDark = themeProvider.isDark(context);

    return Scaffold(
      body: SafeArea(
        child: dashboard.isLoading && dashboard.operational == null
            ? const _DashboardSkeleton()
            : RefreshIndicator(
                onRefresh: () async => _refresh(),
                child: dashboard.operational == null
                    ? _buildError(theme, dashboard)
                    : _buildContent(context, theme, dashboard, isDark),
              ),
      ),
    );
  }

  Widget _buildError(ThemeData theme, DashboardProvider dashboard) {
    return ListView(
      children: [
        SizedBox(height: MediaQuery.sizeOf(context).height * 0.3),
        Icon(Icons.cloud_off_rounded,
            size: 56, color: theme.colorScheme.onSurfaceVariant),
        const SizedBox(height: 16),
        Center(
          child: Text(
            dashboard.error ?? 'No data available',
            style: theme.textTheme.titleMedium,
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: FilledButton.icon(
            onPressed: _refresh,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ),
      ],
    );
  }

  Widget _buildContent(
    BuildContext context,
    ThemeData theme,
    DashboardProvider dashboard,
    bool isDark,
  ) {
    final auth = context.read<AuthProvider>();
    // Receiving roles can accept a delivery at their centre by scanning it in.
    final role = auth.role;
    final canAccept = role == 'dispatcher' ||
        role == 'hub_officer' ||
        role == 'lab_officer' ||
        role == 'admin';
    // Only roles granted the network dashboard see the org-wide metrics; others
    // get a focused role landing instead of the admin overview.
    final canNetwork = auth.can('dashboard.network');
    final maxWidth = context.isWide ? 1320.0 : double.infinity;
    final pad = context.responsive(mobile: 16.0, tablet: 24.0, desktop: 32.0);

    return ListView(
      padding: EdgeInsets.fromLTRB(pad, pad, pad, pad + 24),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Header(
                  name: auth.user?.firstName ?? '',
                  role: auth.user?.roleLabel ?? '',
                  isDark: isDark,
                  onToggleTheme: () =>
                      context.read<ThemeProvider>().toggle(context),
                  onRefresh: _refresh,
                  onAccept: canAccept
                      ? () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  const ScanScreen(acceptMode: true),
                            ),
                          )
                      : null,
                ),
                const SizedBox(height: 24),
                if (canNetwork) ...[
                  _KpiGrid(operational: dashboard.operational!),
                  const SizedBox(height: 16),
                  _NetworkStrip(management: dashboard.management),
                  const SizedBox(height: 16),
                  _ChartsSection(dashboard: dashboard),
                  const SizedBox(height: 16),
                  _BottomSection(dashboard: dashboard),
                ] else
                  _RoleLanding(role: role),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
/// Shown on the dashboard to roles without the network view — a focused, plain
/// landing that points them at what they can actually do (vs the admin metrics).
class _RoleLanding extends StatelessWidget {
  const _RoleLanding({required this.role});
  final String role;

  List<(IconData, String)> _tipsFor(String role) {
    switch (role) {
      case 'collector':
        return [
          (Icons.science_outlined,
              'Register new samples in the Samples tab — each gets a QR instantly.'),
          (Icons.qr_code_scanner,
              'Use Scan to look up any sample and see where it is.'),
        ];
      case 'dispatcher':
        return [
          (Icons.qr_code_scanner,
              'Scan samples and boxes to pick up and hand off — your location is shared while on a trip.'),
          (Icons.local_shipping_outlined,
              'Carry return parcels (PCL-…) and scan them in at the facility.'),
        ];
      case 'hub_officer':
      case 'lab_officer':
        return [
          (Icons.inventory_2_outlined,
              'Scan arriving samples and boxes to receive them here.'),
          (Icons.local_shipping_outlined,
              'Register return parcels going back out to facilities.'),
        ];
      default:
        return [
          (Icons.qr_code_scanner,
              'Use the tabs below to scan and view samples.'),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tips = _tipsFor(role);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Here’s what you can do',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          for (final t in tips)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(t.$1, size: 20, color: theme.colorScheme.primary),
                  const SizedBox(width: 12),
                  Expanded(child: Text(t.$2, style: theme.textTheme.bodyMedium)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.name,
    required this.role,
    required this.isDark,
    required this.onToggleTheme,
    required this.onRefresh,
    this.onAccept,
  });

  final String name;
  final String role;
  final bool isDark;
  final VoidCallback onToggleTheme;
  final VoidCallback onRefresh;
  // Non-null only for roles that receive deliveries — opens the accept scanner.
  final VoidCallback? onAccept;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final today = DateFormat('EEEE, d MMMM y').format(DateTime.now());

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Good ${_dayPart()}, $name',
                style: theme.textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                '$role  •  $today',
                style: theme.textTheme.bodyMedium
                    ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        if (onAccept != null) ...[
          FilledButton.icon(
            onPressed: onAccept,
            icon: const Icon(Icons.qr_code_scanner_rounded, size: 18),
            label: const Text('Accept'),
            style: FilledButton.styleFrom(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
          const SizedBox(width: 8),
        ],
        _IconAction(
          icon: isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
          tooltip: isDark ? 'Light mode' : 'Dark mode',
          onTap: onToggleTheme,
        ),
        const SizedBox(width: 8),
        _IconAction(
          icon: Icons.refresh_rounded,
          tooltip: 'Refresh',
          onTap: onRefresh,
        ),
      ],
    );
  }

  String _dayPart() {
    final h = DateTime.now().hour;
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }
}

class _IconAction extends StatelessWidget {
  const _IconAction(
      {required this.icon, required this.tooltip, required this.onTap});
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Tooltip(
      message: tooltip,
      child: Material(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: theme.colorScheme.outlineVariant),
            ),
            child: Icon(icon, size: 20, color: theme.colorScheme.onSurface),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// KPI grid
// ---------------------------------------------------------------------------
class _KpiGrid extends StatelessWidget {
  const _KpiGrid({required this.operational});
  final Map<String, dynamic> operational;

  @override
  Widget build(BuildContext context) {
    final total = _num(operational['totalSamples']);
    final completed = _num(operational['completed']);
    final inTransit = _num(operational['inTransit']);
    final delayed = _num(operational['delayed']);
    final today = _num(operational['samplesToday']);
    final lost = _num(operational['lost']);
    final lostRate = operational['lostRate'] ?? 0;
    final completedPct =
        total > 0 ? (completed / total * 100).toStringAsFixed(0) : '0';

    final cards = [
      _KpiData(
        label: 'Total Samples',
        value: _fmt(total),
        icon: Icons.science_rounded,
        color: AppTheme.chartPalette[0],
        delta: today > 0 ? '+${_fmt(today)} today' : 'No new today',
        positive: true,
      ),
      _KpiData(
        label: 'In Transit',
        value: _fmt(inTransit),
        icon: Icons.local_shipping_rounded,
        color: const Color(0xFFF59E0B),
        delta: delayed > 0 ? '$delayed delayed >48h' : 'On schedule',
        positive: delayed == 0,
      ),
      _KpiData(
        label: 'Completed',
        value: _fmt(completed),
        icon: Icons.check_circle_rounded,
        color: const Color(0xFF22C55E),
        delta: '$completedPct% of total',
        positive: true,
      ),
      _KpiData(
        label: 'Lost Rate',
        value: '$lostRate%',
        icon: Icons.warning_rounded,
        color: const Color(0xFFEF4444),
        delta: '${_fmt(lost)} samples lost',
        positive: false,
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final cols = constraints.maxWidth >= 1100
            ? 4
            : constraints.maxWidth >= 720
                ? 4
                : constraints.maxWidth >= 480
                    ? 2
                    : 1;
        const gap = 16.0;
        final cardW = (constraints.maxWidth - gap * (cols - 1)) / cols;
        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: cards
              .map((c) => SizedBox(width: cardW, child: _KpiCard(data: c)))
              .toList(),
        );
      },
    );
  }
}

class _KpiData {
  _KpiData({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.delta,
    required this.positive,
  });
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final String delta;
  final bool positive;
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({required this.data});
  final _KpiData data;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: data.color.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(data.icon, color: data.color, size: 22),
                ),
                const Spacer(),
                Icon(
                  data.positive
                      ? Icons.trending_up_rounded
                      : Icons.trending_down_rounded,
                  size: 18,
                  color: data.positive
                      ? const Color(0xFF22C55E)
                      : const Color(0xFFEF4444),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              data.value,
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              data.label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              data.delta,
              style: theme.textTheme.bodySmall?.copyWith(
                color: data.positive
                    ? const Color(0xFF16A34A)
                    : theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Network strip (management metrics)
// ---------------------------------------------------------------------------
class _NetworkStrip extends StatelessWidget {
  const _NetworkStrip({required this.management});
  final Map<String, dynamic>? management;

  @override
  Widget build(BuildContext context) {
    if (management == null || management!.isEmpty) {
      return const SizedBox.shrink();
    }
    final items = [
      _MiniStat(Icons.people_alt_rounded, 'Active Users',
          _fmt(_num(management!['totalUsers'])), const Color(0xFF6366F1)),
      _MiniStat(Icons.business_rounded, 'Facilities',
          _fmt(_num(management!['totalFacilities'])), const Color(0xFF14B8A6)),
      _MiniStat(Icons.route_rounded, 'Active Dispatches',
          _fmt(_num(management!['activeDispatches'])), const Color(0xFFF97316)),
      _MiniStat(Icons.inventory_2_rounded, 'Total Dispatches',
          _fmt(_num(management!['totalDispatches'])), const Color(0xFF8B5CF6)),
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: LayoutBuilder(builder: (context, c) {
          final vertical = c.maxWidth < 560;
          if (vertical) {
            return Column(
              children: [
                for (var i = 0; i < items.length; i++) ...[
                  items[i],
                  if (i < items.length - 1) const Divider(height: 1),
                ]
              ],
            );
          }
          return Row(
            children: [
              for (var i = 0; i < items.length; i++) ...[
                Expanded(child: items[i]),
                if (i < items.length - 1)
                  Container(
                    width: 1,
                    height: 44,
                    color: Theme.of(context).colorScheme.outlineVariant,
                  ),
              ]
            ],
          );
        }),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat(this.icon, this.label, this.value, this.color);
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value,
                style: theme.textTheme.titleLarge
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              Text(
                label,
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Charts section: volume (line) + status (donut)
// ---------------------------------------------------------------------------
class _ChartsSection extends StatelessWidget {
  const _ChartsSection({required this.dashboard});
  final DashboardProvider dashboard;

  @override
  Widget build(BuildContext context) {
    final volume = _VolumeChartCard(data: dashboard.collectionVolume);
    final status = _StatusDonutCard(data: dashboard.statusDistribution);

    return LayoutBuilder(builder: (context, c) {
      if (c.maxWidth >= 900) {
        return Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(flex: 3, child: volume),
            const SizedBox(width: 16),
            Expanded(flex: 2, child: status),
          ],
        );
      }
      return Column(
        children: [volume, const SizedBox(height: 16), status],
      );
    });
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard(
      {required this.title, required this.child, this.subtitle, this.trailing});
  final String title;
  final String? subtitle;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: theme.textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700)),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(subtitle!,
                            style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant)),
                      ],
                    ],
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
            const SizedBox(height: 20),
            child,
          ],
        ),
      ),
    );
  }
}

class _VolumeChartCard extends StatelessWidget {
  const _VolumeChartCard({required this.data});
  final List<dynamic> data;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final points = data
        .map((e) => (e as Map)['count'])
        .map((v) => _num(v).toDouble())
        .toList();

    final total = points.fold<double>(0, (a, b) => a + b);

    return _SectionCard(
      title: 'Collection Volume',
      subtitle: 'Daily samples collected • last ${points.length} days',
      trailing: _Pill(label: '${_fmt(total)} total', color: theme.colorScheme.primary),
      child: SizedBox(
        height: 200,
        child: points.isEmpty
            ? _EmptyChart(theme)
            : LineChart(_lineData(theme)),
      ),
    );
  }

  LineChartData _lineData(ThemeData theme) {
    final points = data
        .map((e) => (e as Map)['count'])
        .map((v) => _num(v).toDouble())
        .toList();
    final dates = data.map((e) => (e as Map)['date']?.toString() ?? '').toList();
    final maxY = (points.reduce((a, b) => a > b ? a : b) * 1.25).ceilToDouble();
    final primary = theme.colorScheme.primary;

    final spots = [
      for (var i = 0; i < points.length; i++) FlSpot(i.toDouble(), points[i]),
    ];

    return LineChartData(
      minY: 0,
      maxY: maxY <= 0 ? 10 : maxY,
      gridData: FlGridData(
        show: true,
        drawVerticalLine: false,
        horizontalInterval: maxY <= 0 ? 5 : maxY / 4,
        getDrawingHorizontalLine: (_) => FlLine(
          color: theme.colorScheme.outlineVariant,
          strokeWidth: 1,
        ),
      ),
      titlesData: FlTitlesData(
        topTitles:
            const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles:
            const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        leftTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 32,
            interval: maxY <= 0 ? 5 : maxY / 4,
            getTitlesWidget: (value, meta) => Text(
              value.toInt().toString(),
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                fontSize: 11,
              ),
            ),
          ),
        ),
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 24,
            interval: (points.length / 5).ceilToDouble().clamp(1, 999).toDouble(),
            getTitlesWidget: (value, meta) {
              final i = value.toInt();
              if (i < 0 || i >= dates.length) return const SizedBox.shrink();
              final parts = dates[i].split('-');
              final label = parts.length == 3 ? '${parts[2]}/${parts[1]}' : '';
              return Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontSize: 10,
                  ),
                ),
              );
            },
          ),
        ),
      ),
      borderData: FlBorderData(show: false),
      lineTouchData: LineTouchData(
        touchTooltipData: LineTouchTooltipData(
          tooltipBgColor: theme.colorScheme.inverseSurface,
          getTooltipItems: (spots) => spots
              .map((s) => LineTooltipItem(
                    '${s.y.toInt()} samples',
                    TextStyle(
                      color: theme.colorScheme.onInverseSurface,
                      fontWeight: FontWeight.w600,
                    ),
                  ))
              .toList(),
        ),
      ),
      lineBarsData: [
        LineChartBarData(
          spots: spots,
          isCurved: true,
          curveSmoothness: 0.32,
          color: primary,
          barWidth: 3,
          dotData: const FlDotData(show: false),
          belowBarData: BarAreaData(
            show: true,
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                primary.withValues(alpha: 0.28),
                primary.withValues(alpha: 0.0),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _StatusDonutCard extends StatelessWidget {
  const _StatusDonutCard({required this.data});
  final List<dynamic> data;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final entries = data
        .map((e) => e as Map)
        .where((e) => _num(e['count']) > 0)
        .toList();
    final total = entries.fold<double>(0, (a, e) => a + _num(e['count']));

    return _SectionCard(
      title: 'Status Distribution',
      subtitle: 'Current sample states across the pipeline',
      child: entries.isEmpty
          ? SizedBox(height: 180, child: _EmptyChart(theme))
          : Column(
              children: [
                SizedBox(
                  height: 180,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      PieChart(
                        PieChartData(
                          sectionsSpace: 2,
                          centerSpaceRadius: 56,
                          startDegreeOffset: -90,
                          sections: entries.map((e) {
                            final status = (e['status'] ?? '').toString();
                            final count = _num(e['count']).toDouble();
                            return PieChartSectionData(
                              value: count,
                              title: '',
                              color: AppTheme.statusColor(status),
                              radius: 22,
                            );
                          }).toList(),
                        ),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(_fmt(total),
                              style: theme.textTheme.headlineSmall
                                  ?.copyWith(fontWeight: FontWeight.w800)),
                          Text('samples',
                              style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 14,
                  runSpacing: 8,
                  children: entries.map((e) {
                    final status = (e['status'] ?? '').toString();
                    final count = _num(e['count']);
                    return Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            color: AppTheme.statusColor(status),
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${AppTheme.statusLabel(status)} (${_fmt(count)})',
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ],
            ),
    );
  }
}

// ---------------------------------------------------------------------------
// Bottom section: program distribution + recent activity
// ---------------------------------------------------------------------------
class _BottomSection extends StatelessWidget {
  const _BottomSection({required this.dashboard});
  final DashboardProvider dashboard;

  @override
  Widget build(BuildContext context) {
    final programs = _ProgramCard(data: dashboard.programDistribution);
    final activity = _ActivityCard(data: dashboard.recentActivity);

    return LayoutBuilder(builder: (context, c) {
      if (c.maxWidth >= 900) {
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 2, child: programs),
            const SizedBox(width: 16),
            Expanded(flex: 3, child: activity),
          ],
        );
      }
      return Column(
        children: [programs, const SizedBox(height: 16), activity],
      );
    });
  }
}

class _ProgramCard extends StatelessWidget {
  const _ProgramCard({required this.data});
  final List<dynamic> data;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final entries = data.map((e) => e as Map).toList()
      ..sort((a, b) => _num(b['count']).compareTo(_num(a['count'])));
    final maxCount = entries.isEmpty
        ? 1
        : entries.map((e) => _num(e['count'])).reduce((a, b) => a > b ? a : b);

    return _SectionCard(
      title: 'Disease Programs',
      subtitle: 'Samples by program',
      child: entries.isEmpty
          ? SizedBox(height: 120, child: _EmptyChart(theme))
          : Column(
              children: [
                for (var i = 0; i < entries.length; i++)
                  Padding(
                    padding: EdgeInsets.only(
                        bottom: i == entries.length - 1 ? 0 : 16),
                    child: _programRow(
                      theme,
                      (entries[i]['program'] ?? 'Unknown').toString(),
                      _num(entries[i]['count']),
                      maxCount,
                      AppTheme.chartPalette[i % AppTheme.chartPalette.length],
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _programRow(
      ThemeData theme, String label, num count, num max, Color color) {
    final fraction = max > 0 ? count / max : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label,
                style: theme.textTheme.bodyMedium
                    ?.copyWith(fontWeight: FontWeight.w500)),
            Text(_fmt(count),
                style: theme.textTheme.bodyMedium
                    ?.copyWith(fontWeight: FontWeight.w700)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: fraction.toDouble(),
            minHeight: 8,
            backgroundColor: theme.colorScheme.surfaceContainerHighest,
            valueColor: AlwaysStoppedAnimation(color),
          ),
        ),
      ],
    );
  }
}

class _ActivityCard extends StatelessWidget {
  const _ActivityCard({required this.data});
  final List<dynamic> data;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final items = data.take(8).toList();

    return _SectionCard(
      title: 'Recent Activity',
      subtitle: 'Latest sample events',
      child: items.isEmpty
          ? SizedBox(height: 120, child: _EmptyChart(theme))
          : Column(
              children: [
                for (var i = 0; i < items.length; i++)
                  _activityRow(theme, items[i] as Map, i == items.length - 1),
              ],
            ),
    );
  }

  Widget _activityRow(ThemeData theme, Map a, bool isLast) {
    final sample = a['sample'] as Map?;
    final event = (a['event'] ?? '').toString();
    final color = AppTheme.statusColor(event);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.14),
                  shape: BoxShape.circle,
                ),
                child: Icon(_eventIcon(event), size: 16, color: color),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: theme.colorScheme.outlineVariant,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    sample?['sampleId']?.toString() ?? 'Unknown sample',
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      _Pill(
                          label: AppTheme.statusLabel(event),
                          color: color,
                          small: true),
                      const SizedBox(width: 8),
                      Text(
                        _ago(a['timestamp']?.toString() ?? ''),
                        style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _eventIcon(String event) {
    switch (event) {
      case 'collected':
        return Icons.add_circle_outline;
      case 'picked_up':
        return Icons.directions_bike;
      case 'hub_received':
        return Icons.warehouse_outlined;
      case 'in_transit':
        return Icons.local_shipping_outlined;
      case 'lab_received':
        return Icons.biotech_outlined;
      case 'completed':
        return Icons.check_circle_outline;
      case 'lost':
        return Icons.error_outline;
      default:
        return Icons.circle_outlined;
    }
  }

  String _ago(String ts) {
    try {
      final dt = DateTime.parse(ts);
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (_) {
      return ts;
    }
  }
}

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------
class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.color, this.small = false});
  final String label;
  final Color color;
  final bool small;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
          horizontal: small ? 8 : 10, vertical: small ? 3 : 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: small ? 11 : 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _EmptyChart extends StatelessWidget {
  const _EmptyChart(this.theme);
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bar_chart_rounded,
              size: 32, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(height: 8),
          Text('No data yet',
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
class _DashboardSkeleton extends StatelessWidget {
  const _DashboardSkeleton();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    Widget box(double h, {double? w}) => Container(
          height: h,
          width: w,
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(14),
          ),
        );
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        box(28, w: 220),
        const SizedBox(height: 8),
        box(16, w: 160),
        const SizedBox(height: 24),
        LayoutBuilder(builder: (context, c) {
          final cols = c.maxWidth >= 720 ? 4 : (c.maxWidth >= 480 ? 2 : 1);
          final w = (c.maxWidth - 16 * (cols - 1)) / cols;
          return Wrap(
            spacing: 16,
            runSpacing: 16,
            children:
                List.generate(4, (_) => SizedBox(width: w, child: box(140))),
          );
        }),
        const SizedBox(height: 16),
        box(220),
        const SizedBox(height: 16),
        box(260),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
num _num(dynamic v) {
  if (v is num) return v;
  if (v is String) return num.tryParse(v) ?? 0;
  return 0;
}

String _fmt(num v) {
  final i = v.round();
  return i.toString().replaceAllMapped(
        RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
        (m) => '${m[1]},',
      );
}
