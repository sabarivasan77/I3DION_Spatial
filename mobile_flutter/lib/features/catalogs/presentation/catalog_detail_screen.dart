import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:i3dion_spatial_hub_mobile/app/theme.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/published_catalog.dart';
import 'package:i3dion_spatial_hub_mobile/features/explore/providers.dart';

class CatalogDetailScreen extends ConsumerWidget {
  const CatalogDetailScreen({required this.slug, super.key});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catalog = ref.watch(publishedCatalogProvider(slug));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Catalog details')),
      body: SafeArea(
        child: catalog.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stackTrace) => _CatalogDetailMessage(
            icon: Icons.cloud_off_outlined,
            title: 'Catalog unavailable',
            message: error.toString(),
            action: FilledButton.tonal(
              onPressed: () => ref.invalidate(publishedCatalogProvider(slug)),
              child: const Text('Try again'),
            ),
          ),
          data: (data) => ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
            children: [
              Container(
                height: 148,
                decoration: BoxDecoration(
                  color: AppColors.deepNavy,
                  borderRadius: BorderRadius.circular(20),
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.inventory_2_outlined,
                  color: Colors.white,
                  size: 52,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                data.summary.name,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (data.summary.organizationName?.isNotEmpty == true) ...[
                const SizedBox(height: 5),
                Text(
                  data.summary.organizationName!,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
              if (data.summary.description.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  data.summary.description,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Text(
                '${data.products.length} '
                '${data.products.length == 1 ? 'product' : 'products'}',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 10),
              if (data.products.isEmpty)
                const _CatalogDetailMessage(
                  icon: Icons.inventory_2_outlined,
                  title: 'No products in this catalog',
                  message:
                      'Products will appear here when included in the published catalog.',
                )
              else
                for (final product in data.products)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _CatalogProductCard(product: product),
                  ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CatalogProductCard extends StatelessWidget {
  const _CatalogProductCard({required this.product});

  final PublishedCatalogProduct product;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        enabled: product.hasModel,
        onTap: product.hasModel
            ? () => context.push('/viewer/${product.id}')
            : null,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: const Icon(
          Icons.view_in_ar_outlined,
          color: AppColors.spatialBlue,
        ),
        title: Text(product.name, maxLines: 2, overflow: TextOverflow.ellipsis),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(product.category),
            if (product.description.isNotEmpty)
              Text(
                product.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            if (!product.hasModel)
              Text(
                'No 3D model available',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
          ],
        ),
        trailing: product.hasModel
            ? const Icon(Icons.chevron_right_rounded)
            : const Icon(Icons.image_not_supported_outlined),
      ),
    );
  }
}

class _CatalogDetailMessage extends StatelessWidget {
  const _CatalogDetailMessage({
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
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 40, color: theme.colorScheme.onSurfaceVariant),
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
      ),
    );
  }
}
