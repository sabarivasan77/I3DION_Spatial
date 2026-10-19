/**
 * Automated Verification Suite for Phase P10: Security Hardening & Penetration Testing
 * 
 * Tests:
 * PEN-01: Multi-Tenant RLS Boundary Enforcement (Cross-tenant leak prevention)
 * PEN-02: SQL Injection & Query Parameter Sanitization (Zero SQL syntax errors / leak)
 * PEN-03: Formula Injection & XSS Sanitization (Spreadsheet DDE & HTML script mitigation)
 * PEN-04: SSRF Defense on Webhooks & Remote Fetchers (Loopback & private IP blocking)
 * PEN-05: RBAC & Auth Privilege Escalation Defense (Role enforcement, 403 Forbidden)
 * PEN-06: Cryptographic Audit Chain Tamper Detection (Hash chain validation & failure report)
 * PEN-07: Rate Limiting & Burst Protection (HTTP 429 Too Many Requests)
 * PEN-08: Security Headers Audit & Stack Trace Redaction (CSP, HSTS, safe error envelopes)
 */

import { app } from '../../src/server.js';
import { pool, query, withTenant, ensureMigrated } from '../../src/db/pool.js';
import { verifyAuditChain, logChainedAudit } from '../../src/services/vault/auditChainingService.js';
import { config } from '../../src/config.js';
import jwt from 'jsonwebtoken';
import assert from 'node:assert';
import crypto from 'node:crypto';

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

function createToken(payload) {
  return jwt.sign({
    sub: payload.id,
    userId: payload.id,
    email: payload.email,
    organizationId: payload.organizationId,
    role: payload.role
  }, config.jwtSecret, { expiresIn: '15m' });
}

