import 'dart:convert';
import 'package:i3dion_spatial_hub_mobile/domain/models/public_product.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/published_catalog.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/spatial_item.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OfflineCacheRepository {
  static const _feedKey = 'i3dion.cache.feed.v1';
  static const _feedTimestampKey = 'i3dion.cache.feed_time.v1';
  static const _catalogsKey = 'i3dion.cache.catalogs.v1';
  static const _productPrefix = 'i3dion.cache.product.';

  Future<void> cacheExploreFeed(List<SpatialItem> items) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonList = items.map((item) => item.toJson()).toList();
      await prefs.setString(_feedKey, jsonEncode(jsonList));
      await prefs.setString(_feedTimestampKey, DateTime.now().toUtc().toIso8601String());
    } catch (_) {}
  }

  Future<List<SpatialItem>?> loadCachedExploreFeed() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_feedKey);
      if (raw == null || raw.isEmpty) return null;
      final decoded = jsonDecode(raw);
      if (decoded is! List) return null;
      return decoded
          .cast<Map<String, dynamic>>()
          .map(SpatialItem.fromJson)
          .toList(growable: false);
    } catch (_) {
      return null;
    }
  }

  Future<DateTime?> getCachedFeedTimestamp() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_feedTimestampKey);
      if (raw == null || raw.isEmpty) return null;
      return DateTime.tryParse(raw);
    } catch (_) {
      return null;
    }
  }

  Future<void> cacheProduct(PublicProduct product) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        '$_productPrefix${product.id}',
        jsonEncode(product.toJson()),
      );
    } catch (_) {}
  }

  Future<PublicProduct?> loadCachedProduct(String id) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('$_productPrefix$id');
      if (raw == null || raw.isEmpty) return null;
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) return null;
      final modelUrlStr = decoded['model_url'] as String?;
      if (modelUrlStr == null) return null;
      return PublicProduct(
        id: decoded['id'] as String,
        name: decoded['name'] as String,
        category: decoded['category'] as String? ?? 'Product',
        description: decoded['description'] as String? ?? '',
        modelUrl: Uri.parse(modelUrlStr),
        imageUrl: decoded['image_url'] != null ? Uri.parse(decoded['image_url'] as String) : null,
        specs: (decoded['specs'] is Map<String, dynamic>) ? decoded['specs'] as Map<String, dynamic> : const {},
        modelSizeBytes: decoded['model_size_bytes'] as int?,
        modelChecksumSha256: decoded['model_checksum_sha256'] as String?,
        isOffline: true,
      );
    } catch (_) {
      return null;
    }
  }

  Future<void> cacheCatalogs(PublishedCatalogPage page) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_catalogsKey, jsonEncode(page.toJson()));
    } catch (_) {}
  }

  Future<PublishedCatalogPage?> loadCachedCatalogs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_catalogsKey);
      if (raw == null || raw.isEmpty) return null;
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) return null;
      return PublishedCatalogPage.fromJson(decoded);
    } catch (_) {
      return null;
    }
  }

  Future<int> getCachedItemCount() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final feed = prefs.getString(_feedKey);
      if (feed == null) return 0;
      final decoded = jsonDecode(feed);
      return decoded is List ? decoded.length : 0;
    } catch (_) {
      return 0;
    }
  }

  Future<void> clearCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_feedKey);
      await prefs.remove(_feedTimestampKey);
      await prefs.remove(_catalogsKey);
      final keys = prefs.getKeys().where((k) => k.startsWith(_productPrefix)).toList();
      for (final key in keys) {
        await prefs.remove(key);
      }
    } catch (_) {}
  }
}
