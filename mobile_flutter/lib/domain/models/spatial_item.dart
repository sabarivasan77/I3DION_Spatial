class SpatialItem {
  const SpatialItem({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.modelUrl,
    this.imageUrl,
  });

  final String id;
  final String name;
  final String category;
  final String description;
  final String modelUrl;
  final String? imageUrl;

  factory SpatialItem.fromJson(Map<String, dynamic> json) => SpatialItem(
    id: json['id'] as String,
    name: json['name'] as String,
    category: json['category'] as String? ?? 'Product',
    description: json['description'] as String? ?? '',
    modelUrl: json['modelUrl'] as String,
    imageUrl: json['imageUrl'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'category': category,
    'description': description,
    'modelUrl': modelUrl,
    if (imageUrl != null) 'imageUrl': imageUrl,
  };
}

