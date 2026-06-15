import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/auth_provider.dart';

class _Step {
  const _Step(this.icon, this.color, this.title, this.body);
  final IconData icon;
  final Color color;
  final String title;
  final String body;
}

/// First-login walkthrough. Role-specific slides that teach the key actions for
/// the signed-in person. Shown once per user (tracked in SharedPreferences),
/// re-openable from Settings → "How it works".
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  static String _key(String? userId) => 'onboarded_${userId ?? 'anon'}';

  /// True if this user still needs the walkthrough.
  static Future<bool> shouldShow(String? userId) async {
    final prefs = await SharedPreferences.getInstance();
    return !(prefs.getBool(_key(userId)) ?? false);
  }

  static Future<void> markDone(String? userId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key(userId), true);
  }

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<_Step> _stepsFor(String role) {
    const blue = Color(0xFF3B82F6);
    const green = Color(0xFF16A34A);
    const amber = Color(0xFFF59E0B);
    const purple = Color(0xFF8B5CF6);

    final welcome = _Step(Icons.waving_hand, green, 'Welcome to NSRTMS',
        'A quick tour of how you’ll get things done. You can reopen this any time from Settings → How it works.');
    final dashboard = _Step(Icons.dashboard, blue, 'Your dashboard',
        'The home tab shows live numbers and recent activity at a glance.');
    final scan = _Step(Icons.qr_code_scanner, purple, 'Scan to advance',
        'Open Scan, point at a sample QR (or type the ID). Each scan moves it to its next stage and records where and when — with GPS.');
    final parcels = _Step(Icons.local_shipping, amber, 'Return parcels',
        'Letters and supplies coming back from the center have PCL- codes. Scan them the same way to move them along; find them under Settings → Return Parcels.');

    switch (role) {
      case 'collector':
        return [
          welcome,
          dashboard,
          const _Step(Icons.science, green, 'Collect samples',
              'Register a new sample in the Samples tab — its QR is generated instantly so it can be tracked end to end.'),
          const _Step(Icons.qr_code_2, purple, 'Look anything up',
              'Use Scan to pull up any sample and see exactly where it is.'),
        ];
      case 'dispatcher':
        return [
          welcome,
          dashboard,
          const _Step(Icons.directions_bike, blue, 'Carry & advance',
              'When you pick up or hand off, open Scan and scan each sample (or a BOX- package) to confirm the move.'),
          parcels,
          const _Step(Icons.my_location, green, 'You’re on the map',
              'While you’re on an active trip, your location is shared so the control room can see your progress.'),
        ];
      case 'hub_officer':
      case 'lab_officer':
        return [
          welcome,
          dashboard,
          const _Step(Icons.inventory, green, 'Accept arrivals',
              'When samples reach you, open Scan to receive them — arrival is confirmed and everyone is notified.'),
          parcels,
        ];
      case 'admin':
        return [
          welcome,
          dashboard,
          const _Step(Icons.science, blue, 'Samples & journeys',
              'Browse every sample and tap its tracker to see — and rate — each handoff.'),
          scan,
          const _Step(Icons.settings, purple, 'Everything else',
              'Profile, alerts, users and return parcels all live under the Settings gear, top-right.'),
        ];
      default:
        return [welcome, dashboard, scan];
    }
  }

  Future<void> _finish() async {
    final auth = context.read<AuthProvider>();
    await OnboardingScreen.markDone(auth.user?.id);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final role = context.read<AuthProvider>().role;
    final steps = _stepsFor(role);
    final isLast = _index == steps.length - 1;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _finish,
                child: const Text('Skip'),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: steps.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (_, i) {
                  final s = steps[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: s.color.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(s.icon, size: 60, color: s.color),
                        ),
                        const SizedBox(height: 36),
                        Text(s.title,
                            textAlign: TextAlign.center,
                            style: theme.textTheme.headlineSmall
                                ?.copyWith(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        Text(s.body,
                            textAlign: TextAlign.center,
                            style: theme.textTheme.bodyLarge?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                                height: 1.4)),
                      ],
                    ),
                  );
                },
              ),
            ),
            // Progress dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(steps.length, (i) {
                final active = i == _index;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: active ? 22 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: active
                        ? theme.colorScheme.primary
                        : theme.colorScheme.onSurfaceVariant
                            .withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(4),
                  ),
                );
              }),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  if (_index > 0)
                    TextButton(
                      onPressed: () => _controller.previousPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeOut),
                      child: const Text('Back'),
                    ),
                  const Spacer(),
                  FilledButton(
                    onPressed: () {
                      if (isLast) {
                        _finish();
                      } else {
                        _controller.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeOut);
                      }
                    },
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 32, vertical: 14),
                    ),
                    child: Text(isLast ? 'Get started' : 'Next'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
