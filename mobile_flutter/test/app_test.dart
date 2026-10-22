import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:i3dion_spatial_hub_mobile/app/app.dart';

void main() {
  testWidgets('explore has no demo models and navigation works', (
    tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: I3DIONSpatialHubApp()));
    await tester.pumpAndSettle();

    expect(find.text('Column Drill Press'), findsNothing);
    expect(find.text('Explore'), findsOneWidget);
    expect(find.text('Scan'), findsOneWidget);
    expect(find.text('Your library'), findsNothing);

    await tester.tap(find.text('Library'));
    await tester.pumpAndSettle();

    expect(find.text('Your library'), findsOneWidget);
  });
}
