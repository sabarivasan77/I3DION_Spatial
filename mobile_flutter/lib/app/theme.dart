import 'package:flutter/material.dart';

abstract final class AppColors {
  static const spatialBlue = Color(0xFF2563EB);
  static const deepNavy = Color(0xFF0F172A);
  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
  static const canvas = Color(0xFFF6F8FC);
  static const darkCanvas = Color(0xFF0B1220);
}

abstract final class AppTheme {
  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.spatialBlue,
      brightness: brightness,
      primary: AppColors.spatialBlue,
      secondary: AppColors.success,
      error: AppColors.error,
      surface: isDark ? AppColors.deepNavy : Colors.white,
    );
    final textTheme =
        ThemeData(
          brightness: brightness,
          colorScheme: colorScheme,
        ).textTheme.apply(
          bodyColor: isDark ? const Color(0xFFE2E8F0) : AppColors.deepNavy,
          displayColor: isDark ? Colors.white : AppColors.deepNavy,
          fontFamily: 'Inter',
        );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: isDark ? AppColors.darkCanvas : AppColors.canvas,
      textTheme: textTheme,
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: isDark ? AppColors.deepNavy : Colors.white,
        indicatorColor: AppColors.spatialBlue.withValues(alpha: 0.12),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return TextStyle(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          );
        }),
      ),
      cardTheme: CardThemeData(
        color: isDark ? AppColors.deepNavy : Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: BorderSide(
            color: isDark ? Colors.white12 : const Color(0xFFE7ECF4),
          ),
        ),
      ),
    );
  }
}