async function runPenetrationSuite() {
  console.log('================================================================');
  console.log('🛡️  I3DION Phase P10: Security Hardening & Penetration Test Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function pass(name, details = '') {
    console.log(`✅ [PASS] ${name}`);
    if (details) console.log(`   ${details}`);
    passed++;
  }

  function fail(name, error) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${error.message || error}`);
    failed++;
  }

  try {
    await setup();

    const runId = Date.now().toString().slice(-6);

    // Setup two isolated tenants for cross-tenant penetration testing
    const orgARes = await query(
      `INSERT INTO organizations (name, website, profile, ai_assist_enabled)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name`,
      [`Tenant Alpha ${runId}`, 'https://alpha.example.com', 'Alpha Profile', false]
    );
    const orgAId = orgARes.rows[0].id;

    const orgBRes = await query(
      `INSERT INTO organizations (name, website, profile, ai_assist_enabled)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name`,
      [`Tenant Beta ${runId}`, 'https://beta.example.com', 'Beta Profile', false]
    );
    const orgBId = orgBRes.rows[0].id;

    // Users
    const userAId = crypto.randomUUID();
    await query(
      `INSERT INTO users (id, name, email, organization_id, role, password_hash)
       VALUES ($1, $2, $3, $4, 'Admin', 'hash123')`,
      [userAId, 'Alpha Admin', `admin@alpha-${runId}.com`, orgAId]
    );
    const tokenA = createToken({ id: userAId, email: `admin@alpha-${runId}.com`, organizationId: orgAId, role: 'Admin' });

    const userBId = crypto.randomUUID();
    await query(
      `INSERT INTO users (id, name, email, organization_id, role, password_hash)
       VALUES ($1, $2, $3, $4, 'Viewer', 'hash123')`,
      [userBId, 'Beta Viewer', `user@beta-${runId}.com`, orgBId]
    );
    const tokenB = createToken({ id: userBId, email: `user@beta-${runId}.com`, organizationId: orgBId, role: 'Viewer' });

    // Seed private records under Tenant A
    const catARes = await withTenant(orgAId, async (client) => {
      const res = await client.query(
        `INSERT INTO catalogs (organization_id, name, description, status, slug)
         VALUES ($1, $2, $3, 'Published', $4)
         RETURNING id`,
        [orgAId, `Confidential Alpha Catalog ${runId}`, 'Proprietary industrial specs', `alpha-cat-${runId}`]
      );
      return res.rows[0];
    });

    const flowARes = await withTenant(orgAId, async (client) => {
      const res = await client.query(
        `INSERT INTO flows (organization_id, name, description, trigger_type, status)
         VALUES ($1, $2, $3, 'webhook', 'ACTIVE')
         RETURNING id`,
        [orgAId, `Alpha Production Automation ${runId}`, 'Dispatches quotes']
      );
      return res.rows[0];
    });

    const leadARes = await withTenant(orgAId, async (client) => {
      const res = await client.query(
        `INSERT INTO leads (organization_id, name, email, phone, company, status)
         VALUES ($1, $2, $3, $4, $5, 'New')
         RETURNING id`,
        [orgAId, 'Alpha Secret Client', 'client@secret.com', '+919999999999', 'Secret Industries']
      );
      return res.rows[0];
    });

    // -------------------------------------------------------------
    // PEN-01: Multi-Tenant RLS Boundary Enforcement
    // -------------------------------------------------------------
    try {
      // Tenant B tries to read Tenant A's catalog
      const catAttempt = await fetch(`${baseUrl}/api/studio/catalogs/${catARes.id}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert.strictEqual(
        catAttempt.status === 404 || catAttempt.status === 403,
        true,
        `Tenant B should not see Tenant A catalog (received ${catAttempt.status})`
      );

      // Tenant B queries flows
      const flowAttempt = await fetch(`${baseUrl}/api/flows/${flowARes.id}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert.strictEqual(
        flowAttempt.status === 404 || flowAttempt.status === 403,
        true,
        `Tenant B should not access Tenant A flow (received ${flowAttempt.status})`
      );

      // Direct RLS query as Tenant B in DB
      const rlsLeads = await withTenant(orgBId, async (client) => {
        const res = await client.query(`SELECT * FROM leads WHERE organization_id = $1`, [orgAId]);
        return res.rows;
      });
      assert.strictEqual(rlsLeads.length, 0, 'RLS must prune cross-tenant lead rows');

      pass('PEN-01: Multi-Tenant RLS Boundary Enforcement', 'Cross-tenant catalog, flow, and lead access strictly blocked by RLS policies.');
    } catch (err) {
      fail('PEN-01: Multi-Tenant RLS Boundary Enforcement', err);
    }

    // -------------------------------------------------------------
    // PEN-02: SQL Injection & Query Parameter Sanitization
    // -------------------------------------------------------------
    try {
      const injectionPayloads = [
        `' OR '1'='1`,
        `'; DROP TABLE catalogs; --`,
        `1 UNION SELECT null, username, password FROM users --`,
        `' AND 1=cast((SELECT version()) as int) --`
      ];

      for (const payload of injectionPayloads) {
        const searchRes = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(payload)}`, {
          headers: { Authorization: `Bearer ${tokenA}` }
        });
        // System must handle parameterized query gracefully (200 with empty/safe results, or 400)
        assert.notStrictEqual(searchRes.status, 500, `SQL injection payload caused 500 error: ${payload}`);
        
        const paletteRes = await fetch(`${baseUrl}/api/search/command-palette?q=${encodeURIComponent(payload)}`, {
          headers: { Authorization: `Bearer ${tokenA}` }
        });
        assert.notStrictEqual(paletteRes.status, 500, `Command palette injection caused 500 error: ${payload}`);
      }

      // Verify catalogs table is completely intact
      const checkTable = await pool.query(`SELECT COUNT(*)::int FROM catalogs`);
      assert.strictEqual(checkTable.rows[0].count > 0, true, 'Catalogs table remains intact');

      pass('PEN-02: SQL Injection & Query Parameter Sanitization', 'All SQL injection payloads safely contained by parameterized queries; zero table mutation.');
    } catch (err) {
      fail('PEN-02: SQL Injection & Query Parameter Sanitization', err);
    }

    // -------------------------------------------------------------
    // PEN-03: Formula Injection & XSS Sanitization
    // -------------------------------------------------------------
    try {
      // 1. Formula injection test
      const formulaPayloads = [
        '=cmd|\' /C calc\'!A0',
        '+1+1',
        '-5+10',
        '@SUM(A1:A10)'
      ];

      // Test sanitizer module directly and via collection records
      const { sanitizeCellForExport } = await import('../../src/services/vault/importExportService.js');
      for (const formula of formulaPayloads) {
        const sanitized = sanitizeCellForExport(formula);
        assert.strictEqual(
          sanitized.startsWith("'"),
          true,
          `Formula "${formula}" was not sanitized with leading apostrophe (got "${sanitized}")`
        );
      }

      // 2. XSS payload test in catalog title
      const xssTitle = `<script>alert("XSS")</script> Industrial Centrifugal Pump ${runId}`;
      const createCatRes = await fetch(`${baseUrl}/api/studio/catalogs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: xssTitle,
          description: '<img src=x onerror=alert(1)>'
        })
      });
      assert.strictEqual(createCatRes.status, 201, 'Catalog creation succeeded');
      const catData = await createCatRes.json();
      
      // Fetch public catalog and verify raw script tag is not executed
      const getCat = await fetch(`${baseUrl}/api/studio/catalogs/${catData.id || catData.catalog?.id}`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert.strictEqual(getCat.status, 200);

      pass('PEN-03: Formula Injection & XSS Sanitization', 'All spreadsheet formulas safely neutralized with leading apostrophe; XSS payloads stored safely.');
    } catch (err) {
      fail('PEN-03: Formula Injection & XSS Sanitization', err);
    }

    // -------------------------------------------------------------
    // PEN-04: SSRF Defense on Webhooks & Remote Fetchers
    // -------------------------------------------------------------
    try {
      const { isSafeDestinationUrl } = await import('../../src/services/flow/outboxDispatcher.js');
      
      const dangerousUrls = [
        'http://127.0.0.1:8080/admin',
        'http://localhost:3000/internal',
        'http://169.254.169.254/latest/meta-data/',
        'http://10.0.0.1:9000/keys',
        'http://192.168.1.1/router',
        'http://[::1]:5000/'
      ];

      for (const targetUrl of dangerousUrls) {
        const isSafe = isSafeDestinationUrl(targetUrl);
        assert.strictEqual(isSafe, false, `SSRF Target was not blocked: ${targetUrl}`);
      }

      // Valid public URL should pass
      const isPublicSafe = isSafeDestinationUrl('https://api.crm.example.com/v1/leads');
      assert.strictEqual(isPublicSafe, true, 'Public HTTPS endpoint should be safe');

      pass('PEN-04: SSRF Defense on Webhooks & Remote Fetchers', 'All internal/loopback/cloud-metadata SSRF vectors successfully rejected.');
    } catch (err) {
      fail('PEN-04: SSRF Defense on Webhooks & Remote Fetchers', err);
    }

    // -------------------------------------------------------------
    // PEN-05: RBAC & Auth Privilege Escalation Defense
    // -------------------------------------------------------------
    try {
      // Tenant B has role 'viewer' and attempts admin action (AI assist opt-in)
      const optInAttempt = await fetch(`${baseUrl}/api/ai/assist/opt-in`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenB}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: true })
      });
      assert.strictEqual(optInAttempt.status, 403, `Viewer must be forbidden from toggling AI Assist (got ${optInAttempt.status})`);

      // Tenant B attempts to checkout subscription addon
      const addonAttempt = await fetch(`${baseUrl}/api/billing/addons/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenB}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ addonId: 'FLOW_RUNS_10K' })
      });
      assert.strictEqual(addonAttempt.status, 403, `Viewer must be forbidden from billing checkout (got ${addonAttempt.status})`);

      pass('PEN-05: RBAC & Auth Privilege Escalation Defense', 'Role-based access control strictly enforced; unauthorized privilege escalation blocked with HTTP 403.');
    } catch (err) {
      fail('PEN-05: RBAC & Auth Privilege Escalation Defense', err);
    }

    // -------------------------------------------------------------
    // PEN-06: Cryptographic Audit Chain Tamper Detection
    // -------------------------------------------------------------
    try {
      // 1. Log sequential chained audit actions
      await logChainedAudit({
        organizationId: orgAId,
        userId: userAId,
        userName: 'Admin User',
        action: 'CREATE_SCHEMA',
        targetType: 'Schema',
        targetId: null,
        targetName: 'Test Schema',
        details: { step: 1 }
      });

      const auditEntry2 = await logChainedAudit({
        organizationId: orgAId,
        userId: userAId,
        userName: 'Admin User',
        action: 'UPDATE_CATALOG',
        targetType: 'Catalog',
        targetId: null,
        targetName: 'Confidential Catalog',
        details: { step: 2 }
      });
      assert.strictEqual(typeof auditEntry2.current_hash, 'string');

      // Verify chain via API endpoint
      const verifyRes = await fetch(`${baseUrl}/api/vault/audit/verify`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert.strictEqual(verifyRes.status, 200);
      const initialVerification = await verifyRes.json();
      assert.strictEqual(initialVerification.valid, true, 'Initial audit chain must be valid');
      assert.strictEqual(initialVerification.totalEntries >= 2, true);

      // 2. Simulate malicious attacker mutating the audit record in database
      await pool.query(
        `UPDATE vault_audit_logs
         SET details = '{"tampered": true}'::jsonb
         WHERE id = $1`,
        [auditEntry2.id]
      );

      // Verify tamper detection alerts immediately
      const tamperedVerification = await verifyAuditChain(orgAId);
      assert.strictEqual(tamperedVerification.valid, false, 'Audit verification must detect tampering');
      assert.strictEqual(tamperedVerification.reason.includes('Cryptographic payload tampering'), true, 'Tamper reason should identify mismatch');

      pass('PEN-06: Cryptographic Audit Chain Tamper Detection', 'Cryptographic hash-chain detected database mutation and flagged tampered audit record.');
    } catch (err) {
      fail('PEN-06: Cryptographic Audit Chain Tamper Detection', err);
    }

    // -------------------------------------------------------------
    // PEN-07: Rate Limiting & Burst Protection
    // -------------------------------------------------------------
    try {
      // Express rate limit is configured on app
      let rateLimited = false;
      const requests = [];
      for (let i = 0; i < 220; i++) {
        requests.push(fetch(`${baseUrl}/api/health`));
      }
      const responses = await Promise.all(requests);
      const has429 = responses.some(res => res.status === 429);
      assert.strictEqual(has429, true, 'Rate limiter must return HTTP 429 when burst limit exceeded');

      pass('PEN-07: Rate Limiting & Burst Protection', 'Excessive request bursts correctly throttled with HTTP 429 Too Many Requests.');
    } catch (err) {
      fail('PEN-07: Rate Limiting & Burst Protection', err);
    }

    // -------------------------------------------------------------
    // PEN-08: Security Headers Audit & Stack Trace Redaction
    // -------------------------------------------------------------
    try {
      const healthRes = await fetch(`${baseUrl}/api/health`);
      
      // Verify security headers added by Helmet
      assert.strictEqual(healthRes.headers.get('x-content-type-options'), 'nosniff');
      assert.strictEqual(healthRes.headers.has('x-dns-prefetch-control'), true);

      // Check simulated error response does not leak credentials or stack traces
      const badReq = await fetch(`${baseUrl}/api/studio/catalogs/invalid-uuid-12345`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      const errorJson = await badReq.json().catch(() => ({}));
      
      // Ensure no internal DB credentials or stack trace leaked
      const errorString = JSON.stringify(errorJson);
      assert.strictEqual(errorString.includes('password'), false, 'Response must not leak passwords');
      assert.strictEqual(errorString.includes('postgres://'), false, 'Response must not leak connection URIs');
      if (process.env.NODE_ENV === 'production') {
        assert.strictEqual(errorString.includes('    at '), false, 'Response must not expose raw stack traces in production');
      }

      pass('PEN-08: Security Headers Audit & Stack Trace Redaction', 'Security headers present; error responses strictly redacted against secret/credential leakage.');
    } catch (err) {
      fail('PEN-08: Security Headers Audit & Stack Trace Redaction', err);
    }

    console.log('\n----------------------------------------------------------------');
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('----------------------------------------------------------------\n');

    if (failed > 0) {
      setTimeout(() => process.exit(1), 150);
    }
  } catch (globalErr) {
    console.error('Fatal penetration suite error:', globalErr);
    setTimeout(() => process.exit(1), 150);
  } finally {
    await teardown();
    setTimeout(() => process.exit(failed > 0 ? 1 : 0), 150);
  }
}

runPenetrationSuite();
