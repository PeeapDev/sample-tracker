import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/web_push.dart';
import 'home_screen.dart';
import 'onboarding_screen.dart';

/// Wraps the home experience and shows the first-login walkthrough once per
/// user, before they land on the dashboard. Keeps HomeScreen itself untouched.
class HomeGate extends StatefulWidget {
  const HomeGate({super.key});

  @override
  State<HomeGate> createState() => _HomeGateState();
}

class _HomeGateState extends State<HomeGate> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeOnboard());
    // Register this device for web push (no-op off the web / if declined).
    registerWebPush();
  }

  Future<void> _maybeOnboard() async {
    final userId = context.read<AuthProvider>().user?.id;
    if (await OnboardingScreen.shouldShow(userId)) {
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const OnboardingScreen(), fullscreenDialog: true),
      );
    }
  }

  @override
  Widget build(BuildContext context) => const HomeScreen();
}
