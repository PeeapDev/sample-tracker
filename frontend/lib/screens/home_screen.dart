import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import 'login_screen.dart';
import 'dashboard_screen.dart';
import 'samples_list_screen.dart';
import 'scan_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    final role = context.read<AuthProvider>().role;
    _screens = [
      const DashboardScreen(),
      const SamplesListScreen(),
      if (role == 'dispatcher' || role == 'hub_officer' || role == 'lab_officer' || role == 'admin')
        const ScanScreen(),
      const NotificationsScreen(),
      const ProfileScreen(),
    ];

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().loadUnreadCount();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final notifs = context.watch<NotificationProvider>();

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          const NavigationDestination(
            icon: Icon(Icons.science_outlined),
            selectedIcon: Icon(Icons.science),
            label: 'Samples',
          ),
          if (auth.role == 'dispatcher' || auth.role == 'hub_officer' || auth.role == 'lab_officer' || auth.role == 'admin')
            const NavigationDestination(
              icon: Icon(Icons.qr_code_scanner_outlined),
              selectedIcon: Icon(Icons.qr_code_scanner),
              label: 'Scan',
            ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: notifs.unreadCount > 0,
              label: Text('${notifs.unreadCount}'),
              child: const Icon(Icons.notifications_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: notifs.unreadCount > 0,
              label: Text('${notifs.unreadCount}'),
              child: const Icon(Icons.notifications),
            ),
            label: 'Alerts',
          ),
          const NavigationDestination(
            icon: Icon(Icons.person_outlined),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
