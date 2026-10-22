import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:i3dion_spatial_hub_mobile/app/theme.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/spatial_item.dart';
import 'package:i3dion_spatial_hub_mobile/features/explore/providers.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;
  String? _query;

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
                      tooltip: 'Notifications',
                      onPressed: () {},
                      icon: const Icon(Icons.notifications_none_rounded),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'A new perspective\non every product.',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        height: 1.12,
                        letterSpacing: -0.8,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Discover the details that move your world.',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 22),
                    _SearchPrompt(
                      controller: _searchController,
                      onChanged: _search,
                    ),
                    const SizedBox(height: 28),
                    Row(
                      children: [
                        Text(
                          'Featured in 3D',
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: () {},
                          child: const Text('See all'),
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
                      data: (items) => items.isEmpty
                          ? const _EmptyFeedState()
                          : Column(
                              children: [
                                _FeaturedCard(item: items.first),
                                const SizedBox(height: 14),
                                for (final item in items.skip(1)) ...[
                                  _CompactItemCard(item: item),
                                  const SizedBox(height: 10),
                                ],
                              ],
                            ),
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

class _FeaturedCard extends StatelessWidget {
  const _FeaturedCard({required this.item});

  final SpatialItem item;

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
            Container(
              height: 190,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF153A85),
                    AppColors.spatialBlue,
                    const Color(0xFF73A4FF),
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
  const _CompactItemCard({required this.item});

  final SpatialItem item;

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
        trailing: const Icon(Icons.chevron_right_rounded),
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
  const _EmptyFeedState();

  @override
  Widget build(BuildContext context) {
    return const _FeedMessage(
      icon: Icons.search_off_rounded,
      message: 'No models are featured right now.',
    );
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
