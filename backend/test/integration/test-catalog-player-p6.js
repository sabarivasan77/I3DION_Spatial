/**
 * Phase P6 Integration Test Suite: Catalog Player PWA, Non-Enumerable QR & RFQ Engine
 * Verification Coverage:
 *  - PLAYER-01: Non-enumerable QR link generation (>= 96 bits entropy) & printable QR sheet export.
 *  - PLAYER-02: Server-side audience filtering: public link returns 200 without dealer prices or internal notes.
 *  - PLAYER-03: Password protection: protected link rejects unauthenticated/wrong password, accepts correct password.
 *  - PLAYER-04: Link expiration: expired link returns HTTP 410 Gone.
 *  - PLAYER-05: Non-existent short code returns HTTP 404 (enumeration resistance).
 *  - PLAYER-06: RFQ submission with honeypot bot check rejection & idempotency deduplication on offline reconnect.
 *  - PLAYER-07: Transactional Flow Outbox verification ('lead.created' enqueued into flow_event_outbox).
 *  - PLAYER-08: Telemetry attribution ('QR-attributed visit' metric logged on visit).
 */

import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { app } from '../../src/server.js';
import { pool, query, ensureMigrated } from '../../src/db/pool.js';
import { config } from '../../src/config.js';
import { playerService } from '../../src/services/player/playerService.js';

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
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
}

console.log('================================================================');
console.log('📱 I3DION Phase P6: Catalog Player PWA, Non-Enumerable QR & RFQ Suite');
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

