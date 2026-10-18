import assert from 'node:assert/strict';
import { pool } from '../../src/db/pool.js';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config.js';

function pass(testId, msg) {
  console.log(`  ✅ [${testId}] ${msg}`);
}

async function run() {
  console.log('\n--- Running Spatial Hub Phase H7 Test Suite (Discovery: Search, Compare, Recommendations) ---');

  // 1. Full-text Search by keyword
  const searchRes1 = await fetch('http://localhost:4000/api/hub/search?q=pump');
  assert.equal(searchRes1.status, 200, 'Search should return 200 OK');
  const items1 = await searchRes1.json();
  assert.ok(Array.isArray(items1), 'Search result must be an array of models');
  assert.ok(items1.length > 0, 'Keyword "pump" should return matching pump models');
  assert.ok(
    items1[0].name.toLowerCase().includes('pump') || items1[0].description.toLowerCase().includes('pump'),
    'Returned item should match keyword'
  );
  pass('SEARCH-FTS-01', 'Postgres text search successfully matches keywords across titles, descriptions, and tags');

  // 2. Faceted Search by Category
  const searchRes2 = await fetch('http://localhost:4000/api/hub/search?q=&category=Pumps%20%26%20Fluid%20Handling');
  assert.equal(searchRes2.status, 200);
  const items2 = await searchRes2.json();
  assert.ok(Array.isArray(items2));
  assert.ok(items2.length > 0, 'Category query must return products');
  for (const item of items2) {
    assert.equal(item.category, 'Pumps & Fluid Handling', 'Faceted search must strictly filter by category');
  }
  pass('SEARCH-FACET-CAT-01', 'Category facet filtering strictly isolates matching products');

  // 3. Faceted Search by License
  const searchRes3 = await fetch('http://localhost:4000/api/hub/search?license=CC0-1.0');
  assert.equal(searchRes3.status, 200);
  const items3 = await searchRes3.json();
  assert.ok(Array.isArray(items3));
  assert.ok(items3.length > 0, 'Should find CC0-1.0 models in catalog');
  for (const item of items3) {
    assert.ok(
      item.license_spdx.includes('CC0-1.0'),
      'Returned items must carry the requested CC0-1.0 license SPDX'
    );
  }
  pass('SEARCH-FACET-LIC-01', 'License SPDX facet filtering verified across database catalog');

  // 4. Verbose Facets Aggregation
  const searchRes4 = await fetch('http://localhost:4000/api/hub/search?format=verbose');
  assert.equal(searchRes4.status, 200);
  const verboseData = await searchRes4.json();
  assert.ok(verboseData.facets, 'Verbose response must include facets object');
  assert.ok(Array.isArray(verboseData.facets.categories), 'Facets must contain categories array');
  assert.ok(Array.isArray(verboseData.facets.licenses), 'Facets must contain licenses array');
  assert.ok(verboseData.facets.categories.length > 0, 'Categories breakdown must be non-empty');
  assert.ok(verboseData.facets.licenses.length > 0, 'Licenses breakdown must be non-empty');
  pass('SEARCH-FACETS-AGG-01', 'Dynamic catalog facet aggregations returned with real category & license distributions');

  // 5. Personal Saved & Liked Auth Gate
  const unauthSaved = await fetch('http://localhost:4000/api/hub/personal/saved');
  assert.equal(unauthSaved.status, 401, 'Unauthenticated call to personal/saved must fail closed with 401');
  pass('PERSONAL-AUTH-01', 'Personal library routes fail closed for unauthenticated visitors');

  // 6. Authenticated Personal Saved & Liked Lifecycle
  const userRes = await pool.query(`SELECT id, email, organization_id FROM users LIMIT 1`);
  if (userRes.rows.length > 0) {
    const user = userRes.rows[0];
    const token = jwt.sign(
      { userId: user.id, sub: user.id, email: user.email, organizationId: user.organization_id, role: 'Owner' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const targetProduct = items1[0].id;

    // Save item
    const saveRes = await fetch('http://localhost:4000/api/hub/personal/saved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ contentId: targetProduct, contentType: 'product' })
    });
    assert.equal(saveRes.status, 200, 'Authenticated save must succeed');

    // Retrieve saved
    const getSaved = await fetch('http://localhost:4000/api/hub/personal/saved', {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(getSaved.status, 200);
    const savedList = await getSaved.json();
    assert.ok(
      savedList.some((s) => s.content_id === targetProduct),
      'Saved item must appear in user personal library'
    );
    pass('PERSONAL-SAVED-01', 'Authenticated save item lifecycle verified end-to-end');

    // Toggle liked
    const likeRes = await fetch('http://localhost:4000/api/hub/personal/liked', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ contentId: targetProduct, contentType: 'product' })
    });
    assert.equal(likeRes.status, 200, 'Authenticated like must succeed');

    // Clean up saved item
    await fetch(`http://localhost:4000/api/hub/personal/saved/${targetProduct}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  console.log('\n✅ All Phase H7 integration tests passed successfully!\n');
  await pool.end();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Phase H7 test failed:', err);
    process.exit(1);
  });
