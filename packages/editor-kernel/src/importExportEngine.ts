import type { AppDefinitionContract, AppNode, AppPage } from '../../contracts/src/catalogAppDefinition.ts';
import { serializeCatalogYaml } from './yamlEngine.ts';

export interface SpreadsheetProductRow {
  sku?: string;
  name: string;
  category?: string;
  price?: number | string;
  description?: string;
  photo?: string;
  model3d?: string;
  specs?: Record<string, string>;
  [key: string]: any;
}

export interface PdfImportPageSpec {
  pageNumber: number;
  title?: string;
  imageAssetId: string;
  hotspots?: { x: number; y: number; width: number; height: number; targetProductId?: string }[];
}

/**
 * Parses raw CSV text into an array of product rows
 */
export function parseProductCsv(csvContent: string): SpreadsheetProductRow[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const products: SpreadsheetProductRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV splitting handling simple quotes
    const cells: string[] = [];
    let inQuotes = false;
    let currentCell = '';

    for (let c = 0; c < lines[i].length; c++) {
      const char = lines[i][c];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    const row: any = {};
    for (let h = 0; h < headers.length; h++) {
      const headerName = headers[h];
      const val = cells[h] || '';
      row[headerName] = val;
    }

    if (row.name || row.title) {
      products.push({
        sku: row.sku || `SKU-${i}`,
        name: row.name || row.title,
        category: row.category || 'General',
        price: row.price ? Number(row.price.replace(/[^0-9.]/g, '')) || 0 : 0,
        description: row.description || '',
        photo: row.photo || row.image || '',
        model3d: row.model3d || row.model || ''
      });
    }
  }

  return products;
}

/**
 * Generates an end-to-end branded Catalog App Definition from an array of spreadsheet products
 */
export function generateCatalogFromProducts(
  catalogName: string,
  products: SpreadsheetProductRow[],
  brandTheme: 'industrial-light' | 'high-contrast-dark' | 'machinery-heavy' | 'minimal-aerospace' = 'industrial-light'
): AppDefinitionContract {
  const slug = catalogName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const homeChildren: AppNode[] = [
    {
      id: 'hero-header',
      type: 'heading',
      title: catalogName,
      props: {
        text: catalogName,
        level: 'h1',
        subtitle: `Explore our interactive catalog of ${products.length} precision-engineered models`,
        align: 'center'
      }
    },
    {
      id: 'search-filter-bar',
      type: 'search_box',
      props: {
        placeholder: 'Search specifications, series, or product names...',
        bindVariable: 'searchQuery'
      }
    },
    {
      id: 'main-product-grid',
      type: 'grid',
      title: 'Products Showcase',
      layout: {
        mode: 'grid',
        columns: 3,
        gap: 20
      },
      children: products.map((prod, idx) => ({
        id: `card-${prod.sku || idx}`,
        type: 'product_card',
        title: prod.name,
        props: {
          title: prod.name,
          sku: prod.sku,
          price: prod.price,
          category: prod.category,
          image: prod.photo || 'asset:default-product-img'
        },
        on: {
          click: {
            navigate: 'page-detail',
            params: { id: prod.sku || String(idx) }
          }
        }
      }))
    }
  ];

  const detailPage: AppPage = {
    id: 'page-detail',
    title: 'Product Specifications & 3D',
    route: '/p/:id',
    layout: {
      mode: 'stack',
      direction: 'vertical',
      gap: 24,
      columns: 1,
      align: 'stretch',
      justify: 'start'
    },
    children: [
      {
        id: 'detail-heading',
        type: 'heading',
        props: {
          text: '{{ product.name }}',
          level: 'h2',
          subtitle: 'Series SKU: {{ product.sku }}'
        }
      },
      {
        id: 'detail-viewer-3d',
        type: 'viewer_3d',
        props: {
          model: '{{ product.model3d }}',
          ar: true,
          hotspots: 'from-scene'
        }
      },
      {
        id: 'detail-spec-table',
        type: 'spec_table',
        props: {
          bind: 'product.specs'
        }
      },
      {
        id: 'detail-rfq-button',
        type: 'rfq_form',
        props: {
          productName: '{{ product.name }}',
          submitLabel: 'Request Commercial Quote'
        }
      }
    ]
  };

  return {
    schema: 'i3dion.catalog/1',
    meta: {
      name: catalogName,
      slug,
      description: `Precision Product Catalog: ${catalogName}`,
      languages: ['en'],
      defaultLanguage: 'en',
      version: '1.0.0'
    },
    theme: {
      preset: brandTheme,
      primary: brandTheme === 'machinery-heavy' ? '#D97706' : brandTheme === 'high-contrast-dark' ? '#06B6D4' : '#2563EB',
      secondary: '#0F172A',
      font: 'Inter',
      radius: 8,
      mode: brandTheme === 'high-contrast-dark' ? 'dark' : 'light'
    },
    data: {
      sources: {
        products: {
          vault: 'Products',
          sort: ['name asc'],
          pageSize: 24
        }
      }
    },
    variables: {
      searchQuery: { type: 'text', default: '' },
      selectedCategory: { type: 'text', default: 'all' }
    },
    pages: [
      {
        id: 'page-home',
        title: 'Home Showcase',
        layout: {
          mode: 'stack',
          direction: 'vertical',
          gap: 24,
          columns: 1,
          align: 'stretch',
          justify: 'start'
        },
        children: homeChildren
      },
      detailPage
    ],
    revision: 1
  };
}

