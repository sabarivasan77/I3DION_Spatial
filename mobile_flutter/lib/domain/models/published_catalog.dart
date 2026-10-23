class PublishedCatalogSummary {
  const PublishedCatalogSummary({
    required this.id,
    required this.name,
    required this.slug,
    required this.productCount,
    this.description = '',
    this.organizationName,
    this.publishedAt,
  });

  final String id;
  final String name;
  final String slug;
  final String description;
  final String? organizationName;
  final DateTime? publishedAt;
  final int productCount;

  factory PublishedCatalogSummary.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final name = json['name'];
    final slug = json['slug'];
    final productCount = json['product_count'];
    if (id is! String ||
        id.trim().isEmpty ||
        name is! String ||
        name.trim().isEmpty ||
        slug is! String ||
        slug.trim().isEmpty ||
        productCount is! num ||
        productCount < 0) {
      throw const FormatException(
        'The published catalog is missing required fields.',
      );
    }

    return PublishedCatalogSummary(
      id: id,
      name: name.trim(),
      slug: slug.trim(),
      description: json['description'] is String
          ? (json['description'] as String).trim()
          : '',
      organizationName: json['organization_name'] is String
          ? (json['organization_name'] as String).trim()
          : null,
      publishedAt: DateTime.tryParse('${json['published_at'] ?? ''}'),
      productCount: productCount.toInt(),
    );
  }
}

class PublishedCatalogPage {
  const PublishedCatalogPage({
    required this.items,
    required this.total,
    required this.limit,
    required this.offset,
    required this.hasMore,
  });

  final List<PublishedCatalogSummary> items;
  final int total;
  final int limit;
  final int offset;
  final bool hasMore;

  factory PublishedCatalogPage.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    final total = json['total'];
    final limit = json['limit'];
    final offset = json['offset'];
    final hasMore = json['hasMore'];
    if (rawItems is! List ||
        total is! num ||
        limit is! num ||
        offset is! num ||
        hasMore is! bool) {
      throw const FormatException(
        'The I3DION API returned an invalid catalog list.',
      );
    }
    if (rawItems.any((item) => item is! Map<String, dynamic>)) {
      throw const FormatException(
        'The I3DION API returned an invalid catalog entry.',
      );
    }

    return PublishedCatalogPage(
      items: rawItems
          .cast<Map<String, dynamic>>()
          .map(PublishedCatalogSummary.fromJson)
          .toList(growable: false),
      total: total.toInt(),
      limit: limit.toInt(),
      offset: offset.toInt(),
      hasMore: hasMore,
    );
  }
}

class PublishedCatalogProduct {
  const PublishedCatalogProduct({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.hasModel,
  });

  final String id;
  final String name;
  final String category;
  final String description;
  final bool hasModel;

  factory PublishedCatalogProduct.fromJson(Map<String, dynamic> json) {
    final id = json['id'] ?? json['productId'] ?? json['product_id'];
    final name = json['name'] ?? json['productName'] ?? json['product_name'];
    if (id is! String ||
        id.trim().isEmpty ||
        name is! String ||
        name.trim().isEmpty) {
      throw const FormatException(
        'A published catalog product is missing its identifier or name.',
      );
    }
    final modelUrl =
        json['model_access_url'] ??
        json['model_url'] ??
        json['modelUrl'] ??
        json['vaultPublicUrl'] ??
        json['vault_public_url'];

    return PublishedCatalogProduct(
      id: id,
      name: name.trim(),
      category: json['category'] is String
          ? (json['category'] as String).trim()
          : 'Product',
      description: json['description'] is String
          ? (json['description'] as String).trim()
          : '',
      hasModel: modelUrl is String && modelUrl.trim().isNotEmpty,
    );
  }
}

class PublishedCatalog {
  const PublishedCatalog({required this.summary, required this.products});

  final PublishedCatalogSummary summary;
  final List<PublishedCatalogProduct> products;

  factory PublishedCatalog.fromJson(Map<String, dynamic> json) {
    final snapshot = json['publishedSnapshot'] ?? json['published_snapshot'];
    final rawProducts = snapshot is Map<String, dynamic>
        ? snapshot['products']
        : null;
    if (rawProducts != null && rawProducts is! List) {
      throw const FormatException(
        'The published catalog contains an invalid product list.',
      );
    }
    final productEntries = rawProducts as List? ?? const [];
    if (productEntries.any((product) => product is! Map<String, dynamic>)) {
      throw const FormatException(
        'The published catalog contains an invalid product entry.',
      );
    }
    final products = productEntries
        .cast<Map<String, dynamic>>()
        .map(PublishedCatalogProduct.fromJson)
        .toList(growable: false);
    final catalogDetails = json['catalog'];
    final catalogId =
        json['id'] ?? (catalogDetails is Map ? catalogDetails['id'] : null);
    final catalogName =
        json['name'] ?? (catalogDetails is Map ? catalogDetails['name'] : null);
    final catalogSlug =
        json['slug'] ?? (catalogDetails is Map ? catalogDetails['slug'] : null);
    final organization = json['organization'];
    final snapshotPublishedAt = snapshot is Map<String, dynamic>
        ? snapshot['publishedAt']
        : null;
    final publishedAt = DateTime.tryParse(
      '${json['publishedAt'] ?? snapshotPublishedAt ?? ''}',
    );
    final summary = PublishedCatalogSummary(
      id: _requiredValue(catalogId, 'id'),
      name: _requiredValue(catalogName, 'name'),
      slug: _requiredValue(catalogSlug, 'slug'),
      description: json['description'] is String
          ? (json['description'] as String).trim()
          : '',
      organizationName:
          organization is Map<String, dynamic> && organization['name'] is String
          ? (organization['name'] as String).trim()
          : null,
      publishedAt: publishedAt,
      productCount: products.length,
    );

    return PublishedCatalog(summary: summary, products: products);
  }
}

String _requiredValue(dynamic value, String key) {
  if (value is! String || value.trim().isEmpty) {
    throw FormatException('The published catalog is missing $key.');
  }
  return value.trim();
}
