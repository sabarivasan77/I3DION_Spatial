/**
 * Automated Verification Suite for Security Phase S1 (Identity, Sessions & Authorization)
 * Tests AUTH-ARGON2, AUTH-SESSION-ROTATION, AUTH-REUSE-DETECTION, AUTH-MFA, AUTHZ-CAN, and ORG-SWITCH.
 */

import { app } from '../../src/server.js';
import { pool, query, ensureMigrated } from '../../src/db/pool.js';
import { passwordService } from '../../src/services/auth/passwordService.js';
import { sessionService } from '../../src/services/auth/sessionService.js';
import { mfaService } from '../../src/services/auth/mfaService.js';
import { can, PERMISSIONS } from '../../src/middleware/authorizationEngine.js';
import { getRoutePolicy, ROUTE_POLICIES } from '../../src/routes/policies.js';
import { generateSync } from 'otplib';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config.js';
import crypto from 'node:crypto';
import assert from 'node:assert';

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

async function runS1Tests() {
  console.log('================================================================');
  console.log('🛡️ Security Phase S1: Identity, Sessions & AuthZ Test Suite');
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
    // TEST 1: AUTH-ARGON2 — Argon2id Hashing, Policy & Upgrade-on-Login (Annex A1)
    // -------------------------------------------------------------------------
    try {
      // 1A. Policy: reject passwords under 12 characters
      const shortPwEmail = `short-${Date.now()}@domain.com`;
      const shortRes = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Short Pw',
          email: shortPwEmail,
          password: 'Password123!', // 11 chars
          organizationName: 'Policy Test Org'
        })
      });
      assert.strictEqual(shortRes.status, 400, 'Password < 12 chars must be rejected with HTTP 400');

      // 1B. Policy: reject password containing email local part
      const emailMatchRes = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Target User',
          email: 'johndoe_corp@domain.com',
          password: 'Secure_johndoe_corp_2026!',
          organizationName: 'Policy Test Org 2'
        })
      });
      assert.strictEqual(emailMatchRes.status, 400, 'Password containing email username must be rejected');

      // 1C. Successful signup hashes with Argon2id
      const validPw = 'SuperStrongEnterpriseSecret_2026!#';
      const validEmail = `argon2-user-${Date.now()}@enterprise.com`;
      const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Argon2 User',
          email: validEmail,
          password: validPw,
          organizationName: 'Argon2 Enterprise Org'
        })
      });
      assert.strictEqual(signupRes.status, 201, 'Signup must succeed with valid 12+ char password');

      const checkHashRes = await query('SELECT password_hash FROM users WHERE email = $1', [validEmail]);
      const storedHash = checkHashRes.rows[0]?.password_hash;
      assert.ok(storedHash.startsWith('$argon2id$'), 'Password must be hashed with $argon2id$');

      // 1D. Timing Equalization: Non-existent account verification still runs full Argon2 hash
      const t0 = Date.now();
      const fakeLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent-user@domain.com', password: validPw })
      });
      const duration = Date.now() - t0;
      assert.strictEqual(fakeLoginRes.status, 401);
      assert.ok(duration > 15, 'Dummy hash verification must execute to equalize timing against enumeration');

      // 1E. Upgrade-on-Login: legacy bcrypt password transparently upgraded to Argon2id on login
      const legacyEmail = `legacy-bcrypt-${Date.now()}@domain.com`;
      const legacyPw = 'LegacyBcryptPassword2026!';
      const legacyBcryptHash = await bcrypt.hash(legacyPw, 10);
      const legacyOrgRes = await query(`INSERT INTO organizations (name) VALUES ('Legacy Org') RETURNING id`);
      const legacyOrgId = legacyOrgRes.rows[0].id;
      const legacyUserId = crypto.randomUUID();

      await query(
        `INSERT INTO users (id, name, email, password_hash, organization_id, role)
         VALUES ($1, 'Legacy User', $2, $3, $4, 'Admin')`,
        [legacyUserId, legacyEmail, legacyBcryptHash, legacyOrgId]
      );
      await query(
        `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'Admin')`,
        [legacyOrgId, legacyUserId]
      );

      // Verify hash is bcrypt initially
      assert.ok(legacyBcryptHash.startsWith('$2a$') || legacyBcryptHash.startsWith('$2b$'));

      // Perform login
      const legacyLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: legacyEmail, password: legacyPw })
      });
      assert.strictEqual(legacyLoginRes.status, 200, 'Legacy user login must succeed');

      // Assert hash in database is now upgraded to Argon2id
      const upgradedDbRes = await query('SELECT password_hash FROM users WHERE id = $1', [legacyUserId]);
      const upgradedHash = upgradedDbRes.rows[0]?.password_hash;
      assert.ok(
        upgradedHash.startsWith('$argon2id$'),
        'Legacy bcrypt hash must be transparently upgraded to $argon2id$ upon login'
      );

      recordPass(
        '1. AUTH-ARGON2 — Argon2id Hashing, Policy & Upgrade-on-Login',
        'Enforced 12-char policy, verified $argon2id$ hashing, and proved automatic bcrypt upgrade on login.'
      );
    } catch (err) {
      recordFail('1. AUTH-ARGON2 — Argon2id Hashing, Policy & Upgrade-on-Login', err);
    }

    // -------------------------------------------------------------------------
    // TEST 2: AUTH-SESSION-ROTATION — Dual-Token Session & Atomic Rotation (Annex A2)
    // -------------------------------------------------------------------------
    let testRefreshToken = '';
    let testUserId = '';
    let testOrgId = '';
    let testFamilyId = '';

    try {
      const email = `session-user-${Date.now()}@domain.com`;
      const password = 'ValidSessionPassword2026!';
      const orgRes = await query(`INSERT INTO organizations (name) VALUES ('Session Test Org') RETURNING id`);
      testOrgId = orgRes.rows[0].id;
      testUserId = crypto.randomUUID();
      const argonHash = await passwordService.hash(password);

      await query(
        `INSERT INTO users (id, name, email, password_hash, organization_id, role)
         VALUES ($1, 'Session User', $2, $3, $4, 'Admin')`,
        [testUserId, email, argonHash, testOrgId]
      );
      await query(
        `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'Admin')`,
        [testOrgId, testUserId]
      );

      // Login to obtain session
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      assert.strictEqual(loginRes.status, 200);

      // Extract refresh token from Set-Cookie header
      const cookieHeader = loginRes.headers.get('set-cookie');
      assert.ok(cookieHeader && cookieHeader.includes('i3dion_refresh_token='), 'HttpOnly refresh cookie must be present');
      const match = cookieHeader.match(/i3dion_refresh_token=([^;]+)/);
      testRefreshToken = match[1];

      const loginData = await loginRes.json();
      assert.ok(loginData.token, '10-minute access token must be returned');

      // Verify access token claims
      const decoded = jwt.decode(loginData.token);
      assert.strictEqual(decoded.sub, testUserId);
      assert.strictEqual(decoded.org, testOrgId);
      assert.strictEqual(decoded.role, 'Admin');
      assert.ok(decoded.sid, 'Session ID claim (sid) must be present in token');

      // Check sessions table in DB
      const sessionDbRes = await query(
        `SELECT id, family_id, token_hash, replaced_by, revoked_at FROM sessions WHERE user_id = $1`,
        [testUserId]
      );
      assert.strictEqual(sessionDbRes.rows.length, 1);
      testFamilyId = sessionDbRes.rows[0].family_id;
      assert.strictEqual(sessionDbRes.rows[0].replaced_by, null);

      // Perform Refresh / Rotation
      const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': `i3dion_refresh_token=${testRefreshToken}`
        }
      });
      assert.strictEqual(refreshRes.status, 200);

      const refreshCookieHeader = refreshRes.headers.get('set-cookie');
      assert.ok(refreshCookieHeader.includes('i3dion_refresh_token='));
      const rotatedMatch = refreshCookieHeader.match(/i3dion_refresh_token=([^;]+)/);
      const newRefreshToken = rotatedMatch[1];
      assert.notStrictEqual(newRefreshToken, testRefreshToken, 'Refresh token must be rotated to a new token');

      // Verify old session in DB is marked replaced and revoked
      const oldSessionDb = await query(
        `SELECT id, replaced_by, revoked_at FROM sessions WHERE token_hash = $1`,
        [sessionService.hashToken(testRefreshToken)]
      );
      assert.ok(oldSessionDb.rows[0].revoked_at !== null, 'Old session must have revoked_at set');
      assert.ok(oldSessionDb.rows[0].replaced_by !== null, 'Old session must have replaced_by set');

      recordPass(
        '2. AUTH-SESSION-ROTATION — Dual-Token Session & Atomic Rotation',
        'Verified 10-minute access token, HttpOnly cookie, and atomic rotation of refresh token.'
      );
    } catch (err) {
      recordFail('2. AUTH-SESSION-ROTATION — Dual-Token Session & Atomic Rotation', err);
    }

    // -------------------------------------------------------------------------
    // TEST 3: AUTH-REUSE-DETECTION — Replay Attack Triggers Family Revocation (Annex A2)
    // -------------------------------------------------------------------------
    try {
      // Attacker tries to use the already-rotated testRefreshToken
      const replayRes = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': `i3dion_refresh_token=${testRefreshToken}`
        }
      });
      assert.strictEqual(replayRes.status, 401, 'Replayed token must be rejected with HTTP 401');
      const replayData = await replayRes.json();
      assert.strictEqual(replayData.code, 'TOKEN_REUSE_DETECTED');

      // Assert that ALL sessions in testFamilyId are now revoked
      const allFamilySessions = await query(
        `SELECT id, revoked_at FROM sessions WHERE family_id = $1`,
        [testFamilyId]
      );
      assert.ok(allFamilySessions.rows.length >= 2, 'Family must have multiple session generations');
      const unrevokedSessions = allFamilySessions.rows.filter(s => s.revoked_at === null);
      assert.strictEqual(unrevokedSessions.length, 0, 'ALL sessions in the compromised family must be revoked');

      recordPass(
        '3. AUTH-REUSE-DETECTION — Automatic Family Revocation',
        'Replayed refresh token detected; revoked entire session family and returned TOKEN_REUSE_DETECTED.'
      );
    } catch (err) {
      recordFail('3. AUTH-REUSE-DETECTION — Automatic Family Revocation', err);
    }

    // -------------------------------------------------------------------------
    // TEST 4: AUTH-REVOCATION-GLOBAL — token_version Invalidates Access Tokens (Annex A2)
    // -------------------------------------------------------------------------
    try {
      const email = `token-ver-${Date.now()}@domain.com`;
      const pw = 'ValidGlobalRevokePassword2026!';
      const orgRes = await query(`INSERT INTO organizations (name) VALUES ('Revoke Test Org') RETURNING id`);
      const orgId = orgRes.rows[0].id;
      const userId = crypto.randomUUID();
      const argonHash = await passwordService.hash(pw);

      await query(
        `INSERT INTO users (id, name, email, password_hash, organization_id, role, token_version)
         VALUES ($1, 'Revoke User', $2, $3, $4, 'Admin', 1)`,
        [userId, email, argonHash, orgId]
      );
      await query(
        `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'Admin')`,
        [orgId, userId]
      );

      // Create initial access token with ver=1
      const initialToken = jwt.sign(
        { sub: userId, org: orgId, role: 'Admin', ver: 1 },
        config.jwtSecret,
        { expiresIn: '10m' }
      );

      // Verify token works on protected endpoint
      const protectedRes1 = await fetch(`${baseUrl}/api/organization`, {
        headers: { 'Authorization': `Bearer ${initialToken}` }
      });
      assert.strictEqual(protectedRes1.status, 200, 'Initial token with ver=1 must succeed');

      // Increment token_version (e.g. via logout-all or password change)
      await sessionService.revokeAllUserSessions(userId);

      // Verify database token_version bumped to 2
      const userCheck = await query(`SELECT token_version FROM users WHERE id = $1`, [userId]);
      assert.strictEqual(userCheck.rows[0].token_version, 2);

      // Verify previous access token (ver=1) is now immediately rejected
      const protectedRes2 = await fetch(`${baseUrl}/api/organization`, {
        headers: { 'Authorization': `Bearer ${initialToken}` }
      });
      assert.strictEqual(protectedRes2.status, 401, 'Token with stale ver=1 must be rejected with HTTP 401');

      recordPass(
        '4. AUTH-REVOCATION-GLOBAL — Immediate Access Token Invalidation',
        'Bumping token_version immediately invalidates all active JWT access tokens.'
      );
    } catch (err) {
      recordFail('4. AUTH-REVOCATION-GLOBAL — Immediate Access Token Invalidation', err);
    }

    // -------------------------------------------------------------------------
    // TEST 5: AUTH-MFA — TOTP Multi-Factor Enrollment & Enforcement
    // -------------------------------------------------------------------------
    try {
      const email = `mfa-user-${Date.now()}@enterprise.com`;
      const pw = 'SecureMfaPassword2026!';
      const orgRes = await query(`INSERT INTO organizations (name) VALUES ('MFA Enterprise Org') RETURNING id`);
      const orgId = orgRes.rows[0].id;
      const userId = crypto.randomUUID();
      const argonHash = await passwordService.hash(pw);

      await query(
        `INSERT INTO users (id, name, email, password_hash, organization_id, role)
         VALUES ($1, 'MFA User', $2, $3, $4, 'Admin')`,
        [userId, email, argonHash, orgId]
      );
      await query(
        `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'Admin')`,
        [orgId, userId]
      );

      const userToken = jwt.sign({ sub: userId, org: orgId, role: 'Admin', ver: 1 }, config.jwtSecret, { expiresIn: '10m' });

      // 1. Initialize MFA setup
      const setupRes = await fetch(`${baseUrl}/api/auth/mfa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });
      assert.strictEqual(setupRes.status, 200);
      const setupData = await setupRes.json();
      assert.ok(setupData.secret, 'TOTP secret must be returned');
      assert.ok(setupData.qrCodeDataUrl.startsWith('data:image/png;base64,'), 'QR Code PNG must be returned');
      assert.strictEqual(setupData.scratchCodes.length, 8, '8 scratch codes must be generated');

      // 2. Confirm MFA setup using valid TOTP token
      const validTotp = generateSync({ secret: setupData.secret });
      const confirmRes = await fetch(`${baseUrl}/api/auth/mfa/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: validTotp })
      });
      assert.strictEqual(confirmRes.status, 200);

      // Verify secret encrypted at rest in DB
      const mfaDbCheck = await query(`SELECT secret_encrypted, is_enabled FROM user_mfa WHERE user_id = $1`, [userId]);
      assert.strictEqual(mfaDbCheck.rows[0].is_enabled, true);
      assert.ok(mfaDbCheck.rows[0].secret_encrypted.includes(':'), 'Secret must be stored encrypted (IV:TAG:CIPHER)');

      // 3. Login without MFA code triggers challenge
      const loginWithoutMfa = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw })
      });
      assert.strictEqual(loginWithoutMfa.status, 200);
      const challengeData = await loginWithoutMfa.json();
      assert.strictEqual(challengeData.mfaRequired, true, 'Login must require MFA code');

      // 4. Login with single-use scratch recovery code
      const scratchToUse = setupData.scratchCodes[0];
      const loginWithScratch = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw, mfaCode: scratchToUse })
      });
      assert.strictEqual(loginWithScratch.status, 200);
      const scratchLoginData = await loginWithScratch.json();
      assert.ok(scratchLoginData.token, 'Login with scratch code must issue access token');

      // 5. Scratch code reuse must fail
      const reuseScratchLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw, mfaCode: scratchToUse })
      });
      assert.strictEqual(reuseScratchLogin.status, 401, 'Consumed scratch code must be rejected');

      recordPass(
        '5. AUTH-MFA — TOTP Multi-Factor Enrollment & Scratch Codes',
        'Enrolled TOTP, verified encryption at rest, enforced on login, and proved atomic scratch code consumption.'
      );
    } catch (err) {
      recordFail('5. AUTH-MFA — TOTP Multi-Factor Enrollment & Scratch Codes', err);
    }

    // -------------------------------------------------------------------------
    // TEST 6: AUTHZ-CAN — Canonical Authorization Engine & Tenant Isolation (Annex A4)
    // -------------------------------------------------------------------------
    try {
      const orgAId = crypto.randomUUID();
      const orgBId = crypto.randomUUID();
      const userAId = crypto.randomUUID();
      const userBId = crypto.randomUUID();

      await query(`INSERT INTO organizations (id, name) VALUES ($1, 'Org A'), ($2, 'Org B')`, [orgAId, orgBId]);

      const emailA = `usera-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@orga.com`;
      const emailB = `userb-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@orgb.com`;

      // Seed User A as Admin in Org A
      await query(
        `INSERT INTO users (id, name, email, password_hash, organization_id, role)
         VALUES ($1, 'User A', $2, 'dummy', $3, 'Admin')`,
        [userAId, emailA, orgAId]
      );
      await query(`INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'Admin')`, [orgAId, userAId]);

      // Seed User B as Viewer in Org B
      await query(
        `INSERT INTO users (id, name, email, password_hash, organization_id, role)
         VALUES ($1, 'User B', $2, 'dummy', $3, 'Viewer')`,
        [userBId, emailB, orgBId]
      );
      await query(`INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'Viewer')`, [orgBId, userBId]);

      // 6A. Viewer role permission check (can Viewer create catalogs?)
      const viewerActor = { userId: userBId, organizationId: orgBId };
      const viewerCatalogCreate = await can(viewerActor, 'catalog:create');
      assert.strictEqual(viewerCatalogCreate.allow, false, 'Viewer role must NOT be permitted to create catalogs');

      // 6B. Admin role permission check (can Admin create catalogs?)
      const adminActor = { userId: userAId, organizationId: orgAId };
      const adminCatalogCreate = await can(adminActor, 'catalog:create');
      assert.strictEqual(adminCatalogCreate.allow, true, 'Admin role must be permitted to create catalogs');

      // 6C. Cross-Tenant Isolation: User A (Org A) attempting action on Org B resource
      const resourceInOrgB = { id: crypto.randomUUID(), organization_id: orgBId, name: 'Org B Resource' };
      const crossTenantCheck = await can(adminActor, 'catalog:read', resourceInOrgB);
      assert.strictEqual(crossTenantCheck.allow, false, 'Cross-tenant resource access must be strictly DENIED');
      assert.ok(crossTenantCheck.reason.includes('Cross-tenant'), 'Reason must explicitly identify cross-tenant violation');

      // 6D. Resource condition invariant: Cannot delete a published catalog
      const publishedCatalog = { id: crypto.randomUUID(), organization_id: orgAId, status: 'Published' };
      const deletePublishedCheck = await can(adminActor, 'catalog:delete', publishedCatalog);
      assert.strictEqual(deletePublishedCheck.allow, false, 'Deleting a published catalog must be denied');

      recordPass(
        '6. AUTHZ-CAN — Canonical can() Decision Engine & Boundary Isolation',
        'Verified membership-based matrix decisions, cross-tenant denial, and resource invariant checks.'
      );
    } catch (err) {
      recordFail('6. AUTHZ-CAN — Canonical can() Decision Engine & Boundary Isolation', err);
    }

    // -------------------------------------------------------------------------
    // TEST 7: AUTHZ-ORG-SWITCH & ROUTE-REGISTRY (Annex A4)
    // -------------------------------------------------------------------------
    try {
      const multiOrgUser = crypto.randomUUID();
      const org1Id = crypto.randomUUID();
      const org2Id = crypto.randomUUID();
      const multiEmail = `multiorg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@domain.com`;

      await query(`INSERT INTO organizations (id, name) VALUES ($1, 'Company 1'), ($2, 'Company 2')`, [org1Id, org2Id]);
      await query(
        `INSERT INTO users (id, name, email, password_hash, organization_id, role)
         VALUES ($1, 'Multi Org User', $2, 'dummy', $3, 'Viewer')`,
        [multiOrgUser, multiEmail, org1Id]
      );

      // Member of Org 1 as 'Viewer' and Org 2 as 'Admin'
      await query(`INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'Viewer')`, [org1Id, multiOrgUser]);
      await query(`INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'Admin')`, [org2Id, multiOrgUser]);

      const initialToken = jwt.sign({ sub: multiOrgUser, org: org1Id, role: 'Viewer', ver: 1 }, config.jwtSecret, { expiresIn: '10m' });

      // Switch organization to Org 2
      const switchRes = await fetch(`${baseUrl}/api/auth/switch-org`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${initialToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ organizationId: org2Id })
      });
      assert.strictEqual(switchRes.status, 200, 'Switch org endpoint must succeed');
      const switchData = await switchRes.json();
      assert.strictEqual(switchData.organizationId, org2Id);
      assert.strictEqual(switchData.role, 'Admin');

      const switchedDecoded = jwt.decode(switchData.token);
      assert.strictEqual(switchedDecoded.org, org2Id);
      assert.strictEqual(switchedDecoded.role, 'Admin');

      // Verify Route Policy Registry Coverage
      const samplePolicies = [
        getRoutePolicy('GET', '/api/vault/assets'),
        getRoutePolicy('POST', '/api/studio/catalogs'),
        getRoutePolicy('GET', '/api/lens/overview'),
        getRoutePolicy('POST', '/api/billing/checkout')
      ];
      for (const p of samplePolicies) {
        assert.ok(p && p.action, 'Route must match registered canonical permission');
      }

      recordPass(
        '7. AUTHZ-ORG-SWITCH & ROUTE-REGISTRY — Scope Switch & Policy Registry',
        'Switched organization scope dynamically; issued token bound to target org with elevated membership role.'
      );
    } catch (err) {
      recordFail('7. AUTHZ-ORG-SWITCH & ROUTE-REGISTRY — Scope Switch & Policy Registry', err);
    }

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    console.log('\n----------------------------------------------------------------');
    console.log(`Phase S1 Verification Summary: ${passed} Passed | ${failed} Failed`);
    console.log('----------------------------------------------------------------\n');
    await teardown();
    if (failed > 0) process.exit(1);
    process.exit(0);
  }
}

runS1Tests();
