import 'package:flutter_test/flutter_test.dart';
import 'package:i3dion_spatial_hub_mobile/features/scan/data/scan_history_repository.dart';
import 'package:i3dion_spatial_hub_mobile/features/scan/domain/content_link.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late ScanHistoryRepository repository;

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    repository = ScanHistoryRepository();
  });

  test(
    'stores only normalized accepted content and deduplicates recent scans',
    () async {
      const first = ContentLink(
        kind: ContentKind.model,
        id: 'model-1',
        scheme: 'i3dion',
      );
      const second = ContentLink(
        kind: ContentKind.catalog,
        id: 'catalog-2',
        scheme: 'i3dion',
      );

      await repository.add(first);
      await repository.add(second);
      await repository.add(first);

      final history = await repository.load();
      expect(history.map((link) => link.id), ['model-1', 'catalog-2']);
    },
  );

  test('caps history at thirty entries and clears it', () async {
    for (var index = 0; index < 35; index++) {
      await repository.add(
        ContentLink(
          kind: ContentKind.model,
          id: 'model-$index',
          scheme: 'i3dion',
        ),
      );
    }

    expect((await repository.load()).length, 30);
    await repository.clear();
    expect(await repository.load(), isEmpty);
  });
}
