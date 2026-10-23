import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:i3dion_spatial_hub_mobile/app/app.dart';
import 'package:i3dion_spatial_hub_mobile/data/auth_repository.dart';
import 'package:i3dion_spatial_hub_mobile/features/auth/providers.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('home has no demo models and navigation works', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          secureSessionStoreProvider.overrideWithValue(
            _MemorySecureSessionStore(),
          ),
        ],
        child: const I3DIONSpatialHubApp(),
      ),
    );
    await tester.pumpAndSettle();

    final scrollableContext = tester.element(find.byType(Scrollable).first);
    expect(
      ScrollConfiguration.of(
        scrollableContext,
      ).getScrollPhysics(scrollableContext),
      isA<ClampingScrollPhysics>(),
    );

    expect(find.text('Column Drill Press'), findsNothing);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Welcome to Spatial Hub'), findsOneWidget);
    expect(find.text('Scan QR'), findsOneWidget);
    expect(find.text('Catalogs'), findsWidgets);
    expect(find.text('Offline-ready models'), findsOneWidget);
    expect(find.text('Scan'), findsOneWidget);
    expect(find.text('Your library'), findsNothing);

    await tester.tap(find.text('Catalogs').last);
    await tester.pumpAndSettle();

    expect(
      find.text('Browse published catalogs from I3DION organizations.'),
      findsOneWidget,
    );
    expect(find.text('Search catalogs'), findsOneWidget);
    expect(find.text('Catalogs unavailable'), findsOneWidget);

    await tester.tap(find.text('Downloads'));
    await tester.pumpAndSettle();

    expect(find.text('Your library'), findsOneWidget);
    expect(find.text('Saved products'), findsOneWidget);
    expect(find.text('Offline models'), findsOneWidget);
    expect(find.text('Recently viewed'), findsOneWidget);
    expect(find.textContaining('Save a verified model'), findsOneWidget);

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    expect(find.text('Account access'), findsOneWidget);
    expect(find.text('Sign in to I3DION'), findsOneWidget);
    expect(find.text('QR link security'), findsOneWidget);

    await tester.tap(find.text('Sign in to I3DION'));
    await tester.pumpAndSettle();
    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Work email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    final signInButton = find.widgetWithText(FilledButton, 'Sign in');
    await tester.ensureVisible(signInButton);
    await tester.tap(signInButton);
    await tester.pumpAndSettle();
    expect(find.text('Enter your email address.'), findsOneWidget);
    expect(find.text('Enter your password.'), findsOneWidget);
  });
}

class _MemorySecureSessionStore implements SecureSessionStore {
  @override
  Future<void> delete() async {}

  @override
  Future<String?> read() async => null;

  @override
  Future<void> write(String value) async {}
}
