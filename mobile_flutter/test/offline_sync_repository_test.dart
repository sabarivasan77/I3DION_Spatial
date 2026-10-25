import 'package:flutter_test/flutter_test.dart';
import 'package:i3dion_spatial_hub_mobile/data/api_client.dart';
import 'package:i3dion_spatial_hub_mobile/data/hub_reaction_repository.dart';
import 'package:i3dion_spatial_hub_mobile/data/offline_sync_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _FakeReactionRepo extends HubReactionRepository {
  _FakeReactionRepo() : super(client: ApiClient(baseUrl: 'https://test.example'));

  final List<String> likedProducts = [];

  @override
  Future<void> setProductLiked(String productId, {required bool liked}) async {
    if (liked) {
      likedProducts.add(productId);
    } else {
      likedProducts.remove(productId);
    }
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('enqueues likes and syncs them when online', () async {
    final repo = OfflineSyncRepository();
    final fakeReactions = _FakeReactionRepo();

    expect(await repo.getPendingLikes(), isEmpty);

    await repo.enqueueLike('uuid-1', liked: true);
    await repo.enqueueLike('uuid-2', liked: true);

    final pending = await repo.getPendingLikes();
    expect(pending.length, 2);
    expect(pending.first.productId, 'uuid-1');

    final syncedCount = await repo.syncPending(fakeReactions);
    expect(syncedCount, 2);
    expect(fakeReactions.likedProducts, contains('uuid-1'));
    expect(fakeReactions.likedProducts, contains('uuid-2'));

    final remaining = await repo.getPendingLikes();
    expect(remaining, isEmpty);
  });
}
