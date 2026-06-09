import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/notification_provider.dart';
import '../models/models.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final notifs = context.watch<NotificationProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (notifs.unreadCount > 0)
            TextButton(
              onPressed: () => notifs.markAllAsRead(),
              child: const Text('Mark all read'),
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => notifs.loadNotifications(),
          ),
        ],
      ),
      body: notifs.isLoading
          ? const Center(child: CircularProgressIndicator())
          : notifs.notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_none, size: 64, color: theme.colorScheme.onSurfaceVariant.withOpacity(0.4)),
                      const SizedBox(height: 16),
                      Text('No notifications', style: theme.textTheme.bodyLarge),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: notifs.notifications.length,
                  itemBuilder: (_, i) => _buildNotificationCard(theme, notifs, notifs.notifications[i]),
                ),
    );
  }

  Widget _buildNotificationCard(ThemeData theme, NotificationProvider notifs, NotificationModel notification) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: notification.isRead ? null : theme.colorScheme.primaryContainer.withOpacity(0.3),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _typeColor(notification.type).withOpacity(0.1),
          child: Icon(_typeIcon(notification.type), color: _typeColor(notification.type), size: 20),
        ),
        title: Text(
          notification.title,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(notification.message, style: theme.textTheme.bodySmall),
            const SizedBox(height: 4),
            Text(
              _formatTime(notification.createdAt),
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
          ],
        ),
        trailing: notification.isRead
            ? null
            : IconButton(
                icon: const Icon(Icons.check, size: 18),
                onPressed: () => notifs.markAsRead(notification.id),
              ),
        onTap: notification.isRead ? null : () => notifs.markAsRead(notification.id),
      ),
    );
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'sample_registered': return Colors.blue;
      case 'sample_picked_up': return Colors.orange;
      case 'hub_arrival': return Colors.purple;
      case 'lab_arrival': return Colors.teal;
      case 'sample_delayed': return Colors.amber;
      case 'sample_lost': return Colors.red;
      default: return Colors.grey;
    }
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'sample_registered': return Icons.science;
      case 'sample_picked_up': return Icons.local_shipping;
      case 'hub_arrival': return Icons.warehouse;
      case 'lab_arrival': return Icons.biotech;
      case 'sample_delayed': return Icons.access_time;
      case 'sample_lost': return Icons.report_problem;
      default: return Icons.notifications;
    }
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}
