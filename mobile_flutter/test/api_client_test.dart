import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:i3dion_spatial_hub_mobile/data/api_client.dart';

void main() {
  test('rejects HTTP requests before opening a connection', () async {
    final client = ApiClient(baseUrl: '');

    await expectLater(
      client.dio.get<void>('http://example.com/resource'),
      throwsA(
        isA<DioException>().having(
          (error) => error.message,
          'message',
          'I3DION API requests must use HTTPS.',
        ),
      ),
    );
  });

  test('retries transient GET failures at most twice', () async {
    final client = ApiClient(baseUrl: 'https://api.example.invalid');
    final adapter = _FlakyAdapter();
    client.dio.httpClientAdapter = adapter;

    final response = await client.dio.get<Map<String, dynamic>>('/probe');

    expect(response.statusCode, 200);
    expect(adapter.requestCount, 3);
  });

  test(
    'allows emulator localhost HTTP only when development is explicit',
    () async {
      final client = ApiClient(
        baseUrl: 'http://10.0.2.2:4000',
        allowLocalHttpForDevelopment: true,
      );
      final adapter = _FlakyAdapter();
      client.dio.httpClientAdapter = adapter;

      final response = await client.dio.get<void>('/api/health');

      expect(response.statusCode, 200);
      expect(adapter.requestCount, 3);
    },
  );

  test('rejects non-local HTTP hosts even in development mode', () async {
    final client = ApiClient(
      baseUrl: 'http://api.example.com:4000',
      allowLocalHttpForDevelopment: true,
    );

    await expectLater(
      client.dio.get<void>('/api/health'),
      throwsA(
        isA<DioException>().having(
          (error) => error.message,
          'message',
          'I3DION API requests must use HTTPS.',
        ),
      ),
    );
  });

  test(
    'attaches the secure access token only to same-origin API calls',
    () async {
      final client = ApiClient(
        baseUrl: 'https://api.example.invalid',
        accessTokenProvider: () async => 'secure-access-token',
      );
      final adapter = _RecordingAdapter();
      client.dio.httpClientAdapter = adapter;

      await client.dio.get<void>('/api/hub/personal/liked');
      expect(
        adapter.requests.last.headers['Authorization'],
        'Bearer secure-access-token',
      );

      await client.dio.get<void>('https://cdn.example.invalid/model.glb');
      expect(
        adapter.requests.last.headers.containsKey('Authorization'),
        isFalse,
      );

      await client.dio.post<void>('/api/auth/login');
      expect(
        adapter.requests.last.headers.containsKey('Authorization'),
        isFalse,
      );
    },
  );
}

class _FlakyAdapter implements HttpClientAdapter {
  int requestCount = 0;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requestCount++;
    final statusCode = requestCount < 3 ? 503 : 200;
    return ResponseBody.fromString(
      '{"ok":true}',
      statusCode,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

class _RecordingAdapter implements HttpClientAdapter {
  final requests = <RequestOptions>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    return ResponseBody.fromString(
      '{}',
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}
