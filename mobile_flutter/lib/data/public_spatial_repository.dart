import 'package:dio/dio.dart';
import 'package:i3dion_spatial_hub_mobile/data/api_client.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/public_product.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/spatial_item.dart';
import 'package:i3dion_spatial_hub_mobile/domain/repositories/spatial_repository.dart';

class PublicApiException implements Exception {
  const PublicApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

class PublicSpatialRepository implements SpatialRepository {
  PublicSpatialRepository({required this.client});

  final ApiClient client;

  Uri get _apiOrigin {
    final value = client.baseUrl.trim();
    final uri = Uri.tryParse(value);
    if (uri == null ||
        !client.permitsUri(uri) ||
        uri.host.isEmpty ||
        uri.userInfo.isNotEmpty ||
        uri.hasQuery ||
        uri.hasFragment ||
        (uri.path.isNotEmpty && uri.path != '/')) {
      throw const PublicApiException(
        'Live catalog is not configured. Set API_BASE_URL to the HTTPS '
        'origin of the I3DION backend.',
      );
    }
    return uri.replace(path: '', query: null, fragment: null);
  }

  @override
  Future<List<SpatialItem>> fetchExploreFeed({String? query}) async {
    final origin = _apiOrigin;
    try {
      final response = await client.dio.get<dynamic>(
        '/api/hub/feed',
        queryParameters: {
          'paginated': 'true',
          'limit': 50,
          'sort': 'popular',
          if (query != null && query.trim().isNotEmpty) 'search': query.trim(),
        },
      );
      final items = _extractItems(response.data);
      return items
          .map(
            (product) => PublicProduct.fromJson(
              product,
              apiOrigin: origin,
              allowLocalHttpForDevelopment: client.allowLocalHttpForDevelopment,
            ),
          )
          .map(
            (product) => SpatialItem(
              id: product.id,
              name: product.name,
              category: product.category,
              description: product.description,
              modelUrl: product.modelUrl.toString(),
              imageUrl: product.imageUrl?.toString(),
            ),
          )
          .toList(growable: false);
    } on DioException catch (error) {
      throw PublicApiException(_messageFor(error));
    } on FormatException catch (error) {
      throw PublicApiException(error.message);
    }
  }

  Future<PublicProduct> fetchProduct(String identifier) async {
    final origin = _apiOrigin;
    final isUuid = RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    ).hasMatch(identifier);
    final path = isUuid
        ? '/api/hub/products/${Uri.encodeComponent(identifier)}'
        : '/api/public/products/${Uri.encodeComponent(identifier)}';
    try {
      final response = await client.dio.get<dynamic>(path);
      if (response.data is! Map<String, dynamic>) {
        throw const PublicApiException(
          'The I3DION API returned an invalid product response.',
        );
      }
      return PublicProduct.fromJson(
        response.data as Map<String, dynamic>,
        apiOrigin: origin,
        allowLocalHttpForDevelopment: client.allowLocalHttpForDevelopment,
      );
    } on DioException catch (error) {
      throw PublicApiException(_messageFor(error));
    } on FormatException catch (error) {
      throw PublicApiException(error.message);
    }
  }

  List<Map<String, dynamic>> _extractItems(dynamic data) {
    final dynamic rawItems;
    if (data is List) {
      rawItems = data;
    } else if (data is Map<String, dynamic> && data['items'] is List) {
      rawItems = data['items'];
    } else {
      throw const FormatException(
        'The I3DION API returned an invalid catalog response.',
      );
    }
    return rawItems
        .whereType<Map<String, dynamic>>()
        .where((item) {
          final model = item['model_url'] ?? item['modelUrl'];
          return model is String && model.trim().isNotEmpty;
        })
        .toList(growable: false);
  }

  String _messageFor(DioException error) {
    final status = error.response?.statusCode;
    if (status == 404) {
      return 'This published product is no longer available.';
    }
    if (status == 401 || status == 403) {
      return 'This product is not available to this account.';
    }
    if (status != null && status >= 500) {
      return 'The I3DION catalog service is temporarily unavailable.';
    }
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return 'Could not reach the I3DION catalog. Check your connection '
          'and try again.';
    }
    return 'The I3DION catalog request failed. Please try again.';
  }
}
