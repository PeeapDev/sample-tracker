import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'providers/auth_provider.dart';
import 'providers/sample_provider.dart';
import 'providers/dispatch_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/dashboard_provider.dart';
import 'providers/connectivity_provider.dart';
import 'screens/splash_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(const NSRTMSApp());
}

class NSRTMSApp extends StatelessWidget {
  const NSRTMSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
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
      ],
      child: MaterialApp(
        title: 'NSRTMS',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF1B5E20),
            brightness: Brightness.light,
          ),
          textTheme: GoogleFonts.interTextTheme(),
          cardTheme: CardTheme(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 0,
          ),
        ),
        home: const SplashScreen(),
      ),
    );
  }
}
