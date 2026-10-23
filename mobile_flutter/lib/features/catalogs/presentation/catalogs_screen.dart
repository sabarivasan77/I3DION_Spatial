import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:i3dion_spatial_hub_mobile/app/theme.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/published_catalog.dart';
import 'package:i3dion_spatial_hub_mobile/features/explore/providers.dart';

class CatalogsScreen extends ConsumerStatefulWidget {
  const CatalogsScreen({super.key});

  @override
  ConsumerState<CatalogsScreen> createState() => _CatalogsScreenState();
}

class _CatalogsScreenState extends ConsumerState<CatalogsScreen> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;
  String? _query;
  List<PublishedCatalogSummary> _additionalCatalogs = [];
  bool _isLoadingMore = false;
  Object? _loadMoreError;
  bool? _hasMoreAdditional;

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 300), () {
      if (!mounted) return;
      final normalized = value.trim();
      setState(() {
        _query = normalized.isEmpty ? null : normalized;
        _additionalCatalogs = [];
        _loadMoreError = null;
        _hasMoreAdditional = null;
      });
    });
  }

  Future<void> _loadMore(PublishedCatalogPage page) async {
    if (_isLoadingMore || !(_hasMoreAdditional ?? page.hasMore)) return;
    final requestedQuery = _query;
    setState(() {
      _isLoadingMore = true;
      _loadMoreError = null;
    });
    try {
      final next = await ref
          .read(spatialRepositoryProvider)
          .fetchPublishedCatalogs(
            query: requestedQuery,
            limit: page.limit,
            offset: page.items.length + _additionalCatalogs.length,
          );
      if (!mounted || requestedQuery != _query) return;
      setState(() {
        _additionalCatalogs.addAll(next.items);
        _hasMoreAdditional = next.hasMore;
      });
    } on Exception catch (error) {
      if (mounted && requestedQuery == _query) {
        setState(() => _loadMoreError = error);
      }
    } finally {
      if (mounted) setState(() => _isLoadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final request = (query: _query, offset: 0);
    final catalogs = ref.watch(publishedCatalogPageProvider(request));
    final theme = Theme.of(context);

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () =>
            ref.refresh(publishedCatalogPageProvider(request).future),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Catalogs',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Browse published catalogs from I3DION organizations.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 18),
                    TextField(
                      controller: _searchController,
                      onChanged: _onSearchChanged,
                      textInputAction: TextInputAction.search,
                      decoration: InputDecoration(
                        hintText: 'Search catalogs',
                        prefixIcon: const Icon(Icons.search_rounded),
                        suffixIcon: _searchController.text.isEmpty
                            ? null
                            : IconButton(
                                tooltip: 'Clear search',
                                onPressed: () {
                                  _searchController.clear();
                                  _onSearchChanged('');
                                },
                                icon: const Icon(Icons.close_rounded),
                              ),
                        filled: true,
                        fillColor: theme.colorScheme.surface,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide(
                            color: theme.colorScheme.outlineVariant,
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide(
                            color: theme.colorScheme.outlineVariant,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            catalogs.when(
              loading: () => const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, stackTrace) => SliverFillRemaining(
                hasScrollBody: false,
                child: _CatalogMessage(
                  icon: Icons.cloud_off_outlined,
                  title: 'Catalogs unavailable',
                  message: error.toString(),
                  action: FilledButton.tonal(
                    onPressed: () =>
                        ref.invalidate(publishedCatalogPageProvider(request)),
                    child: const Text('Try again'),
                  ),
                ),
              ),
              data: (page) {
                final items = [...page.items, ..._additionalCatalogs];
                final hasMore = _hasMoreAdditional ?? page.hasMore;
                if (items.isEmpty) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: _CatalogMessage(
                      icon: Icons.inventory_2_outlined,
                      title: _query == null
                          ? 'No published catalogs yet'
                          : 'No matching catalogs',
                      message: _query == null
                          ? 'Published catalogs will appear here when available.'
                          : 'Try another search term.',
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
                  sliver: SliverList.builder(
                    itemCount:
                        items.length +
                        (hasMore || _loadMoreError != null ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == items.length) {
                        if (_loadMoreError != null) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: Column(
                              children: [
                                Text(
                                  'More catalogs could not be loaded.',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: theme.colorScheme.error,
                                  ),
                                ),
                                TextButton(
                                  onPressed: () => _loadMore(page),
                                  child: const Text('Retry'),
                                ),
                              ],
                            ),
                          );
                        }
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Center(
                            child: OutlinedButton.icon(
                              onPressed: _isLoadingMore
                                  ? null
                                  : () => _loadMore(page),
                              icon: _isLoadingMore
                                  ? const SizedBox.square(
                                      dimension: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Icon(Icons.expand_more_rounded),
                              label: Text(
                                _isLoadingMore ? 'Loading…' : 'Load more',
                              ),
                            ),
                          ),
                        );
                      }
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _CatalogCard(catalog: items[index]),
                      );
                    },
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _CatalogCard extends StatelessWidget {
  const _CatalogCard({required this.catalog});

  final PublishedCatalogSummary catalog;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/catalog/${catalog.slug}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: AppColors.spatialBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.inventory_2_outlined,
                  color: AppColors.spatialBlue,
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      catalog.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (catalog.organizationName?.isNotEmpty == true) ...[
                      const SizedBox(height: 3),
                      Text(
                        catalog.organizationName!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                    const SizedBox(height: 5),
                    Text(
                      '${catalog.productCount} '
                      '${catalog.productCount == 1 ? 'product' : 'products'}',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right_rounded),
            ],
          ),
        ),
      ),
    );
  }
}

class _CatalogMessage extends StatelessWidget {
  const _CatalogMessage({
    required this.icon,
    required this.title,
    required this.message,
    this.action,
  });

  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 42, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            message,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          if (action != null) ...[const SizedBox(height: 12), action!],
        ],
      ),
    );
  }
}
