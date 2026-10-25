import 'package:flutter_test/flutter_test.dart';
import 'package:i3dion_spatial_hub_mobile/data/offline_cache_repository.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/spatial_item.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('caches and retrieves explore feed items', () async {
    final repo = OfflineCacheRepository();

    expect(await repo.loadCachedExploreFeed(), isNull);
    expect(await repo.getCachedItemCount(), 0);

    final items = [
      const SpatialItem(
        id: 'p1',
        name: 'Pump 100',
        category: 'Pumps',
        description: 'Heavy duty pump',
        modelUrl: 'https://cdn.example.com/pump.glb',
      ),
      const SpatialItem(
        id: 'p2',
        name: 'Motor 200',
        category: 'Motors',
        description: 'AC induction motor',
        modelUrl: 'https://cdn.example.com/motor.glb',
      ),
    ];

    await repo.cacheExploreFeed(items);

    final cached = await repo.loadCachedExploreFeed();
    expect(cached, isNotNull);
    expect(cached!.length, 2);
    expect(cached.first.name, 'Pump 100');
    expect(cached.last.category, 'Motors');
    expect(await repo.getCachedItemCount(), 2);

    await repo.clearCache();
    expect(await repo.loadCachedExploreFeed(), isNull);
    expect(await repo.getCachedItemCount(), 0);
  });
}
