import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import '../theme/responsive.dart';
import 'dashboard_screen.dart';
import 'samples_list_screen.dart';
import 'scan_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';
import 'user_management_screen.dart';

class _NavItem {
  const _NavItem(this.icon, this.selectedIcon, this.label, this.screen);
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final Widget screen;
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  late final List<_NavItem> _items;

  @override
  void initState() {
    super.initState();
    final role = context.read<AuthProvider>().role;
    final isAdmin = role == 'admin';
    final canScan = role == 'dispatcher' ||
        role == 'hub_officer' ||
        role == 'lab_officer' ||
        role == 'admin';

    _items = [
      const _NavItem(Icons.dashboard_outlined, Icons.dashboard, 'Dashboard',
          DashboardScreen()),
      const _NavItem(
          Icons.science_outlined, Icons.science, 'Samples', SamplesListScreen()),
      if (canScan)
        const _NavItem(Icons.qr_code_scanner_outlined, Icons.qr_code_scanner,
            'Scan', ScanScreen()),
      if (isAdmin)
        const _NavItem(Icons.group_outlined, Icons.group, 'Users',
            UserManagementScreen()),
      const _NavItem(Icons.notifications_outlined, Icons.notifications, 'Alerts',
          NotificationsScreen()),
      const _NavItem(
          Icons.person_outlined, Icons.person, 'Profile', ProfileScreen()),
    ];

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().loadUnreadCount();
    });
  }

  Widget _iconFor(_NavItem item, bool selected, int unread) {
    final icon = Icon(selected ? item.selectedIcon : item.icon);
    if (item.label == 'Alerts') {
      return Badge(
        isLabelVisible: unread > 0,
        label: Text('$unread'),
        child: icon,
      );
    }
    return icon;
  }

  @override
  Widget build(BuildContext context) {
    final notifs = context.watch<NotificationProvider>();
    final body = IndexedStack(
      index: _currentIndex,
      children: _items.map((e) => e.screen).toList(),
    );

    if (context.isWide) {
      return Scaffold(
        body: Row(
          children: [
            _SideRail(
              items: _items,
              currentIndex: _currentIndex,
              unread: notifs.unreadCount,
              extended: context.width >= Breakpoints.desktop,
              onSelected: (i) => setState(() => _currentIndex = i),
            ),
            const VerticalDivider(width: 1),
            Expanded(child: body),
          ],
        ),
      );
    }

    return Scaffold(
      body: body,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: [
          for (final item in _items)
            NavigationDestination(
              icon: _iconFor(item,
                  _items.indexOf(item) == _currentIndex, notifs.unreadCount),
              selectedIcon: _iconFor(item, true, notifs.unreadCount),
              label: item.label,
            ),
        ],
      ),
    );
  }
}

class _SideRail extends StatelessWidget {
  const _SideRail({
    required this.items,
    required this.currentIndex,
    required this.unread,
    required this.extended,
    required this.onSelected,
  });

  final List<_NavItem> items;
  final int currentIndex;
  final int unread;
  final bool extended;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    Widget badged(_NavItem item, bool selected) {
      final icon = Icon(selected ? item.selectedIcon : item.icon);
      if (item.label == 'Alerts') {
        return Badge(
          isLabelVisible: unread > 0,
          label: Text('$unread'),
          child: icon,
        );
      }
      return icon;
    }

    return Container(
      width: extended ? 248 : 80,
      color: theme.colorScheme.surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Brand
          Padding(
            padding: EdgeInsets.symmetric(
                horizontal: extended ? 20 : 16, vertical: 20),
            child: Row(
              mainAxisAlignment:
                  extended ? MainAxisAlignment.start : MainAxisAlignment.center,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.science_rounded,
                      color: theme.colorScheme.onPrimary, size: 22),
                ),
                if (extended) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'NSRTMS',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const Divider(height: 1),
          const SizedBox(height: 8),
          // Destinations
          Expanded(
            child: ListView(
              padding: EdgeInsets.symmetric(horizontal: extended ? 12 : 8),
              children: [
                for (var i = 0; i < items.length; i++)
                  _RailTile(
                    icon: badged(items[i], i == currentIndex),
                    label: items[i].label,
                    selected: i == currentIndex,
                    extended: extended,
                    onTap: () => onSelected(i),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),
          // User footer
          Padding(
            padding: EdgeInsets.all(extended ? 16 : 12),
            child: Row(
              mainAxisAlignment:
                  extended ? MainAxisAlignment.start : MainAxisAlignment.center,
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: theme.colorScheme.primaryContainer,
                  child: Text(
                    '${user?.firstName.isNotEmpty == true ? user!.firstName[0] : '?'}'
                    '${user?.lastName.isNotEmpty == true ? user!.lastName[0] : ''}',
                    style: TextStyle(
                      color: theme.colorScheme.onPrimaryContainer,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
                if (extended) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.fullName ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodyMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        Text(
                          user?.roleLabel ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RailTile extends StatelessWidget {
  const _RailTile({
    required this.icon,
    required this.label,
    required this.selected,
    required this.extended,
    required this.onTap,
  });

  final Widget icon;
  final String label;
  final bool selected;
  final bool extended;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color =
        selected ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Material(
        color: selected
            ? theme.colorScheme.primary.withValues(alpha: 0.12)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Container(
            height: 48,
            padding: EdgeInsets.symmetric(horizontal: extended ? 14 : 0),
            child: Row(
              mainAxisAlignment: extended
                  ? MainAxisAlignment.start
                  : MainAxisAlignment.center,
              children: [
                IconTheme(
                  data: IconThemeData(color: color, size: 22),
                  child: icon,
                ),
                if (extended) ...[
                  const SizedBox(width: 14),
                  Text(
                    label,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: selected ? theme.colorScheme.primary : color,
                      fontWeight:
                          selected ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
