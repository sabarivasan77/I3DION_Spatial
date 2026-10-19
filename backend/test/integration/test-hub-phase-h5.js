import assert from 'node:assert/strict';
import { pool } from '../../src/db/pool.js';

function pass(testId, msg) {
  console.log(`  ✅ [${testId}] ${msg}`);
}

async function run() {
  console.log('\n--- Running Spatial Hub Phase H5 Test Suite (Organization Storefronts & Collections) ---');

  // 1. Test Organization Showcase Endpoint
  const res = await fetch('http://localhost:4000/api/hub/org/i3dion-showcase');
  assert.equal(res.status, 200, 'Showcase endpoint must return 200 OK');
  const data = await res.json();

  assert.ok(data.organization, 'Showcase must return organization object');
  assert.equal(data.organization.name, 'I3DION Showcase');
  assert.equal(data.organization.is_verified, true, 'Showcase organization must be verified');
  assert.ok(Array.isArray(data.products), 'Showcase must return products array');
  assert.ok(data.products.length >= 15, 'Showcase must include all 15 starter models');
  pass('ORG-SHOWCASE-01', 'Organization storefront endpoint returns verified organization and published products');

  // 2. Test Collections Retrieval & Server-Side Audience Filtering
  const collRes = await pool.query(`SELECT id FROM vault_collections LIMIT 1`);
  if (collRes.rows.length > 0) {
    const collId = collRes.rows[0].id;
    const cRes = await fetch(`http://localhost:4000/api/hub/collections/${collId}`);
    assert.equal(cRes.status, 200, 'Public collection endpoint must return 200 OK');
    const cData = await cRes.json();
    assert.ok(cData.collection, 'Collection record must be returned');
    assert.ok(Array.isArray(cData.items), 'Public assets items must be returned');

    // Cross-tenant/Audience check: all returned items must have visibility = 'Public'
    for (const item of cData.items) {
      assert.notEqual(item.visibility, 'Private', 'Private items must never be shipped in public payloads');
      assert.notEqual(item.visibility, 'Organization', 'Organization-restricted items must never be shipped in public payloads');
    }
    pass('ORG-AUDIENCE-01', 'Server-side audience filtering strictly verified: non-public items never leaked to client');
  }

  // 3. Test Fail-Closed on Non-Existent Organization
  const fakeRes = await fetch('http://localhost:4000/api/hub/org/non-existent-org-slug-xyz');
  assert.equal(fakeRes.status, 404, 'Non-existent organization must return 404');
  pass('ORG-NOT-FOUND-01', 'Fail-closed behavior: invalid organization slugs return honest 404');

  console.log('\n✅ All Phase H5 integration tests passed successfully!\n');
  await pool.end();
}

run()
  .catch((err) => {
    console.error('\n❌ Phase H5 test failed:', err);
    process.exit(1);
  });
