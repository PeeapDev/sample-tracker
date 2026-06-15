import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// Centralised design system for NSRTMS.
///
/// Provides a tuned light and dark [ThemeData] pair plus a shared palette of
/// brand and status colors so every screen draws from the same source of truth.
class AppTheme {
  AppTheme._();

  // ---- Brand ---------------------------------------------------------------
  static const Color brandGreen = Color(0xFF1B7A3D);
  static const Color brandGreenLight = Color(0xFF2ECC71);
  static const Color brandGreenDark = Color(0xFF34D399);

  // ---- Status palette (shared by charts, chips, timelines) -----------------
  static const Map<String, Color> _statusColors = {
    'collected': Color(0xFF3B82F6), // blue
    'picked_up': Color(0xFFF97316), // orange
    'hub_received': Color(0xFF8B5CF6), // violet
    'in_transit': Color(0xFFF59E0B), // amber
    'lab_received': Color(0xFF14B8A6), // teal
    'analysis_queue': Color(0xFF6366F1), // indigo
    'completed': Color(0xFF22C55E), // green
    'lost': Color(0xFFEF4444), // red
  };

  static Color statusColor(String status) =>
      _statusColors[status] ?? const Color(0xFF94A3B8);

  static String statusLabel(String status) {
    switch (status) {
      case 'collected':
        return 'Collected';
      case 'picked_up':
        return 'Picked Up';
      case 'hub_received':
        return 'Hub Received';
      case 'in_transit':
        return 'In Transit';
      case 'lab_received':
        return 'Lab Received';
      case 'analysis_queue':
        return 'Analysis Queue';
      case 'completed':
        return 'Completed';
      case 'lost':
        return 'Lost';
      default:
        return status;
    }
  }

  /// A rotating palette used for categorical charts (e.g. disease programs).
  static const List<Color> chartPalette = [
    Color(0xFF3B82F6),
    Color(0xFF22C55E),
    Color(0xFFF59E0B),
    Color(0xFF8B5CF6),
    Color(0xFFEC4899),
    Color(0xFF14B8A6),
    Color(0xFFF97316),
    Color(0xFF6366F1),
  ];

  // ---- Light ---------------------------------------------------------------
  static ThemeData get light {
    const scheme = ColorScheme(
      brightness: Brightness.light,
      primary: brandGreen,
      onPrimary: Colors.white,
      primaryContainer: Color(0xFFCDEFD9),
      onPrimaryContainer: Color(0xFF0A3D1E),
      secondary: Color(0xFF2563EB),
      onSecondary: Colors.white,
      secondaryContainer: Color(0xFFDCE7FF),
      onSecondaryContainer: Color(0xFF0B2C66),
      tertiary: Color(0xFF7C3AED),
      onTertiary: Colors.white,
      tertiaryContainer: Color(0xFFEADDFF),
      onTertiaryContainer: Color(0xFF2A0E5C),
      error: Color(0xFFDC2626),
      onError: Colors.white,
      errorContainer: Color(0xFFFEE2E2),
      onErrorContainer: Color(0xFF7F1D1D),
      surface: Color(0xFFFFFFFF),
      onSurface: Color(0xFF111827),
      surfaceContainerLowest: Color(0xFFFFFFFF),
      surfaceContainerLow: Color(0xFFF8FAFC),
      surfaceContainer: Color(0xFFF1F5F9),
      surfaceContainerHigh: Color(0xFFE9EEF4),
      surfaceContainerHighest: Color(0xFFE2E8F0),
      onSurfaceVariant: Color(0xFF64748B),
      outline: Color(0xFFCBD5E1),
      outlineVariant: Color(0xFFE2E8F0),
      inverseSurface: Color(0xFF1E293B),
      onInverseSurface: Color(0xFFF8FAFC),
      shadow: Color(0xFF000000),
      scrim: Color(0xFF000000),
    );
    return _base(scheme, const Color(0xFFF4F6FA));
  }

