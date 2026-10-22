import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:i3dion_spatial_hub_mobile/data/api_client.dart';
import 'package:i3dion_spatial_hub_mobile/data/public_spatial_repository.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/spatial_item.dart';

final spatialRepositoryProvider = Provider<PublicSpatialRepository>(
  (ref) => PublicSpatialRepository(client: ApiClient.fromConfig()),
);

final exploreFeedProvider = FutureProvider.family<List<SpatialItem>, String?>(
  (ref, query) =>
      ref.watch(spatialRepositoryProvider).fetchExploreFeed(query: query),
);