async function runPlayerTestSuite() {
  const testOrgId = '66666666-6666-4666-8666-666666666666';
  const adminUserId = 'aaaa6666-6666-4666-8666-666666666666';
  const testCatalogId = '77777777-7777-4777-8777-777777777777';

  // 0. Seed test organization, user and sample catalog
  await query(`DELETE FROM catalog_links WHERE organization_id = $1`, [testOrgId]);
  await query(`DELETE FROM leads WHERE organization_id = $1`, [testOrgId]);
  await query(`DELETE FROM flow_event_outbox WHERE organization_id = $1`, [testOrgId]);
  await query(`DELETE FROM catalogs WHERE organization_id = $1`, [testOrgId]);
  await query(`DELETE FROM organization_members WHERE organization_id = $1`, [testOrgId]);
  await query(`DELETE FROM users WHERE organization_id = $1`, [testOrgId]);
  await query(`DELETE FROM organizations WHERE id = $1`, [testOrgId]);

  await query(`INSERT INTO organizations (id, name) VALUES ($1, 'Turbo Dynamics Ltd')`, [testOrgId]);

  await query(
    `INSERT INTO users (id, email, password_hash, name, role, organization_id, token_version)
     VALUES ($1, 'admin@turbodynamics.test', 'argon2id$mock', 'Chief Engineer', 'Admin', $2, 0)`,
    [adminUserId, testOrgId]
  );

  await query(
    `INSERT INTO organization_members (organization_id, user_id, role)
     VALUES ($1, $2, 'Admin')`,
    [testOrgId, adminUserId]
  );

  const adminToken = createToken({
    id: adminUserId,
    userId: adminUserId,
    email: 'admin@turbodynamics.test',
    role: 'Admin',
    organization_id: testOrgId,
    token_version: 0
  });

  const catalogSnapshot = {
    schema: 'i3dion.catalog/1',
    meta: {
      name: 'Industrial Turbo Systems 2027',
      slug: 'turbo-systems-2027'
    },
    theme: {
      preset: 'industrial-light',
      primary: '#2563EB'
    },
    pages: [
      {
        id: 'overview',
        title: 'Commercial Turbochargers',
        items: [
          {
            id: 'turbo-v8-marine',
            name: 'Marine Turbocharger V8-Spec',
            list_price: 34500,
            dealer_price: 19800,
            wholesale_price: 17500,
            cost_margin: 0.46,
            internal_notes: 'RESTRICTED: Manufacturing margin target is 46%',
            public_specs: {
              displacement_liters: 16.0,
              max_rpm: 85000,
              compression_ratio: '3.4:1'
            }
          }
        ]
      }
    ]
  };

  await query(
    `INSERT INTO catalogs (id, organization_id, name, slug, published_snapshot, status)
     VALUES ($1, $2, $3, $4, $5, 'Published')`,
    [
      testCatalogId,
      testOrgId,
      'Industrial Turbo Systems 2027',
      'turbo-systems-2027',
      JSON.stringify(catalogSnapshot)
    ]
  );

  let publicLink;
  let protectedLink;
  let expiredLink;

  // --------------------------------------------------------------------------
  // PLAYER-01: Non-enumerable QR Link Generation & Vector Print Sheet Export
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${baseUrl}/api/player/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        catalogId: testCatalogId,
        label: 'Hannover Messe 2027 Booth A4',
        campaign: 'HannoverExpo2027',
        audienceRole: 'public'
      })
    });

    assert.strictEqual(res.status, 201, 'Should create link with status 201');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.link.short_code, 'Short code must be present');

    // Verify entropy: 18 base64url characters = 108 bits of entropy (exceeds >= 96 bits requirement)
    assert.ok(data.link.short_code.length >= 18, 'Short code length must be >= 18 chars');
    const base64UrlPattern = /^[A-Za-z0-9_-]{18,}$/;
    assert.ok(base64UrlPattern.test(data.link.short_code), 'Short code must match base64url format');

    assert.ok(data.link.qr_svg.includes('<svg'), 'QR SVG must be a valid SVG string');
    assert.ok(data.link.qr_png_url.startsWith('data:image/png;base64,'), 'QR PNG Data URL must be valid');

    publicLink = data.link;

    // Test print sheet layout endpoint
    const printRes = await fetch(`${baseUrl}/api/player/links/${publicLink.short_code}/print-sheet`);
    assert.strictEqual(printRes.status, 200, 'Print sheet must return 200');
    const printData = await printRes.json();
    assert.strictEqual(printData.success, true);
    assert.ok(printData.sheet.svgHtml.includes('HannoverExpo2027'), 'Print sheet must include campaign label');
    assert.ok(printData.sheet.svgHtml.includes('<svg'), 'Print sheet must contain SVG barcode');

    pass('PLAYER-01', `Generated 108-bit non-enumerable QR link "${publicLink.short_code}" with vector print sheet`);
  } catch (err) {
    fail('PLAYER-01', err);
  }

  // --------------------------------------------------------------------------
  // PLAYER-02: Server-Side Audience Filtering (Zero Price/Margin Leakage)
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${baseUrl}/api/player/public/q/${publicLink.short_code}`);
    assert.strictEqual(res.status, 200, 'Public player lookup must return 200');
    const data = await res.json();

    assert.strictEqual(data.success, true);
    assert.strictEqual(data.requiresPassword, false);
    assert.strictEqual(data.audienceRole, 'public');

    const networkResponseStr = JSON.stringify(data);

    // Verify public product attributes are delivered
    assert.ok(networkResponseStr.includes('Marine Turbocharger V8-Spec'), 'Public product name must be present');
    assert.ok(networkResponseStr.includes('list_price'), 'List price must be present');
    assert.ok(networkResponseStr.includes('34500'), 'List price value must be present');
    assert.ok(networkResponseStr.includes('displacement_liters'), 'Public specs must be present');

    // CRITICAL SECURITY ASSERTION: Internal margins and dealer prices MUST NEVER LEAK into network payload
    assert.strictEqual(networkResponseStr.includes('dealer_price'), false, 'dealer_price leaked in network response!');
    assert.strictEqual(networkResponseStr.includes('19800'), false, 'Dealer price value 19800 leaked in network response!');
    assert.strictEqual(networkResponseStr.includes('wholesale_price'), false, 'wholesale_price leaked in network response!');
    assert.strictEqual(networkResponseStr.includes('17500'), false, 'Wholesale price leaked in network response!');
    assert.strictEqual(networkResponseStr.includes('cost_margin'), false, 'cost_margin leaked in network response!');
    assert.strictEqual(networkResponseStr.includes('0.46'), false, 'Cost margin leaked in network response!');
    assert.strictEqual(networkResponseStr.includes('internal_notes'), false, 'internal_notes leaked in network response!');
    assert.strictEqual(networkResponseStr.includes('RESTRICTED'), false, 'Internal notes leaked in network response!');

    pass('PLAYER-02', 'Server-side audience filter completely stripped dealer prices, margins & internal notes');
  } catch (err) {
    fail('PLAYER-02', err);
  }

  // --------------------------------------------------------------------------
  // PLAYER-03: Password Protection (Fail-Closed Auth & Verification)
  // --------------------------------------------------------------------------
  try {
    const resLink = await fetch(`${baseUrl}/api/player/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        catalogId: testCatalogId,
        label: 'Confidential OEM Pricing Link',
        campaign: 'DealerPortalQ3',
        audienceRole: 'dealer',
        password: 'TurboSecretPassword2027!'
      })
    });
    assert.strictEqual(resLink.status, 201);
    const linkData = await resLink.json();
    protectedLink = linkData.link;

    // 1. Initial request without password should prompt for password and NOT return catalog data
    const resNoPass = await fetch(`${baseUrl}/api/player/public/q/${protectedLink.short_code}`);
    assert.strictEqual(resNoPass.status, 200);
    const dataNoPass = await resNoPass.json();
    assert.strictEqual(dataNoPass.requiresPassword, true);
    assert.strictEqual(dataNoPass.catalog, undefined, 'Catalog payload must NOT be returned without password');

    // 2. Verification request with wrong password should return HTTP 401
    const resWrongPass = await fetch(`${baseUrl}/api/player/public/q/${protectedLink.short_code}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'WrongPassword123' })
    });
    assert.strictEqual(resWrongPass.status, 401, 'Wrong password must be rejected with 401');

    // 3. Verification request with correct password should return HTTP 200 and catalog payload
    const resCorrectPass = await fetch(`${baseUrl}/api/player/public/q/${protectedLink.short_code}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'TurboSecretPassword2027!' })
    });
    assert.strictEqual(resCorrectPass.status, 200, 'Correct password must succeed with 200');
    const dataCorrectPass = await resCorrectPass.json();
    assert.strictEqual(dataCorrectPass.requiresPassword, false);
    assert.ok(dataCorrectPass.catalog, 'Catalog payload must be present after password verification');

    pass('PLAYER-03', 'Password-protected link rejected missing/invalid password and unlocked with valid password');
  } catch (err) {
    fail('PLAYER-03', err);
  }

  // --------------------------------------------------------------------------
  // PLAYER-04: Link Expiration (HTTP 410 Gone)
  // --------------------------------------------------------------------------
  try {
    const expiredDate = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour in the past
    const resLink = await fetch(`${baseUrl}/api/player/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        catalogId: testCatalogId,
        label: 'Flash Sale (Expired)',
        campaign: 'FlashPromo2026',
        expiresAt: expiredDate
      })
    });
    assert.strictEqual(resLink.status, 201);
    const linkData = await resLink.json();
    expiredLink = linkData.link;

    const res = await fetch(`${baseUrl}/api/player/public/q/${expiredLink.short_code}`);
    assert.strictEqual(res.status, 410, 'Expired link must return HTTP 410 Gone');
    const errData = await res.json();
    assert.ok(errData.message.toLowerCase().includes('expired'), 'Error message must specify expiration');

    pass('PLAYER-04', 'Expired catalog link returned HTTP 410 Gone');
  } catch (err) {
    fail('PLAYER-04', err);
  }

  // --------------------------------------------------------------------------
  // PLAYER-05: Non-Existent Short Code (Enumeration Resistance HTTP 404)
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${baseUrl}/api/player/public/q/nonexistent_code_xyz999`);
    assert.strictEqual(res.status, 404, 'Non-existent short code must return HTTP 404');
    const errData = await res.json();
    assert.ok(errData.message.toLowerCase().includes('not found'), 'Error message must indicate not found');

    pass('PLAYER-05', 'Non-existent short code rejected with HTTP 404');
  } catch (err) {
    fail('PLAYER-05', err);
  }

  // --------------------------------------------------------------------------
  // PLAYER-06: RFQ Submission, Honeypot Anti-Bot & Idempotency Deduplication
  // --------------------------------------------------------------------------
  let rfqLeadId;
  try {
    // 1. Honeypot Bot Rejection
    const botRes = await fetch(`${baseUrl}/api/player/public/rfq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shortCode: publicLink.short_code,
        name: 'Automated Bot',
        email: 'bot@spamnetwork.com',
        botCheck: 'i_am_a_bot_field_filled' // Honeypot trigger
      })
    });
    assert.strictEqual(botRes.status, 400, 'Honeypot bot submission must be rejected with HTTP 400');

    // 2. First Valid RFQ Submission with Idempotency Key (e.g. from offline PWA queue)
    const idempotencyKey = 'offline-rfq-sync-id-998877';
    const rfqRes = await fetch(`${baseUrl}/api/player/public/rfq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shortCode: publicLink.short_code,
        name: 'Vikram Mehta',
        email: 'vikram@coastalshipping.in',
        phone: '+91 94440 12345',
        company: 'Coastal Shipping Corp',
        idempotencyKey,
        items: [
          { id: 'turbo-v8-marine', quantity: 4, notes: 'Includes flange mounting kit' }
        ],
        message: 'Need urgent quote for 4 units with marine class certificates'
      })
    });

    assert.strictEqual(rfqRes.status, 201, 'Valid RFQ submission must return 201');
    const rfqData = await rfqRes.json();
    assert.strictEqual(rfqData.success, true);
    assert.strictEqual(rfqData.isDuplicate, false);
    assert.ok(rfqData.leadId, 'Lead ID must be generated');
    rfqLeadId = rfqData.leadId;

    // Verify DB lead insertion
    const dbLead = await query(`SELECT * FROM leads WHERE id = $1`, [rfqLeadId]);
    assert.strictEqual(dbLead.rows.length, 1);
    assert.strictEqual(dbLead.rows[0].email, 'vikram@coastalshipping.in');
    assert.strictEqual(dbLead.rows[0].status, 'New');
    assert.strictEqual(dbLead.rows[0].qr_attributed, true);

    // 3. Duplicate Re-transmission (Simulating PWA offline reconnect retry)
    const dupRes = await fetch(`${baseUrl}/api/player/public/rfq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shortCode: publicLink.short_code,
        name: 'Vikram Mehta',
        email: 'vikram@coastalshipping.in',
        idempotencyKey,
        items: [{ id: 'turbo-v8-marine', quantity: 4 }]
      })
    });

    assert.strictEqual(dupRes.status, 201, 'Idempotent duplicate must succeed');
    const dupData = await dupRes.json();
    assert.strictEqual(dupData.isDuplicate, true, 'isDuplicate flag must be true');
    assert.strictEqual(dupData.leadId, rfqLeadId, 'Must return the same original leadId');

    // Confirm database still contains EXACTLY ONE lead record
    const allLeadsForSync = await query(
      `SELECT count(*)::int as count FROM leads WHERE metadata->>'idempotencyKey' = $1`,
      [idempotencyKey]
    );
    assert.strictEqual(allLeadsForSync.rows[0].count, 1, 'Database must have exactly 1 lead despite multiple reconnect syncs');

    pass('PLAYER-06', `RFQ captured lead ${rfqLeadId}, rejected honeypot bot, and deduplicated offline reconnect idempotently`);
  } catch (err) {
    fail('PLAYER-06', err);
  }

  // --------------------------------------------------------------------------
  // PLAYER-07: Transactional Flow Outbox Verification
  // --------------------------------------------------------------------------
  try {
    const outboxRes = await query(
      `SELECT * FROM flow_event_outbox WHERE organization_id = $1 AND event_type = 'lead.created' ORDER BY created_at DESC LIMIT 1`,
      [testOrgId]
    );
    assert.strictEqual(outboxRes.rows.length, 1, 'Flow outbox event must be enqueued');
    const event = outboxRes.rows[0];

    assert.strictEqual(event.status, 'pending');
    const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
    assert.strictEqual(payload.leadId, rfqLeadId);
    assert.strictEqual(payload.email, 'vikram@coastalshipping.in');
    assert.strictEqual(payload.campaign, 'HannoverExpo2027');
    assert.strictEqual(payload.itemsCount, 1);

    pass('PLAYER-07', 'Enqueued transactional "lead.created" event into Flow Outbox for automated sales alert');
  } catch (err) {
    fail('PLAYER-07', err);
  }

  // --------------------------------------------------------------------------
  // PLAYER-08: Telemetry Attribution ("QR-attributed visit" metric logged)
  // --------------------------------------------------------------------------
  try {
    const linkRes = await query(`SELECT visits_count FROM catalog_links WHERE id = $1`, [publicLink.id]);
    assert.ok(linkRes.rows[0].visits_count >= 1, 'Link visits_count must be incremented');

    const eventRes = await query(
      `SELECT * FROM analytics_events WHERE organization_id = $1 AND metadata->>'attributionMetric' = 'QR-attributed visit'`,
      [testOrgId]
    );
    assert.ok(eventRes.rows.length >= 1, 'Telemetry must log "QR-attributed visit" event');
    assert.strictEqual(eventRes.rows[0].event_type, 'catalog.viewed');

    pass('PLAYER-08', `Attribution verified: ${linkRes.rows[0].visits_count} visits and "QR-attributed visit" logged in analytics`);
  } catch (err) {
    fail('PLAYER-08', err);
  }

  // Final summary
  console.log('\n================================================================');
  console.log(`Test Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

async function main() {
  try {
    await setup();
    await runPlayerTestSuite();
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await teardown();
    process.exit(0);
  }
}

main();
