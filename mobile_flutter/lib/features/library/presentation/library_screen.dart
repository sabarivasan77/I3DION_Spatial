import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:i3dion_spatial_hub_mobile/data/offline_model_download_service.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/local_library_item.dart';
import 'package:i3dion_spatial_hub_mobile/features/explore/providers.dart';
import 'package:i3dion_spatial_hub_mobile/features/library/providers.dart';

class LibraryScreen extends ConsumerWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(savedProductsProvider);
    final recent = ref.watch(recentlyViewedProvider);
    final offline = ref.watch(offlineModelsProvider);
    final offlineItems = offline.asData?.value;
    final offlineBytes = offlineItems?.fold<int>(
      0,
      (total, item) => total + (item.modelSizeBytes ?? 0),
    );

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async {
          refreshLocalLibrary(ref);
          await Future.wait([
            ref.read(savedProductsProvider.future),
            ref.read(recentlyViewedProvider.future),
          ]);
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your library',
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Keep products close and pick up where you left off.',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Save a verified model for viewing without a connection. '
                      'Catalog details still refresh when you are online.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
              sliver: SliverToBoxAdapter(
                child: _LibrarySection(
                  title: 'Saved products',
                  icon: Icons.bookmark_rounded,
                  products: saved,
                  emptyMessage: 'Save a product from Explore to find it here.',
                  onRetry: () => ref.invalidate(savedProductsProvider),
                  onRemove: (product) => _removeSaved(context, ref, product),
                  onAction: (product) =>
                      _downloadOffline(context, ref, product),
                  actionTooltip: 'Download model for offline use',
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
              sliver: SliverToBoxAdapter(
                child: _LibrarySection(
                  title: 'Offline models',
                  icon: Icons.download_done_rounded,
                  products: offline,
                  detail: offlineItems == null
                      ? null
                      : '${offlineItems.length} '
                            '${offlineItems.length == 1 ? 'model' : 'models'} · '
                            '${_formatSize(offlineBytes ?? 0)} stored',
                  emptyMessage:
                      'Verified model files you save will appear here.',
                  onRetry: () => ref.invalidate(offlineModelsProvider),
                  onRemove: (product) => _removeOffline(context, ref, product),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
              sliver: SliverToBoxAdapter(
                child: _LibrarySection(
                  title: 'Recently viewed',
                  icon: Icons.history_rounded,
                  products: recent,
                  emptyMessage: 'Products you view will appear here.',
                  onRetry: () => ref.invalidate(recentlyViewedProvider),
                  onRemove: (product) => _removeRecent(context, ref, product),
                  onClear: recent.asData?.value.isNotEmpty == true
                      ? () => _clearRecent(context, ref)
                      : null,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _removeSaved(
    BuildContext context,
    WidgetRef ref,
    LocalLibraryItem product,
  ) async {
    try {
      await ref
          .read(localLibraryRepositoryProvider)
          .setSaved(product, saved: false);
      ref.invalidate(savedProductsProvider);
    } on Exception {
      if (context.mounted) {
        _showMessage(context, 'Could not update your saved products.');
      }
    }
  }

  Future<void> _removeRecent(
    BuildContext context,
    WidgetRef ref,
    LocalLibraryItem product,
  ) async {
    try {
      final repository = ref.read(localLibraryRepositoryProvider);
      final current = await repository.loadRecent();
      await repository.replaceRecent(
        current.where((item) => item.id != product.id).toList(),
      );
      ref.invalidate(recentlyViewedProvider);
    } on Exception {
      if (context.mounted) {
        _showMessage(context, 'Could not update recently viewed products.');
      }
    }
  }

  Future<void> _downloadOffline(
    BuildContext context,
    WidgetRef ref,
    LocalLibraryItem savedProduct,
  ) async {
    try {
      final product = await ref
          .read(spatialRepositoryProvider)
          .fetchProduct(savedProduct.id);
      if (!context.mounted) return;
      if (product.id != savedProduct.id) {
        throw const OfflineDownloadException(
          'The catalog returned a different product than requested.',
        );
      }
      final size = product.modelSizeBytes;
      final checksum = product.modelChecksumSha256;
      if (size == null || checksum == null) {
        throw const OfflineDownloadException(
          'This product does not have a verified model size and checksum.',
        );
      }
      if (size > OfflineModelDownloadService.maxModelSizeBytes) {
        throw const OfflineDownloadException(
          'This model exceeds the 50 MB offline-download limit.',
        );
      }
      if (size > OfflineModelDownloadService.largeModelWarningBytes) {
        final shouldContinue = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Large model download'),
            content: Text(
              'This model is ${_formatSize(size)}. It may use significant '
              'storage and memory on this device. Continue?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Not now'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Download'),
              ),
            ],
          ),
        );
        if (shouldContinue != true || !context.mounted) return;
      }

      final progress = ValueNotifier<double?>(null);
      final cancelToken = CancelToken();
      final downloadService = OfflineModelDownloadService(
        client: ref.read(spatialRepositoryProvider).client,
      );
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => _OfflineDownloadDialog(
          progress: progress,
          cancelToken: cancelToken,
        ),
      );
      try {
        final downloaded = await downloadService.download(
          product,
          cancelToken: cancelToken,
          onProgress: (received, total) {
            if (total > 0) progress.value = (received / total).clamp(0, 1);
          },
        );
        final item = LocalLibraryItem(
          id: product.id,
          name: product.name,
          category: product.category,
          description: product.description,
          modelPath: downloaded.path,
          modelSizeBytes: downloaded.sizeBytes,
          modelChecksumSha256: downloaded.checksumSha256,
        );
        try {
          await ref.read(localLibraryRepositoryProvider).saveOfflineModel(item);
        } on Exception {
          await downloadService.delete(item);
          rethrow;
        }
        if (context.mounted) {
          Navigator.of(context, rootNavigator: true).pop();
          refreshLocalLibrary(ref);
          _showMessage(context, 'Verified model saved for offline viewing.');
        }
      } on Exception catch (error) {
        if (context.mounted) {
          Navigator.of(context, rootNavigator: true).pop();
          _showMessage(
            context,
            error is OfflineDownloadException
                ? error.message
                : 'The offline model could not be saved: $error',
          );
        }
      } finally {
        progress.dispose();
      }
    } on Exception catch (error) {
      if (context.mounted) {
        _showMessage(
          context,
          error is OfflineDownloadException
              ? error.message
              : 'The product could not be prepared for offline use: $error',
        );
      }
    }
  }

  Future<void> _removeOffline(
    BuildContext context,
    WidgetRef ref,
    LocalLibraryItem product,
  ) async {
    try {
      await OfflineModelDownloadService(
        client: ref.read(spatialRepositoryProvider).client,
      ).delete(product);
      await ref
          .read(localLibraryRepositoryProvider)
          .removeOfflineModel(product.id);
      refreshLocalLibrary(ref);
    } on Exception catch (error) {
      if (context.mounted) {
        _showMessage(
          context,
          error is OfflineDownloadException
              ? error.message
              : 'The offline model could not be removed: $error',
        );
      }
    }
  }

  Future<void> _clearRecent(BuildContext context, WidgetRef ref) async {
    final shouldClear = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear recently viewed?'),
        content: const Text('This only clears this device’s viewing history.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Clear history'),
          ),
        ],
      ),
    );
    if (!context.mounted) return;
    if (shouldClear != true) return;
    try {
      await ref.read(localLibraryRepositoryProvider).clearRecent();
      ref.invalidate(recentlyViewedProvider);
    } on Exception {
      if (context.mounted) {
        _showMessage(context, 'Recently viewed history could not be cleared.');
      }
    }
  }

  void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _OfflineDownloadDialog extends StatefulWidget {
  const _OfflineDownloadDialog({
    required this.progress,
    required this.cancelToken,
  });

  final ValueListenable<double?> progress;
  final CancelToken cancelToken;

  @override
  State<_OfflineDownloadDialog> createState() => _OfflineDownloadDialogState();
}

