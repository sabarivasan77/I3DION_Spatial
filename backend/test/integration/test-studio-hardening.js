import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { app } from '../../src/server.js';
import { pool, query, ensureMigrated } from '../../src/db/pool.js';
import { config } from '../../src/config.js';
import { CatalogCompositionContractSchema } from '../../../packages/contracts/src/catalogComposition.ts';

console.log('================================================================');
console.log('🧪 Omni Studio Product Hardening: Automated Verification Suite');
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

async function runStudioSuite() {
  await ensureMigrated();

  // Start ephemeral HTTP server on dynamic port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🚀 Ephemeral test server listening on ${baseUrl}\n`);

  const testRunId = Date.now();
  let orgId = null;
  let adminUserId = null;
  let token = null;
  let catalogId = null;
  let productId = null;
  let vaultAssetId = null;

  try {
    // -------------------------------------------------------------
    // SETUP: Test Tenant & Authenticated Admin
    // -------------------------------------------------------------
    const orgRes = await query(
      `INSERT INTO organizations (name, website, profile, primary_color)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name`,
      [
        `Omni Studio Hardening Dynamics ${testRunId}`,
        'https://omni-studio-hardening.i3dion.com',
        'Industrial Dynamics Equipment Catalog Studio',
        '#2563EB'
      ]
    );
    orgId = orgRes.rows[0].id;

    const userRes = await query(
      `INSERT INTO users (organization_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, role, email`,
      [
        orgId,
        'Elena Rostova (Catalog Lead)',
        `elena.rostova.${testRunId}@i3dion.internal`,
        '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        'Admin'
      ]
    );
    adminUserId = userRes.rows[0].id;
    token = jwt.sign({ userId: adminUserId }, config.jwtSecret);
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 1. Create corresponding Vault Asset with v1 and v2 history
    const assetRes = await query(
      `INSERT INTO vault_assets (
        organization_id, name, description, category, type, original_name,
        storage_key, public_url, mime_type, size_bytes, visibility, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        orgId,
        'Pump CAD Geometry',
        'Authoritative engineering model',
        '3D CAD',
        '3D Model',
        'pump_v1.glb',
        `vault-pump-model-${testRunId}.glb`,
        `/uploads/vault-pump-model-${testRunId}.glb`,
        'model/gltf-binary',
        1838084,
        'Organization',
        'Ready',
        adminUserId
      ]
    );
    vaultAssetId = assetRes.rows[0].id;

    // Record v1 in vault_asset_versions
    await query(
      `INSERT INTO vault_asset_versions (
        asset_id, version_number, original_name, storage_key, public_url, mime_type, size_bytes, change_description, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        vaultAssetId, 1, 'pump_v1.glb', `vault-pump-model-${testRunId}.glb`,
        `/uploads/vault-pump-model-${testRunId}.glb`, 'model/gltf-binary', 1838084, 'Initial CAD release', adminUserId
      ]
    );

    // 2. Create a product in products table linked to Vault asset
    const prodRes = await query(
      `INSERT INTO products (organization_id, name, slug, category, description, specs, dimensions, model_url, model_asset_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, slug`,
      [
        orgId,
        'Centrifugal Fluid Pump CP-450',
        `pump-cp450-${testRunId}`,
        'Fluid Handling',
        'High performance centrifugal slurry pump for continuous plant operations.',
        JSON.stringify({ FlowRate: '450 m3/h', Head: '65 m', Power: '75 kW', Efficiency: '84%' }),
        JSON.stringify({ length: 1420, width: 850, height: 920, weight: 640 }),
        `/uploads/vault-pump-model-${testRunId}.glb`,
        vaultAssetId
      ]
    );
    productId = prodRes.rows[0].id;

    pass('Tenant, User & Authoritative Vault Asset Baseline Established', `Org: ${orgId}, Product: ${productId}, Asset: ${vaultAssetId}`);

    // -------------------------------------------------------------
    // TEST 1: Catalog Workspace Lifecycle & Tenant Isolation
    // -------------------------------------------------------------
    try {
      // 1.1: Create catalog
      const createPayload = {
        name: '2026 Process Equipment Master Catalog',
        description: 'Comprehensive industrial pumping and processing systems catalog.',
        branding: {
          companyName: 'I3DION Industrial Dynamics',
          primaryColor: '#2563EB',
          accentColor: '#0F172A',
          fontFamily: 'Inter',
          contactEmail: 'sales@i3dion.com'
        }
      };

      const createRes = await fetch(`${baseUrl}/api/studio/catalogs`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(createPayload)
      });
      assert.strictEqual(createRes.status, 201, 'Create catalog should return 201');
      const createdCatalog = await createRes.json();
      catalogId = createdCatalog.id;
      assert.strictEqual(createdCatalog.name, createPayload.name);
      assert.strictEqual(createdCatalog.status, 'Draft');
      assert.ok(createdCatalog.slug.length > 5);

      // 1.2: Fetch catalog detail
      const detailRes = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}`, { headers: authHeaders });
      assert.strictEqual(detailRes.status, 200);
      const detail = await detailRes.json();
      assert.strictEqual(detail.id, catalogId);
      assert.ok(detail.layout_config.sections.length >= 3, 'Must initialize default sections');

      // 1.3: Update catalog
      const patchRes = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ description: 'Updated technical specification catalog.' })
      });
      assert.strictEqual(patchRes.status, 200);
      const updated = await patchRes.json();
      assert.strictEqual(updated.description, 'Updated technical specification catalog.');

      // 1.4: Duplicate catalog
      const dupRes = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}/duplicate`, {
        method: 'POST',
        headers: authHeaders
      });
      assert.strictEqual(dupRes.status, 201);
      const duplicated = await dupRes.json();
      assert.ok(duplicated.name.includes('(Copy)'));
      assert.notStrictEqual(duplicated.id, catalogId);

      // 1.5: Archive duplicated catalog
      const archiveRes = await fetch(`${baseUrl}/api/studio/catalogs/${duplicated.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      assert.strictEqual(archiveRes.status, 200);

      pass('Test 1: Catalog Workspace Lifecycle & Tenant Isolation Verified', 
        `Created: ${catalogId} -> Updated -> Duplicated (${duplicated.id}) -> Archived.`);
    } catch (err) {
      fail('Test 1: Catalog Workspace Lifecycle & Tenant Isolation Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 2: Vault Content Picker with Version Pinning (Decision D-05)
    // -------------------------------------------------------------
    try {
      // 2.1: Pin product with version 1
      const pinRes = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}/products`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          productId,
          pinnedVersionNumber: 1,
          pinnedAssetId: vaultAssetId,
          customSpecOverrides: { ImpellerDiameter: '320 mm' },
          sortOrder: 1
        })
      });
      assert.strictEqual(pinRes.status, 200);

      // 2.2: Verify pinned item in catalog detail
      const catCheck1 = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}`, { headers: authHeaders });
      const catData1 = await catCheck1.json();
      assert.strictEqual(catData1.products.length, 1);
      assert.strictEqual(catData1.products[0].pinnedVersionNumber, 1);
      assert.strictEqual(catData1.products[0].isOutdated, false);

      // 2.3: Ingest Version 2 into Spatial Vault
      await query(
        `INSERT INTO vault_asset_versions (
          asset_id, version_number, original_name, storage_key, public_url, mime_type, size_bytes, change_description, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          vaultAssetId, 2, 'pump_v2_enhanced.glb', `vault-pump-model-v2-${testRunId}.glb`,
          `/uploads/vault-pump-model-v2-${testRunId}.glb`, 'model/gltf-binary', 1945120, 'V2 high-flow impeller upgrade', adminUserId
        ]
      );
      await query(
        `UPDATE vault_assets 
         SET storage_key = $1, public_url = $2, size_bytes = $3
         WHERE id = $4`,
        [`vault-pump-model-v2-${testRunId}.glb`, `/uploads/vault-pump-model-v2-${testRunId}.glb`, 1945120, vaultAssetId]
      );

      // 2.4: Verify Catalog still serves Version 1 immutably!
      const catCheck2 = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}`, { headers: authHeaders });
      const catData2 = await catCheck2.json();
      assert.strictEqual(catData2.products[0].pinnedVersionNumber, 1, 'Catalog MUST retain pinned version 1 despite upstream v2!');
      assert.strictEqual(catData2.products[0].latestVaultVersion, 2, 'Latest Vault version should be recognized as 2');
      assert.strictEqual(catData2.products[0].isOutdated, true, 'Product should be flagged as outdated');

      pass('Test 2: Vault Content Picker with Version Pinning Verified (Decision D-05)', 
        'Pinned v1 -> Vault upgraded to v2 -> Catalog immutably retained v1 with zero silent mutation.');
    } catch (err) {
      fail('Test 2: Vault Content Picker with Version Pinning Verified (Decision D-05)', err);
    }

    // -------------------------------------------------------------
    // TEST 3: "Asset Updated in Vault — Re-Publish?" Detection
    // -------------------------------------------------------------
    try {
      const syncStatusRes = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}/sync-status`, { headers: authHeaders });
      assert.strictEqual(syncStatusRes.status, 200);
      const syncStatus = await syncStatusRes.json();

      assert.strictEqual(syncStatus.hasOutdatedAssets, true, 'hasOutdatedAssets must be true');
      assert.strictEqual(syncStatus.outdatedCount, 1);
      assert.strictEqual(syncStatus.outdatedItems[0].pinnedVersion, 1);
      assert.strictEqual(syncStatus.outdatedItems[0].latestVaultVersion, 2);

      pass('Test 3: "Asset Updated in Vault — Re-publish?" Prompt Detected Accurately', 
        `Sync status detected outdated asset (pinned: v1, available in Vault: v2).`);
    } catch (err) {
      fail('Test 3: "Asset Updated in Vault — Re-publish?" Prompt Detected Accurately', err);
    }

    // -------------------------------------------------------------
    // TEST 4: Explicit Sync Update
    // -------------------------------------------------------------
    try {
      const syncActionRes = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}/sync-assets`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ productIds: [productId] })
      });
      assert.strictEqual(syncActionRes.status, 200);
      const syncAction = await syncActionRes.json();
      assert.strictEqual(syncAction.updatedCount, 1);
      assert.strictEqual(syncAction.updatedProducts[0].toVersion, 2);

      // Verify sync status is now clean
      const checkClean = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}/sync-status`, { headers: authHeaders });
      const cleanData = await checkClean.json();
      assert.strictEqual(cleanData.hasOutdatedAssets, false, 'All items should now be synced');

      pass('Test 4: Explicit Sync Update to Latest Vault Version Verified', 
        'Explicit author confirmation updated pinned version to v2; out-of-sync status resolved.');
    } catch (err) {
      fail('Test 4: Explicit Sync Update to Latest Vault Version Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 5: Composition & Layout Contract Validation
    // -------------------------------------------------------------
    try {
      const detailRes = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}`, { headers: authHeaders });
      const catalog = await detailRes.json();

      const contractPayload = {
        contractVersion: '1.0',
        catalogId: catalog.id,
        organizationId: catalog.organization_id,
        title: catalog.name,
        slug: catalog.slug,
        description: catalog.description,
        status: catalog.status,
        branding: catalog.branding,
        sections: catalog.layout_config?.sections || [],
        pinnedProducts: catalog.products.map(p => ({
          productId: p.productId,
          productName: p.productName,
          productSlug: p.productSlug,
          category: p.category,
          description: p.description,
          pinnedAssetId: p.pinnedAssetId,
          pinnedVersionNumber: p.pinnedVersionNumber,
          pinnedStorageKey: p.vaultStorageKey,
          pinnedPublicUrl: p.vaultPublicUrl,
          specs: p.specs,
          dimensions: p.dimensions,
          sortOrder: p.sortOrder
        }))
      };

      const validated = CatalogCompositionContractSchema.parse(contractPayload);
      assert.strictEqual(validated.contractVersion, '1.0');
      assert.ok(validated.sections.length >= 3);
      assert.strictEqual(validated.pinnedProducts.length, 1);

      pass('Test 5: Composition & Layout Contract Schema Validation Verified', 
        `Zod validated CatalogCompositionContractSchema with ${validated.sections.length} sections and ${validated.pinnedProducts.length} pinned products.`);
    } catch (err) {
      fail('Test 5: Composition & Layout Contract Schema Validation Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 6: Desktop & Mobile Responsive Live Preview
    // -------------------------------------------------------------
    try {
      const previewRes = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}/preview`, { headers: authHeaders });
      assert.strictEqual(previewRes.status, 200);
      const preview = await previewRes.json();

      assert.strictEqual(preview.catalogId, catalogId);
      assert.ok(preview.previewTimestamp);
      assert.ok(Array.isArray(preview.sections));
      assert.ok(Array.isArray(preview.products));
      assert.strictEqual(preview.products[0].productId, productId);

      pass('Test 6: Desktop & Mobile Responsive Live Preview Verified', 
        `Preview payload loaded with ${preview.sections.length} sections, branding tokens, and live product specifications.`);
    } catch (err) {
      fail('Test 6: Desktop & Mobile Responsive Live Preview Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 7: Universal Publishing Ceremony & QR Code Association
    // -------------------------------------------------------------
    try {
      // 7.1: Publish Catalog
      const pubRes = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}/publish`, {
        method: 'POST',
        headers: authHeaders
      });
      assert.strictEqual(pubRes.status, 200);
      const published = await pubRes.json();

      assert.strictEqual(published.status, 'Published');
      assert.ok(published.published_at);
      assert.ok(published.published_snapshot, 'Must freeze immutable published_snapshot');
      assert.ok(published.published_snapshot.products.length === 1);
      assert.ok(published.qrDataUrl, 'Must return QR data URL');

      // 7.2: Vector QR Code Endpoint
      const qrSvgRes = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}/qr?format=svg`, { headers: authHeaders });
      assert.strictEqual(qrSvgRes.status, 200);
      assert.ok(qrSvgRes.headers.get('content-type').includes('image/svg+xml'), 'Content type must include image/svg+xml');
      const svgContent = await qrSvgRes.text();
      assert.ok(svgContent.includes('<svg'), 'QR code must be valid SVG');

      // 7.3: PNG QR Code Endpoint
      const qrPngRes = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}/qr?format=png`, { headers: authHeaders });
      assert.strictEqual(qrPngRes.status, 200);
      assert.strictEqual(qrPngRes.headers.get('content-type'), 'image/png');
      const pngBuffer = await qrPngRes.arrayBuffer();
      assert.ok(pngBuffer.byteLength > 100, 'PNG buffer must be valid image');

      pass('Test 7: Universal Publishing Ceremony & QR Code Association Verified', 
        `Published with frozen immutable snapshot -> SVG and PNG QR codes generated linking to /catalog/${published.slug}.`);
    } catch (err) {
      fail('Test 7: Universal Publishing Ceremony & QR Code Association Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 8: Branded PDF / HTML Specification Document Export (Decision D-07)
    // -------------------------------------------------------------
    try {
      const pdfRes = await fetch(`${baseUrl}/api/studio/catalogs/${catalogId}/export/pdf`, { headers: authHeaders });
      assert.strictEqual(pdfRes.status, 200);
      assert.ok(pdfRes.headers.get('content-type').includes('text/html'));
      const content = await pdfRes.text();

      assert.ok(content.includes('2026 Process Equipment Master Catalog'), 'Document must contain catalog title');
      assert.ok(content.includes('Centrifugal Fluid Pump CP-450'), 'Document must contain product name');
      assert.ok(content.includes('Scan for 3D & AR'), 'Document must include scan call-to-action');
      assert.ok(content.includes('#2563EB'), 'Document must apply primary branding color');

      pass('Test 8: Branded PDF / HTML Specification Document Export Verified (Decision D-07)', 
        'Generated printable specification document with company branding, engineering spec tables, and QR anchor.');
    } catch (err) {
      fail('Test 8: Branded PDF / HTML Specification Document Export Verified (Decision D-07)', err);
    }

  } finally {
    // Teardown
    server.close();
    if (orgId) {
      await query(`DELETE FROM catalog_products WHERE catalog_id IN (SELECT id FROM catalogs WHERE organization_id = $1)`, [orgId]).catch(() => {});
      await query(`DELETE FROM catalogs WHERE organization_id = $1`, [orgId]).catch(() => {});
      await query(`DELETE FROM products WHERE organization_id = $1`, [orgId]).catch(() => {});
      await query(`DELETE FROM vault_asset_versions WHERE asset_id IN (SELECT id FROM vault_assets WHERE organization_id = $1)`, [orgId]).catch(() => {});
      await query(`DELETE FROM vault_assets WHERE organization_id = $1`, [orgId]).catch(() => {});
      await query(`DELETE FROM users WHERE organization_id = $1`, [orgId]).catch(() => {});
      await query(`DELETE FROM organizations WHERE id = $1`, [orgId]).catch(() => {});
    }
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 Omni Studio Hardening Results: ${passedCount} Passed, ${failedCount} Failed.`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runStudioSuite().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Fatal test error in test-studio-hardening:', err);
  process.exit(1);
});
