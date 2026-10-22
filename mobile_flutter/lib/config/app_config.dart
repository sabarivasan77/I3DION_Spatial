enum AppEnvironment { development, staging, production }

class AppConfig {
  const AppConfig._({
    required this.environment,
    required this.apiBaseUrl,
    required this.qrAllowedHosts,
  });

  static const _environmentName = String.fromEnvironment(
    'APP_ENV',
    defaultValue: 'development',
  );
  static const _apiBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const _qrAllowedHosts = String.fromEnvironment('QR_ALLOWED_HOSTS');

  static AppConfig get current => AppConfig._(
    environment: AppEnvironment.values.firstWhere(
      (environment) => environment.name == _environmentName,
      orElse: () => throw StateError(
        'Unsupported APP_ENV "$_environmentName". '
        'Use development, staging, or production.',
      ),
    ),
    apiBaseUrl: _apiBaseUrl,
    qrAllowedHosts: _qrAllowedHosts
        .split(',')
        .map((host) => host.trim().toLowerCase())
        .where((host) => host.isNotEmpty)
        .toSet(),
  );

  final AppEnvironment environment;
  final String apiBaseUrl;
  final Set<String> qrAllowedHosts;
}
