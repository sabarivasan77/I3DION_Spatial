import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:i3dion_spatial_hub_mobile/data/auth_repository.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/auth_session.dart';

void main() {
  const accessToken = 'short-lived-access-token';
  const refreshToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

  test(
    'stores only tokens and account details after successful login',
    () async {
      final store = _MemorySecureSessionStore();
      final adapter = _AuthAdapter(
        (options) => ResponseBody.fromString(
          jsonEncode({
            'token': accessToken,
            'user': {
              'id': 'user-1',
              'name': 'Alex Example',
              'email': 'alex@example.com',
              'role': 'Sales User',
              'organizationId': 'org-1',
            },
          }),
          200,
          headers: {
            'content-type': ['application/json'],
            'set-cookie': [
              'i3dion_refresh_token=$refreshToken; Path=/api/auth; HttpOnly',
            ],
          },
        ),
      );
      final repository = _repository(adapter, store);

      final result = await repository.login(
        email: ' alex@example.com ',
        password: 'do-not-persist-this-password',
      );

      expect(result.mfaRequired, isFalse);
      expect(result.session?.name, 'Alex Example');
      expect(result.session?.organizationId, 'org-1');
      expect(adapter.lastRequest?.uri.path, '/api/auth/login');
      expect(adapter.lastRequest?.data['email'], 'alex@example.com');
      final stored = jsonDecode(store.value!) as Map<String, dynamic>;
      expect(stored['accessToken'], accessToken);
      expect(stored['refreshToken'], refreshToken);
      expect(stored.containsKey('password'), isFalse);
      expect(store.value, isNot(contains('do-not-persist-this-password')));
    },
  );

  test('returns MFA requirement without storing a partial session', () async {
    final store = _MemorySecureSessionStore();
    final adapter = _AuthAdapter(
      (_) => ResponseBody.fromString(
        jsonEncode({'mfaRequired': true, 'message': 'Code required'}),
        200,
        headers: {
          'content-type': ['application/json'],
        },
      ),
    );
    final repository = _repository(adapter, store);

    final result = await repository.login(
      email: 'alex@example.com',
      password: 'provided-only-in-memory',
    );

    expect(result.mfaRequired, isTrue);
    expect(result.session, isNull);
    expect(store.value, isNull);
    expect(adapter.lastRequest?.data['mfaCode'], isNull);
  });

  test('refresh rotates access and refresh tokens in secure storage', () async {
    final store = _MemorySecureSessionStore(
      value: jsonEncode(_session().toJson()),
    );
    const rotatedToken = 'ZYXWVUTSRQPONMLKJIHGFEDCBA9876543210abcd';
    final adapter = _AuthAdapter(
      (_) => ResponseBody.fromString(
        jsonEncode({'token': 'rotated-access-token', 'role': 'Manager'}),
        200,
        headers: {
          'content-type': ['application/json'],
          'set-cookie': [
            'i3dion_refresh_token=$rotatedToken; Path=/api/auth; HttpOnly',
          ],
        },
      ),
    );
    final repository = _repository(adapter, store);

    final restored = await repository.restoreSession();

    expect(adapter.lastRequest?.uri.path, '/api/auth/refresh');
    expect(adapter.lastRequest?.data['refreshToken'], refreshToken);
    expect(restored?.accessToken, 'rotated-access-token');
    expect(restored?.refreshToken, rotatedToken);
    expect(restored?.role, 'Manager');
  });

  test('clears an expired refresh session', () async {
    final store = _MemorySecureSessionStore(
      value: jsonEncode(_session().toJson()),
    );
    final adapter = _AuthAdapter(
      (_) => ResponseBody.fromString(
        jsonEncode({'error': 'Invalid refresh token'}),
        401,
        headers: {
          'content-type': ['application/json'],
        },
      ),
    );
    final repository = _repository(adapter, store);

    expect(await repository.restoreSession(), isNull);
    expect(store.value, isNull);
  });

  test('logout revokes the server session and clears secure storage', () async {
    final store = _MemorySecureSessionStore(value: 'stored session');
    final adapter = _AuthAdapter(
      (_) => ResponseBody.fromString(
        jsonEncode({'message': 'Logged out successfully'}),
        200,
        headers: {
          'content-type': ['application/json'],
        },
      ),
    );
    final repository = _repository(adapter, store);

    await repository.logout(_session());

    expect(adapter.lastRequest?.uri.path, '/api/auth/logout');
    expect(adapter.lastRequest?.data['refreshToken'], refreshToken);
    expect(store.value, isNull);
  });

  test('maps incorrect credentials to a user-safe message', () async {
    final adapter = _AuthAdapter(
      (_) => ResponseBody.fromString(
        jsonEncode({'error': 'Invalid credentials'}),
        401,
        headers: {
          'content-type': ['application/json'],
        },
      ),
    );
    final repository = _repository(adapter, _MemorySecureSessionStore());

    await expectLater(
      repository.login(email: 'alex@example.com', password: 'incorrect'),
      throwsA(
        isA<AuthException>().having(
          (error) => error.message,
          'message',
          'Email, password, or MFA code is incorrect.',
        ),
      ),
    );
  });
}

AuthRepository _repository(_AuthAdapter adapter, SecureSessionStore store) {
  final dio = Dio(BaseOptions(baseUrl: 'https://api.example.invalid'))
    ..httpClientAdapter = adapter;
  return AuthRepository(dio: dio, store: store);
}

AuthSession _session() => const AuthSession(
  accessToken: 'old-access-token',
  refreshToken: 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
  id: 'user-1',
  name: 'Alex Example',
  email: 'alex@example.com',
  role: 'Sales User',
  organizationId: 'org-1',
);

class _MemorySecureSessionStore implements SecureSessionStore {
  _MemorySecureSessionStore({this.value});

  String? value;

  @override
  Future<void> delete() async => value = null;

  @override
  Future<String?> read() async => value;

  @override
  Future<void> write(String value) async => this.value = value;
}

class _AuthAdapter implements HttpClientAdapter {
  _AuthAdapter(this.respond);

  final ResponseBody Function(RequestOptions options) respond;
  RequestOptions? lastRequest;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    lastRequest = options;
    return respond(options);
  }

  @override
  void close({bool force = false}) {}
}
