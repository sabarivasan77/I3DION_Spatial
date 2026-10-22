import 'dart:convert';

import 'package:i3dion_spatial_hub_mobile/domain/models/spatial_item.dart';

class LocalLibraryItem {
  const LocalLibraryItem({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    this.modelPath,
    this.modelSizeBytes,
    this.modelChecksumSha256,
  });

  final String id;
  final String name;
  final String category;
  final String description;
  final String? modelPath;
  final int? modelSizeBytes;
  final String? modelChecksumSha256;

  factory LocalLibraryItem.fromSpatialItem(SpatialItem item) {
    return LocalLibraryItem(
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
    );
  }

  factory LocalLibraryItem.fromJson(String value) {
    final decoded = jsonDecode(value);
    if (decoded is! Map<String, dynamic> ||
        decoded['id'] is! String ||
        decoded['name'] is! String ||
        decoded['category'] is! String ||
        decoded['description'] is! String) {
      throw const FormatException('Saved product data is invalid.');
    }
    final modelFields = [
      decoded['modelPath'],
      decoded['modelSizeBytes'],
      decoded['modelChecksumSha256'],
    ];
    final hasModelFields = modelFields.any((value) => value != null);
    if (hasModelFields &&
        (decoded['modelPath'] is! String ||
            (decoded['modelPath'] as String).trim().isEmpty ||
            decoded['modelSizeBytes'] is! int ||
            (decoded['modelSizeBytes'] as int) <= 0 ||
            decoded['modelChecksumSha256'] is! String ||
            !RegExp(
              r'^[a-f\d]{64}$',
              caseSensitive: false,
            ).hasMatch(decoded['modelChecksumSha256'] as String))) {
      throw const FormatException('Saved offline model metadata is invalid.');
    }
    return LocalLibraryItem(
      id: decoded['id'] as String,
      name: decoded['name'] as String,
      category: decoded['category'] as String,
      description: decoded['description'] as String,
      modelPath: decoded['modelPath'] is String
          ? decoded['modelPath'] as String
          : null,
      modelSizeBytes: decoded['modelSizeBytes'] is int
          ? decoded['modelSizeBytes'] as int
          : null,
      modelChecksumSha256: decoded['modelChecksumSha256'] is String
          ? decoded['modelChecksumSha256'] as String
          : null,
    );
  }

  String toJson() => jsonEncode({
    'id': id,
    'name': name,
    'category': category,
    'description': description,
    if (modelPath != null) 'modelPath': modelPath,
    if (modelSizeBytes != null) 'modelSizeBytes': modelSizeBytes,
    if (modelChecksumSha256 != null) 'modelChecksumSha256': modelChecksumSha256,
  });

  @override
  bool operator ==(Object other) =>
      other is LocalLibraryItem &&
      other.id == id &&
      other.name == name &&
      other.category == category &&
      other.description == description &&
      other.modelPath == modelPath &&
      other.modelSizeBytes == modelSizeBytes &&
      other.modelChecksumSha256 == modelChecksumSha256;

  @override
  int get hashCode => Object.hash(
    id,
    name,
    category,
    description,
    modelPath,
    modelSizeBytes,
    modelChecksumSha256,
  );
}
