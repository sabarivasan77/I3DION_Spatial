import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:i3dion_spatial_hub_mobile/config/connection_settings.dart';
import 'package:i3dion_spatial_hub_mobile/features/auth/providers.dart';
import 'package:i3dion_spatial_hub_mobile/features/explore/providers.dart';
import 'package:i3dion_spatial_hub_mobile/features/library/providers.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(exploreFeedProvider(null));
    final authSession = ref.watch(authSessionProvider);
    final connection = ref.watch(connectionSettingsProvider);
    final offlineRepo = ref.watch(offlineCacheRepositoryProvider);
    final syncRepo = ref.watch(offlineSyncRepositoryProvider);
    final offlineModels = ref.watch(offlineModelsProvider);
    final apiHost = Uri.tryParse(connection.apiBaseUrl)?.host;
    final allowedHosts = connection.qrAllowedHosts.toList()..sort();
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
                          tooltip: 'Configure connection',
                          onPressed: () => _showConnectionDialog(context),
                          icon: const Icon(Icons.tune_rounded),
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
                      value: connection.environment.name,
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
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Offline & Cache Management',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Models and catalog snapshots cached locally for offline browsing.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 12),
                    FutureBuilder<int>(
                      future: offlineRepo.getCachedItemCount(),
                      builder: (context, snapshot) {
                        final cachedCount = snapshot.data ?? 0;
                        final downloadedCount = offlineModels.asData?.value.length ?? 0;
                        return Column(
                          children: [
                            _InfoRow(
                              label: 'Cached feed products',
                              value: '$cachedCount items',
                            ),
                            const SizedBox(height: 8),
                            _InfoRow(
                              label: 'Downloaded 3D models',
                              value: '$downloadedCount files',
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              final messenger = ScaffoldMessenger.of(context);
                              final synced = await syncRepo.syncPending(
                                ref.read(hubReactionRepositoryProvider),
                              );
                              if (!mounted) return;
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text(
                                    synced > 0
                                        ? 'Synchronized $synced offline action(s).'
                                        : 'All actions are up to date.',
                                  ),
                                ),
                              );
                            },
                            icon: const Icon(Icons.sync_rounded, size: 18),
                            label: const Text('Sync Actions'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextButton.icon(
                            onPressed: () async {
                              final messenger = ScaffoldMessenger.of(context);
                              await offlineRepo.clearCache();
                              if (!mounted) return;
                              setState(() {});
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('Offline metadata cache cleared.'),
                                ),
                              );
                            },
                            icon: const Icon(Icons.delete_sweep_outlined, size: 18),
                            label: const Text('Clear Cache'),
                          ),
                        ),
                      ],
                    ),
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

  void _showConnectionDialog(BuildContext context) {
    final currentUrl = ref.read(connectionSettingsProvider).apiBaseUrl;
    final controller = TextEditingController(text: currentUrl);
    ConnectionTestResult? testResult;
    bool testing = false;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (bottomSheetContext) {
        return StatefulBuilder(
          builder: (dialogContext, setDialogState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 24,
                bottom: MediaQuery.of(dialogContext).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.dns_rounded),
                      const SizedBox(width: 10),
                      Text(
                        'Backend Endpoint',
                        style: Theme.of(dialogContext).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () => Navigator.pop(dialogContext),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Select a preset or enter the custom URL of your I3DION backend.',
                    style: Theme.of(dialogContext).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(dialogContext).colorScheme.onSurfaceVariant,
                        ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final preset in ConnectionSettingsNotifier.presets)
                        ActionChip(
                          label: Text(preset.label),
                          avatar: const Icon(Icons.hub_outlined, size: 16),
                          onPressed: () {
                            setDialogState(() {
                              controller.text = preset.url;
                              testResult = null;
                            });
                          },
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: controller,
                    decoration: InputDecoration(
                      labelText: 'API Base URL',
                      hintText: 'https://api.your-domain.com or http://10.0.2.2:4000',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      suffixIcon: IconButton(
                        tooltip: 'Test this URL',
                        onPressed: testing
                            ? null
                            : () async {
                                setDialogState(() => testing = true);
                                final res = await ref
                                    .read(connectionSettingsProvider.notifier)
                                    .testConnection(controller.text);
                                setDialogState(() {
                                  testResult = res;
                                  testing = false;
                                });
                              },
                        icon: testing
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.network_ping_rounded),
                      ),
                    ),
                  ),
                  if (testResult != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: testResult!.databaseConnected
                            ? const Color(0xFFE8F5E9)
                            : const Color(0xFFFFEBEE),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            testResult!.databaseConnected
                                ? Icons.check_circle_rounded
                                : Icons.error_outline_rounded,
                            size: 18,
                            color: testResult!.databaseConnected
                                ? const Color(0xFF2E7D32)
                                : const Color(0xFFC62828),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              testResult!.message,
                              style: TextStyle(
                                fontSize: 13,
                                color: testResult!.databaseConnected
                                    ? const Color(0xFF2E7D32)
                                    : const Color(0xFFC62828),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      OutlinedButton(
                        onPressed: () async {
                          await ref
                              .read(connectionSettingsProvider.notifier)
                              .resetToDefault();
                          if (dialogContext.mounted) {
                            Navigator.pop(dialogContext);
                            ref.invalidate(exploreFeedProvider(null));
                          }
                        },
                        child: const Text('Reset'),
                      ),
                      const Spacer(),
                      FilledButton(
                        onPressed: () async {
                          await ref
                              .read(connectionSettingsProvider.notifier)
                              .updateEndpoint(controller.text);
                          if (dialogContext.mounted) {
                            Navigator.pop(dialogContext);
                            ref.invalidate(exploreFeedProvider(null));
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Backend connection endpoint updated.'),
                                ),
                              );
                            }
                          }
                        },
                        child: const Text('Save & Connect'),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
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