  // ---- Dark ----------------------------------------------------------------
  static ThemeData get dark {
    const scheme = ColorScheme(
      brightness: Brightness.dark,
      primary: brandGreenDark,
      onPrimary: Color(0xFF04261A),
      primaryContainer: Color(0xFF12513A),
      onPrimaryContainer: Color(0xFFB8F5D8),
      secondary: Color(0xFF60A5FA),
      onSecondary: Color(0xFF06183A),
      secondaryContainer: Color(0xFF1E3A66),
      onSecondaryContainer: Color(0xFFD6E6FF),
      tertiary: Color(0xFFC4B5FD),
      onTertiary: Color(0xFF26104F),
      tertiaryContainer: Color(0xFF3F2B73),
      onTertiaryContainer: Color(0xFFEADDFF),
      error: Color(0xFFF87171),
      onError: Color(0xFF3A0A0A),
      errorContainer: Color(0xFF5B1A1A),
      onErrorContainer: Color(0xFFFFD9D6),
      surface: Color(0xFF131A22),
      onSurface: Color(0xFFE6EBF2),
      surfaceContainerLowest: Color(0xFF0B0F14),
      surfaceContainerLow: Color(0xFF121922),
      surfaceContainer: Color(0xFF1A222C),
      surfaceContainerHigh: Color(0xFF222C38),
      surfaceContainerHighest: Color(0xFF2B3645),
      onSurfaceVariant: Color(0xFF94A3B8),
      outline: Color(0xFF334155),
      outlineVariant: Color(0xFF263240),
      inverseSurface: Color(0xFFE6EBF2),
      onInverseSurface: Color(0xFF1A222C),
      shadow: Color(0xFF000000),
      scrim: Color(0xFF000000),
    );
    return _base(scheme, const Color(0xFF0B0F14));
  }

  // ---- Shared builder ------------------------------------------------------
  static ThemeData _base(ColorScheme scheme, Color scaffold) {
    final isDark = scheme.brightness == Brightness.dark;
    final baseText = GoogleFonts.interTextTheme(
      isDark ? ThemeData.dark().textTheme : ThemeData.light().textTheme,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: scaffold,
      textTheme: baseText.apply(
        bodyColor: scheme.onSurface,
        displayColor: scheme.onSurface,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: scheme.surface,
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: scheme.outlineVariant, width: 1),
        ),
      ),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        backgroundColor: scaffold,
        surfaceTintColor: Colors.transparent,
        foregroundColor: scheme.onSurface,
        systemOverlayStyle:
            isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: scheme.onSurface,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: scheme.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        height: 68,
        indicatorColor: scheme.primary.withValues(alpha: 0.16),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return GoogleFonts.inter(
            fontSize: 12,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w600
                : FontWeight.w500,
            color: states.contains(WidgetState.selected)
                ? scheme.primary
                : scheme.onSurfaceVariant,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          return IconThemeData(
            color: states.contains(WidgetState.selected)
                ? scheme.primary
                : scheme.onSurfaceVariant,
          );
        }),
      ),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: scheme.surface,
        elevation: 0,
        indicatorColor: scheme.primary.withValues(alpha: 0.16),
        selectedIconTheme: IconThemeData(color: scheme.primary),
        unselectedIconTheme: IconThemeData(color: scheme.onSurfaceVariant),
        selectedLabelTextStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          color: scheme.primary,
        ),
        unselectedLabelTextStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w500,
          color: scheme.onSurfaceVariant,
        ),
      ),
      dividerTheme: DividerThemeData(
        color: scheme.outlineVariant,
        thickness: 1,
        space: 1,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surfaceContainerLow,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.primary, width: 1.6),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: scheme.surfaceContainer,
        side: BorderSide(color: scheme.outlineVariant),
        labelStyle: GoogleFonts.inter(fontSize: 12, color: scheme.onSurface),
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(horizontal: 16),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
