import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:i3dion_spatial_hub_mobile/features/scan/domain/content_link.dart';

class LinkStatusScreen extends StatelessWidget {
  const LinkStatusScreen({
    this.kind,
    this.contentId,
    this.invalidLink = false,
    super.key,
  });

  final ContentKind? kind;
  final String? contentId;
  final bool invalidLink;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isInvalid = invalidLink || kind == null || contentId == null;
    return Scaffold(
      appBar: AppBar(
        title: Text(
          isInvalid ? 'Link not opened' : '${kind!.displayName} link',
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isInvalid ? Icons.link_off_rounded : Icons.verified_rounded,
                size: 56,
                color: isInvalid
                    ? theme.colorScheme.error
                    : theme.colorScheme.primary,
              ),
              const SizedBox(height: 18),
              Text(
                isInvalid ? 'This link could not be verified' : 'Link verified',
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                isInvalid
                    ? 'Only supported I3DION model, catalog, and collection '
                          'links are opened in the app.'
                    : '${kind!.displayName} · $contentId',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              if (!isInvalid) ...[
                const SizedBox(height: 14),
                Text(
                  'The link is validated. Content details will be connected '
                  'after the backend mobile API contract is agreed.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => context.go('/explore'),
                icon: const Icon(Icons.explore_rounded),
                label: const Text('Back to Explore'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
