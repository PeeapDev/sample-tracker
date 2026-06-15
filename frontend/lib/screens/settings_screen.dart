import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import 'profile_screen.dart';
import 'notifications_screen.dart';
import 'parcels_screen.dart';
import 'user_management_screen.dart';

/// Settings hub — the home for everything that used to clutter the bottom nav
/// (profile, alerts, admin tools). Reached from the gear icon in the app bar.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  void _push(BuildContext context, Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  String _initials(AuthProvider auth) {
    final u = auth.user;
    final f = (u?.firstName.isNotEmpty == true) ? u!.firstName[0] : '?';
    final l = (u?.lastName.isNotEmpty == true) ? u!.lastName[0] : '';
    return '$f$l';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final isAdmin = auth.role == 'admin';
    final unread = context.watch<NotificationProvider>().unreadCount;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          // Account header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: theme.colorScheme.primaryContainer,
                  child: Text(
                    _initials(auth),
                    style: TextStyle(
                      color: theme.colorScheme.onPrimaryContainer,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.fullName ?? '',
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      Text(
                        user?.roleLabel ?? '',
                        style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 24),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Profile'),
            subtitle: const Text('Account details, theme & sign out'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _push(context, const ProfileScreen()),
          ),
          ListTile(
            leading: Badge(
              isLabelVisible: unread > 0,
              label: Text('$unread'),
              child: const Icon(Icons.notifications_outlined),
            ),
            title: const Text('Alerts'),
            subtitle:
                Text(unread > 0 ? '$unread unread' : 'Notifications & updates'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _push(context, const NotificationsScreen()),
          ),
          ListTile(
            leading: const Icon(Icons.local_shipping_outlined),
            title: const Text('Return Parcels'),
            subtitle: const Text('Letters & supplies sent back from the center'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _push(context, const ParcelsScreen()),
          ),
          if (isAdmin)
            ListTile(
              leading: const Icon(Icons.group_outlined),
              title: const Text('User Management'),
              subtitle: const Text('Manage users & roles'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _push(context, const UserManagementScreen()),
            ),
        ],
      ),
    );
  }
}
