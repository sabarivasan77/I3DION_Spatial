import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:i3dion_spatial_hub_mobile/app/theme.dart';
import 'package:i3dion_spatial_hub_mobile/config/app_config.dart';
import 'package:i3dion_spatial_hub_mobile/features/explore/presentation/explore_screen.dart';
import 'package:i3dion_spatial_hub_mobile/features/scan/domain/content_link.dart';
import 'package:i3dion_spatial_hub_mobile/features/scan/presentation/scan_screen.dart';
import 'package:i3dion_spatial_hub_mobile/features/scan/presentation/scan_status_screen.dart';
import 'package:i3dion_spatial_hub_mobile/features/scan/scanner_session.dart';
import 'package:i3dion_spatial_hub_mobile/features/shell/presentation/placeholder_screen.dart';
import 'package:i3dion_spatial_hub_mobile/features/viewer/presentation/model_viewer_screen.dart';

class I3DIONSpatialHubApp extends StatefulWidget {
  const I3DIONSpatialHubApp({super.key});

  @override
  State<I3DIONSpatialHubApp> createState() => _I3DIONSpatialHubAppState();
}

class _I3DIONSpatialHubAppState extends State<I3DIONSpatialHubApp> {
  late final StreamSubscription<Uri> _linkSubscription;

  @override
  void initState() {
    super.initState();
    _linkSubscription = AppLinks().uriLinkStream.listen(
      _handleIncomingLink,
      onError: (Object error, StackTrace stackTrace) {
        if (error is MissingPluginException) return;
        ScannerSession.isActive.value = false;
        if (mounted) appRouter.go('/link-error');
      },
    );
    unawaited(_handleInitialLink());
  }

  Future<void> _handleInitialLink() async {
    try {
      final uri = await AppLinks().getInitialLink();
      if (uri != null) _handleIncomingLink(uri);
    } on MissingPluginException {
      // The platform channel is unavailable in unit tests and unsupported hosts.
    } on PlatformException {
      ScannerSession.isActive.value = false;
      if (mounted) appRouter.go('/link-error');
    }
  }

  void _handleIncomingLink(Uri uri) {
    if (!mounted) return;
    _routeValidatedLink(uri, appRouter);
  }

  @override
  void dispose() {
    _linkSubscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'I3DION Spatial Hub',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      routerConfig: appRouter,
    );
  }
}

final appRouter = GoRouter(
  initialLocation: '/explore',
  onException: (context, state, router) {
    _routeValidatedLink(state.uri, router);
  },
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) =>
          AppNavigationShell(navigationShell: navigationShell),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/explore',
              builder: (context, state) => const ExploreScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/scan',
              builder: (context, state) => const ScanScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/library',
              builder: (context, state) => const PlaceholderScreen(
                title: 'Your library',
                description: 'Models saved for offline viewing will live here.',
                icon: Icons.inventory_2_outlined,
              ),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/profile',
              builder: (context, state) => const PlaceholderScreen(
                title: 'Profile',
                description:
                    'Sign in and organization settings are coming next.',
                icon: Icons.account_circle_outlined,
              ),
            ),
          ],
        ),
      ],
    ),
    GoRoute(
      path: '/content/:kind/:id',
      builder: (context, state) {
        final kind = ContentKind.fromPathSegment(
          state.pathParameters['kind'] ?? '',
        );
        final id = state.pathParameters['id'] ?? '';
        if (kind == null || !isValidContentId(id)) {
          return const LinkStatusScreen(invalidLink: true);
        }
        if (kind == ContentKind.model) {
          return ModelViewerScreen(productId: id);
        }
        return LinkStatusScreen(kind: kind, contentId: id);
      },
    ),
    GoRoute(
      path: '/viewer/:id',
      builder: (context, state) {
        return ModelViewerScreen(productId: state.pathParameters['id'] ?? '');
      },
    ),
    GoRoute(
      path: '/link-error',
      builder: (context, state) => const LinkStatusScreen(invalidLink: true),
    ),
  ],
);

void _routeValidatedLink(Uri uri, GoRouter router) {
  final result = ContentLinkValidator(
    allowedHosts: AppConfig.current.qrAllowedHosts,
  ).validate(uri.toString());
  final content = result.content;
  if (content == null) {
    ScannerSession.isActive.value = false;
    router.go('/link-error');
    return;
  }
  ScannerSession.isActive.value = false;
  router.go(content.location);
}

class AppNavigationShell extends StatelessWidget {
  const AppNavigationShell({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) {
          ScannerSession.isActive.value = index == 1;
          navigationShell.goBranch(index);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore_rounded),
            label: 'Explore',
          ),
          NavigationDestination(
            icon: Icon(Icons.qr_code_scanner_rounded),
            label: 'Scan',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2_rounded),
            label: 'Library',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
