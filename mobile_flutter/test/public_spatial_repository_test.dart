import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:i3dion_spatial_hub_mobile/data/api_client.dart';
import 'package:i3dion_spatial_hub_mobile/data/public_spatial_repository.dart';

void main() {
  const apiOrigin = 'https://api.i3dion.example';

  test(
    'loads published products with model URLs from the live feed route',
    () async {
      final adapter = _JsonAdapter({
        'items': [
          {
            'id': 'product-1',
            'name': 'Live Pump',
            'category': 'Pumps',
            'description': 'Published product data',
            'model_url': '/uploads/pump.glb',
            'model_access_url':
                '/api/storage/files/pump.glb?expires=1&sig=signature',
            'image_url': '/uploads/pump.png',
            'image_access_url':
                '/api/storage/files/pump.png?expires=1&sig=signature',
          },
          {'id': 'product-2', 'name': 'No model', 'model_url': null},
        ],
      });
      final repository = _repository(apiOrigin, adapter);

      final products = await repository.fetchExploreFeed(query: 'pump');

      expect(adapter.lastRequest?.uri.path, '/api/hub/feed');
      expect(adapter.lastRequest?.uri.queryParameters['search'], 'pump');
      expect(adapter.lastRequest?.uri.queryParameters['paginated'], 'true');
      expect(products, hasLength(1));
      expect(products.single.id, 'product-1');
      expect(
        products.single.modelUrl,
        '$apiOrigin/api/storage/files/pump.glb?expires=1&sig=signature',
      );
      expect(
        products.single.imageUrl,
        '$apiOrigin/api/storage/files/pump.png?expires=1&sig=signature',
      );
    },
  );

  test('uses the existing public product route for UUID details', () async {
    final adapter = _JsonAdapter({
      'id': '143b37ac-62fd-46f4-99bb-f06f995c7dc0',
      'name': 'Database product',
      'category': 'Equipment',
      'model_url': 'https://cdn.i3dion.example/assets/model.glb',
    });
    final repository = _repository(apiOrigin, adapter);

    final product = await repository.fetchProduct(
      '143b37ac-62fd-46f4-99bb-f06f995c7dc0',
    );

    expect(
      adapter.lastRequest?.uri.path,
      '/api/hub/products/143b37ac-62fd-46f4-99bb-f06f995c7dc0',
    );
    expect(product.name, 'Database product');
    expect(
      product.modelUrl.toString(),
      'https://cdn.i3dion.example/assets/model.glb',
    );
  });

  test('uses the existing public route for slug details', () async {
    final adapter = _JsonAdapter({
      'id': 'product-id',
      'name': 'Public product',
      'category': 'Equipment',
      'model_url': 'https://cdn.i3dion.example/assets/model.glb',
    });
    final repository = _repository(apiOrigin, adapter);

    await repository.fetchProduct('public-product');

    expect(
      adapter.lastRequest?.uri.path,
      '/api/public/products/public-product',
    );
  });

  test('uses a signed access URL returned with product details', () async {
    final adapter = _JsonAdapter({
      'id': '143b37ac-62fd-46f4-99bb-f06f995c7dc0',
      'name': 'Database product',
      'model_url': '/uploads/pump.glb',
      'model_access_url': '/api/storage/files/pump.glb?expires=1&sig=signature',
    });
    final repository = _repository(apiOrigin, adapter);

    final product = await repository.fetchProduct(
      '143b37ac-62fd-46f4-99bb-f06f995c7dc0',
    );

    expect(
      product.modelUrl.toString(),
      '$apiOrigin/api/storage/files/pump.glb?expires=1&sig=signature',
    );
  });

  test('rejects products whose model URL is not HTTPS', () async {
    final adapter = _JsonAdapter({
      'items': [
        {
          'id': 'product-1',
          'name': 'Unsafe product',
          'model_url': 'http://untrusted.example/model.glb',
        },
      ],
    });
    final repository = _repository(apiOrigin, adapter);

    await expectLater(
      repository.fetchExploreFeed(),
      throwsA(
        isA<PublicApiException>().having(
          (error) => error.message,
          'message',
          contains('HTTPS'),
        ),
      ),
    );
  });

  test('does not silently fall back when API origin is missing', () async {
    final repository = PublicSpatialRepository(client: ApiClient(baseUrl: ''));

    await expectLater(
      repository.fetchExploreFeed(),
      throwsA(
        isA<PublicApiException>().having(
          (error) => error.message,
          'message',
          contains('Live catalog is not configured'),
        ),
      ),
    );
  });

  test(
    'maps local backend asset URLs to the emulator host in dev mode',
    () async {
      final adapter = _JsonAdapter({
        'id': 'product-1',
        'name': 'Local product',
        'model_url': 'http://localhost:4000/uploads/model.glb',
      });
      final client = ApiClient(
        baseUrl: 'http://10.0.2.2:4000',
        allowLocalHttpForDevelopment: true,
      )..dio.httpClientAdapter = adapter;
      final repository = PublicSpatialRepository(client: client);

      final product = await repository.fetchProduct('product-1');

      expect(
        product.modelUrl.toString(),
        'http://10.0.2.2:4000/uploads/model.glb',
      );
    },
  );
}

PublicSpatialRepository _repository(String baseUrl, _JsonAdapter adapter) {
  final client = ApiClient(baseUrl: baseUrl);
  client.dio.httpClientAdapter = adapter;
  return PublicSpatialRepository(client: client);
}

class _JsonAdapter implements HttpClientAdapter {
  _JsonAdapter(this.response);

  final Object response;
  RequestOptions? lastRequest;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    lastRequest = options;
    return ResponseBody.fromString(
      jsonEncode(response),
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}
