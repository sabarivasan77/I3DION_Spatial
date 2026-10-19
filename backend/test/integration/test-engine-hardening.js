import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { app } from '../../src/server.js';
import { pool, query, ensureMigrated } from '../../src/db/pool.js';
import { config } from '../../src/config.js';
import { ExperienceSceneContractSchema } from '../../../packages/contracts/src/experienceScene.ts';

console.log('================================================================');
console.log('🧪 Spatial Engine Product Hardening: Automated Verification Suite');
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

async function runEngineSuite() {
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
  let experienceId = null;
  let vaultAssetId = null;
  let expSlug = null;

  try {
    // -------------------------------------------------------------
    // SETUP: Test Tenant & Authenticated Admin
    // -------------------------------------------------------------
    const orgRes = await query(
      `INSERT INTO organizations (name, website, profile, primary_color)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name`,
      [
        `Spatial Engine Dynamics ${testRunId}`,
        'https://engine-dynamics.i3dion.com',
        'Interactive 3D/AR Digital Twin Experiences',
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
        'Dr. Julian Sterling (Chief Spatial Architect)',
        `julian.sterling.${testRunId}@i3dion.internal`,
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

    // Create authoritative 3D Model Asset in Vault
    const assetRes = await query(
      `INSERT INTO vault_assets (
        organization_id, name, description, category, type, original_name,
        storage_key, public_url, mime_type, size_bytes, visibility, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        orgId,
        'Centrifugal Fluid Pump 3D Model',
        'Authoritative GLB asset for interactive digital twin',
        'Industrial Equipment',
        '3D Model',
        'industrial_pump.glb',
        `vault-pump-${testRunId}.glb`,
        `/uploads/vault-pump-${testRunId}.glb`,
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
        vaultAssetId, 1, 'industrial_pump.glb', `vault-pump-${testRunId}.glb`,
        `/uploads/vault-pump-${testRunId}.glb`, 'model/gltf-binary', 1838084, 'Initial Release', adminUserId
      ]
    );

    pass('Tenant, Admin & Authoritative Vault 3D Model Baseline Established', `Org: ${orgId}, Asset: ${vaultAssetId}`);

    // -------------------------------------------------------------
    // TEST 1: Experience Projects & Scene Model Persistence
    // -------------------------------------------------------------
    try {
      const createPayload = {
        name: 'CP-450 Interactive Digital Twin Experience',
        description: 'Interactive high-fidelity 3D inspection and AR simulation of CP-450 fluid pump.',
        vault_asset_id: vaultAssetId,
        pinned_version_number: 1,
        scene_config: {
          camera: { fov: 45, position: [0, 1.8, 3.2], target: [0, 0.4, 0] },
          environment: { preset: 'studio', exposure: 1.1, contactShadow: true, reflection: 0.25 },
          ground: { showGrid: true, shadowOpacity: 0.5 }
        },
        ar_config: {
          scale: 1.0,
          placement: 'floor',
          allowSnapshot: true,
          ctaText: 'Request Engineering Quote'
        }
      };

      const createRes = await fetch(`${baseUrl}/api/engine/experiences`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(createPayload)
      });
      assert.strictEqual(createRes.status, 201);
      const created = await createRes.json();
      experienceId = created.id;
      expSlug = created.slug;
      assert.strictEqual(created.name, createPayload.name);
      assert.strictEqual(created.status, 'Draft');
      assert.strictEqual(created.vault_asset_id, vaultAssetId);
      assert.strictEqual(created.pinned_version_number, 1);

      // Fetch detail
      const detailRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}`, { headers: authHeaders });
      assert.strictEqual(detailRes.status, 200);
      const detail = await detailRes.json();
      assert.strictEqual(detail.id, experienceId);
      assert.strictEqual(detail.vault_asset_name, 'Centrifugal Fluid Pump 3D Model');

      // Update experience description
      const patchRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ description: 'Updated technical digital twin description.' })
      });
      assert.strictEqual(patchRes.status, 200);
      const patched = await patchRes.json();
      assert.strictEqual(patched.description, 'Updated technical digital twin description.');

      pass('Test 1: Experience Projects & Scene Model Persistence Verified', 
        `Created experience ${experienceId} (${expSlug}) linked to Vault Asset ${vaultAssetId} (v1).`);
    } catch (err) {
      fail('Test 1: Experience Projects & Scene Model Persistence Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 2: Scene Lighting, Studio Floor & Camera Persistence
    // -------------------------------------------------------------
    try {
      const sceneUpdate = {
        camera: { fov: 50, position: [0.5, 2.0, 3.5], target: [0, 0.5, 0] },
        environment: { preset: 'industrial', exposure: 1.25, contactShadow: true, reflection: 0.35 },
        ground: { showGrid: true, shadowOpacity: 0.6 }
      };

      const sceneRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/scene`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(sceneUpdate)
      });
      assert.strictEqual(sceneRes.status, 200);
      const sceneData = await sceneRes.json();
      assert.strictEqual(sceneData.camera.fov, 50);
      assert.strictEqual(sceneData.environment.preset, 'industrial');
      assert.strictEqual(sceneData.environment.contactShadow, true);

      pass('Test 2: Scene Lighting, Studio Floor & Camera Persistence Verified', 
        'Updated camera FOV to 50, studio lighting to industrial preset with real contact shadows.');
    } catch (err) {
      fail('Test 2: Scene Lighting, Studio Floor & Camera Persistence Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 3: Hotspots & 3D Spatial Annotation Authoring
    // -------------------------------------------------------------
    let hotspotId = null;
    try {
      // 3.1: Add hotspot 1 (Shaft Seal Inspection)
      const hs1Payload = {
        id: `hs-shaft-seal-${testRunId}`,
        title: 'Mechanical Shaft Seal Assembly',
        description: 'Tungsten carbide mechanical seal with dual barrier fluid recirculation.',
        position: { x: 0.28, y: 0.64, z: -0.12 },
        surfaceNormal: { x: 0, y: 1, z: 0 },
        badgeNumber: 1,
        metricUnits: {
          MaxPressure: '65 bar',
          OperatingTemp: '180 °C',
          Tolerance: '±0.005 mm'
        },
        ctaText: 'Inspect Subassembly',
        ctaAction: 'inspect_component'
      };

      const hsRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/hotspots`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(hs1Payload)
      });
      assert.strictEqual(hsRes.status, 200);
      const hsResult = await hsRes.json();
      hotspotId = hsResult.id;
      assert.strictEqual(hsResult.title, hs1Payload.title);
      assert.strictEqual(hsResult.position.x, 0.28);
      assert.strictEqual(hsResult.metricUnits.MaxPressure, '65 bar');

      // 3.2: Add hotspot 2 (Impeller Hub)
      const hs2Payload = {
        id: `hs-impeller-${testRunId}`,
        title: 'High-Chrome Impeller Vane',
        description: 'Closed design impeller engineered for abrasive slurry solids.',
        position: { x: -0.15, y: 0.42, z: 0.05 },
        badgeNumber: 2,
        metricUnits: {
          FlowRate: '450 m3/h',
          Efficiency: '84%',
          Diameter: '320 mm'
        },
        ctaText: 'Request Quote',
        ctaAction: 'quote_request'
      };

      await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/hotspots`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(hs2Payload)
      });

      // Verify experience detail contains 2 hotspots
      const checkRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}`, { headers: authHeaders });
      const expDetail = await checkRes.json();
      assert.strictEqual(expDetail.hotspots.length, 2, 'Must contain 2 hotspots');

      // 3.3: Delete hotspot 2
      const delHsRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/hotspots/${hs2Payload.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      assert.strictEqual(delHsRes.status, 200);
      const delData = await delHsRes.json();
      assert.strictEqual(delData.remainingCount, 1);

      pass('Test 3: Hotspots & 3D Spatial Annotation Authoring Verified', 
        `Authored 3D pins at (0.28, 0.64, -0.12) with engineering metrics (Pressure: 65 bar, Temp: 180 °C). Add/delete verified.`);
    } catch (err) {
      fail('Test 3: Hotspots & 3D Spatial Annotation Authoring Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 4: Exploded View Assembly & Animation Timeline Scrubber
    // -------------------------------------------------------------
    try {
      const animPayload = {
        activeClip: 'Assembly_Explode_Sequence',
        playbackSpeed: 1.5,
        timelinePosition: 0.5,
        explodedViewFactor: 0.85,
        parts: [
          { partId: 'part_casing', partName: 'Volute Casing', offsetVector: { x: 0, y: 0.5, z: 0 } },
          { partId: 'part_impeller', partName: 'Impeller Hub', offsetVector: { x: 0.8, y: 0, z: 0 } },
          { partId: 'part_shaft', partName: 'Drive Shaft', offsetVector: { x: -0.8, y: 0, z: 0 } }
        ]
      };

      const animRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/animation`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(animPayload)
      });
      assert.strictEqual(animRes.status, 200);
      const animData = await animRes.json();
      assert.strictEqual(animData.activeClip, 'Assembly_Explode_Sequence');
      assert.strictEqual(animData.explodedViewFactor, 0.85);
      assert.strictEqual(animData.parts.length, 3);

      pass('Test 4: Exploded View Assembly & Animation Timeline Scrubber Verified', 
        'Configured animation clip, 85% exploded view disassembly factor, and 3 directional part offset vectors.');
    } catch (err) {
      fail('Test 4: Exploded View Assembly & Animation Timeline Scrubber Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 5: Blueprint Overlay & Technical Dimensions
    // -------------------------------------------------------------
    try {
      const blueprintPayload = {
        enabled: true,
        dimensions: {
          length: 1420,
          width: 850,
          height: 920,
          unit: 'mm'
        },
        callouts: [
          {
            id: 'dim-suction',
            label: 'Suction Flange DN200 PN16',
            anchor: { x: -0.4, y: 0.4, z: 0 },
            leaderEndpoint: { x: -0.8, y: 0.8, z: 0 }
          },
          {
            id: 'dim-discharge',
            label: 'Discharge Flange DN150 PN25',
            anchor: { x: 0, y: 0.9, z: 0 },
            leaderEndpoint: { x: 0.4, y: 1.3, z: 0 }
          }
        ]
      };

      const bpRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/blueprint`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(blueprintPayload)
      });
      assert.strictEqual(bpRes.status, 200);
      const bpData = await bpRes.json();
      assert.strictEqual(bpData.enabled, true);
      assert.strictEqual(bpData.dimensions.length, 1420);
      assert.strictEqual(bpData.dimensions.unit, 'mm');
      assert.strictEqual(bpData.callouts.length, 2);

      pass('Test 5: Blueprint Overlay & Technical Dimensions Verified', 
        'Verified blueprint mode (1420 x 850 x 920 mm) with technical callout leaders and flange annotations.');
    } catch (err) {
      fail('Test 5: Blueprint Overlay & Technical Dimensions Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 6: AR Device Capability Matrix Resolution
    // -------------------------------------------------------------
    try {
      // 6.1: iOS Safari -> Quick Look tier
      const iosUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
      const iosRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/ar-config`, {
        headers: { ...authHeaders, 'User-Agent': iosUa }
      });
      assert.strictEqual(iosRes.status, 200);
      const iosConfig = await iosRes.json();
      assert.strictEqual(iosConfig.resolvedTier, 'quick_look', 'iOS must resolve to quick_look tier');
      assert.ok(iosConfig.launchUrl.includes('.usdz') || iosConfig.launchUrl.length > 0);

      // 6.2: Android Chrome -> WebXR tier
      const androidUa = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';
      const androidRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/ar-config`, {
        headers: { ...authHeaders, 'User-Agent': androidUa }
      });
      assert.strictEqual(androidRes.status, 200);
      const androidConfig = await androidRes.json();
      assert.strictEqual(androidConfig.resolvedTier, 'webxr', 'Android Chrome must resolve to webxr tier');
      assert.ok(androidConfig.launchUrl.includes('intent://arvr.google.com/scene-viewer'));

      // 6.3: Desktop Browser -> Orbit QR Fallback tier
      const desktopUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
      const desktopRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/ar-config`, {
        headers: { ...authHeaders, 'User-Agent': desktopUa }
      });
      assert.strictEqual(desktopRes.status, 200);
      const desktopConfig = await desktopRes.json();
      assert.strictEqual(desktopConfig.resolvedTier, 'orbit_qr_fallback', 'Desktop must resolve to orbit_qr_fallback');
      assert.ok(desktopConfig.qrDataUrl, 'Desktop fallback must include QR handoff data URL');

      pass('Test 6: AR Device Capability Matrix Resolution Verified', 
        'iOS -> Quick Look (.usdz); Android -> WebXR (Scene Viewer Intent); Desktop -> Orbit 3D with mobile handoff QR.');
    } catch (err) {
      fail('Test 6: AR Device Capability Matrix Resolution Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 7: Universal Publishing Ceremony & QR Code Association
    // -------------------------------------------------------------
    try {
      // 7.1: Publish Experience
      const pubRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/publish`, {
        method: 'POST',
        headers: authHeaders
      });
      assert.strictEqual(pubRes.status, 200);
      const published = await pubRes.json();
      assert.strictEqual(published.status, 'Published');
      assert.ok(published.published_at);
      assert.ok(published.published_snapshot, 'Must freeze immutable published_snapshot');
      assert.strictEqual(published.published_snapshot.experience.pinnedVersionNumber, 1);
      assert.ok(published.published_snapshot.hotspots.length >= 1);
      assert.ok(published.qrDataUrl);

      // 7.2: Vector QR Code Endpoint
      const qrSvgRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/qr?format=svg`, { headers: authHeaders });
      assert.strictEqual(qrSvgRes.status, 200);
      assert.ok(qrSvgRes.headers.get('content-type').includes('image/svg+xml'));
      const svgText = await qrSvgRes.text();
      assert.ok(svgText.includes('<svg'));

      // 7.3: PNG QR Code Endpoint
      const qrPngRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/qr?format=png`, { headers: authHeaders });
      assert.strictEqual(qrPngRes.status, 200);
      assert.strictEqual(qrPngRes.headers.get('content-type'), 'image/png');

      pass('Test 7: Universal Publishing Ceremony & QR Code Association Verified', 
        `Frozen published_snapshot created -> SVG and PNG QR codes generated linking to /experience/${expSlug}.`);
    } catch (err) {
      fail('Test 7: Universal Publishing Ceremony & QR Code Association Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 8: Public Runtime Delivery (Spatial Hub Integration)
    // -------------------------------------------------------------
    try {
      // Unauthenticated request to public runtime endpoint
      const pubDeliveryRes = await fetch(`${baseUrl}/api/engine/published/${expSlug}`);
      assert.strictEqual(pubDeliveryRes.status, 200, 'Public runtime delivery must be accessible without login');
      const publicPayload = await pubDeliveryRes.json();

      assert.strictEqual(publicPayload.snapshotVersion, '1.0');
      assert.strictEqual(publicPayload.experience.name, 'CP-450 Interactive Digital Twin Experience');
      assert.ok(publicPayload.hotspots.length >= 1);
      assert.strictEqual(publicPayload.sceneConfig.camera.fov, 50);

      pass('Test 8: Public Runtime Delivery Verified (Spatial Hub Integration)', 
        'Unauthenticated public delivery endpoint served frozen digital twin snapshot with complete hotspots and camera rig.');
    } catch (err) {
      fail('Test 8: Public Runtime Delivery Verified (Spatial Hub Integration)', err);
    }

    // -------------------------------------------------------------
    // TEST 9: Canonical Contract Schema Validation
    // -------------------------------------------------------------
    try {
      const expDetailRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}`, { headers: authHeaders });
      const exp = await expDetailRes.json();

      const contractData = {
        contractVersion: '1.0',
        experienceId: exp.id,
        organizationId: exp.organization_id,
        name: exp.name,
        slug: exp.slug,
        description: exp.description,
        status: exp.status,
        vaultAssetId: exp.vault_asset_id,
        pinnedVersionNumber: exp.pinned_version_number,
        modelUrl: exp.vault_public_url,
        camera: exp.scene_config.camera,
        environment: exp.scene_config.environment,
        hotspots: exp.hotspots,
        animation: exp.animation_config,
        blueprint: exp.blueprint_config,
        ar: exp.ar_config,
        publishedSnapshot: exp.published_snapshot,
        publishedAt: exp.published_at
      };

      const validated = ExperienceSceneContractSchema.parse(contractData);
      assert.strictEqual(validated.contractVersion, '1.0');
      assert.strictEqual(validated.name, exp.name);
      assert.ok(validated.hotspots.length >= 1);

      pass('Test 9: Canonical ExperienceSceneContractSchema Validation Verified', 
        'Zod verified full schema integrity for 3D camera, environment, hotspots, animation, blueprint, and AR.');
    } catch (err) {
      fail('Test 9: Canonical ExperienceSceneContractSchema Validation Verified', err);
    }

  } finally {
    // Teardown
    server.close();
    if (orgId) {
      await query(`DELETE FROM spatial_experiences WHERE organization_id = $1`, [orgId]).catch(() => {});
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
  console.log(`📊 Spatial Engine Hardening Results: ${passedCount} Passed, ${failedCount} Failed.`);
  console.log('================================================================');

  if (failedCount > 0) {
    setImmediate(() => process.exit(1));
  }
}

runEngineSuite().then(() => {
  setImmediate(() => process.exit(0));
}).catch((err) => {
  console.error('Fatal test error in test-engine-hardening:', err);
  setImmediate(() => process.exit(1));
});
