import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:i3dion_spatial_hub_mobile/app/theme.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/local_library_item.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/spatial_item.dart';
import 'package:i3dion_spatial_hub_mobile/features/explore/providers.dart';
import 'package:i3dion_spatial_hub_mobile/features/library/providers.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;
  String? _query;
  String? _selectedCategory;

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _search(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 300), () {
      if (!mounted) return;
      setState(() {
        final normalized = value.trim();
        _query = normalized.isEmpty ? null : normalized;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(exploreFeedProvider(_query));
    final savedProducts = ref.watch(savedProductsProvider);
    final recentProducts = ref.watch(recentlyViewedProvider);
    final offlineModels = ref.watch(offlineModelsProvider);
    final savedIds = savedProducts.asData?.value
        .map((product) => product.id)
        .toSet();
    final theme = Theme.of(context);

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () => ref.refresh(exploreFeedProvider(_query).future),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              sliver: SliverToBoxAdapter(
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.spatialBlue,
                        borderRadius: BorderRadius.circular(15),
                      ),
                      alignment: Alignment.center,
                      child: const Text(
                        'I',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 23,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'I3DION',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.2,
                          ),
                        ),
                        Text(
                          'SPATIAL HUB',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                            letterSpacing: 1.5,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    IconButton(
                      tooltip: 'Profile',
                      onPressed: () => context.go('/profile'),
                      icon: const Icon(Icons.person_outline_rounded),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome to Spatial Hub',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'Published industrial products, ready to explore.',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: _DashboardAction(
                            label: 'Scan QR',
                            icon: Icons.qr_code_scanner_rounded,
                            primary: true,
                            onPressed: () => context.go('/scan'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _DashboardAction(
                            label: 'Catalogs',
                            icon: Icons.menu_book_outlined,
                            onPressed: () => context.go('/catalogs'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    _OfflineSummary(
                      models: offlineModels,
                      onPressed: () => context.go('/library'),
                    ),
                    const SizedBox(height: 24),
                    _LocalProductsSection(
                      title: 'Continue exploring',
                      icon: Icons.history_rounded,
                      products: recentProducts,
                      emptyMessage: 'Products you view will appear here.',
                      onRetry: () => ref.invalidate(recentlyViewedProvider),
                    ),
                    const SizedBox(height: 16),
                    _LocalProductsSection(
                      title: 'Offline library',
                      icon: Icons.offline_pin_outlined,
                      products: offlineModels,
                      emptyMessage: 'Download a model to view it offline.',
                      onRetry: () => ref.invalidate(offlineModelsProvider),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Explore products',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _SearchPrompt(
                      controller: _searchController,
                      onChanged: _search,
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Text(
                          _query == null && _selectedCategory == null
                              ? 'Published 3D products'
                              : 'Search results',
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: _query == null && _selectedCategory == null
                              ? null
                              : () {
                                  _searchController.clear();
                                  setState(() {
                                    _query = null;
                                    _selectedCategory = null;
                                  });
                                },
                          child: const Text('Clear'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    feed.when(
                      loading: () => const _FeedLoadingState(),
                      error: (error, stackTrace) => _FeedErrorState(
                        message: error.toString(),
                        onRetry: () =>
                            ref.invalidate(exploreFeedProvider(_query)),
                      ),
                      data: (items) {
                        final categories =
                            items
                                .map((item) => item.category)
                                .where((category) => category.isNotEmpty)
                                .toSet()
                                .toList()
                              ..sort();
                        final visibleItems = _selectedCategory == null
                            ? items
                            : items
                                  .where(
                                    (item) =>
                                        item.category == _selectedCategory,
                                  )
                                  .toList(growable: false);
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (categories.length > 1) ...[
                              _CategoryFilters(
                                categories: categories,
                                selected: _selectedCategory,
                                onSelected: (category) => setState(
                                  () => _selectedCategory = category,
                                ),
                              ),
                              const SizedBox(height: 14),
                            ],
                            if (visibleItems.isEmpty)
                              _EmptyFeedState(
                                message: _selectedCategory == null
                                    ? 'No published 3D products match this search.'
                                    : 'No published 3D products in this category.',
                              )
                            else ...[
                              _FeaturedCard(
                                item: visibleItems.first,
                                isSaved:
                                    savedIds?.contains(visibleItems.first.id) ??
                                    false,
                                saveEnabled: savedIds != null,
                                onSave: () => _toggleSaved(
                                  visibleItems.first,
                                  savedIds?.contains(visibleItems.first.id) ??
                                      false,
                                ),
                              ),
                              const SizedBox(height: 14),
                              for (final item in visibleItems.skip(1)) ...[
                                _CompactItemCard(
                                  item: item,
                                  isSaved: savedIds?.contains(item.id) ?? false,
                                  saveEnabled: savedIds != null,
                                  onSave: () => _toggleSaved(
                                    item,
                                    savedIds?.contains(item.id) ?? false,
                                  ),
                                ),
                                const SizedBox(height: 10),
                              ],
                            ],
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _toggleSaved(SpatialItem item, bool isSaved) async {
    try {
      await ref
          .read(localLibraryRepositoryProvider)
          .setSaved(LocalLibraryItem.fromSpatialItem(item), saved: !isSaved);
      ref.invalidate(savedProductsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isSaved
                  ? 'Removed from saved products.'
                  : 'Saved to your library.',
            ),
          ),
        );
      }
    } on Exception {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not update your library.')),
        );
      }
    }
  }
}

class _DashboardAction extends StatelessWidget {
  const _DashboardAction({
    required this.label,
    required this.icon,
    required this.onPressed,
    this.primary = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    final child = Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, size: 19),
        const SizedBox(width: 8),
        Flexible(
          child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
        ),
      ],
    );
    return SizedBox(
      height: 50,
      child: primary
          ? FilledButton(onPressed: onPressed, child: child)
          : OutlinedButton(onPressed: onPressed, child: child),
    );
  }
}

class _OfflineSummary extends StatelessWidget {
  const _OfflineSummary({required this.models, required this.onPressed});

  final AsyncValue<List<LocalLibraryItem>> models;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const Icon(Icons.offline_pin_outlined, color: AppColors.success),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Offline-ready models',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    models.when(
                      data: (items) => Text(
                        '${items.length} verified '
                        '${items.length == 1 ? 'model' : 'models'} stored',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      loading: () => const Text('Checking saved models…'),
                      error: (error, stackTrace) => Text(
                        'Could not read offline model storage.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.error,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded),
            ],
          ),
        ),
      ),
    );
  }
}

