package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme =
  darkColorScheme(
    primary = Color(0xFF2563EB),
    secondary = Color(0xFF94A3B8),
    tertiary = Color(0xFF64748B),
    background = Color(0xFF0F172A), // Slate 900
    surface = Color(0xFF1E293B), // Slate 800
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
    outline = Color(0xFF334155)
  )

private val LightColorScheme =
  lightColorScheme(
    primary = Color(0xFF2563EB), // Primary Brand Blue
    secondary = Color(0xFF0F172A), // Dark Accent
    tertiary = Color(0xFF64748B),
    background = Color(0xFFFFFFFF), // Primary Background #FFFFFF
    surface = Color(0xFFFFFFFF), // Card Background #FFFFFF
    onPrimary = Color.White,
    onSecondary = Color(0xFF0F172A),
    onTertiary = Color(0xFF64748B),
    onBackground = Color(0xFF0F172A), // Dark Accent #0F172A for important headers/texts
    onSurface = Color(0xFF0F172A),
    outline = Color(0xFFE2E8F0), // Slate 200 border
    surfaceVariant = Color(0xFFF8FAFC), // Secondary Background #F8FAFC
    onSurfaceVariant = Color(0xFF334155) // Slate 700 text
  )

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = false, // Clean Minimalism theme uses light mode as primary
  dynamicColor: Boolean = false, // Keep branded consistency
  content: @Composable () -> Unit,
) {
  val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
