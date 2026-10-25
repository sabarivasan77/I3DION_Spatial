import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:i3dion_spatial_hub_mobile/config/app_config.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ConnectionTestResult {
  const ConnectionTestResult({
    required this.success,
    required this.databaseConnected,
    required this.latencyMs,
    required this.message,
    this.serverTimestamp,
  });

  final bool success;
  final bool databaseConnected;
  final int latencyMs;
  final String message;
  final String? serverTimestamp;
}

class EndpointPreset {
  const EndpointPreset({
    required this.label,
    required this.url,
    required this.description,
  });

  final String label;
  final String url;
  final String description;
}

class ConnectionSettings {
  const ConnectionSettings({
    required this.apiBaseUrl,
    required this.environment,
    this.qrAllowedHosts = const {},
    this.isCustom = false,
  });

  final String apiBaseUrl;
  final AppEnvironment environment;
  final Set<String> qrAllowedHosts;
  final bool isCustom;

  ConnectionSettings copyWith({
    String? apiBaseUrl,
    AppEnvironment? environment,
    Set<String>? qrAllowedHosts,
    bool? isCustom,
  }) =>
      ConnectionSettings(
        apiBaseUrl: apiBaseUrl ?? this.apiBaseUrl,
        environment: environment ?? this.environment,
        qrAllowedHosts: qrAllowedHosts ?? this.qrAllowedHosts,
        isCustom: isCustom ?? this.isCustom,
      );
}

class ConnectionSettingsNotifier extends Notifier<ConnectionSettings> {
  static const _urlKey = 'i3dion.active_api_url';

  static List<EndpointPreset> get presets => [
        const EndpointPreset(
          label: 'Android Emulator',
          url: 'http://10.0.2.2:4000',
          description: 'Connects from Android emulator to local dev machine on port 4000',
        ),
        const EndpointPreset(
          label: 'Localhost / iOS',
          url: 'http://localhost:4000',
          description: 'Connects to local backend on port 4000 (iOS simulator & desktop)',
        ),
        const EndpointPreset(
          label: 'Production Cloud',
          url: 'https://i3-dion-spatial.vercel.app',
          description: 'Live production I3DION Spatial API',
        ),
      ];

  static String defaultLocalUrl() {
    if (!kDebugMode) return AppConfig.current.apiBaseUrl;
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:4000';
    } catch (_) {}
    return 'http://localhost:4000';
  }

  @override
  ConnectionSettings build() {
    final config = AppConfig.current;
    String initialUrl = config.apiBaseUrl;
    
    // In dev / test, if compile-time url was provided, use it
    if (initialUrl.isNotEmpty) {
      return ConnectionSettings(
        apiBaseUrl: initialUrl,
        environment: config.environment,
        qrAllowedHosts: config.qrAllowedHosts,
        isCustom: false,
      );
    }

    _loadPersistedUrl();

    return ConnectionSettings(
      apiBaseUrl: initialUrl,
      environment: config.environment,
      qrAllowedHosts: config.qrAllowedHosts,
      isCustom: false,
    );
  }

  Future<void> _loadPersistedUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_urlKey);
      if (saved != null && saved.trim().isNotEmpty) {
        state = state.copyWith(apiBaseUrl: saved.trim(), isCustom: true);
      }
    } catch (_) {}
  }

  Future<ConnectionTestResult> testConnection([String? targetUrl]) async {
    final urlToTest = (targetUrl ?? state.apiBaseUrl).trim();
    if (urlToTest.isEmpty) {
      return const ConnectionTestResult(
        success: false,
        databaseConnected: false,
        latencyMs: 0,
        message: 'API URL is empty. Please configure an endpoint.',
      );
    }

    final uri = Uri.tryParse(urlToTest);
    if (uri == null || uri.host.isEmpty) {
      return const ConnectionTestResult(
        success: false,
        databaseConnected: false,
        latencyMs: 0,
        message: 'Invalid URL format.',
      );
    }

    final stopwatch = Stopwatch()..start();
    final dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 5),
      ),
    );

    try {
      final healthUri = uri.replace(
        path: '/api/health',
        query: null,
        fragment: null,
      );
      final response = await dio.get<dynamic>(healthUri.toString());
      stopwatch.stop();

      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        final dbStatus = data['database'] == 'connected';
        return ConnectionTestResult(
          success: true,
          databaseConnected: dbStatus,
          latencyMs: stopwatch.elapsedMilliseconds,
          message: dbStatus
              ? 'Database connected (${stopwatch.elapsedMilliseconds}ms)'
              : 'Service reachable, database degraded',
          serverTimestamp: data['timestamp'] as String?,
        );
      }

      return ConnectionTestResult(
        success: true,
        databaseConnected: false,
        latencyMs: stopwatch.elapsedMilliseconds,
        message: 'Endpoint reachable (${stopwatch.elapsedMilliseconds}ms)',
      );
    } on DioException catch (e) {
      stopwatch.stop();
      return ConnectionTestResult(
        success: false,
        databaseConnected: false,
        latencyMs: stopwatch.elapsedMilliseconds,
        message: e.type == DioExceptionType.connectionTimeout
            ? 'Connection timed out (5s)'
            : 'Failed to reach server: ${e.message ?? 'Unknown error'}',
      );
    } catch (e) {
      stopwatch.stop();
      return ConnectionTestResult(
        success: false,
        databaseConnected: false,
        latencyMs: stopwatch.elapsedMilliseconds,
        message: 'Error: $e',
      );
    }
  }

  Future<void> updateEndpoint(String newUrl) async {
    final normalized = newUrl.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_urlKey, normalized);

    final uri = Uri.tryParse(normalized);
    final allowedHosts = Set<String>.from(state.qrAllowedHosts);
    if (uri != null && uri.host.isNotEmpty) {
      allowedHosts.add(uri.host.toLowerCase());
    }

    state = state.copyWith(
      apiBaseUrl: normalized,
      qrAllowedHosts: allowedHosts,
      isCustom: true,
    );
  }

  Future<void> resetToDefault() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_urlKey);
    final config = AppConfig.current;
    state = ConnectionSettings(
      apiBaseUrl: config.apiBaseUrl,
      environment: config.environment,
      qrAllowedHosts: config.qrAllowedHosts,
      isCustom: false,
    );
  }
}

final connectionSettingsProvider =
    NotifierProvider<ConnectionSettingsNotifier, ConnectionSettings>(
  ConnectionSettingsNotifier.new,
);
