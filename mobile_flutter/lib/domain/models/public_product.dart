class PublicProduct {
  const PublicProduct({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.modelUrl,
    this.imageUrl,
    this.specs = const {},
    this.modelSizeBytes,
    this.modelChecksumSha256,
    this.isOffline = false,
  });

  final String id;
  final String name;
  final String category;
  final String description;
  final Uri modelUrl;
  final Uri? imageUrl;
  final Map<String, dynamic> specs;
  final int? modelSizeBytes;
  final String? modelChecksumSha256;
  final bool isOffline;

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
      modelSizeBytes: _positiveInteger(json['model_size_bytes']),
      modelChecksumSha256: _sha256(json['model_checksum_sha256']),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'category': category,
    'description': description,
    'model_url': modelUrl.toString(),
    if (imageUrl != null) 'image_url': imageUrl.toString(),
    'specs': specs,
    if (modelSizeBytes != null) 'model_size_bytes': modelSizeBytes,
    if (modelChecksumSha256 != null)
      'model_checksum_sha256': modelChecksumSha256,
    'isOffline': isOffline,
  };

  PublicProduct copyWith({
    String? id,
    String? name,
    String? category,
    String? description,
    Uri? modelUrl,
    Uri? imageUrl,
    Map<String, dynamic>? specs,
    int? modelSizeBytes,
    String? modelChecksumSha256,
    bool? isOffline,
  }) => PublicProduct(
    id: id ?? this.id,
    name: name ?? this.name,
    category: category ?? this.category,
    description: description ?? this.description,
    modelUrl: modelUrl ?? this.modelUrl,
    imageUrl: imageUrl ?? this.imageUrl,
    specs: specs ?? this.specs,
    modelSizeBytes: modelSizeBytes ?? this.modelSizeBytes,
    modelChecksumSha256: modelChecksumSha256 ?? this.modelChecksumSha256,
    isOffline: isOffline ?? this.isOffline,
  );
}

int? _positiveInteger(dynamic value) {
  final number = value is num ? value.toInt() : int.tryParse('$value');
  return number != null && number > 0 ? number : null;
}

String? _sha256(dynamic value) {
  if (value is String &&
      RegExp(r'^[a-f\d]{64}$', caseSensitive: false).hasMatch(value)) {
    return value.toLowerCase();
  }
  return null;
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
