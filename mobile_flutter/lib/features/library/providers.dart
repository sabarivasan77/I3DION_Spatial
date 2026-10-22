import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:i3dion_spatial_hub_mobile/data/local_library_repository.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/local_library_item.dart';

final localLibraryRepositoryProvider = Provider<LocalLibraryRepository>(
  (ref) => LocalLibraryRepository(),
);

final savedProductsProvider = FutureProvider<List<LocalLibraryItem>>(
  (ref) => ref.watch(localLibraryRepositoryProvider).loadSaved(),
);

final recentlyViewedProvider = FutureProvider<List<LocalLibraryItem>>(
  (ref) => ref.watch(localLibraryRepositoryProvider).loadRecent(),
);

final offlineModelsProvider = FutureProvider<List<LocalLibraryItem>>(
  (ref) => ref.watch(localLibraryRepositoryProvider).loadOfflineModels(),
);

void refreshLocalLibrary(WidgetRef ref) {
  ref.invalidate(savedProductsProvider);
  ref.invalidate(recentlyViewedProvider);
  ref.invalidate(offlineModelsProvider);
}