class _OfflineDownloadDialogState extends State<_OfflineDownloadDialog> {
  bool _canceling = false;

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: AlertDialog(
        title: const Text('Saving model'),
        content: ValueListenableBuilder<double?>(
          valueListenable: widget.progress,
          builder: (context, value, _) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              LinearProgressIndicator(value: value),
              const SizedBox(height: 12),
              Text(
                value == null
                    ? 'Preparing download…'
                    : '${(value * 100).round()}%',
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: _canceling
                ? null
                : () {
                    setState(() => _canceling = true);
                    widget.cancelToken.cancel('Canceled by user');
                  },
            child: Text(_canceling ? 'Canceling…' : 'Cancel'),
          ),
        ],
      ),
    );
  }
}

class _LibrarySection extends StatelessWidget {
  const _LibrarySection({
    required this.title,
    required this.icon,
    required this.products,
    required this.emptyMessage,
    required this.onRetry,
    required this.onRemove,
    this.detail,
    this.onAction,
    this.actionTooltip,
    this.onClear,
  });

  final String title;
  final IconData icon;
  final AsyncValue<List<LocalLibraryItem>> products;
  final String emptyMessage;
  final VoidCallback onRetry;
  final ValueChanged<LocalLibraryItem> onRemove;
  final String? detail;
  final ValueChanged<LocalLibraryItem>? onAction;
  final String? actionTooltip;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: theme.colorScheme.primary),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                title,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            if (onClear != null)
              TextButton(onPressed: onClear, child: const Text('Clear')),
          ],
        ),
        if (detail != null) ...[
          const SizedBox(height: 2),
          Text(
            detail!,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
        const SizedBox(height: 10),
        products.when(
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(),
            ),
          ),
          error: (error, stackTrace) => Card(
            child: ListTile(
              leading: const Icon(Icons.error_outline_rounded),
              title: const Text('Your library could not be loaded.'),
              trailing: IconButton(
                tooltip: 'Try again',
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
              ),
            ),
          ),
          data: (items) => items.isEmpty
              ? Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: [
                        Icon(
                          Icons.inventory_2_outlined,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Text(emptyMessage)),
                      ],
                    ),
                  ),
                )
              : Column(
                  children: [
                    for (final product in items) ...[
                      Card(
                        child: ListTile(
                          onTap: () => context.push('/viewer/${product.id}'),
                          title: Text(
                            product.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Text(
                            product.modelSizeBytes == null
                                ? product.category
                                : '${product.category} · '
                                      '${_formatSize(product.modelSizeBytes!)}',
                          ),
                          leading: const CircleAvatar(
                            child: Icon(Icons.view_in_ar_rounded),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (onAction != null)
                                IconButton(
                                  tooltip: actionTooltip,
                                  onPressed: () => onAction!(product),
                                  icon: const Icon(Icons.download_rounded),
                                ),
                              IconButton(
                                tooltip: 'Remove from $title',
                                onPressed: () => onRemove(product),
                                icon: const Icon(Icons.close_rounded),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ],
                ),
        ),
      ],
    );
  }
}

String _formatSize(int bytes) {
  final megabytes = bytes / (1024 * 1024);
  if (megabytes >= 1024) {
    return '${(megabytes / 1024).toStringAsFixed(1)} GB';
  }
  return '${megabytes.toStringAsFixed(1)} MB';
}
