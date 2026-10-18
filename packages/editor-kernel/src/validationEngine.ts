import type { AppDefinitionContract, AppNode, AppPage } from '../../contracts/src/catalogAppDefinition.ts';

export interface CatalogValidationIssue {
  id: string;
  category:
    | 'broken_link'
    | 'missing_asset'
    | 'unbound_field'
    | 'price_issue'
    | 'oversize_model'
    | 'contrast_failure'
    | 'unreachable_page'
    | 'general';
  severity: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: string;
  pageId?: string;
  fixHint?: string;
}

export interface CatalogHealthReport {
  score: number; // 0 - 100
  canPublish: boolean;
  issues: CatalogValidationIssue[];
  metrics: {
    totalErrors: number;
    totalWarnings: number;
    totalPages: number;
    totalWidgets: number;
  };
}

/**
 * Validates entire Catalog App Definition for publish readiness and generates
 * the Catalog Health Score (0-100) per Master Specification §4.2.
 */
export function validateCatalogApp(
  doc: AppDefinitionContract,
  knownAssetIds?: Set<string>
): CatalogHealthReport {
  const issues: CatalogValidationIssue[] = [];
  const pageIdSet = new Set(doc.pages.map(p => p.id));
  const linkedPageIds = new Set<string>();

  // Ensure default home page exists
  if (doc.pages.length === 0) {
    issues.push({
      id: 'no-pages',
      category: 'unreachable_page',
      severity: 'error',
      message: 'Catalog has no pages defined.',
      fixHint: 'Add at least one page to your catalog'
    });
  }

  // Check theme contrast
  if (doc.theme) {
    const isDark = doc.theme.mode === 'dark';
    const primary = (doc.theme.primary || '').toLowerCase();
    // Simple luminance heuristic: pure black on dark or pure white on light is a contrast failure
    if (isDark && (primary === '#000000' || primary === '#111827' || primary === 'black')) {
      issues.push({
        id: 'contrast-dark-fail',
        category: 'contrast_failure',
        severity: 'error',
        message: 'Theme primary color lacks sufficient contrast against dark background.',
        fixHint: 'Use a vibrant, light primary color (e.g. #38BDF8 or #F59E0B) for dark mode'
      });
    } else if (!isDark && (primary === '#ffffff' || primary === 'white')) {
      issues.push({
        id: 'contrast-light-fail',
        category: 'contrast_failure',
        severity: 'error',
        message: 'Theme primary color lacks sufficient contrast against light background.',
        fixHint: 'Use a darker primary color (e.g. #2563EB or #0F172A) for light mode'
      });
    }
  }

  let totalWidgets = 0;
  const knownDataSources = new Set(Object.keys(doc.data?.sources || {}));

  // Recursive node inspector
  function inspectNode(node: AppNode, pageId: string): void {
    totalWidgets++;

    const nodeAny = node as any;

    // 1. Check broken navigation links in events
    if (nodeAny.on) {
      for (const [eventName, eventHandler] of Object.entries(nodeAny.on)) {
        const handlerAny = eventHandler as any;
        if (handlerAny?.navigate) {
          const target = String(handlerAny.navigate);
          linkedPageIds.add(target);
          if (!pageIdSet.has(target)) {
            issues.push({
              id: `broken-link-${node.id}-${eventName}`,
              category: 'broken_link',
              severity: 'error',
              nodeId: node.id,
              pageId,
              message: `Widget '${node.title || node.type}' navigates to non-existent page '${target}' on ${eventName}.`,
              fixHint: `Change target to one of: ${Array.from(pageIdSet).join(', ')}`
            });
          }
        }
      }
    }

    // 2. Check data binding
    if (nodeAny.bind) {
      const sourceName = String(nodeAny.bind).split('.')[0];
      if (!knownDataSources.has(sourceName)) {
        issues.push({
          id: `unbound-data-${node.id}`,
          category: 'unbound_field',
          severity: 'error',
          nodeId: node.id,
          pageId,
          message: `Widget '${node.title || node.type}' is bound to undefined data source '${sourceName}'.`,
          fixHint: `Define data source '${sourceName}' under data.sources in your App Definition`
        });
      }
    }

    // 3. Check assets & alt text
    if (node.type === 'image') {
      const src = String(node.props?.src || '');
      const alt = String(node.props?.alt || '');
      if (!alt || alt.trim() === '') {
        issues.push({
          id: `missing-alt-${node.id}`,
          category: 'missing_asset',
          severity: 'warning',
          nodeId: node.id,
          pageId,
          message: `Image widget '${node.id}' is missing descriptive alt text for accessibility (WCAG 2.2).`,
          fixHint: "Add an 'alt' property describing the product image"
        });
      }

      if (src.startsWith('asset:') && knownAssetIds) {
        const assetId = src.replace(/^asset:/, '');
        if (!knownAssetIds.has(assetId)) {
          issues.push({
            id: `missing-asset-${node.id}`,
            category: 'missing_asset',
            severity: 'error',
            nodeId: node.id,
            pageId,
            message: `Asset '${src}' referenced by image widget does not exist in the tenant Vault.`,
            fixHint: 'Upload the asset to Vault or rebind to an existing asset'
          });
        }
      }
    }

    // 4. Check 3D viewer model size & presence
    if (node.type === 'viewer_3d') {
      const model = String(node.props?.model || '');
      if (!model) {
        issues.push({
          id: `missing-model-${node.id}`,
          category: 'missing_asset',
          severity: 'error',
          nodeId: node.id,
          pageId,
          message: `3D Viewer '${node.id}' has no 3D model assigned.`,
          fixHint: "Provide an asset reference, e.g. props: { model: 'asset:compressor-glb' }"
        });
      }

      const modelSizeBytes = Number(node.props?.modelSizeBytes || 0);
      if (modelSizeBytes > 50 * 1024 * 1024) {
        issues.push({
          id: `oversize-model-err-${node.id}`,
          category: 'oversize_model',
          severity: 'error',
          nodeId: node.id,
          pageId,
          message: `3D Model size ${(modelSizeBytes / (1024 * 1024)).toFixed(1)} MB exceeds maximum limit of 50 MB.`,
          fixHint: 'Compress textures and run Draco mesh compression before uploading'
        });
      } else if (modelSizeBytes > 25 * 1024 * 1024) {
        issues.push({
          id: `oversize-model-warn-${node.id}`,
          category: 'oversize_model',
          severity: 'warning',
          nodeId: node.id,
          pageId,
          message: `3D Model is ${(modelSizeBytes / (1024 * 1024)).toFixed(1)} MB. Models over 25 MB may load slowly on mobile networks.`,
          fixHint: 'Consider optimizing LOD or textures for mobile players'
        });
      }
    }

    // 5. Check price widget
    if (node.type === 'price') {
      const amount = node.props?.amount;
      if (amount === undefined || amount === null || Number(amount) < 0) {
        issues.push({
          id: `invalid-price-${node.id}`,
          category: 'price_issue',
          severity: 'error',
          nodeId: node.id,
          pageId,
          message: `Price widget '${node.id}' has missing or negative amount.`,
          fixHint: "Set a valid positive number or use 'RFQ / Request Quote' mode"
        });
      }
    }

    // Traverse children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        inspectNode(child, pageId);
      }
    }
  }

  // Inspect all pages and child nodes
  for (const page of doc.pages) {
    if (page.children) {
      for (const node of page.children) {
        inspectNode(node, page.id);
      }
    }
  }

  // 6. Check unreachable pages (page that is not page 0, has no route, and no navigation link points to it)
  for (let i = 1; i < doc.pages.length; i++) {
    const page = doc.pages[i] as any;
    const isLinked = linkedPageIds.has(page.id);
    const hasRoute = Boolean(page.route && page.route.trim() !== '');

    if (!isLinked && !hasRoute) {
      issues.push({
        id: `unreachable-page-${page.id}`,
        category: 'unreachable_page',
        severity: 'warning',
        pageId: page.id,
        message: `Page '${page.title || page.id}' cannot be reached by visitors (no URL route and no buttons navigate to it).`,
        fixHint: "Assign a URL route (e.g. route: /p/:id) or add a button that navigates to this page"
      });
    }
  }

  // Compute Health Score (0 - 100)
  // Each error deducts 15 points; each warning deducts 5 points
  const totalErrors = issues.filter(i => i.severity === 'error').length;
  const totalWarnings = issues.filter(i => i.severity === 'warning').length;

  const rawScore = 100 - (totalErrors * 15 + totalWarnings * 5);
  const score = Math.max(0, Math.min(100, rawScore));
  const canPublish = totalErrors === 0;

  return {
    score,
    canPublish,
    issues,
    metrics: {
      totalErrors,
      totalWarnings,
      totalPages: doc.pages.length,
      totalWidgets
    }
  };
}
