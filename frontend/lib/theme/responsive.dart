import 'package:flutter/widgets.dart';

/// Layout breakpoints used across the app shell and dashboards.
class Breakpoints {
  static const double mobile = 640;
  static const double tablet = 1024;
  static const double desktop = 1440;
}

enum ScreenSize { mobile, tablet, desktop }

extension ResponsiveContext on BuildContext {
  double get width => MediaQuery.sizeOf(this).width;

  ScreenSize get screenSize {
    final w = width;
    if (w < Breakpoints.mobile) return ScreenSize.mobile;
    if (w < Breakpoints.tablet) return ScreenSize.tablet;
    return ScreenSize.desktop;
  }

  bool get isMobile => screenSize == ScreenSize.mobile;
  bool get isTablet => screenSize == ScreenSize.tablet;
  bool get isDesktop => screenSize == ScreenSize.desktop;

  /// True once the viewport is wide enough to show a persistent side rail.
  bool get isWide => width >= Breakpoints.tablet;

  /// Pick a value based on the current breakpoint, falling back downward.
  T responsive<T>({required T mobile, T? tablet, T? desktop}) {
    switch (screenSize) {
      case ScreenSize.desktop:
        return desktop ?? tablet ?? mobile;
      case ScreenSize.tablet:
        return tablet ?? mobile;
      case ScreenSize.mobile:
        return mobile;
    }
  }
}
