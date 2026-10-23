import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/auth_session.dart';

abstract interface class SecureSessionStore {
  Future<String?> read();
  Future<void> write(String value);
  Future<void> delete();
}

class FlutterSecureSessionStore implements SecureSessionStore {
  FlutterSecureSessionStore({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  static const _sessionKey = 'i3dion.auth.session.v1';
  final FlutterSecureStorage _storage;

  @override
  Future<String?> read() => _storage.read(key: _sessionKey);

  @override
  Future<void> write(String value) =>
      _storage.write(key: _sessionKey, value: value);

  @override
  Future<void> delete() => _storage.delete(key: _sessionKey);
}

class AuthException implements Exception {
  const AuthException(this.message);

  final String message;

  @override
  String toString() => message;
}

class AuthLoginResult {
  const AuthLoginResult({required this.mfaRequired, this.session});

  final bool mfaRequired;
  final AuthSession? session;
}

class AuthRepository {
  AuthRepository({required this.dio, required this.store});

  final Dio dio;
  final SecureSessionStore store;

  Future<AuthLoginResult> login({
    required String email,
    required String password,
    String? mfaCode,
  }) async {
    try {
      final response = await dio.post<dynamic>(
        '/api/auth/login',
        data: {
          'email': email.trim(),
          'password': password,
          if (mfaCode != null && mfaCode.trim().isNotEmpty)
            'mfaCode': mfaCode.trim(),
        },
      );
      final data = _mapResponse(response.data);
      if (data['mfaRequired'] == true) {
        return const AuthLoginResult(mfaRequired: true);
      }
      final user = data['user'];
      if (user is! Map<String, dynamic>) {
        throw const AuthException(
          'The I3DION authentication service returned an invalid account.',
        );
      }
      final token = data['token'];
      final refreshToken = _refreshTokenFromResponse(response);
      if (token is! String || token.isEmpty || refreshToken == null) {
        throw const AuthException(
          'The authentication response did not include a complete secure session.',
        );
      }
      final session = AuthSession(
        accessToken: token,
        refreshToken: refreshToken,
        id: _requiredUserField(user, 'id'),
        name: _requiredUserField(user, 'name'),
        email: _requiredUserField(user, 'email'),
        role: _optionalUserField(user, 'role') ?? 'Viewer',
        organizationId: _optionalUserField(user, 'organizationId'),
      );
      await _save(session);
      return AuthLoginResult(mfaRequired: false, session: session);
    } on DioException catch (error) {
      throw _exceptionFor(error);
    }
  }

  Future<AuthSession?> restoreSession() async {
    final rawSession = await store.read();
    if (rawSession == null) return null;
    final decoded = jsonDecode(rawSession);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Stored account session is invalid.');
    }
    final previous = AuthSession.fromJson(decoded);
    try {
      final response = await dio.post<dynamic>(
        '/api/auth/refresh',
        data: {'refreshToken': previous.refreshToken},
      );
      final data = _mapResponse(response.data);
      final token = data['token'];
      final refreshToken = _refreshTokenFromResponse(response);
      if (token is! String || token.isEmpty || refreshToken == null) {
        throw const AuthException(
          'The I3DION service could not renew the secure session.',
        );
      }
      final session = previous.copyWithTokens(
        accessToken: token,
        refreshToken: refreshToken,
        role: _optionalUserField(data, 'role'),
      );
      await _save(session);
      return session;
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        await store.delete();
        return null;
      }
      throw _exceptionFor(error);
    }
  }

  Future<void> logout(AuthSession session) async {
    try {
      await dio.post<dynamic>(
        '/api/auth/logout',
        data: {'refreshToken': session.refreshToken},
      );
    } on DioException {
      await store.delete();
      throw const AuthException(
        'Signed out on this device, but the server could not revoke the session. '
        'It will expire according to the server session policy.',
      );
    }
    await store.delete();
  }

  Future<void> _save(AuthSession session) =>
      store.write(jsonEncode(session.toJson()));

  Map<String, dynamic> _mapResponse(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    throw const AuthException(
      'The I3DION authentication service returned an invalid response.',
    );
  }

  String _requiredUserField(Map<String, dynamic> user, String key) {
    final value = user[key];
    if (value is! String || value.trim().isEmpty) {
      throw AuthException('The authentication response is missing $key.');
    }
    return value.trim();
  }

  String? _optionalUserField(Map<String, dynamic> user, String key) {
    final value = user[key];
    return value is String && value.trim().isNotEmpty ? value.trim() : null;
  }

  String? _refreshTokenFromResponse(Response<dynamic> response) {
    for (final value in response.headers.map['set-cookie'] ?? const []) {
      final cookie = value.split(';').first.trim();
      const prefix = 'i3dion_refresh_token=';
      if (!cookie.startsWith(prefix)) continue;
      final token = cookie.substring(prefix.length);
      if (RegExp(r'^[A-Za-z0-9_-]{40,}$').hasMatch(token)) return token;
    }
    return null;
  }

  AuthException _exceptionFor(DioException error) {
    final status = error.response?.statusCode;
    if (status == 401) {
      return const AuthException('Email, password, or MFA code is incorrect.');
    }
    if (status == 429) {
      return const AuthException(
        'Too many sign-in attempts. Wait a few minutes and try again.',
      );
    }
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return const AuthException(
        'Could not reach I3DION authentication. Check your connection and try again.',
      );
    }
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'] ?? data['error'];
      if (message is String && message.trim().isNotEmpty) {
        return AuthException(message.trim());
      }
    }
    return const AuthException('Sign-in failed. Please try again.');
  }
}
