import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/sample_provider.dart';
import 'providers/dispatch_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/dashboard_provider.dart';
import 'providers/connectivity_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/admin_users_provider.dart';
import 'services/api_service.dart';
import 'services/offline_sync_service.dart';
import 'services/reachability_service.dart';
import 'services/sync_engine.dart';
import 'screens/splash_screen.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Always-on offline sync: probes the backend on a low-cost loop and flushes
  // queued writes whenever real internet appears (incl. after wake-from-sleep).
  final syncEngine = SyncEngine(
    offline: OfflineSyncService(ApiService()),
    reachability: ReachabilityService(baseUrl: ApiService.baseUrl),
  )..start();

  runApp(NSRTMSApp(syncEngine: syncEngine));
}

class NSRTMSApp extends StatelessWidget {
  const NSRTMSApp({super.key, required this.syncEngine});

  final SyncEngine syncEngine;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
        ChangeNotifierProvider<SyncEngine>.value(value: syncEngine),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProxyProvider<AuthProvider, SampleProvider>(
          create: (_) => SampleProvider(),
          update: (_, auth, prev) => prev!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, DispatchProvider>(
          create: (_) => DispatchProvider(),
          update: (_, auth, prev) => prev!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, NotificationProvider>(
          create: (_) => NotificationProvider(),
          update: (_, auth, prev) => prev!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, DashboardProvider>(
          create: (_) => DashboardProvider(),
          update: (_, auth, prev) => prev!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, AdminUsersProvider>(
          create: (_) => AdminUsersProvider(),
          update: (_, auth, prev) => prev!..updateAuth(auth),
        ),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) => MaterialApp(
          title: 'NSRTMS',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light,
          darkTheme: AppTheme.dark,
          themeMode: themeProvider.mode,
          home: const SplashScreen(),
        ),
      ),
    );
  }
}
