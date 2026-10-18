import assert from 'node:assert/strict';
import { pool } from '../../src/db/pool.js';

function pass(testId, msg) {
  console.log(`  ✅ [${testId}] ${msg}`);
}

async function run() {
  console.log('\n--- Running Spatial Hub Phase H2 Test Suite (Feed Pagination, Filtering & Sorting) ---');

  const baseUrl = 'http://localhost:4000/api/hub/feed';

  // 1. Test Server-side Paginated Feed
  const res1 = await fetch(`${baseUrl}?paginated=true&limit=5`);
  assert.equal(res1.status, 200, 'Feed endpoint must return 200 OK');
  const page1 = await res1.json();

  assert.ok(Array.isArray(page1.items), 'page1.items must be an array');
  assert.equal(page1.items.length, 5, 'page1 should return exactly 5 items when limit=5');
  assert.ok(page1.hasMore === true, 'hasMore should be true when total models > limit');
  assert.ok(typeof page1.nextCursor === 'string', 'nextCursor must be a valid cursor timestamp');
  pass('HUBCARD-PAGE-01', 'Server-side pagination returns page of 5 items with valid nextCursor');

  // 2. Test Cursor Navigation (Page 2)
  const res2 = await fetch(`${baseUrl}?paginated=true&limit=5&cursor=${encodeURIComponent(page1.nextCursor)}`);
  assert.equal(res2.status, 200, 'Feed page 2 must return 200 OK');
  const page2 = await res2.json();

  assert.ok(Array.isArray(page2.items), 'page2.items must be an array');
  assert.ok(page2.items.length > 0, 'page2 must contain items');

  const page1Ids = new Set(page1.items.map((i) => i.id));
  const page2Ids = page2.items.map((i) => i.id);
  const overlap = page2Ids.filter((id) => page1Ids.has(id));
  assert.equal(overlap.length, 0, 'Cursor pagination must not produce overlapping items between pages');
  pass('HUBCARD-PAGE-02', 'Cursor pagination advances cleanly without duplicating items');

  // 3. Test Category Filtering
  const resCat = await fetch(`${baseUrl}?paginated=true&limit=20&category=${encodeURIComponent('Demonstration model (not industrial equipment)')}`);
  assert.equal(resCat.status, 200, 'Category filter request must return 200 OK');
  const catData = await resCat.json();
  assert.equal(catData.items.length, 15, 'All 15 starter models must match demonstration category when limit=20');
  for (const item of catData.items) {
    assert.equal(item.category, 'Demonstration model (not industrial equipment)', 'All items must match filtered category');
  }
  pass('HUBCARD-FILTER-01', 'Category filtering accurately isolates requested category on the server');

  // 4. Test Search Query Filtering
  const resSearch = await fetch(`${baseUrl}?paginated=true&search=Camera`);
  assert.equal(resSearch.status, 200, 'Search request must return 200 OK');
  const searchData = await resSearch.json();
  assert.ok(searchData.items.length >= 1, 'Search for Camera must return at least 1 model');
  assert.ok(searchData.items.some((i) => i.name.includes('Camera')), 'Search results must include Antique Camera');
  pass('HUBCARD-SEARCH-01', 'Server-side search query successfully matches model names and tags');

  // 5. Test Alphabetical Sorting
  const resSort = await fetch(`${baseUrl}?paginated=true&limit=10&sort=alphabetical`);
  assert.equal(resSort.status, 200, 'Alphabetical sort request must return 200 OK');
  const sortData = await resSort.json();
  const names = sortData.items.map((i) => i.name.toLowerCase());
  const sortedNames = [...names].sort();
  assert.deepEqual(names, sortedNames, 'Items must be returned in strict alphabetical order');
  pass('HUBCARD-SORT-01', 'Alphabetical sorting functions correctly on server query');

  // 6. Test Backward Compatibility
  const resLegacy = await fetch(baseUrl);
  assert.equal(resLegacy.status, 200, 'Legacy feed call must return 200 OK');
  const legacyData = await resLegacy.json();
  assert.ok(Array.isArray(legacyData), 'Unpaginated call must return direct array for backwards compatibility');
  pass('HUBCARD-LEGACY-01', 'Backward-compatible direct array response preserved for unpaginated callers');

  console.log('\n✅ All Phase H2 integration tests passed successfully!\n');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Phase H2 test failed:', err);
    process.exit(1);
  });