/**
 * Generates interactive pages from an imported PDF
 */
export function generateCatalogFromPdf(
  catalogName: string,
  pdfPages: PdfImportPageSpec[]
): AppDefinitionContract {
  const slug = catalogName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const pages: AppPage[] = pdfPages.map(page => {
    const pageId = `page-pdf-${page.pageNumber}`;
    const hotspotsNodes: AppNode[] = (page.hotspots || []).map((hs, i) => ({
      id: `hotspot-${page.pageNumber}-${i}`,
      type: 'button',
      title: 'Interactive Hotspot',
      props: {
        label: 'View 3D',
        style: {
          position: 'absolute',
          left: `${hs.x}%`,
          top: `${hs.y}%`,
          width: `${hs.width}%`,
          height: `${hs.height}%`
        }
      },
      on: {
        click: {
          navigate: 'page-home'
        }
      }
    }));

    return {
      id: pageId,
      title: page.title || `Page ${page.pageNumber}`,
      route: `/page/${page.pageNumber}`,
      layout: {
        mode: 'free'
      },
      children: [
        {
          id: `bg-image-${page.pageNumber}`,
          type: 'image',
          props: {
            src: `asset:${page.imageAssetId}`,
            alt: `Page ${page.pageNumber} scan`
          }
        },
        ...hotspotsNodes
      ]
    };
  });

  return {
    schema: 'i3dion.catalog/1',
    meta: {
      name: catalogName,
      slug,
      description: `Imported PDF Catalog: ${catalogName}`,
      languages: ['en'],
      defaultLanguage: 'en',
      version: '1.0.0'
    },
    theme: {
      preset: 'industrial-light',
      primary: '#2563EB',
      secondary: '#0F172A',
      font: 'Inter',
      radius: 8,
      mode: 'light'
    },
    pages,
    revision: 1
  };
}

export interface OfflinePackageBundle {
  manifest: {
    appId: string;
    version: string;
    catalogName: string;
    createdAt: string;
  };
  appDefinitionYaml: string;
  appDefinitionJson: string;
  assetsManifest: { assetRef: string; filename: string }[];
}

/**
 * Exports the complete Catalog App Definition to YAML, JSON, and Offline Package bundle
 */
export function exportCatalogApp(doc: AppDefinitionContract): OfflinePackageBundle {
  const appDefinitionYaml = serializeCatalogYaml(doc);
  const appDefinitionJson = JSON.stringify(doc, null, 2);

  const assets: { assetRef: string; filename: string }[] = [];

  function collectAssets(node: AppNode): void {
    if (node.props) {
      for (const val of Object.values(node.props)) {
        if (typeof val === 'string' && val.startsWith('asset:')) {
          assets.push({
            assetRef: val,
            filename: `${val.replace(/^asset:/, '')}.bin`
          });
        }
      }
    }
    if (node.children) {
      for (const c of node.children) collectAssets(c);
    }
  }

  for (const p of doc.pages) {
    if (p.children) {
      for (const n of p.children) collectAssets(n);
    }
  }

  return {
    manifest: {
      appId: doc.meta.slug,
      version: doc.meta.version || '1.0.0',
      catalogName: doc.meta.name,
      createdAt: new Date().toISOString()
    },
    appDefinitionYaml,
    appDefinitionJson,
    assetsManifest: assets
  };
}
