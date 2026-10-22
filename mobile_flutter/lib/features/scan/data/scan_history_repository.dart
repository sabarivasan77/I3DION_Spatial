import 'dart:convert';

import 'package:i3dion_spatial_hub_mobile/features/scan/domain/content_link.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ScanHistoryRepository {
  static const _storageKey = 'i3dion.scan_history.v1';
  static const _maxItems = 30;

  Future<List<ContentLink>> load() async {
    final preferences = await SharedPreferences.getInstance();
    final values = preferences.getStringList(_storageKey) ?? const [];
    final links = <ContentLink>[];
    for (final value in values) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is String) {
          links.add(ContentLink.fromCanonicalUri(decoded));
        }
      } on FormatException {
        continue;
      } on TypeError {
        continue;
      }
    }
    return links;
  }

  Future<void> add(ContentLink link) async {
    final preferences = await SharedPreferences.getInstance();
    final history = await load();
    final updated = [
      link,
      ...history.where((item) => item.canonicalUri != link.canonicalUri),
    ].take(_maxItems);
    final saved = await preferences.setStringList(
      _storageKey,
      updated.map((item) => jsonEncode(item.canonicalUri)).toList(),
    );
    if (!saved) {
      throw StateError('The scan could not be added to scan history.');
    }
  }

  Future<void> clear() async {
    final preferences = await SharedPreferences.getInstance();
    final removed = await preferences.remove(_storageKey);
    if (!removed) {
      throw StateError('Scan history could not be cleared.');
    }
  }
}
