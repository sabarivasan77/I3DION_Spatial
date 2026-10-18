import assert from 'node:assert';
import {
  DocumentStore,
  CommandBus,
  parseCatalogYaml,
  serializeCatalogYaml,
  ApplyYamlCommand,
  validateCatalogApp,
  parseProductCsv,
  generateCatalogFromProducts,
  generateCatalogFromPdf,
  exportCatalogApp,
  catalogTemplates,
  ClipboardManager
} from '../../../packages/editor-kernel/src/index.ts';
import { createBlankAppDefinition } from '../../../packages/contracts/src/catalogAppDefinition.ts';

console.log('================================================================');
console.log('🧪 I3DION Phase P5: Omni Studio (App Def, YAML, Validation, Import/Export)');
console.log('================================================================\n');

let passedCount = 0;
let failedCount = 0;

function pass(name, details = '') {
  console.log(`✅ [PASS] ${name}`);
  if (details) console.log(`   ${details}`);
  passedCount++;
}

function fail(name, error) {
  console.error(`❌ [FAIL] ${name}`);
  console.error(`   Error: ${error.message || error}`);
  failedCount++;
}

async function runStudioTestSuite() {
  // Test 1: YAML-01 Canonical YAML Parse
  try {
    const canonicalYaml = `schema: i3dion.catalog/1
meta:
  name: "Industrial Compressors 2027"
  slug: "compressors-2027"
  languages: [en, hi, ta]
  defaultLanguage: en
theme:
  preset: industrial-light
  primary: "#2563EB"
  font: Inter
  radius: 8
data:
  sources:
    products:
      vault: Products
      filter: "status = 'active'"
      pageSize: 24
variables:
  searchQuery:
    type: text
    default: ""
pages:
  - id: home
    title: Home
    layout:
      mode: stack
    children:
      - type: heading
        props:
          text: "{{ meta.name }}"
          level: h1
      - type: button
        props:
          label: "View Catalog"
        on:
          click:
            navigate: product-detail
  - id: product-detail
    title: Detail
    route: /p/:id
    children:
      - type: viewer_3d
        props:
          model: "asset:compressor-glb"
          ar: true
`;

    const result = parseCatalogYaml(canonicalYaml);
    if (!result.success) {
      console.error('YAML-01 errors:', result.errors);
    }
    assert.strictEqual(result.success, true, 'Canonical YAML must parse successfully');
    assert(result.doc, 'Parsed document must exist');
    assert.strictEqual(result.doc.meta.name, 'Industrial Compressors 2027');
    assert.strictEqual(result.doc.pages.length, 2);
    assert.strictEqual(result.doc.pages[1].route, '/p/:id');

    pass('YAML-01: Canonical YAML Parse', 'Successfully parsed i3dion.catalog/1 with pages, routes and theme');
  } catch (err) {
    fail('YAML-01: Canonical YAML Parse', err);
  }

  // Test 2: YAML-02 Rejection of invalid YAML corpus (oversize, custom tags, deep nesting, unknown keys, unsafe expressions)
  try {
    // 2a. Oversize YAML (> 1 MB)
    const largeYaml = 'schema: i3dion.catalog/1\n# ' + 'A'.repeat(1024 * 1024 + 100);
    const oversizeResult = parseCatalogYaml(largeYaml);
    assert.strictEqual(oversizeResult.success, false);
    assert.match(oversizeResult.errors[0].message, /exceeds maximum limit of 1 MB/i);

    // 2b. Custom YAML tag rejected
    const tagYaml = `schema: i3dion.catalog/1
meta: !customTag
  name: "Hacked"
`;
    const tagResult = parseCatalogYaml(tagYaml);
    assert.strictEqual(tagResult.success, false);
    assert.match(tagResult.errors[0].message, /strictly forbidden/i);

    // 2c. Deep nesting (> 32 levels)
    let deepYaml = 'schema: i3dion.catalog/1\nlevel0:\n';
    let indent = '  ';
    for (let d = 1; d <= 34; d++) {
      deepYaml += `${indent}level${d}:\n`;
      indent += '  ';
    }
    deepYaml += `${indent}val: true\n`;
    const deepResult = parseCatalogYaml(deepYaml);
    assert.strictEqual(deepResult.success, false);
    assert(deepResult.errors.some(e => e.message.includes('nesting depth')));

    // 2d. Unknown root key with Levenshtein fix hint
    const unknownRootYaml = `schema: i3dion.catalog/1
themee:
  primary: "#2563EB"
meta:
  name: "Test"
  slug: "test"
pages: []
`;
    const rootKeyResult = parseCatalogYaml(unknownRootYaml);
    assert.strictEqual(rootKeyResult.success, false);
    const rootErr = rootKeyResult.errors.find(e => e.message.includes("Unknown top-level property 'themee'"));
    assert(rootErr, "Must detect unknown property 'themee'");
    assert.match(rootErr.fixHint || '', /Did you mean 'theme'\?/);

    // 2e. Unsafe arbitrary JS expression rejected
    const unsafeExprYaml = `schema: i3dion.catalog/1
meta:
  name: "{{ window.location.href }}"
  slug: "test"
pages: []
`;
    const unsafeResult = parseCatalogYaml(unsafeExprYaml);
    assert.strictEqual(unsafeResult.success, false);
    assert(unsafeResult.errors.some(e => e.message.includes("Forbidden expression scope 'window'")));

    pass('YAML-02: Invalid YAML Corpus & Security Rejection', 'Oversize, custom tags, 34-level depth, unknown keys (with fix hints) and unsafe expressions strictly blocked');
  } catch (err) {
    fail('YAML-02: Invalid YAML Corpus & Security Rejection', err);
  }

  // Test 3: YAML-03 Round-trip equality
  try {
    const initialDoc = createBlankAppDefinition('Centrifugal Compressor Series', 'centrifugal-compressors');
    initialDoc.pages[0].children = [
      {
        id: 'heading-hero',
        type: 'heading',
        props: { text: 'Next-Gen Fluid Compressors', level: 'h1' }
      },
      {
        id: 'spec-detail',
        type: 'spec_table',
        props: { bind: 'products.specs' }
      }
    ];

    const serializedYaml = serializeCatalogYaml(initialDoc);
    const parseResult = parseCatalogYaml(serializedYaml);
    assert.strictEqual(parseResult.success, true, 'Serialized YAML must re-parse cleanly');
    assert.deepStrictEqual(parseResult.doc?.meta.name, initialDoc.meta.name);
    assert.deepStrictEqual(parseResult.doc?.pages[0].children?.length, initialDoc.pages[0].children?.length);

    pass('YAML-03: YAML ⇄ Canvas Round-Trip Equality', 'Document -> YAML -> Document round-trip verified');
  } catch (err) {
    fail('YAML-03: YAML ⇄ Canvas Round-Trip Equality', err);
  }

  // Test 4: YAML-04 Remote URL auto-ingested to Vault and rewritten to asset:
  try {
    const yamlWithUrl = `schema: i3dion.catalog/1
meta:
  name: "Auto Ingest Catalog"
  slug: "auto-ingest"
pages:
  - id: home
    title: Home
    children:
      - type: image
        props:
          src: "https://supplier-cdn.example.com/models/pump-render.png"
          alt: "Pump Render"
`;
    const ingestResult = parseCatalogYaml(yamlWithUrl);
    if (!ingestResult.success) {
      console.error('YAML-04 errors:', ingestResult.errors);
    }
    assert.strictEqual(ingestResult.success, true);
    assert(ingestResult.importedAssets && ingestResult.importedAssets.length === 1);
    assert.strictEqual(ingestResult.importedAssets[0].originalUrl, 'https://supplier-cdn.example.com/models/pump-render.png');

    const imageNode = ingestResult.doc?.pages[0].children?.[0];
    assert(imageNode && typeof imageNode.props.src === 'string');
    assert.match(imageNode.props.src, /^asset:vault-[a-z0-9]+/);

    pass('YAML-04: Remote URL Auto-Ingestion', `Remote URL converted to '${imageNode.props.src}' for Vault pipeline`);
  } catch (err) {
    fail('YAML-04: Remote URL Auto-Ingestion', err);
  }

  // Test 5: YAML-05 ApplyYamlCommand single atomic undo/redo
  try {
    const store = new DocumentStore();
    const bus = new CommandBus();

    const originalName = store.getDocument().meta.name;

    const modifiedDoc = JSON.parse(JSON.stringify(store.getDocument()));
    modifiedDoc.meta.name = 'Updated via YAML Editor';
    modifiedDoc.pages[0].title = 'Updated Title';

    // Apply YAML command
    bus.dispatch(new ApplyYamlCommand(store, modifiedDoc));
    assert.strictEqual(store.getDocument().meta.name, 'Updated via YAML Editor');

    // Undo YAML command
    bus.undo();
    assert.strictEqual(store.getDocument().meta.name, originalName, 'Undo must restore original document state completely');

    // Redo YAML command
    bus.redo();
    assert.strictEqual(store.getDocument().meta.name, 'Updated via YAML Editor', 'Redo must re-apply modified state');

    pass('YAML-05: ApplyYamlCommand Atomic Undo/Redo', 'Full YAML updates dispatch as ONE command and undo/redo cleanly');
  } catch (err) {
    fail('YAML-05: ApplyYamlCommand Atomic Undo/Redo', err);
  }

  // Test 6: STUDIO-01 Spreadsheet (CSV) 20-Product Catalog Generation
  try {
    const startTime = Date.now();
    let csvData = 'sku,name,category,price,description,photo,model3d\n';
    for (let i = 1; i <= 20; i++) {
      csvData += `CP-${1000 + i},Industrial Pump Model ${i},Pumps,$${(450 * i).toFixed(2)},High efficiency centrifugal stage,https://cdn.example.com/pump${i}.jpg,asset:pump-${i}-glb\n`;
    }

    const rows = parseProductCsv(csvData);
    assert.strictEqual(rows.length, 20, 'Must parse exactly 20 rows');

    const generatedDoc = generateCatalogFromProducts('Apex Fluid Systems 2027', rows, 'industrial-light');
    const elapsedMs = Date.now() - startTime;

    assert.strictEqual(generatedDoc.pages.length, 2, 'Must generate Home showcase and Detail specifications pages');
    const homePage = generatedDoc.pages[0];
    const gridWidget = homePage.children?.find(c => c.id === 'main-product-grid');
    assert(gridWidget, 'Home page must contain main-product-grid');
    assert.strictEqual(gridWidget.children?.length, 20, 'Product grid must contain all 20 product cards');

    assert(elapsedMs < 1000, `Generation must be near-instant (took ${elapsedMs}ms, budget < 1000ms)`);

    pass('STUDIO-01: 20-Product Spreadsheet Catalog Ingestion', `Generated branded 20-product catalog in ${elapsedMs}ms (< 1s budget)`);
  } catch (err) {
    fail('STUDIO-01: 20-Product Spreadsheet Catalog Ingestion', err);
  }

  // Test 7: STUDIO-02 PDF Catalog Import (3 pages + interactive hotspots)
  try {
    const pdfPages = [
      {
        pageNumber: 1,
        title: 'Cover & Executive Summary',
        imageAssetId: 'pdf-page-1-png',
        hotspots: [{ x: 10, y: 20, width: 30, height: 15 }]
      },
      {
        pageNumber: 2,
        title: 'Compressors Series Overview',
        imageAssetId: 'pdf-page-2-png',
        hotspots: [
          { x: 15, y: 35, width: 25, height: 20, targetProductId: 'CP-1001' },
          { x: 55, y: 35, width: 25, height: 20, targetProductId: 'CP-1002' }
        ]
      },
      {
        pageNumber: 3,
        title: 'Technical Specs & RFQ',
        imageAssetId: 'pdf-page-3-png',
        hotspots: [{ x: 20, y: 70, width: 60, height: 20 }]
      }
    ];

    const pdfCatalog = generateCatalogFromPdf('Industrial Equipment PDF Catalog', pdfPages);
    assert.strictEqual(pdfCatalog.pages.length, 3, 'Must create 3 catalog pages');
    assert.strictEqual(pdfCatalog.pages[1].children?.length, 3, 'Page 2 must have background image + 2 hotspots');
    assert.strictEqual(pdfCatalog.pages[1].children?.[0].type, 'image');
    assert.strictEqual(pdfCatalog.pages[1].children?.[1].type, 'button');

    pass('STUDIO-02: Multi-Page PDF Catalog Ingestion', '3 pages generated with background images and coordinate hotspots');
  } catch (err) {
    fail('STUDIO-02: Multi-Page PDF Catalog Ingestion', err);
  }

  // Test 8: STUDIO-03 Catalog Health Score & Validation Panel
  try {
    // 8a. Seeded document with multiple intentional validation errors:
    // 1. Broken navigation link (to 'missing-page')
    // 2. Unbound data source ('ghost_table')
    // 3. Image missing alt text
    // 4. Image referencing non-existent Vault asset
    // 5. 3D Viewer missing model
    // 6. 3D Viewer oversize model (> 50MB)
    // 7. Negative price
    // 8. Unreachable page
    // 9. Poor theme contrast
    const problematicDoc = createBlankAppDefinition('Problematic Catalog', 'problematic');
    problematicDoc.theme.mode = 'dark';
    problematicDoc.theme.primary = '#000000'; // Contrast failure on dark

    problematicDoc.pages[0].children = [
      {
        id: 'btn-broken',
        type: 'button',
        props: { label: 'Go' },
        on: { click: { navigate: 'ghost-page-999' } } // 1. Broken link
      },
      {
        id: 'table-unbound',
        type: 'spec_table',
        bind: 'ghost_table.specs', // 2. Unbound data
        props: {}
      },
      {
        id: 'img-no-alt',
        type: 'image',
        props: { src: 'asset:missing-asset-123', alt: '' } // 3. Missing alt + 4. Missing asset
      },
      {
        id: 'viewer-no-model',
        type: 'viewer_3d',
        props: { model: '', modelSizeBytes: 65 * 1024 * 1024 } // 5. Missing model + 6. Oversize model
      },
      {
        id: 'invalid-price-node',
        type: 'price',
        props: { amount: -50 } // 7. Negative price
      }
    ];

    // 8. Add unreachable second page
    problematicDoc.pages.push({
      id: 'unreachable-page',
      title: 'Hidden Page',
      layout: { mode: 'stack' },
      children: []
    });

    const knownVaultAssets = new Set(['valid-asset-1']);
    const healthReport = validateCatalogApp(problematicDoc, knownVaultAssets);

    assert.strictEqual(healthReport.canPublish, false, 'Publish must be STRICTLY blocked when critical errors exist');
    assert(healthReport.metrics.totalErrors >= 6, `Expected at least 6 errors, got ${healthReport.metrics.totalErrors}`);
    assert(healthReport.score < 50, `Health score should drop significantly (got ${healthReport.score})`);

    // 8b. Clean document
    const cleanDoc = createBlankAppDefinition('Clean Catalog', 'clean');
    cleanDoc.theme.primary = '#2563EB';
    cleanDoc.pages[0].children = [
      {
        id: 'valid-img',
        type: 'image',
        props: { src: 'asset:valid-asset-1', alt: 'Precision Turbine' }
      }
    ];
    const cleanReport = validateCatalogApp(cleanDoc, knownVaultAssets);
    assert.strictEqual(cleanReport.canPublish, true, 'Clean catalog must be permitted to publish');
    assert.strictEqual(cleanReport.score, 100, 'Clean catalog must achieve 100/100 health score');

    pass('STUDIO-03: Catalog Health Score & Validation Gates', `Seeded errors blocked publish (score: ${healthReport.score}/100); Clean catalog passed (score: 100/100)`);
  } catch (err) {
    fail('STUDIO-03: Catalog Health Score & Validation Gates', err);
  }

  // Test 9: STUDIO-04 Export Engine (YAML, JSON, Offline Package)
  try {
    const doc = createBlankAppDefinition('Turbine Catalog', 'turbines');
    doc.pages[0].children = [
      { id: 'img-1', type: 'image', props: { src: 'asset:turbine-photo', alt: 'Turbine Photo' } },
      { id: 'v3d-1', type: 'viewer_3d', props: { model: 'asset:turbine-glb' } }
    ];

    const exported = exportCatalogApp(doc);
    assert(exported.appDefinitionYaml.includes('schema: i3dion.catalog/1'));
    assert(exported.appDefinitionJson.includes('"schema": "i3dion.catalog/1"'));
    assert.strictEqual(exported.manifest.catalogName, 'Turbine Catalog');
    assert.strictEqual(exported.assetsManifest.length, 2, 'Exported manifest must collect all 2 referenced asset IDs');
    assert.strictEqual(exported.assetsManifest[0].assetRef, 'asset:turbine-photo');
    assert.strictEqual(exported.assetsManifest[1].assetRef, 'asset:turbine-glb');

    pass('STUDIO-04: Export Engine (YAML, JSON & Offline Bundle)', 'Exported manifest, YAML/JSON definitions, and asset dependencies');
  } catch (err) {
    fail('STUDIO-04: Export Engine (YAML, JSON & Offline Bundle)', err);
  }

  // Test 10: STUDIO-05 Templates (4 built-in presets)
  try {
    assert.strictEqual(catalogTemplates.length, 4, 'Must provide 4 built-in templates');

    const templateIds = catalogTemplates.map(t => t.id);
    assert.deepStrictEqual(templateIds, [
      'industrial-light',
      'high-contrast-dark',
      'machinery-heavy',
      'minimal-aerospace'
    ]);

    for (const tpl of catalogTemplates) {
      const generated = tpl.createCatalog(`Template Test ${tpl.name}`);
      assert.strictEqual(generated.theme.preset, tpl.id);
      assert.strictEqual(generated.schema, 'i3dion.catalog/1');
    }

    pass('STUDIO-05: Branded Design Templates', 'All 4 presets (Industrial, Diagnostics, Heavy Machinery, Aerospace) validated');
  } catch (err) {
    fail('STUDIO-05: Branded Design Templates', err);
  }

  // Summary
  console.log('\n================================================================');
  console.log(`📊 Test Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runStudioTestSuite();
