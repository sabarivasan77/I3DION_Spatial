process.env.TEST_MODE = 'true';
import assert from 'node:assert';
import { app } from './src/server.js';

console.log('🧪 Running I3DION Spatial Integration Tests...\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Unauthenticated request to protected endpoint should return 401
  try {
    const req = { headers: {}, cookies: {} };
    let errorCaught = null;
    const next = (err) => { errorCaught = err; };

    const { requireAuth } = await import('./src/middleware/auth.js');
    await requireAuth(req, {}, next);

    assert.ok(errorCaught, 'Expected error caught for unauthenticated request');
    assert.strictEqual(errorCaught.status, 401, 'Expected status 401');
    console.log('✅ Test 1 Passed: requireAuth blocks unauthenticated requests with HTTP 401.');
    passed++;
  } catch (err) {
    console.error('❌ Test 1 Failed:', err.message);
    failed++;
  }

  // Test 2: Verify orphaned routes /create-order and /verify-payment are no longer on apiRouter
  try {
    const routes = app._router.stack
      .filter((r) => r.route)
      .map((r) => r.route.path);
    
    assert.strictEqual(routes.includes('/api/create-order'), false, '/api/create-order must not exist');
    assert.strictEqual(routes.includes('/api/verify-payment'), false, '/api/verify-payment must not exist');
    console.log('✅ Test 2 Passed: Orphaned unauthenticated billing endpoints removed from server.js.');
    passed++;
  } catch (err) {
    console.error('❌ Test 2 Failed:', err.message);
    failed++;
  }

  // Test 3: Verify standard trial period configured to 14 days
  try {
    const { config } = await import('./src/config.js');
    assert.strictEqual(config.billing.standardTrialDays, 14, 'Standard trial period should be 14 days');
    console.log('✅ Test 3 Passed: Standard trial period configured to 14 days for B2B procurement.');
    passed++;
  } catch (err) {
    console.error('❌ Test 3 Failed:', err.message);
    failed++;
  }

  // Summary
  console.log(`\n📊 Integration Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
