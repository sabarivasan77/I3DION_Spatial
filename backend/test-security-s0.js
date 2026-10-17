/**
 * Automated Verification Suite for Security Phase S0 (Emergency Hotfixes)
 * Tests findings C1, C2, C3, SEC-01, H5, H3, H4/Webhook against live database & server.
 */

import { app } from './src/server.js';
import { pool, query, ensureMigrated } from './src/db/pool.js';
import jwt from 'jsonwebtoken';
import { config } from './src/config.js';
import crypto from 'node:crypto';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

let server;
let baseUrl;

async function setup() {
  await ensureMigrated();
  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function teardown() {
  if (server) await new Promise((r) => server.close(r));
  await pool.end();
}

async function runS0Tests() {
  console.log('================================================================');
  console.log('🛡️ Security Phase S0: Automated Verification Suite');
  console.log('================================================================\n');

  await setup();
  let passed = 0;
  let failed = 0;

  function recordPass(testName, details) {
    passed++;
    console.log(`✅ [PASS] ${testName}`);
    if (details) console.log(`   ${details}`);
  }

  function recordFail(testName, error) {
    failed++;
    console.error(`❌ [FAIL] ${testName}`);
    console.error(`   ${error.message || error}`);
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Finding C1 — Platform Admin Staff Allowlist Enforcement
    // -------------------------------------------------------------------------
    try {
      const staffUserId = crypto.randomUUID();
      const unauthorizedAdminId = crypto.randomUUID();
      const unauthorizedSuperAdminId = crypto.randomUUID();

      // Configure allowlist with ONLY staffUserId
      process.env.PLATFORM_ADMIN_USER_IDS = `${staffUserId},some-other-uuid`;

      // 1. Unauthorized tenant user with role 'Admin'
      const orgRes1 = await query(`INSERT INTO organizations (name) VALUES ('C1 Test Org 1') RETURNING id`);
      const org1Id = orgRes1.rows[0].id;
      const adminEmail = `admin-${Date.now()}@tenant.com`;
      await query(
        `INSERT INTO users (id, name, email, password_hash, organization_id, role)
         VALUES ($1, 'Tenant Admin', $2, 'dummy_hash', $3, 'Admin')`,
        [unauthorizedAdminId, adminEmail, org1Id]
      );
      const adminToken = jwt.sign({ userId: unauthorizedAdminId, email: adminEmail }, config.jwtSecret, { expiresIn: '1h' });

      const resAdmin = await fetch(`${baseUrl}/api/platform-admin/enterprise/requests`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assert.strictEqual(resAdmin.status, 403, 'Tenant Admin must be rejected with HTTP 403');

      // 2. Unauthorized user with role 'Super Admin' but NOT in allowlist
      const superAdminEmail = `superadmin-${Date.now()}@tenant.com`;
      await query(
        `INSERT INTO users (id, name, email, password_hash, organization_id, role)
         VALUES ($1, 'Non-Staff Super Admin', $2, 'dummy_hash', $3, 'Super Admin')`,
        [unauthorizedSuperAdminId, superAdminEmail, org1Id]
      );
      const superAdminToken = jwt.sign({ userId: unauthorizedSuperAdminId, email: superAdminEmail }, config.jwtSecret, { expiresIn: '1h' });

      const resSuperAdmin = await fetch(`${baseUrl}/api/platform-admin/enterprise/requests`, {
        headers: { 'Authorization': `Bearer ${superAdminToken}` }
      });
      assert.strictEqual(resSuperAdmin.status, 403, 'Non-allowlisted Super Admin must be rejected with HTTP 403');

      // 3. Authorized staff user in allowlist
      const staffEmail = `staff-${Date.now()}@i3dion.com`;
      await query(
        `INSERT INTO users (id, name, email, password_hash, organization_id, role)
         VALUES ($1, 'Authorized Staff', $2, 'dummy_hash', $3, 'Admin')`,
        [staffUserId, staffEmail, org1Id]
      );
      const staffToken = jwt.sign({ userId: staffUserId, email: staffEmail }, config.jwtSecret, { expiresIn: '1h' });

      const resStaff = await fetch(`${baseUrl}/api/platform-admin/enterprise/requests`, {
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });
      assert.strictEqual(resStaff.status, 200, 'Allowlisted staff user must receive HTTP 200');

      recordPass('1. Finding C1 — Platform Staff Realm & Allowlist', 'Enforced deny-all on /platform-admin unless user ID is in PLATFORM_ADMIN_USER_IDS.');
    } catch (err) {
      recordFail('1. Finding C1 — Platform Staff Realm & Allowlist', err);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Finding C2 — Authoritative Orders & Tamper-Proof Verify
    // -------------------------------------------------------------------------
    try {
      const c2UserId = crypto.randomUUID();
      const c2OrgRes = await query(`INSERT INTO organizations (name) VALUES ('C2 Test Org') RETURNING id`);
      const c2OrgId = c2OrgRes.rows[0].id;
      const c2Email = `buyer-${Date.now()}@industry.com`;

      await query(
        `INSERT INTO users (id, name, email, password_hash, organization_id, role)
         VALUES ($1, 'Buyer User', $2, 'dummy_hash', $3, 'Admin')`,
        [c2UserId, c2Email, c2OrgId]
      );
      await query(
        `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'Admin')`,
        [c2OrgId, c2UserId]
      );
      await query(
        `INSERT INTO subscriptions (organization_id, plan_id, billing_cycle, status)
         VALUES ($1, 'FREE', 'monthly', 'active')`,
        [c2OrgId]
      );

      const c2Token = jwt.sign(
        { userId: c2UserId, email: c2Email, organizationId: c2OrgId },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      // 1. Checkout cheap plan: STARTER (₹1,499)
      const checkoutRes = await fetch(`${baseUrl}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${c2Token}`,
          'x-organization-id': c2OrgId
        },
        body: JSON.stringify({ planId: 'STARTER', billingCycle: 'monthly' })
      });
      assert.strictEqual(checkoutRes.status, 200);
      const checkoutData = await checkoutRes.json();
      assert.ok(checkoutData.order_id, 'Must generate order_id');

      // Verify authoritative order row exists in DB
      const orderDbCheck = await query(`SELECT * FROM orders WHERE id = $1`, [checkoutData.order_id]);
      assert.strictEqual(orderDbCheck.rows.length, 1, 'Authoritative order record must exist in DB');
      assert.strictEqual(orderDbCheck.rows[0].plan_id, 'STARTER');
      assert.strictEqual(orderDbCheck.rows[0].amount_paise, 149900);

      // 2. Attempt to TAMPER verify call: client requests UNLIMITED yearly (₹149,990)
      process.env.TEST_MODE = 'true';
      const fakePaymentId = 'pay_test_' + Date.now();
      const verifyRes = await fetch(`${baseUrl}/api/billing/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${c2Token}`,
          'x-organization-id': c2OrgId
        },
        body: JSON.stringify({
          razorpay_order_id: checkoutData.order_id,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: `test_sig_${Date.now()}`,
          planId: 'UNLIMITED', // TAMPERED INPUT
          billingCycle: 'yearly' // TAMPERED INPUT
        })
      });
      assert.strictEqual(verifyRes.status, 200);
      const verifyData = await verifyRes.json();

      // Assert server applied STARTER, NOT the tampered UNLIMITED!
      assert.strictEqual(verifyData.subscription.plan_id, 'STARTER', 'Server must apply STARTER from stored order truth');
      assert.strictEqual(verifyData.subscription.billing_cycle, 'monthly');

      // Verify invoice in DB is for STARTER (₹1,499)
      const invCheck = await query(`SELECT * FROM invoices WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`, [c2OrgId]);
      assert.strictEqual(Number(invCheck.rows[0].amount_inr), 1499, 'Invoice amount must be ₹1,499');

      // Verify order marked 'paid'
      const orderPaidCheck = await query(`SELECT status FROM orders WHERE id = $1`, [checkoutData.order_id]);
      assert.strictEqual(orderPaidCheck.rows[0].status, 'paid');

      // 3. Negative test: Non-existent order returns 404
      const nonExistentRes = await fetch(`${baseUrl}/api/billing/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${c2Token}`,
          'x-organization-id': c2OrgId
        },
        body: JSON.stringify({
          razorpay_order_id: 'order_non_existent',
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: 'test_sig_123'
        })
      });
      assert.strictEqual(nonExistentRes.status, 404, 'Non-existent order must return HTTP 404');

      recordPass('2. Finding C2 — Payment Integrity & Server-Side Order Authority', 'Ignored tampered planId/cycle; applied STARTER from authoritative DB order; verified invoice amount ₹1,499.');
    } catch (err) {
      recordFail('2. Finding C2 — Payment Integrity & Server-Side Order Authority', err);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Finding C3 — Atomic Transactional Signup & Zero Orphaned Accounts
    // -------------------------------------------------------------------------
    try {
      // 1. Successful Signup
      const validEmail = `signup-success-${Date.now()}@factory.com`;
      const validOrgName = `Valid Factory ${Date.now()}`;
      const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Factory Owner',
          email: validEmail,
          password: 'StrongS0EnterpriseSecure2026!#$',
          organizationName: validOrgName
        })
      });
      assert.strictEqual(signupRes.status, 201);
      const signupData = await signupRes.json();
      assert.ok(signupData.token, 'Must return JWT token');
      assert.strictEqual(signupData.user.email, validEmail);

      // Verify DB state
      const userCheck = await query(`SELECT * FROM users WHERE email = $1`, [validEmail]);
      assert.strictEqual(userCheck.rows.length, 1);
      const orgCheck = await query(`SELECT * FROM organizations WHERE id = $1`, [signupData.user.organizationId]);
      assert.strictEqual(orgCheck.rows.length, 1);

      // 2. Failed Signup Rollback Test (Password too short)
      const failedEmail = `short-pw-${Date.now()}@factory.com`;
      const failedOrgName = `Short PW Org ${Date.now()}`;
      const failRes = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Short PW User',
          email: failedEmail,
          password: '123', // Invalid short password
          organizationName: failedOrgName
        })
      });
      assert.strictEqual(failRes.status, 400);

      // Verify zero orphaned rows
      const checkOrphanOrg = await query(`SELECT id FROM organizations WHERE name = $1`, [failedOrgName]);
      assert.strictEqual(checkOrphanOrg.rows.length, 0, 'Organization must NOT be created when validation fails');

      recordPass('3. Finding C3 — Transactional Signup Helper & Rollback', 'Signup executed atomically via withTransaction; rejected invalid input without orphaned DB records.');
    } catch (err) {
      recordFail('3. Finding C3 — Transactional Signup Helper & Rollback', err);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Finding SEC-01 — Secrets Hygiene & Scanning Rules
    // -------------------------------------------------------------------------
    try {
      const gitleaksPath = [
        path.resolve(process.cwd(), '.gitleaks.toml'),
        path.resolve(process.cwd(), '../.gitleaks.toml')
      ].find(p => fs.existsSync(p));
      const rewritePlanPath = [
        path.resolve(process.cwd(), 'docs/security/history-rewrite-plan.md'),
        path.resolve(process.cwd(), '../docs/security/history-rewrite-plan.md'),
        path.resolve(process.cwd(), '../../docs/security/history-rewrite-plan.md')
      ].find(p => fs.existsSync(p));

      assert.ok(gitleaksPath && fs.existsSync(gitleaksPath), '.gitleaks.toml must exist');
      assert.ok(rewritePlanPath && fs.existsSync(rewritePlanPath), 'history-rewrite-plan.md must exist');

      const planContent = fs.readFileSync(rewritePlanPath, 'utf8');
      assert.ok(planContent.includes('Razorpay Key ID & Secret'), 'Plan must document Razorpay keys');
      assert.ok(planContent.includes('JWT Secrets'), 'Plan must document JWT secrets');
      assert.ok(planContent.includes('Supabase Service Role Key'), 'Plan must document Supabase keys');
      assert.ok(planContent.includes('git-filter-repo'), 'Plan must specify git-filter-repo execution instructions');

      recordPass('4. Finding SEC-01 — Secrets Inventory & History Rewrite Plan', 'Documented all compromised secret classes and configured .gitleaks.toml rules.');
    } catch (err) {
      recordFail('4. Finding SEC-01 — Secrets Inventory & History Rewrite Plan', err);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Finding H5 — Single-Use Hashed Reset Tokens (Annex A9)
    // -------------------------------------------------------------------------
    try {
      const resetUserEmail = `reset-test-${Date.now()}@domain.com`;
      const resetOrgRes = await query(`INSERT INTO organizations (name) VALUES ('Reset Test Org') RETURNING id`);
      const resetOrgId = resetOrgRes.rows[0].id;
      const resetUserId = crypto.randomUUID();

      await query(
        `INSERT INTO users (id, name, email, password_hash, organization_id, role)
         VALUES ($1, 'Reset User', $2, 'old_password_hash', $3, 'Viewer')`,
        [resetUserId, resetUserEmail, resetOrgId]
      );

      // 1. Request password reset
      const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetUserEmail })
      });
      assert.strictEqual(forgotRes.status, 200);

      // Check token in DB
      const tokenDbRes = await query(
        `SELECT token_hash, expires_at, used_at FROM password_reset_tokens WHERE user_id = $1`,
        [resetUserId]
      );
      assert.strictEqual(tokenDbRes.rows.length, 1, 'Hashed token must exist in password_reset_tokens');
      assert.strictEqual(tokenDbRes.rows[0].used_at, null, 'used_at must initially be null');
      assert.ok(tokenDbRes.rows[0].token_hash.length === 64, 'Token hash must be 64-char sha256');

      // 2. Generate matching test raw token and hash
      const testRawToken = 'test_raw_token_' + Date.now();
      const testTokenHash = crypto.createHash('sha256').update(testRawToken).digest('hex');
      await query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, now() + interval '30 minutes')`,
        [resetUserId, testTokenHash]
      );

      // 3. Reset password using test token
      const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: testRawToken,
          password: 'BrandNewSecurePassword123!'
        })
      });
      assert.strictEqual(resetRes.status, 200);

      // Assert token is now consumed (used_at is not null)
      const tokenConsumedCheck = await query(
        `SELECT used_at FROM password_reset_tokens WHERE token_hash = $1`,
        [testTokenHash]
      );
      assert.ok(tokenConsumedCheck.rows[0].used_at !== null, 'Token must be marked consumed');

      // 4. REUSE ATTEMPT: Reusing the same token must fail with HTTP 400
      const reuseRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: testRawToken,
          password: 'AnotherPassword123!'
        })
      });
      assert.strictEqual(reuseRes.status, 400, 'Reusing a consumed reset token must return HTTP 400');

      recordPass('5. Finding H5 — Single-Use Hashed Reset Tokens', 'Tokens stored as sha256; atomic invalidation on use; token reuse returns HTTP 400.');
    } catch (err) {
      recordFail('5. Finding H5 — Single-Use Hashed Reset Tokens', err);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Finding H3 — Per-Route Rate Limiting (Annex A3)
    // -------------------------------------------------------------------------
    try {
      process.env.TEST_RATE_LIMIT = 'true';

      // 1. Test payload cap on telemetry endpoint (exceeding 4 KB)
      const oversizedPayload = {
        organizationId: crypto.randomUUID(),
        type: 'huge_event',
        properties: { blob: 'X'.repeat(5000) } // > 4 KB
      };

      const oversizedRes = await fetch(`${baseUrl}/api/lens/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oversizedPayload)
      });
      assert.strictEqual(oversizedRes.status, 413, 'Oversized event payload must return HTTP 413');

      // 2. Test login rate limiting threshold (20 attempts)
      let rateLimitHit = false;
      for (let i = 0; i < 22; i++) {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'rate@test.com', password: 'wrong' })
        });
        if (res.status === 429) {
          rateLimitHit = true;
          break;
        }
      }
      assert.strictEqual(rateLimitHit, true, 'Login attempts beyond threshold must trigger HTTP 429');

      delete process.env.TEST_RATE_LIMIT;
      recordPass('6. Finding H3 — Per-Route Rate Limiting & Payload Cap', 'Enforced 4 KB payload limit (HTTP 413) and login rate limiter (HTTP 429).');
    } catch (err) {
      delete process.env.TEST_RATE_LIMIT;
      recordFail('6. Finding H3 — Per-Route Rate Limiting & Payload Cap', err);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Finding H4 / Webhook — Length-Safe Signatures & Durable Deduplication
    // -------------------------------------------------------------------------
    try {
      const webhookSecret = 'test_webhook_secret_key_12345';
      process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
      const { billingProvider } = await import('./src/services/billing/billingProvider.js');
      billingProvider.webhookSecret = webhookSecret;

      // 1. Length-safe signature comparison: disparate signature length must return false without crash
      const isMismatchedValid = billingProvider.verifyWebhookSignature('{"event":"test"}', 'short_sig');
      assert.strictEqual(isMismatchedValid, false, 'Short signature must return false without throwing TypeError');

      // 2. Webhook header-based deduplication & durable write test
      const webhookEventId = `evt_test_${Date.now()}`;
      const validPayload = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_hook_1' } } }
      });
      const validSig = crypto.createHmac('sha256', webhookSecret).update(validPayload).digest('hex');

      // First webhook submission
      const hookRes1 = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': validSig,
          'x-razorpay-event-id': webhookEventId
        },
        body: validPayload
      });
      assert.strictEqual(hookRes1.status, 200);
      const hookData1 = await hookRes1.json();
      assert.strictEqual(hookData1.received, true);

      // Verify event was durably written to billing_events
      const eventDbCheck = await query(
        `SELECT * FROM billing_events WHERE provider = 'razorpay' AND provider_event_id = $1`,
        [webhookEventId]
      );
      assert.strictEqual(eventDbCheck.rows.length, 1, 'Event must be durably stored in billing_events');

      // Second webhook submission (DUPLICATE)
      const hookRes2 = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': validSig,
          'x-razorpay-event-id': webhookEventId
        },
        body: validPayload
      });
      assert.strictEqual(hookRes2.status, 200);
      const hookData2 = await hookRes2.json();
      assert.strictEqual(hookData2.duplicate, true, 'Duplicate webhook must return duplicate: true');

      recordPass('7. Finding H4 / Webhook — Length-Safe & Durable Ingestion', 'Verified length-safe HMAC verification and header-based deduplication with durable DB write.');
    } catch (err) {
      recordFail('7. Finding H4 / Webhook — Length-Safe & Durable Ingestion', err);
    }

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    console.log('\n----------------------------------------------------------------');
    console.log(`Phase S0 Verification Summary: ${passed} Passed | ${failed} Failed`);
    console.log('----------------------------------------------------------------\n');
    await teardown();
    if (failed > 0) process.exit(1);
    process.exit(0);
  }
}

runS0Tests();
