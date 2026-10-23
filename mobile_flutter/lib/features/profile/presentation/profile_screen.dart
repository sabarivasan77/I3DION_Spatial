import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:i3dion_spatial_hub_mobile/config/app_config.dart';
import 'package:i3dion_spatial_hub_mobile/features/auth/providers.dart';
import 'package:i3dion_spatial_hub_mobile/features/explore/providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(exploreFeedProvider(null));
    final authSession = ref.watch(authSessionProvider);
    final config = AppConfig.current;
    final apiHost = Uri.tryParse(config.apiBaseUrl)?.host;
    final allowedHosts = config.qrAllowedHosts.toList()..sort();
    final theme = Theme.of(context);

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () => ref.refresh(exploreFeedProvider(null).future),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
          children: [
            Text(
              'Profile',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your I3DION app and connection status.',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 22),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const CircleAvatar(child: Icon(Icons.public_rounded)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Public catalog',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                switch (feed) {
                                  AsyncData(:final value) =>
                                    'Connected · ${value.length} products loaded',
                                  AsyncError() => 'Connection unavailable',
                                  _ => 'Checking connection…',
                                },
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: switch (feed) {
                                    AsyncData() => const Color(0xFF16803C),
                                    AsyncError() => theme.colorScheme.error,
                                    _ => theme.colorScheme.onSurfaceVariant,
                                  },
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'Refresh connection',
                          onPressed: () =>
                              ref.invalidate(exploreFeedProvider(null)),
                          icon: const Icon(Icons.refresh_rounded),
                        ),
                      ],
                    ),
                    if (apiHost != null && apiHost.isNotEmpty) ...[
                      const Divider(height: 28),
                      _InfoRow(label: 'API host', value: apiHost),
                    ],
                    const SizedBox(height: 8),
                    _InfoRow(
                      label: 'App environment',
                      value: config.environment.name,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: authSession.when(
                  loading: () => const Row(
                    children: [
                      SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      SizedBox(width: 12),
                      Text('Checking account session…'),
                    ],
                  ),
                  error: (error, stackTrace) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Account access',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Could not restore the saved session. $error',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.error,
                        ),
                      ),
                      TextButton(
                        onPressed: () => ref.invalidate(authSessionProvider),
                        child: const Text('Retry'),
                      ),
                      OutlinedButton(
                        onPressed: () => context.push('/login'),
                        child: const Text('Sign in'),
                      ),
                    ],
                  ),
                  data: (session) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Account access',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      if (session == null) ...[
                        Text(
                          'Browsing public products. Sign in with your I3DION '
                          'account to access account features as they become '
                          'available in the mobile app.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () => context.push('/login'),
                            icon: const Icon(Icons.login_rounded),
                            label: const Text('Sign in to I3DION'),
                          ),
                        ),
                      ] else ...[
                        Row(
                          children: [
                            CircleAvatar(
                              child: Text(
                                session.name.isEmpty
                                    ? '?'
                                    : session.name[0].toUpperCase(),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    session.name,
                                    style: theme.textTheme.titleSmall?.copyWith(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  Text(
                                    session.email,
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                  Text(
                                    session.role,
                                    style: theme.textTheme.labelSmall?.copyWith(
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Private catalog access is not yet integrated.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () async {
                              try {
                                await ref
                                    .read(authSessionProvider.notifier)
                                    .signOut();
                              } on Exception catch (error) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(error.toString())),
                                  );
                                }
                              }
                            },
                            child: const Text('Sign out'),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'QR link security',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      allowedHosts.isEmpty
                          ? 'Web QR links are disabled until an exact content '
                                'domain is configured. The i3dion:// scheme '
                                'remains available.'
                          : 'Only these exact HTTPS hosts are accepted:',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    if (allowedHosts.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      for (final host in allowedHosts)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: SelectableText(host),
                        ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'I3DION Spatial Hub Mobile · 0.1.0',
              textAlign: TextAlign.center,
              style: theme.textTheme.labelMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        Text(value, style: theme.textTheme.bodyMedium),
      ],
    );
  }
}
