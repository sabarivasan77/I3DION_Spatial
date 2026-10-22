import 'package:flutter_test/flutter_test.dart';
import 'package:i3dion_spatial_hub_mobile/data/local_library_repository.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/local_library_item.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  const pump = LocalLibraryItem(
    id: 'pump-1',
    name: 'Centrifugal pump',
    category: 'Pumps',
    description: 'Industrial product',
  );

  test('saved products persist metadata without expiring asset URLs', () async {
    final repository = LocalLibraryRepository();

    await repository.setSaved(pump, saved: true);
    final saved = await repository.loadSaved();

    expect(saved, [pump]);
    expect(saved.single.toJson(), isNot(contains('modelUrl')));
  });

  test('unsaving removes only the selected product', () async {
    final repository = LocalLibraryRepository();
    const valve = LocalLibraryItem(
      id: 'valve-1',
      name: 'Valve',
      category: 'Flow',
      description: '',
    );
    await repository.setSaved(pump, saved: true);
    await repository.setSaved(valve, saved: true);

    await repository.setSaved(pump, saved: false);

    expect(await repository.loadSaved(), [valve]);
  });

  test('recent products move to the front and can be removed', () async {
    final repository = LocalLibraryRepository();
    await repository.recordViewed(pump);
    const valve = LocalLibraryItem(
      id: 'valve-1',
      name: 'Valve',
      category: 'Flow',
      description: '',
    );
    await repository.recordViewed(valve);
    await repository.recordViewed(pump);

    expect(await repository.loadRecent(), [pump, valve]);
    await repository.replaceRecent([valve]);
    expect(await repository.loadRecent(), [valve]);
  });

  test('rejects corrupt local product data explicitly', () async {
    SharedPreferences.setMockInitialValues({
      'i3dion.saved_products.v1': ['not-json'],
    });

    await expectLater(
      LocalLibraryRepository().loadSaved(),
      throwsFormatException,
    );
  });

  test('persists separately indexed offline model metadata', () async {
    final repository = LocalLibraryRepository();
    const offline = LocalLibraryItem(
      id: 'pump-1',
      name: 'Centrifugal pump',
      category: 'Pumps',
      description: 'Industrial product',
      modelPath: r'C:\app\offline\pump.glb',
      modelSizeBytes: 123,
      modelChecksumSha256:
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    );

    await repository.saveOfflineModel(offline);

    expect(await repository.loadOfflineModels(), [offline]);
    await repository.removeOfflineModel(offline.id);
    expect(await repository.loadOfflineModels(), isEmpty);
  });

  test('refuses incomplete offline model records', () async {
    await expectLater(
      LocalLibraryRepository().saveOfflineModel(pump),
      throwsArgumentError,
    );
  });
}
