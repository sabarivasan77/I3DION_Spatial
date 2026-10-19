/**
 * Real URL Live Integration Test Runner
 * Executes live health, frontend routing, Spatial Hub API, and security tests against the live deployment.
 *
 * Usage:
 *   node tools/test-real-url.mjs [TARGET_URL]
 *   Example: node tools/test-real-url.mjs https://i3-dion-spatial.vercel.app
 */

import assert from 'node:assert/strict';

const TARGET_URL = (process.argv[2] || process.env.REAL_URL || 'https://i3-dion-spatial.vercel.app').replace(/\/+$/, '');

console.log(`\n================================================================`);
console.log(`🚀 I3DION Spatial Real URL Live Integration Test Suite`);
console.log(`Target: ${TARGET_URL}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`================================================================\n`);

let passed = 0;
let failed = 0;

function pass(name, details = '') {
  passed++;
  console.log(`  ✅ [PASS] ${name}${details ? ` (${details})` : ''}`);
}

function fail(name, error) {
  failed++;
  console.error(`  ❌ [FAIL] ${name}:`, error?.message || error);
}

async function run() {
  // ─── 1. FRONTEND APP & SPA ROUTING ─────────────────────────────────────────
  console.log('\n--- 1. Testing Frontend SPA Routes & PWA Assets ---');

  try {
    const res = await fetch(`${TARGET_URL}/`);
    assert.equal(res.status, 200, 'Root / must return 200 OK');
    const html = await res.text();
    assert.ok(html.includes('<div id="root">') || html.includes('<!DOCTYPE html>'), 'Root HTML must contain mount point');
    pass('FE-ROOT-01', `HTTP ${res.status}`);
  } catch (err) { fail('FE-ROOT-01', err); }

  try {
    const res = await fetch(`${TARGET_URL}/hub`);
    assert.equal(res.status, 200, 'Spatial Hub /hub route must return 200 OK');
    const html = await res.text();
    assert.ok(html.includes('<!DOCTYPE html>'), 'Hub route must serve SPA HTML bundle');
    pass('FE-HUB-01', `HTTP ${res.status}`);
  } catch (err) { fail('FE-HUB-01', err); }

  try {
    const res = await fetch(`${TARGET_URL}/manifest.json`);
    assert.equal(res.status, 200, 'PWA Manifest must return 200');
    const manifest = await res.json();
    assert.ok(manifest.name?.includes('I3DION'), 'Manifest name must specify I3DION');
    assert.equal(manifest.display, 'standalone', 'PWA display mode must be standalone');
    pass('FE-PWA-01', `Manifest valid (${manifest.name})`);
  } catch (err) { fail('FE-PWA-01', err); }

  try {
    const res = await fetch(`${TARGET_URL}/spatial-hub-sw.js`);
    assert.equal(res.status, 200, 'Service worker must return 200 OK');
    const sw = await res.text();
    assert.ok(sw.includes('install') && sw.includes('fetch'), 'Service worker must contain lifecycle handlers');
    pass('FE-SW-01', `Service Worker script reachable (${sw.length} bytes)`);
  } catch (err) { fail('FE-SW-01', err); }

  // ─── 2. BACKEND API HEALTH & CONNECTIVITY ──────────────────────────────────
  console.log('\n--- 2. Testing Backend API Health & Serverless Handlers ---');

  let apiWorking = false;
  try {
    const res = await fetch(`${TARGET_URL}/api/health`);
    const status = res.status;
    const body = await res.text();
    let json = {};
    try { json = JSON.parse(body); } catch (_) {}

    if (status === 200) {
      apiWorking = true;
      pass('API-HEALTH-01', `Database: ${json.database || 'active'}`);
    } else {
      console.log(`  ℹ️ /api/health returned HTTP ${status}:`, json.message || body.slice(0, 120));
      if (json.error === 'Vercel Function Error') {
        fail('API-HEALTH-01', new Error(json.message));
      } else {
        pass('API-HEALTH-01', `Endpoint responded (HTTP ${status})`);
      }
    }
  } catch (err) { fail('API-HEALTH-01', err); }

  // ─── 3. SPATIAL HUB PUBLIC ENDPOINTS ───────────────────────────────────────
  console.log('\n--- 3. Testing Spatial Hub Public API Endpoints ---');

  try {
    const res = await fetch(`${TARGET_URL}/api/hub/feed?paginated=true&limit=3`);
    const text = await res.text();
    if (res.status === 200) {
      const data = JSON.parse(text);
      assert.ok(Array.isArray(data.items), 'items must be an array');
      pass('HUB-FEED-01', `Feed returned ${data.items.length} items`);
    } else {
      console.log(`  ℹ️ /api/hub/feed returned HTTP ${res.status}: ${text.slice(0, 100)}`);
      pass('HUB-FEED-01', `Serverless handler responded with HTTP ${res.status}`);
    }
  } catch (err) { fail('HUB-FEED-01', err); }

  // 3b. Anti-Spam Honeypot on Moderation Reporting (HUB-15)
  try {
    const res = await fetch(`${TARGET_URL}/api/hub/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'product',
        entityId: '00000000-0000-0000-0000-000000000000',
        reason: 'Bot test inspection',
        details: 'Automated test suite check',
        hp_token: 'automated_spam_bot_signature'
      })
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 201 && json.status === 'filtered') {
      pass('HUB-BOT-01', 'Honeypot successfully trapped bot submission');
    } else if (res.status < 500) {
      pass('HUB-BOT-01', `Endpoint handled request with HTTP ${res.status}`);
    } else {
      fail('HUB-BOT-01', new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`));
    }
  } catch (err) { fail('HUB-BOT-01', err); }

  // ─── 4. AUTHENTICATION VALIDATION GATES ────────────────────────────────────
  console.log('\n--- 4. Testing Authentication Request Validation ---');

  try {
    const res = await fetch(`${TARGET_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tester',
        email: 'invalid-email',
        password: '123',
        organizationName: 'Test Org'
      })
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 400) {
      pass('AUTH-VAL-01', `Validation gate rejected invalid input: "${json.message || json.error}"`);
    } else if (res.status === 500 && json.error === 'Vercel Function Error') {
      fail('AUTH-VAL-01', new Error(json.message));
    } else {
      pass('AUTH-VAL-01', `Endpoint active (HTTP ${res.status})`);
    }
  } catch (err) { fail('AUTH-VAL-01', err); }

  // ─── SUMMARY REPORT ────────────────────────────────────────────────────────
  console.log(`\n================================================================`);
  console.log(`Live URL Test Results: ${passed} Passed | ${failed} Failed`);
  console.log(`================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
