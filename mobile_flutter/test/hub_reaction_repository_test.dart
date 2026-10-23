import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:i3dion_spatial_hub_mobile/data/api_client.dart';
import 'package:i3dion_spatial_hub_mobile/data/hub_reaction_repository.dart';

void main() {
  const productId = '11111111-2222-4333-8444-555555555555';

  test('reads whether the current account likes a product', () async {
    final adapter = _ReactionAdapter(
      (_) => _jsonResponse([
        {'content_id': productId, 'content_type': 'product'},
        {
          'content_id': 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
          'content_type': 'catalog',
        },
      ]),
    );
    final repository = HubReactionRepository(client: _client(adapter));

    expect(await repository.isProductLiked(productId), isTrue);
    expect(adapter.lastRequest?.uri.path, '/api/hub/personal/liked');
  });

  test(
    'saves product likes through the authenticated personal route',
    () async {
      final adapter = _ReactionAdapter((_) => _jsonResponse({'success': true}));
      final repository = HubReactionRepository(client: _client(adapter));

      await repository.setProductLiked(productId, liked: true);
      expect(adapter.lastRequest?.method, 'POST');
      expect(adapter.lastRequest?.uri.path, '/api/hub/personal/liked');
      expect(adapter.lastRequest?.data, {
        'contentId': productId,
        'contentType': 'product',
      });
    },
  );

  test(
    'removes product likes through the authenticated personal route',
    () async {
      final adapter = _ReactionAdapter((_) => _jsonResponse({'success': true}));
      final repository = HubReactionRepository(client: _client(adapter));

      await repository.setProductLiked(productId, liked: false);
      expect(adapter.lastRequest?.method, 'DELETE');
      expect(
        adapter.lastRequest?.uri.path,
        '/api/hub/personal/liked/$productId',
      );
    },
  );

  test(
    'rejects non-UUID product identifiers before sending a request',
    () async {
      final adapter = _ReactionAdapter((_) => _jsonResponse({'success': true}));
      final repository = HubReactionRepository(client: _client(adapter));

      await expectLater(
        repository.setProductLiked('not-a-product-id', liked: true),
        throwsA(isA<HubReactionException>()),
      );
      expect(adapter.lastRequest, isNull);
    },
  );
}

ApiClient _client(_ReactionAdapter adapter) {
  final client = ApiClient(baseUrl: 'https://api.example.invalid');
  client.dio.httpClientAdapter = adapter;
  return client;
}

ResponseBody _jsonResponse(Object body) => ResponseBody.fromString(
  jsonEncode(body),
  200,
  headers: {
    Headers.contentTypeHeader: [Headers.jsonContentType],
  },
);

class _ReactionAdapter implements HttpClientAdapter {
  _ReactionAdapter(this.respond);

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
