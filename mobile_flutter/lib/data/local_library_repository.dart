import 'package:i3dion_spatial_hub_mobile/domain/models/local_library_item.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalLibraryRepository {
  static const _savedKey = 'i3dion.saved_products.v1';
  static const _recentKey = 'i3dion.recent_products.v1';
  static const _offlineKey = 'i3dion.offline_models.v1';
  static const _maxSaved = 100;
  static const _maxRecent = 30;

  Future<List<LocalLibraryItem>> loadSaved() => _load(_savedKey);

  Future<List<LocalLibraryItem>> loadRecent() => _load(_recentKey);

  Future<List<LocalLibraryItem>> loadOfflineModels() => _load(_offlineKey);

  Future<void> saveOfflineModel(LocalLibraryItem item) async {
    if (item.modelPath == null ||
        item.modelPath!.trim().isEmpty ||
        item.modelSizeBytes == null ||
        item.modelSizeBytes! <= 0 ||
        item.modelChecksumSha256 == null ||
        !RegExp(
          r'^[a-f\d]{64}$',
          caseSensitive: false,
        ).hasMatch(item.modelChecksumSha256!)) {
      throw ArgumentError('A verified local model is required.');
    }
    final current = await loadOfflineModels();
    await _save(_offlineKey, [
      item,
      ...current.where((existing) => existing.id != item.id),
    ]);
  }

  Future<void> removeOfflineModel(String id) async {
    final current = await loadOfflineModels();
    await _save(_offlineKey, current.where((item) => item.id != id));
  }

  Future<void> setSaved(LocalLibraryItem item, {required bool saved}) async {
    final current = await loadSaved();
    final updated = [
      if (saved) item,
      ...current.where((existing) => existing.id != item.id),
    ].take(_maxSaved);
    await _save(_savedKey, updated);
  }

  Future<void> recordViewed(LocalLibraryItem item) async {
    final current = await loadRecent();
    final updated = [
      item,
      ...current.where((existing) => existing.id != item.id),
    ].take(_maxRecent);
    await _save(_recentKey, updated);
  }

  Future<void> clearRecent() async {
    final preferences = await SharedPreferences.getInstance();
    final removed = await preferences.remove(_recentKey);
    if (!removed) {
      throw StateError('Recently viewed products could not be cleared.');
    }
  }

  Future<void> replaceRecent(Iterable<LocalLibraryItem> items) =>
      _save(_recentKey, items.take(_maxRecent));

  Future<List<LocalLibraryItem>> _load(String key) async {
    final preferences = await SharedPreferences.getInstance();
    final values = preferences.getStringList(key) ?? const <String>[];
    return values.map(LocalLibraryItem.fromJson).toList(growable: false);
  }

  Future<void> _save(String key, Iterable<LocalLibraryItem> items) async {
    final preferences = await SharedPreferences.getInstance();
    final saved = await preferences.setStringList(
      key,
      items.map((item) => item.toJson()).toList(growable: false),
    );
    if (!saved) {
      throw StateError('Your product library could not be updated.');
    }
  }
}
