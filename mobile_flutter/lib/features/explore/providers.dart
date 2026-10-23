import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:i3dion_spatial_hub_mobile/data/hub_reaction_repository.dart';
import 'package:i3dion_spatial_hub_mobile/data/public_spatial_repository.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/published_catalog.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/spatial_item.dart';
import 'package:i3dion_spatial_hub_mobile/features/auth/providers.dart';

final spatialRepositoryProvider = Provider<PublicSpatialRepository>(
  (ref) => PublicSpatialRepository(client: ref.watch(apiClientProvider)),
);

final exploreFeedProvider = FutureProvider.family<List<SpatialItem>, String?>(
  (ref, query) =>
      ref.watch(spatialRepositoryProvider).fetchExploreFeed(query: query),
);

final publishedCatalogPageProvider =
    FutureProvider.family<PublishedCatalogPage, ({String? query, int offset})>((
      ref,
      request,
    ) {
      return ref
          .watch(spatialRepositoryProvider)
          .fetchPublishedCatalogs(query: request.query, offset: request.offset);
    });

final publishedCatalogProvider =
    FutureProvider.family<PublishedCatalog, String>((ref, slug) {
      return ref.watch(spatialRepositoryProvider).fetchPublishedCatalog(slug);
    });

final hubReactionRepositoryProvider = Provider<HubReactionRepository>(
  (ref) => HubReactionRepository(client: ref.watch(apiClientProvider)),
);
