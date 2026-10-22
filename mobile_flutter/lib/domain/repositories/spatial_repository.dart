import 'package:i3dion_spatial_hub_mobile/domain/models/spatial_item.dart';

abstract interface class SpatialRepository {
  Future<List<SpatialItem>> fetchExploreFeed({String? query});
}
