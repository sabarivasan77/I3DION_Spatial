import assert from 'node:assert/strict';
import { pool } from '../../src/db/pool.js';

function pass(testId, msg) {
  console.log(`  ✅ [${testId}] ${msg}`);
}

async function run() {
  console.log('\n--- Running Spatial Hub Phase H6 Test Suite (Quote Basket, RFQ, Leads, Flow) ---');

  // Fetch a product ID to attach to the quote
  const prodRes = await pool.query(`SELECT id, name FROM products WHERE is_public = true LIMIT 1`);
  const productId = prodRes.rows[0]?.id;
  const productName = prodRes.rows[0]?.name || 'Industrial Pump';

  const testIdempotencyKey = `test_rfq_${Date.now()}`;

  // 1. Valid RFQ Submission
  const validPayload = {
    name: 'Sarah Connor',
    email: 'sarah@skynet-defense.com',
    phone: '+1 555-0199',
    company: 'Resistance Tech Inc.',
    timeline: 'Immediate (< 30 days)',
    targetDelivery: 'Los Angeles, CA',
    message: 'Need 5 units with custom mounting brackets.',
    campaign: 'Phase H6 Integration Test',
    qrAttributed: true,
    idempotencyKey: testIdempotencyKey,
    items: [
      {
        productId,
        name: productName,
        quantity: 2,
        notes: 'High temperature seal variant'
      }
    ],
    consent: {
      consentGiven: true,
      consentText: 'I agree to be contacted regarding this quotation.'
    }
  };

  const res1 = await fetch('http://localhost:4000/api/hub/rfq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPayload)
  });

  assert.equal(res1.status, 201, `Valid RFQ should return 201 Created (got ${res1.status})`);
  const data1 = await res1.json();
  assert.equal(data1.success, true);
  assert.ok(data1.leadId, 'Lead ID must be generated');
  assert.ok(data1.whatsappDeepLink, 'WhatsApp deep-link must be generated');
  assert.ok(data1.whatsappDeepLink.includes('wa.me'), 'WhatsApp link must be properly formatted');
  pass('RFQ-SUBMIT-01', 'Valid RFQ submitted successfully with lead creation & WhatsApp link');

  // Verify in database: leads table
  const leadInDb = await pool.query(`SELECT * FROM leads WHERE id = $1`, [data1.leadId]);
  assert.equal(leadInDb.rows.length, 1, 'Lead must exist in leads table');
  const leadRow = leadInDb.rows[0];
  assert.equal(leadRow.email, 'sarah@skynet-defense.com');
  assert.equal(leadRow.source, 'Spatial Hub RFQ');
  assert.equal(leadRow.qr_attributed, true);
  assert.ok(leadRow.metadata.items.length === 1);
  pass('RFQ-DB-LEAD-01', 'Lead persisted in database with full metadata, consent, and attribution');

  // Verify in database: flow_event_outbox table
  const outboxEvents = await pool.query(
    `SELECT * FROM flow_event_outbox WHERE event_type = 'rfq.submitted' AND payload->>'leadId' = $1`,
    [data1.leadId]
  );
  assert.equal(outboxEvents.rows.length, 1, 'Outbox must contain rfq.submitted event');
  assert.equal(outboxEvents.rows[0].status, 'pending');
  pass('RFQ-FLOW-OUTBOX-01', 'Flow automation event (rfq.submitted) queued in transactional outbox');

  // 2. Idempotency Check (Duplicate network retry)
  const res2 = await fetch('http://localhost:4000/api/hub/rfq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPayload)
  });

  assert.equal(res2.status, 201, 'Idempotent resubmission returns 201 with duplicate status');
  const data2 = await res2.json();
  assert.equal(data2.isDuplicate, true, 'Must detect duplicate submission via idempotencyKey');
  assert.equal(data2.leadId, data1.leadId, 'Must return original leadId without duplicating');

  const countCheck = await pool.query(
    `SELECT count(*) FROM leads WHERE metadata->>'idempotencyKey' = $1`,
    [testIdempotencyKey]
  );
  assert.equal(parseInt(countCheck.rows[0].count, 10), 1, 'Must not create duplicate lead rows in database');
  pass('RFQ-IDEMPOTENCY-01', 'Idempotent submission handled cleanly without CRM pollution');

  // 3. Honeypot Anti-Spam Detection
  const botPayload = {
    ...validPayload,
    idempotencyKey: `bot_${Date.now()}`,
    hp_token: 'bot-auto-filled-content',
    email: 'spambot@auto-scrapers.net'
  };

  const resBot = await fetch('http://localhost:4000/api/hub/rfq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(botPayload)
  });

  assert.equal(resBot.status, 201, 'Bot receives silent success response');
  const botData = await resBot.json();
  assert.equal(botData.status, 'filtered', 'Status indicates spam filtered internally');
  assert.equal(botData.leadId, 'spam-filtered');

  const botCheck = await pool.query(`SELECT count(*) FROM leads WHERE email = $1`, ['spambot@auto-scrapers.net']);
  assert.equal(parseInt(botCheck.rows[0].count, 10), 0, 'Spam bots must never pollute database leads table');
  pass('RFQ-BOT-TRAP-01', 'Honeypot trap successfully neutralizes automated bot spam submissions');

  // 4. Missing Consent Validation (Must Fail Closed)
  const noConsentPayload = {
    ...validPayload,
    idempotencyKey: `no_consent_${Date.now()}`,
    consent: { consentGiven: false }
  };

  const resConsent = await fetch('http://localhost:4000/api/hub/rfq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noConsentPayload)
  });

  assert.equal(resConsent.status, 400, 'Submission without consent must return 400');
  pass('RFQ-CONSENT-01', 'Explicit consent mandatory gate verified');

  // 5. Empty Basket Validation (Must Fail Closed)
  const emptyBasketPayload = {
    ...validPayload,
    idempotencyKey: `empty_${Date.now()}`,
    items: []
  };

  const resEmpty = await fetch('http://localhost:4000/api/hub/rfq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emptyBasketPayload)
  });

  assert.equal(resEmpty.status, 400, 'Submission with empty basket must return 400');
  pass('RFQ-EMPTY-01', 'Empty basket rejection verified');

  console.log('\n✅ All Phase H6 integration tests passed successfully!\n');
  await pool.end();
}

run()
  .catch((err) => {
    console.error('\n❌ Phase H6 test failed:', err);
    process.exit(1);
  });
