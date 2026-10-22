class PublicProduct {
  const PublicProduct({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.modelUrl,
    this.imageUrl,
    this.specs = const {},
  });

  final String id;
  final String name;
  final String category;
  final String description;
  final Uri modelUrl;
  final Uri? imageUrl;
  final Map<String, dynamic> specs;

  factory PublicProduct.fromJson(
    Map<String, dynamic> json, {
    required Uri apiOrigin,
    bool allowLocalHttpForDevelopment = false,
  }) {
    final id = json['id'];
    final name = json['name'];
    final modelUrl =
        json['model_access_url'] ?? json['model_url'] ?? json['modelUrl'];
    if (id is! String ||
        id.isEmpty ||
        name is! String ||
        name.trim().isEmpty ||
        modelUrl is! String ||
        modelUrl.trim().isEmpty) {
      throw const FormatException(
        'The published product is missing its identifier, name, or 3D model.',
      );
    }

    final resolvedModelUrl = _resolveAssetUrl(
      modelUrl,
      apiOrigin,
      allowLocalHttpForDevelopment,
    );
    final imageValue =
        json['image_access_url'] ?? json['image_url'] ?? json['poster_url'];
    final imageUrl = imageValue is String && imageValue.trim().isNotEmpty
        ? _resolveAssetUrl(imageValue, apiOrigin, allowLocalHttpForDevelopment)
        : null;
    final specsValue = json['specs'];

    return PublicProduct(
      id: id,
      name: name.trim(),
      category: json['category'] is String
          ? (json['category'] as String).trim()
          : 'Product',
      description: json['description'] is String
          ? (json['description'] as String).trim()
          : '',
      modelUrl: resolvedModelUrl,
      imageUrl: imageUrl,
      specs: specsValue is Map<String, dynamic> ? specsValue : const {},
    );
  }
}

Uri _resolveAssetUrl(
  String value,
  Uri apiOrigin,
  bool allowLocalHttpForDevelopment,
) {
  final parsed = Uri.tryParse(value.trim());
  if (parsed == null) {
    throw const FormatException('The product contains an invalid asset URL.');
  }
  var resolved = parsed.hasScheme ? parsed : apiOrigin.resolveUri(parsed);
  if (allowLocalHttpForDevelopment &&
      resolved.scheme == 'http' &&
      const {'localhost', '127.0.0.1'}.contains(resolved.host.toLowerCase()) &&
      resolved.port == apiOrigin.port &&
      apiOrigin.scheme == 'http') {
    resolved = apiOrigin.replace(
      path: resolved.path,
      query: resolved.hasQuery ? resolved.query : null,
      fragment: resolved.hasFragment ? resolved.fragment : null,
    );
  }
  if (resolved.scheme != 'https' ||
      resolved.host.isEmpty ||
      resolved.userInfo.isNotEmpty) {
    if (allowLocalHttpForDevelopment &&
        resolved.scheme == 'http' &&
        const {
          'localhost',
          '127.0.0.1',
          '10.0.2.2',
        }.contains(resolved.host.toLowerCase()) &&
        resolved.port == 4000) {
      return resolved;
    }
    throw const FormatException(
      'Published product assets must use secure HTTPS URLs.',
    );
  }
  return resolved;
}