class _LocalProductsSection extends StatelessWidget {
  const _LocalProductsSection({
    required this.title,
    required this.icon,
    required this.products,
    required this.emptyMessage,
    required this.onRetry,
  });

  final String title;
  final IconData icon;
  final AsyncValue<List<LocalLibraryItem>> products;
  final String emptyMessage;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 19, color: AppColors.spatialBlue),
            const SizedBox(width: 8),
            Text(
              title,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        products.when(
          data: (items) => items.isEmpty
              ? Text(
                  emptyMessage,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                )
              : Column(
                  children: [
                    for (final item in items.take(2))
                      Card(
                        child: ListTile(
                          onTap: () => context.push('/viewer/${item.id}'),
                          leading: const Icon(
                            Icons.view_in_ar_outlined,
                            color: AppColors.spatialBlue,
                          ),
                          title: Text(
                            item.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Text(
                            item.category,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing: const Icon(Icons.chevron_right_rounded),
                        ),
                      ),
                  ],
                ),
          loading: () => const LinearProgressIndicator(),
          error: (error, stackTrace) => Row(
            children: [
              Expanded(
                child: Text(
                  'Could not load this section.',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.error,
                  ),
                ),
              ),
              TextButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ),
        ),
      ],
    );
  }
}

class _SearchPrompt extends StatelessWidget {
  const _SearchPrompt({required this.controller, required this.onChanged});

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.surface,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        height: 56,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: Theme.of(context).dividerColor.withValues(alpha: 0.35),
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.search_rounded,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: controller,
                onChanged: onChanged,
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  border: InputBorder.none,
                  hintText: 'Search live published 3D products',
                  suffixIcon: controller.text.isEmpty
                      ? null
                      : IconButton(
                          tooltip: 'Clear search',
                          onPressed: () {
                            controller.clear();
                            onChanged('');
                          },
                          icon: const Icon(Icons.close_rounded),
                        ),
                  hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryFilters extends StatelessWidget {
  const _CategoryFilters({
    required this.categories,
    required this.selected,
    required this.onSelected,
  });

  final List<String> categories;
  final String? selected;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 42,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          ChoiceChip(
            label: const Text('All'),
            selected: selected == null,
            onSelected: (_) => onSelected(null),
          ),
          const SizedBox(width: 8),
          for (final category in categories) ...[
            ChoiceChip(
              label: Text(category),
              selected: selected == category,
              onSelected: (_) =>
                  onSelected(selected == category ? null : category),
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _FeaturedCard extends StatelessWidget {
  const _FeaturedCard({
    required this.item,
    required this.isSaved,
    required this.saveEnabled,
    required this.onSave,
  });

  final SpatialItem item;
  final bool isSaved;
  final bool saveEnabled;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/viewer/${item.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Stack(
              children: [
                Container(
                  height: 190,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Color(0xFF153A85),
                        AppColors.spatialBlue,
                        Color(0xFF73A4FF),
                      ],
                      begin: Alignment.bottomLeft,
                      end: Alignment.topRight,
                    ),
                  ),
                  child: item.imageUrl == null
                      ? const Center(
                          child: Icon(
                            Icons.view_in_ar_rounded,
                            size: 64,
                            color: Colors.white,
                          ),
                        )
                      : Image.network(
                          item.imageUrl!,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              const Center(
                                child: Icon(
                                  Icons.broken_image_outlined,
                                  size: 48,
                                  color: Colors.white,
                                ),
                              ),
                        ),
                ),
                Positioned(
                  top: 10,
                  right: 10,
                  child: IconButton.filledTonal(
                    tooltip: isSaved ? 'Remove saved product' : 'Save product',
                    onPressed: saveEnabled ? onSave : null,
                    icon: Icon(
                      isSaved
                          ? Icons.bookmark_rounded
                          : Icons.bookmark_add_outlined,
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    item.description,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(
                        Icons.threed_rotation_rounded,
                        size: 17,
                        color: AppColors.spatialBlue,
                      ),
                      const SizedBox(width: 7),
                      Text(
                        'LIVE 3D MODEL',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: AppColors.spatialBlue,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1,
                        ),
                      ),
                      const Spacer(),
                      const Icon(Icons.arrow_forward_rounded, size: 20),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CompactItemCard extends StatelessWidget {
  const _CompactItemCard({
    required this.item,
    required this.isSaved,
    required this.saveEnabled,
    required this.onSave,
  });

  final SpatialItem item;
  final bool isSaved;
  final bool saveEnabled;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: ListTile(
        onTap: () => context.push('/viewer/${item.id}'),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        leading: SizedBox(
          width: 50,
          height: 50,
          child: item.imageUrl == null
              ? const Icon(
                  Icons.view_in_ar_rounded,
                  color: AppColors.spatialBlue,
                )
              : ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    item.imageUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.broken_image_outlined,
                      color: AppColors.spatialBlue,
                    ),
                  ),
                ),
        ),
        title: Text(
          item.name,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        subtitle: Text(item.category),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              tooltip: isSaved ? 'Remove saved product' : 'Save product',
              onPressed: saveEnabled ? onSave : null,
              icon: Icon(
                isSaved ? Icons.bookmark_rounded : Icons.bookmark_add_outlined,
              ),
            ),
            const Icon(Icons.chevron_right_rounded),
          ],
        ),
      ),
    );
  }
}

class _FeedLoadingState extends StatelessWidget {
  const _FeedLoadingState();

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.surfaceContainerHighest;
    return Column(
      children: [
        for (final height in [248.0, 80.0])
          Container(
            height: height,
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(24),
            ),
          ),
      ],
    );
  }
}

class _FeedErrorState extends StatelessWidget {
  const _FeedErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return _FeedMessage(
      icon: Icons.cloud_off_rounded,
      message: message,
      actionLabel: 'Try again',
      onAction: onRetry,
    );
  }
}

class _EmptyFeedState extends StatelessWidget {
  const _EmptyFeedState({this.message = 'No models are featured right now.'});

  final String message;

  @override
  Widget build(BuildContext context) {
    return _FeedMessage(icon: Icons.search_off_rounded, message: message);
  }
}

class _FeedMessage extends StatelessWidget {
  const _FeedMessage({
    required this.icon,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(icon, size: 32),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center),
            if (actionLabel != null) ...[
              const SizedBox(height: 8),
              TextButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}
