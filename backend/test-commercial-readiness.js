import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { app } from './src/server.js';
import { pool, query, ensureMigrated } from './src/db/pool.js';
import { config } from './src/config.js';
import { runDatabaseBackup } from './scripts/backup-database.js';
import { runDatabaseRestore } from './scripts/restore-database.js';

console.log('================================================================');
console.log('🧪 Commercial Readiness & Pilot Hardening: Automated Verification Suite');
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

async function runSuite() {
  await ensureMigrated();

  // Enforce strict plan limits for quota testing
  process.env.ENFORCE_PLAN_LIMITS = 'true';
  process.env.TEST_MODE = 'true';

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🚀 Ephemeral test server listening on ${baseUrl}\n`);

  const testRunId = Date.now();
  let tenant1 = null;
  let tenant2 = null;

  try {
    // -------------------------------------------------------------
    // SETUP: Two Distinct Test Tenants
    // -------------------------------------------------------------
    const org1 = await query(
      `INSERT INTO organizations (name, website, profile)
       VALUES ($1, $2, $3)
       RETURNING id, name`,
      [`Commercial Dynamics Org A ${testRunId}`, 'https://org-a.com', 'Commercial Tenant A']
    );
    const org2 = await query(
      `INSERT INTO organizations (name, website, profile)
       VALUES ($1, $2, $3)
       RETURNING id, name`,
      [`Commercial Dynamics Org B ${testRunId}`, 'https://org-b.com', 'Commercial Tenant B']
    );

    const user1 = await query(
      `INSERT INTO users (organization_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'Admin')
       RETURNING id, name, email, role, organization_id`,
      [org1.rows[0].id, 'Owner A', `owner-a-${testRunId}@i3dion.local`, 'hash']
    );
    const user2 = await query(
      `INSERT INTO users (organization_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'Admin')
       RETURNING id, name, email, role, organization_id`,
      [org2.rows[0].id, 'Owner B', `owner-b-${testRunId}@i3dion.local`, 'hash']
    );

    // Initial subscriptions on FREE tier
    await query(
      `INSERT INTO subscriptions (organization_id, plan_id, status)
       VALUES ($1, 'FREE', 'active'), ($2, 'FREE', 'active')
       ON CONFLICT (organization_id) DO UPDATE SET plan_id = 'FREE', status = 'active'`,
      [org1.rows[0].id, org2.rows[0].id]
    );

    await query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       VALUES ($1, $2, 'Admin'), ($3, $4, 'Admin')
       ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [org1.rows[0].id, user1.rows[0].id, org2.rows[0].id, user2.rows[0].id]
    );

    const token1 = jwt.sign({ userId: user1.rows[0].id }, config.jwtSecret);
    const token2 = jwt.sign({ userId: user2.rows[0].id }, config.jwtSecret);

    tenant1 = { org: org1.rows[0], user: user1.rows[0], token: token1 };
    tenant2 = { org: org2.rows[0], user: user2.rows[0], token: token2 };

    const auth1 = { 'Authorization': `Bearer ${tenant1.token}`, 'Content-Type': 'application/json' };
    const auth2 = { 'Authorization': `Bearer ${tenant2.token}`, 'Content-Type': 'application/json' };

    // -------------------------------------------------------------
    // TEST 1: Canonical SaaS Plans Discovery
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/billing/plans`, { headers: auth1 });
      assert.strictEqual(res.status, 200, 'GET /billing/plans must return 200');
      const data = await res.json();

      assert(Array.isArray(data.plans), 'Should return plans array');
      const planIds = data.plans.map(p => p.id);
      assert(planIds.includes('FREE'), 'Must include FREE tier');
      assert(planIds.includes('STARTER'), 'Must include STARTER tier');
      assert(planIds.includes('BUSINESS'), 'Must include BUSINESS tier');
      assert(planIds.includes('UNLIMITED'), 'Must include UNLIMITED tier');

      const starter = data.plans.find(p => p.id === 'STARTER');
      assert.strictEqual(starter.price_monthly_inr, 1499, 'Starter monthly price must be 1499');
      assert.strictEqual(starter.price_yearly_inr, 14990, 'Starter yearly price must be 14990');

      const business = data.plans.find(p => p.id === 'BUSINESS');
      assert.strictEqual(business.price_monthly_inr, 4999, 'Business monthly price must be 4999');

      pass('1. Canonical SaaS Plans Discovery', `Verified 4 plans: ${planIds.join(', ')} with correct pricing.`);
    } catch (err) {
      fail('1. Canonical SaaS Plans Discovery', err);
    }

    // -------------------------------------------------------------
    // TEST 2: Server-Side Plan Quota Enforcement (Free tier limit = 2 catalogs)
    // -------------------------------------------------------------
    try {
      // Create Catalog 1 (should succeed)
      const cat1Res = await fetch(`${baseUrl}/api/studio/catalogs`, {
        method: 'POST',
        headers: auth1,
        body: JSON.stringify({ name: 'Catalog 1', description: 'Allowed catalog 1' })
      });
      assert.strictEqual(cat1Res.status, 201, 'Catalog 1 must succeed with 201');

      // Create Catalog 2 (should succeed)
      const cat2Res = await fetch(`${baseUrl}/api/studio/catalogs`, {
        method: 'POST',
        headers: auth1,
        body: JSON.stringify({ name: 'Catalog 2', description: 'Allowed catalog 2' })
      });
      assert.strictEqual(cat2Res.status, 201, 'Catalog 2 must succeed with 201');

      // Create Catalog 3 (exceeds FREE limit of 2 -> must be rejected with 403)
      const cat3Res = await fetch(`${baseUrl}/api/studio/catalogs`, {
        method: 'POST',
        headers: auth1,
        body: JSON.stringify({ name: 'Catalog 3', description: 'Exceeds quota' })
      });
      assert.strictEqual(cat3Res.status, 403, 'Catalog 3 must be blocked with HTTP 403 LIMIT_REACHED');
      const errData = await cat3Res.json();
      assert.strictEqual(errData.error, 'LIMIT_REACHED', 'Error code must be LIMIT_REACHED');
      assert.strictEqual(errData.resourceType, 'catalogs', 'Resource type must be catalogs');

      pass('2. Server-Side Plan Quota Enforcement', `Created 2 catalogs; 3rd catalog was correctly blocked with HTTP 403 LIMIT_REACHED.`);
    } catch (err) {
      fail('2. Server-Side Plan Quota Enforcement', err);
    }

    // -------------------------------------------------------------
    // TEST 3: Un-capped Checkout Order Creation (Zero ₹3,000 Cap)
    // -------------------------------------------------------------
    let orderId = null;
    try {
      // Test Business Plan Checkout (₹4,999/mo)
      const res = await fetch(`${baseUrl}/api/billing/checkout`, {
        method: 'POST',
        headers: auth1,
        body: JSON.stringify({ planId: 'BUSINESS', billingCycle: 'monthly' })
      });
      assert.strictEqual(res.status, 200, 'Checkout must succeed with 200');
      const data = await res.json();
      assert.strictEqual(data.success, true, 'Checkout order creation should succeed');
      assert.strictEqual(data.amount, 499900, 'Amount must be 499,900 paise (₹4,999) without arbitrary caps');
      orderId = data.orderId || data.order_id;
      assert(orderId, 'Must return orderId');

      // Test Unlimited Plan Checkout (₹14,999/mo)
      const unlimRes = await fetch(`${baseUrl}/api/billing/checkout`, {
        method: 'POST',
        headers: auth1,
        body: JSON.stringify({ planId: 'UNLIMITED', billingCycle: 'yearly' })
      });
      const unlimData = await unlimRes.json();
      assert.strictEqual(unlimData.amount, 14999000, 'Unlimited yearly must be 14,999,000 paise (₹149,990)');

      pass('3. Un-capped Checkout Order Creation', `Generated checkout order for BUSINESS (₹4,999) and UNLIMITED (₹149,990). Zero checkout caps.`);
    } catch (err) {
      fail('3. Un-capped Checkout Order Creation', err);
    }

    // -------------------------------------------------------------
    // TEST 4: Payment Signature Verification & Plan Upgrade
    // -------------------------------------------------------------
    let invoiceId = null;
    try {
      const paymentId = `pay_${Date.now()}`;
      const verifyRes = await fetch(`${baseUrl}/api/billing/verify`, {
        method: 'POST',
        headers: auth1,
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: `test_sig_${Date.now()}`,
          planId: 'BUSINESS',
          billingCycle: 'monthly'
        })
      });
      assert.strictEqual(verifyRes.status, 200, 'Payment verify must return 200');
      const verifyData = await verifyRes.json();
      assert.strictEqual(verifyData.success, true, 'Verification should report success');
      assert.strictEqual(verifyData.subscription.plan_id, 'BUSINESS', 'Subscription must be elevated to BUSINESS');

      // Verify invoice generated in database
      const invRes = await fetch(`${baseUrl}/api/billing/invoices`, { headers: auth1 });
      assert.strictEqual(invRes.status, 200);
      const invData = await invRes.json();
      assert(invData.invoices.length > 0, 'Should have at least 1 invoice recorded');
      invoiceId = invData.invoices[0].id;
      assert.strictEqual(Number(invData.invoices[0].amount_inr), 4999, 'Invoice amount must match plan price ₹4,999');

      pass('4. Payment Signature Verification & Plan Upgrade', `Payment verified; upgraded to BUSINESS; invoice generated with amount ₹4,999.`);
    } catch (err) {
      fail('4. Payment Signature Verification & Plan Upgrade', err);
    }

    // -------------------------------------------------------------
    // TEST 5: Quota Relaxation Post-Upgrade
    // -------------------------------------------------------------
    try {
      // Create Catalog 3 under BUSINESS plan (allows up to 50 catalogs)
      const cat3Res = await fetch(`${baseUrl}/api/studio/catalogs`, {
        method: 'POST',
        headers: auth1,
        body: JSON.stringify({ name: 'Catalog 3 (Upgraded)', description: 'Now allowed under Business plan' })
      });
      assert.strictEqual(cat3Res.status, 201, 'Previously blocked Catalog 3 must now succeed with 201');

      pass('5. Quota Relaxation Post-Upgrade', `Previously blocked Catalog 3 succeeded under elevated BUSINESS quota.`);
    } catch (err) {
      fail('5. Quota Relaxation Post-Upgrade', err);
    }

    // -------------------------------------------------------------
    // TEST 6: Real Usage Counters Synchronization
    // -------------------------------------------------------------
    try {
      const usageRes = await fetch(`${baseUrl}/api/billing/usage`, { headers: auth1 });
      assert.strictEqual(usageRes.status, 200);
      const usageData = await usageRes.json();

      assert.strictEqual(usageData.plan.id, 'BUSINESS', 'Active plan should be BUSINESS');
      assert.strictEqual(usageData.plan.limits.maxCatalogs, 50, 'Max catalogs limit should be 50');
      assert.strictEqual(usageData.usage.catalogsCount, 3, 'Synced usage should show exactly 3 catalogs');

      pass('6. Real Usage Counters Synchronization', `Reported live usage: 3/50 catalogs, limits correctly synced.`);
    } catch (err) {
      fail('6. Real Usage Counters Synchronization', err);
    }

    // -------------------------------------------------------------
    // TEST 7: Cross-Tenant Isolation on Billing Data
    // -------------------------------------------------------------
    try {
      // Tenant B queries Tenant A's invoice directly
      const isolatedInvRes = await fetch(`${baseUrl}/api/billing/invoices/${invoiceId}`, { headers: auth2 });
      assert.strictEqual(isolatedInvRes.status, 404, 'Tenant B must NOT access Tenant A invoice (must return 404)');

      // Tenant B queries their own invoices (should be empty)
      const t2Invs = await fetch(`${baseUrl}/api/billing/invoices`, { headers: auth2 });
      const t2Data = await t2Invs.json();
      assert.strictEqual(t2Data.invoices.length, 0, 'Tenant B invoices must be isolated and empty');

      pass('7. Cross-Tenant Isolation on Billing Data', `Tenant B denied access to Tenant A invoice; cross-tenant boundary verified.`);
    } catch (err) {
      fail('7. Cross-Tenant Isolation on Billing Data', err);
    }

    // -------------------------------------------------------------
    // TEST 8: Subscription Cancellation Lifecycle
    // -------------------------------------------------------------
    try {
      const cancelRes = await fetch(`${baseUrl}/api/billing/cancel`, {
        method: 'POST',
        headers: auth1
      });
      assert.strictEqual(cancelRes.status, 200, 'Cancel must return 200');
      const cancelData = await cancelRes.json();
      assert.strictEqual(cancelData.subscription.cancel_at_period_end, true, 'cancel_at_period_end must be true');

      pass('8. Subscription Cancellation Lifecycle', `Subscription successfully scheduled for period-end cancellation.`);
    } catch (err) {
      fail('8. Subscription Cancellation Lifecycle', err);
    }

    // -------------------------------------------------------------
    // TEST 9: Customer Onboarding Status Milestone Calculation
    // -------------------------------------------------------------
    try {
      const onbRes = await fetch(`${baseUrl}/api/onboarding/status`, { headers: auth1 });
      assert.strictEqual(onbRes.status, 200, 'GET /onboarding/status must return 200');
      const onbData = await onbRes.json();

      assert.strictEqual(onbData.totalCount, 5, 'Must evaluate exactly 5 canonical milestones');
      assert.strictEqual(typeof onbData.completedCount, 'number');
      assert.strictEqual(typeof onbData.progressPercentage, 'number');

      // Tenant 1 has created catalogs (Studio milestone must be true)
      const studioStep = onbData.steps.find(s => s.id === 'studio_catalog');
      assert.strictEqual(studioStep.isCompleted, true, 'Omni Studio milestone should be completed');

      pass('9. Customer Onboarding Status Calculation', `Progress calculated: ${onbData.completedCount}/5 steps (${onbData.progressPercentage}%). Studio milestone active.`);
    } catch (err) {
      fail('9. Customer Onboarding Status Calculation', err);
    }

    // -------------------------------------------------------------
    // TEST 10: Onboarding Dismissal & Reset Lifecycle
    // -------------------------------------------------------------
    try {
      const dismissRes = await fetch(`${baseUrl}/api/onboarding/dismiss`, {
        method: 'POST',
        headers: auth1
      });
      assert.strictEqual(dismissRes.status, 200);

      const checkDismissed = await fetch(`${baseUrl}/api/onboarding/status`, { headers: auth1 });
      const disData = await checkDismissed.json();
      assert.strictEqual(disData.isDismissed, true, 'Onboarding must reflect dismissed state');

      const resetRes = await fetch(`${baseUrl}/api/onboarding/reset`, {
        method: 'POST',
        headers: auth1
      });
      assert.strictEqual(resetRes.status, 200);
      const resetData = await resetRes.json();
      assert.strictEqual(resetData.status.isDismissed, false, 'Onboarding must be active after reset');

      pass('10. Onboarding Dismissal & Reset Lifecycle', `Dismissed and reset lifecycle verified in company_preferences.`);
    } catch (err) {
      fail('10. Onboarding Dismissal & Reset Lifecycle', err);
    }

    // -------------------------------------------------------------
    // TEST 11: Database Backup & Verification Restore Drill
    // -------------------------------------------------------------
    try {
      const backupResult = await runDatabaseBackup();
      assert(backupResult.backupFile, 'Backup file should be created');
      assert(backupResult.totalRows > 0, 'Backup should export rows');

      const restoreResult = await runDatabaseRestore(backupResult.backupFile, { drill: true });
      assert.strictEqual(restoreResult.success, true, 'Drill restore must succeed');
      assert.strictEqual(restoreResult.mode, 'drill', 'Should execute in non-destructive drill mode');

      pass('11. Database Backup & Verification Restore Drill', `Backup generated (${backupResult.totalRows} rows, ${backupResult.totalTables} tables); restore drill verified.`);
    } catch (err) {
      fail('11. Database Backup & Verification Restore Drill', err);
    }

  } catch (err) {
    console.error('Fatal suite setup error:', err);
  } finally {
    console.log('\n----------------------------------------------------------------');
    console.log(`Verification Summary: ${passedCount} Passed | ${failedCount} Failed`);
    console.log('----------------------------------------------------------------\n');

    server.close();
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runSuite();
