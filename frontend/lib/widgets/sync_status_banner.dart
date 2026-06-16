import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/sync_engine.dart';

/// Thin, non-intrusive strip that surfaces offline / pending-sync state.
///
/// Driven by the always-on [SyncEngine]:
///  * offline                → amber "You're offline" with the pending count
///  * online + pending > 0   → blue "Syncing N change(s)…"
///  * online + nothing queued → renders nothing (zero height)
///
/// Drop it directly above a screen's body; it collapses to nothing when there's
/// nothing to say, so it never steals space in the normal online case.
class SyncStatusBanner extends StatelessWidget {
  const SyncStatusBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final engine = context.watch<SyncEngine>();
    final pending = engine.pending;
    final offline = !engine.online;

    // Nothing to report: online and the outbox is empty.
    if (!offline && pending == 0) return const SizedBox.shrink();

    final Color bg;
    final IconData icon;
    final String text;

    if (offline) {
      bg = Colors.orange.shade700;
      icon = Icons.cloud_off;
      text = pending > 0
          ? "You're offline — $pending change${pending == 1 ? '' : 's'} will sync when reconnected"
          : "You're offline — showing saved data";
    } else {
      // Online with work to push.
      bg = Colors.blue.shade700;
      icon = engine.status == SyncStatus.syncing
          ? Icons.sync
          : Icons.cloud_upload_outlined;
      text =
          'Syncing $pending change${pending == 1 ? '' : 's'}…';
    }

    return Material(
      color: bg,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Icon(icon, size: 16, color: Colors.white),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  text,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w500),
                ),
              ),
              if (engine.online && pending > 0)
                TextButton(
                  onPressed: () => engine.syncNow(),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    minimumSize: const Size(0, 28),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Sync now'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
