import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:i3dion_spatial_hub_mobile/config/app_config.dart';

typedef AccessTokenProvider = Future<String?> Function();

class ApiClient {
  ApiClient({
    required this.baseUrl,
    this.allowLocalHttpForDevelopment = false,
    this.accessTokenProvider,
  }) : dio = Dio(
         BaseOptions(
           baseUrl: baseUrl,
           connectTimeout: const Duration(seconds: 10),
           receiveTimeout: const Duration(seconds: 20),
           sendTimeout: const Duration(seconds: 20),
         ),
       ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (!permitsUri(options.uri)) {
            handler.reject(
              DioException(
                requestOptions: options,
                message: 'I3DION API requests must use HTTPS.',
                type: DioExceptionType.badCertificate,
              ),
            );
            return;
          }
          if (accessTokenProvider != null &&
              _isApiRequest(options.uri) &&
              !_isAuthenticationRequest(options.uri)) {
            final token = await accessTokenProvider!();
            if (token != null && token.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          handler.next(options);
        },
        onError: _retryTransientGet,
      ),
    );
  }

  factory ApiClient.fromConfig({AccessTokenProvider? accessTokenProvider}) {
    final config = AppConfig.current;
    return ApiClient(
      baseUrl: config.apiBaseUrl,
      accessTokenProvider: accessTokenProvider,
      allowLocalHttpForDevelopment:
          kDebugMode && config.environment == AppEnvironment.development,
    );
  }

  final String baseUrl;
  final bool allowLocalHttpForDevelopment;
  final AccessTokenProvider? accessTokenProvider;
  final Dio dio;

  bool _isApiRequest(Uri uri) {
    final base = Uri.tryParse(baseUrl);
    return base != null &&
        uri.scheme == base.scheme &&
        uri.host.toLowerCase() == base.host.toLowerCase() &&
        uri.port == base.port;
  }

  bool _isAuthenticationRequest(Uri uri) => uri.path.startsWith('/api/auth/');

  bool permitsUri(Uri uri) {
    if (uri.userInfo.isNotEmpty || uri.host.isEmpty) return false;
    if (uri.scheme == 'https') return true;
    return allowLocalHttpForDevelopment &&
        uri.scheme == 'http' &&
        uri.port == 4000 &&
        const {
          'localhost',
          '127.0.0.1',
          '10.0.2.2',
        }.contains(uri.host.toLowerCase());
  }

  Future<void> _retryTransientGet(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    final request = error.requestOptions;
    final attempt = request.extra['i3dion_retry_attempt'] as int? ?? 0;
    final canRetry =
        request.method.toUpperCase() == 'GET' &&
        attempt < 2 &&
        _isTransient(error);

    if (!canRetry) {
      handler.next(error);
      return;
    }

    request.extra['i3dion_retry_attempt'] = attempt + 1;
    await Future<void>.delayed(Duration(milliseconds: 250 * (attempt + 1)));
    try {
      handler.resolve(await dio.fetch<dynamic>(request));
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }

  bool _isTransient(DioException error) {
    return error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.connectionError ||
        const {502, 503, 504}.contains(error.response?.statusCode);
  }
}
