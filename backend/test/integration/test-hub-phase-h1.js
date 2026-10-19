import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../../src/db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');
const manifestPath = path.join(rootDir, 'tools/starter-library/manifest.json');

const ALLOWED_SPDX = new Set(['CC0-1.0', 'CC-BY-4.0', 'MIT']);

function pass(testId, msg) {
  console.log(`  ✅ [${testId}] ${msg}`);
}

async function run() {
  console.log('\n--- Running Spatial Hub Phase H1 Test Suite (Model Pipeline, Tiers, Provenance) ---');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // 1. Verify Database Schema & Fields
  const colRes = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name IN (
      'license_spdx', 'license_artist', 'license_owner', 'license_source_url',
      'attribution_required', 'commercial_use', 'is_demo_model',
      'preview_model_url', 'poster_url', 'full_model_url', 'original_model_url'
    )
  `);
  assert.equal(colRes.rows.length, 11, 'All 11 provenance and tier columns must exist in products table');
  pass('MODEL-SCHEMA-01', 'Products table includes all 11 required provenance, license, and asset tier fields');

  // 2. Query Public Feed from Database
  const { rows } = await pool.query(`
    SELECT p.*, c.name as company_name, c.is_verified as company_verified
    FROM products p
    JOIN organizations c ON p.organization_id = c.id
    WHERE p.is_public = true AND p.status = 'Published'
    ORDER BY p.name ASC
  `);

  const showcaseModels = rows.filter((r) => r.company_name === 'I3DION Showcase');
  assert.equal(showcaseModels.length, 15, `Expected 15 showcase models in public feed, found ${showcaseModels.length}`);
  pass('MODEL-COUNT-01', 'All 15 verified starter models are active and published under I3DION Showcase');

  // 3. Test License Gate & Attributions (MODEL-LICENSE-*)
  for (const model of showcaseModels) {
    assert.ok(Array.isArray(model.license_spdx) && model.license_spdx.length > 0, `${model.slug} must have license_spdx array`);
    for (const spdx of model.license_spdx) {
      assert.ok(ALLOWED_SPDX.has(spdx), `SPDX ${spdx} on ${model.slug} must be in allowed set: CC0-1.0, CC-BY-4.0, MIT`);
    }

    if (model.license_spdx.includes('CC-BY-4.0')) {
      assert.equal(model.attribution_required, true, `CC-BY model ${model.slug} must require attribution`);
      assert.ok(model.license_artist || model.license_owner, `CC-BY model ${model.slug} must have artist or owner`);
    }

    assert.equal(model.commercial_use, true, `Model ${model.slug} must allow commercial use (no NC)`);
    assert.equal(model.is_demo_model, true, `Model ${model.slug} must be marked as demonstration model`);
    assert.equal(model.category, 'Demonstration model (not industrial equipment)', 'Category must be truthful');
  }
  pass('MODEL-LICENSE-01', 'License gate verified: 100% compliant SPDX licenses (CC0/CC-BY), no NC/ND/unknown');

  // 4. Test Zero-Fake Metrics Policy
  for (const model of showcaseModels) {
    assert.equal(model.views_count, 0, `Model ${model.slug} views_count must start at 0`);
    assert.equal(model.likes_count, 0, `Model ${model.slug} likes_count must start at 0`);
  }
  pass('MODEL-METRICS-01', 'Zero hardcoded metrics verified: views_count and likes_count start at real zero');

  // 5. Test Legacy Model Demotion (HUB-01..03)
  const legacyRows = rows.filter((r) => r.model_url && r.model_url.includes('/models/model_'));
  assert.equal(legacyRows.length, 0, 'No legacy unverified models (/models/model_*.gltf) may appear in public feed');
  pass('MODEL-LEGACY-01', 'Legacy unverified models successfully purged/demoted from public feed');

  // 6. Test Asset Tiers & Payload Budget (first 6 models in feed order)
  const feedRes = await pool.query(`
    SELECT p.slug, p.preview_model_url, p.poster_url
    FROM products p
    JOIN organizations c ON p.organization_id = c.id
    WHERE p.is_public = true AND p.status = 'Published' AND c.name = 'I3DION Showcase'
    ORDER BY p.created_at DESC
    LIMIT 6
  `);

  let totalPreviewBytes = 0;
  let totalPosterBytes = 0;

  for (const row of feedRes.rows) {
    const previewFile = path.join(rootDir, 'frontend/public', row.preview_model_url.replace(/^\//, ''));
    const posterFile = path.join(rootDir, 'frontend/public', row.poster_url.replace(/^\//, ''));
    assert.ok(fs.existsSync(previewFile), `Preview GLB must exist at ${previewFile}`);
    assert.ok(fs.existsSync(posterFile), `Poster SVG must exist at ${posterFile}`);
    totalPreviewBytes += fs.statSync(previewFile).size;
    totalPosterBytes += fs.statSync(posterFile).size;
  }

  const totalPayloadMb = (totalPreviewBytes + totalPosterBytes) / (1024 * 1024);
  console.log(`  📊 First 6 models feed payload: ${totalPayloadMb.toFixed(2)} MB (budget <= 3.00 MB)`);
  assert.ok(totalPayloadMb <= 3.0, `First 6 models payload (${totalPayloadMb.toFixed(2)} MB) must be <= 3.0 MB`);
  pass('MODEL-BUDGET-01', `Payload budget strictly enforced: first 6 feed items consume only ${totalPayloadMb.toFixed(2)} MB`);

  console.log('\n✅ All Phase H1 integration tests passed successfully!\n');
}

run()
  .then(() => setTimeout(() => process.exit(0), 150))
  .catch((err) => {
    console.error('\n❌ Phase H1 test failed:', err);
    setTimeout(() => process.exit(1), 150);
  });
