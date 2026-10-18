/**
 * Reproduction Test Suite for Critical Security Vulnerabilities C1, C2, C3
 * Defined in I3DION Spatial Security-First Master Prompt v2.0
 */

import { app } from '../../src/server.js';
import { pool, query } from '../../src/db/pool.js';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config.js';
import crypto from 'node:crypto';

let server;
let baseUrl;

async function setup() {
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

async function runReproductionTests() {
  console.log('================================================================');
  console.log('🚨 Critical Security Vulnerabilities Reproduction Suite (C1, C2, C3)');
  console.log('================================================================\n');

  await setup();

  try {
    // -------------------------------------------------------------------------
    // REPRODUCTION C1: Platform Admin Authorization Vulnerability (No Allowlist)
    // -------------------------------------------------------------------------
    console.log('--- REPRODUCING C1: Platform Admin Authorization Vulnerability ---');
    // An attacker or regular user with 'Super Admin' role in users table
    // In current requirePlatformAdmin, there is NO check against PLATFORM_STAFF_ALLOWLIST / env allowlist.
    // If a user in users table has role = 'Super Admin', they can access /api/platform-admin routes!
    const fakeSuperAdminId = crypto.randomUUID();
    const uniqueEmail = `intruder-${Date.now()}@attacker.com`;

    // Make sure fakeSuperAdminId is NOT in any PLATFORM_STAFF_ALLOWLIST or PLATFORM_ADMIN_USER_IDS env
    delete process.env.PLATFORM_STAFF_ALLOWLIST;
    delete process.env.PLATFORM_ADMIN_USER_IDS;

    // Insert user into DB with role 'Super Admin'
    const orgRes = await query(`INSERT INTO organizations (name) VALUES ('C1 Test Org') RETURNING id`);
    const c1OrgId = orgRes.rows[0].id;
    await query(
      `INSERT INTO users (id, name, email, password_hash, organization_id, role)
       VALUES ($1, 'Untrusted User', $2, 'dummy_hash', $3, 'Super Admin')`,
      [fakeSuperAdminId, uniqueEmail, c1OrgId]
    );

    const tokenWithoutAllowlist = jwt.sign(
      { userId: fakeSuperAdminId, role: 'Super Admin', email: uniqueEmail },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const c1Res = await fetch(`${baseUrl}/api/platform-admin/enterprise/requests`, {
      headers: {
        'Authorization': `Bearer ${tokenWithoutAllowlist}`
      }
    });

    console.log(`C1 Result: HTTP Status = ${c1Res.status}`);
    if (c1Res.status === 200) {
      console.log('🚨 [VULNERABILITY REPRODUCED C1]: User was granted access to /platform-admin based solely on role="Super Admin" without being on any PLATFORM_STAFF_ALLOWLIST from env!');
    } else {
      console.log(`C1 Status: ${c1Res.status}`);
    }

    // -------------------------------------------------------------------------
    // REPRODUCTION C2: Plan Tampering on Checkout Verify (Missing Order Truth)
    // -------------------------------------------------------------------------
    console.log('\n--- REPRODUCING C2: Checkout Price & Plan Tampering Vulnerability ---');
    const c2UserId = crypto.randomUUID();
    const c2OrgRes = await query(`INSERT INTO organizations (name) VALUES ('C2 Exploit Org') RETURNING id`);
    const c2OrgId = c2OrgRes.rows[0].id;
    const c2Email = `tamper-${Date.now()}@test.com`;
    await query(
      `INSERT INTO users (id, name, email, password_hash, organization_id, role)
       VALUES ($1, 'Tampering User', $2, 'dummy_hash', $3, 'Admin')`,
      [c2UserId, c2Email, c2OrgId]
    );
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'Admin')`,
      [c2OrgId, c2UserId]
    );
    await query(
      `INSERT INTO subscriptions (organization_id, plan_id, billing_cycle, status) VALUES ($1, 'FREE', 'monthly', 'active')`,
      [c2OrgId]
    );

    const c2Token = jwt.sign(
      { userId: c2UserId, email: c2Email, organizationId: c2OrgId },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // 2. Client initiates checkout for cheap plan: STARTER (₹1,499)
    const checkoutRes = await fetch(`${baseUrl}/api/billing/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c2Token}`,
        'x-organization-id': c2OrgId
      },
      body: JSON.stringify({
        planId: 'STARTER',
        billingCycle: 'monthly'
      })
    });
    const checkoutData = await checkoutRes.json();
    console.log(`C2: Initiated checkout for STARTER. Order ID: ${checkoutData.order_id}, Amount: ${checkoutData.amount} paise`);

    // 3. Client tampers with verify call, claiming UNLIMITED yearly (₹149,990)
    process.env.TEST_MODE = 'true';
    const fakePaymentId = 'pay_' + Date.now();
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
        planId: 'UNLIMITED', // TAMPERED! Client ordered STARTER
        billingCycle: 'yearly' // TAMPERED!
      })
    });

    const verifyData = await verifyRes.json();
    console.log(`C2 Verify Response:`, verifyData);

    const subCheck = await query(`SELECT plan_id, billing_cycle FROM subscriptions WHERE organization_id = $1`, [c2OrgId]);
    console.log(`C2 Database Subscription:`, subCheck.rows[0]);

    if (subCheck.rows[0]?.plan_id === 'UNLIMITED' && subCheck.rows[0]?.billing_cycle === 'yearly') {
      console.log('🚨 [VULNERABILITY REPRODUCED C2]: Server applied tampered UNLIMITED yearly plan (worth ₹149,990) for a STARTER checkout order!');
    }

    // -------------------------------------------------------------------------
    // REPRODUCTION C3: Signup COMMIT before token generation & broken transactions
    // -------------------------------------------------------------------------
    console.log('\n--- REPRODUCING C3: Broken Signup Transaction & Orphaned Accounts ---');
    // Reproduce the defect in auth.js where:
    // 1) pool.query('BEGIN') is non-transactional across pooled connections.
    // 2) COMMIT occurs before token generation; if JWT signing fails, the account is permanently orphaned in the DB.
    const signupEmail = `fail-signup-${Date.now()}@test.com`;
    const signupOrgName = `Orphaned Signup Org ${Date.now()}`;

    // Temporarily corrupt jwtSecret to cause jwt.sign to throw in auth.js
    const originalJwtSecret = config.jwtSecret;
    config.jwtSecret = null;

    try {
      const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Orphaned User',
          email: signupEmail,
          password: 'Password123!',
          organizationName: signupOrgName
        })
      });

      console.log(`C3: Signup response status with failed token generation: ${signupRes.status}`);
    } finally {
      config.jwtSecret = originalJwtSecret;
    }

    // Check if the user and organization were committed to the DB despite the signup failure
    const orphanedOrgCheck = await query(`SELECT id FROM organizations WHERE name = $1`, [signupOrgName]);
    const orphanedUserCheck = await query(`SELECT id FROM users WHERE email = $1`, [signupEmail]);

    console.log(`C3 Check: Committed Org count: ${orphanedOrgCheck.rows.length}, Committed User count: ${orphanedUserCheck.rows.length}`);
    if (orphanedOrgCheck.rows.length > 0 || orphanedUserCheck.rows.length > 0) {
      console.log('🚨 [VULNERABILITY REPRODUCED C3]: Signup failed with 500 error to user, but account & organization were committed to database because COMMIT was called before token generation and pool.query("BEGIN") does not bind a transaction!');
    }

  } catch (err) {
    console.error('Reproduction run error:', err);
  } finally {
    await teardown();
  }
}

runReproductionTests();
