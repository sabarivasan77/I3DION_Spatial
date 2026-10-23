import 'package:dio/dio.dart';
import 'package:i3dion_spatial_hub_mobile/data/api_client.dart';

class HubReactionException implements Exception {
  const HubReactionException(this.message);

  final String message;

  @override
  String toString() => message;
}

class HubReactionRepository {
  HubReactionRepository({required this.client});

  final ApiClient client;

  Future<bool> isProductLiked(String productId) async {
    try {
      final response = await client.dio.get<dynamic>('/api/hub/personal/liked');
      if (response.data is! List) {
        throw const HubReactionException(
          'The I3DION service returned an invalid likes response.',
        );
      }
      return (response.data as List).whereType<Map<String, dynamic>>().any(
        (item) =>
            item['content_type'] == 'product' &&
            item['content_id'] == productId,
      );
    } on DioException catch (error) {
      throw _exceptionFor(error);
    }
  }

  Future<void> setProductLiked(String productId, {required bool liked}) async {
    if (!_isUuid(productId)) {
      throw const HubReactionException(
        'This product cannot be liked until it has a published product ID.',
      );
    }
    try {
      final response = liked
          ? await client.dio.post<dynamic>(
              '/api/hub/personal/liked',
              data: {'contentId': productId, 'contentType': 'product'},
            )
          : await client.dio.delete<dynamic>(
              '/api/hub/personal/liked/${Uri.encodeComponent(productId)}',
            );
      if (response.data is! Map<String, dynamic> ||
          response.data['success'] != true) {
        throw const HubReactionException(
          'The I3DION service could not confirm the saved like.',
        );
      }
    } on DioException catch (error) {
      throw _exceptionFor(error);
    }
  }

  bool _isUuid(String value) => RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
  ).hasMatch(value);

  HubReactionException _exceptionFor(DioException error) {
    final status = error.response?.statusCode;
    if (status == 401) {
      return const HubReactionException(
        'Your sign-in has expired. Sign in again to use reactions.',
      );
    }
    if (status == 403) {
      return const HubReactionException(
        'This account is not allowed to react to this product.',
      );
    }
    if (status == 404) {
      return const HubReactionException(
        'This product is no longer available for reactions.',
      );
    }
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return const HubReactionException(
        'Could not reach I3DION. Check your connection and try again.',
      );
    }
    return const HubReactionException(
      'The reaction could not be saved. Please try again.',
    );
  }
}
