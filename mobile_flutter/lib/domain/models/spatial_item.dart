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
}
