import 'dart:convert';
import 'package:i3dion_spatial_hub_mobile/data/hub_reaction_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PendingLikeAction {
  const PendingLikeAction({
    required this.productId,
    required this.liked,
    required this.timestamp,
  });

  final String productId;
  final bool liked;
  final DateTime timestamp;

  Map<String, dynamic> toJson() => {
    'productId': productId,
    'liked': liked,
    'timestamp': timestamp.toIso8601String(),
  };

  factory PendingLikeAction.fromJson(Map<String, dynamic> json) =>
      PendingLikeAction(
        productId: json['productId'] as String,
        liked: json['liked'] as bool,
        timestamp: DateTime.parse(json['timestamp'] as String),
      );
}

class OfflineSyncRepository {
  static const _pendingLikesKey = 'i3dion.offline_likes_queue.v1';

  Future<List<PendingLikeAction>> getPendingLikes() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = prefs.getStringList(_pendingLikesKey) ?? const [];
      return list
          .map((item) => PendingLikeAction.fromJson(jsonDecode(item) as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> enqueueLike(String productId, {required bool liked}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final current = await getPendingLikes();
      final updated = [
        ...current.where((action) => action.productId != productId),
        PendingLikeAction(
          productId: productId,
          liked: liked,
          timestamp: DateTime.now().toUtc(),
        ),
      ];
      await prefs.setStringList(
        _pendingLikesKey,
        updated.map((item) => jsonEncode(item.toJson())).toList(),
      );
    } catch (_) {}
  }

  Future<int> syncPending(HubReactionRepository reactionRepository) async {
    final pending = await getPendingLikes();
    if (pending.isEmpty) return 0;

    int syncedCount = 0;
    final remaining = <PendingLikeAction>[];

    for (final action in pending) {
      try {
        await reactionRepository.setProductLiked(action.productId, liked: action.liked);
        syncedCount++;
      } catch (_) {
        remaining.add(action);
      }
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(
        _pendingLikesKey,
        remaining.map((item) => jsonEncode(item.toJson())).toList(),
      );
    } catch (_) {}

    return syncedCount;
  }

  Future<void> clearPending() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_pendingLikesKey);
    } catch (_) {}
  }
}
