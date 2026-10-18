import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../../src/db/pool.js';
import { config } from '../../src/config.js';
import { isSafeDestinationUrl, signWebhookPayload } from '../../src/services/flow/outboxDispatcher.js';

const BASE_URL = 'http://localhost:4000/api';

async function runPhase4Tests() {
  console.log('================================================================');
  console.log('⚡ I3DION Flow: Phase 4 Actions, Connectors & Outbox Test Suite');
  console.log('================================================================\n');

  const orgId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  // Ensure table schema has latest columns
  await pool.query(`
    ALTER TABLE flow_event_outbox ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
    ALTER TABLE flow_event_outbox ADD COLUMN IF NOT EXISTS last_error text;
    ALTER TABLE flow_event_outbox ADD COLUMN IF NOT EXISTS destination_url text;
    ALTER TABLE flow_event_outbox ADD COLUMN IF NOT EXISTS response_status integer;
  `);

  // 1. Fixture: Setup Org and User
  await pool.query(
    `INSERT INTO organizations (id, name, slug) VALUES ($1, 'Phase 4 Test Org', $2) ON CONFLICT DO NOTHING`,
    [orgId, `p4-org-${Date.now()}`]
  );
  await pool.query(
    `INSERT INTO users (id, organization_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'Phase 4 Engineer', 'Admin', 'hash_test') ON CONFLICT DO NOTHING`,
    [userId, orgId, `p4-eng-${Date.now()}@domain.com`]
  );

  const token = jwt.sign(
    { sub: userId, userId, organization_id: orgId, role: 'Admin', email: `p4-eng@domain.com` },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  async function request(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${data.error || res.statusText}`);
    }
    return data;
  }

  let passed = 0;
  function recordPass(name, detail) {
    passed++;
    console.log(`✅ [PASS] ${name}`);
    if (detail) console.log(`   ${detail}`);
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Condition Branching (True Branch Taken, False Branch Skipped)
    // -------------------------------------------------------------------------
    console.log('--- TEST 1 & 2: Condition Branching & Selective Step Skipping ---');
    const nodes = [
      {
        id: 'trigger_1',
        type: 'customFlowNode',
        data: {
          label: '3D RFQ Submitted',
          type: 'trigger_event',
          category: 'trigger',
          params: { eventName: 'rfq_submitted' },
        },
      },
      {
        id: 'cond_dwell',
        type: 'customFlowNode',
        data: {
          label: 'Evaluate Dwell Threshold',
          type: 'condition',
          category: 'logic',
          params: {
            leftOperand: 'trigger.dwellDurationSeconds',
            operator: 'greater_than',
            rightOperand: 60,
          },
        },
      },
      {
        id: 'act_vip_lead',
        type: 'customFlowNode',
        data: {
          label: 'Create VIP Lead',
          type: 'crm_create_lead',
          category: 'ecosystem',
          params: {
            name: '{{trigger.contact.name}}',
            email: '{{trigger.contact.email}}',
            company: '{{trigger.contact.company}}',
            leadStatus: 'VIP',
            scoreDelta: 95,
          },
        },
      },
      {
        id: 'act_send_spec',
        type: 'customFlowNode',
        data: {
          label: 'Dispatch Spec Email',
          type: 'send_email',
          category: 'communication',
          params: {
            to: '{{trigger.contact.email}}',
            subject: 'VIP Spec Sheet: {{trigger.productName}}',
            body: 'Hello {{trigger.contact.name}}, your 3D engineering specifications for {{trigger.productName}} are attached.',
          },
        },
      },
      {
        id: 'act_standard_lead',
        type: 'customFlowNode',
        data: {
          label: 'Standard Inbound Lead',
          type: 'crm_create_lead',
          category: 'ecosystem',
          params: {
            name: '{{trigger.contact.name}}',
            email: '{{trigger.contact.email}}',
            leadStatus: 'Normal',
            scoreDelta: 30,
          },
        },
      },
    ];

    const edges = [
      { id: 'e1', source: 'trigger_1', target: 'cond_dwell' },
      { id: 'e2', source: 'cond_dwell', sourceHandle: 'condition_true', target: 'act_vip_lead' },
      { id: 'e3', source: 'act_vip_lead', target: 'act_send_spec' },
      { id: 'e4', source: 'cond_dwell', sourceHandle: 'condition_false', target: 'act_standard_lead' },
    ];

    const flowCreateRes = await request('/flows', {
      method: 'POST',
      body: JSON.stringify({
        name: '3D Spatial Lead Qualification Engine',
        description: 'Evaluates viewer dwell time and routes VIPs vs Standard prospects.',
        triggerType: 'trigger_event',
        triggerConfig: { eventName: 'rfq_submitted' },
        flowDefinition: {
          schemaVersion: '1.0.0',
          trigger: { id: 'trigger_1', type: 'trigger_event', config: { eventName: 'rfq_submitted' } },
          nodes,
          edges,
          variables: [],
          settings: { concurrency: 5, timeoutSeconds: 60, retentionDays: 30 },
        },
      }),
    });

    const flowId = flowCreateRes.flow.id;

    // Run A: Dwell Time 140s (> 60s) -> True Branch
    const runHighDwellRes = await request(`/flows/${flowId}/trigger`, {
      method: 'POST',
      body: JSON.stringify({
        eventName: 'rfq_submitted',
        productName: 'Cryogenic Valve Assembly X-200',
        dwellDurationSeconds: 140,
        contact: {
          name: 'Marcus Vance',
          email: 'marcus.vance@cryocorp.com',
          company: 'CryoCorp Technologies',
        },
      }),
    });

    const stepsHigh = runHighDwellRes.run.step_results;
    const condStep = stepsHigh.find((s) => s.nodeId === 'cond_dwell');
    const vipStep = stepsHigh.find((s) => s.nodeId === 'act_vip_lead');
    const emailStep = stepsHigh.find((s) => s.nodeId === 'act_send_spec');
    const standardStep = stepsHigh.find((s) => s.nodeId === 'act_standard_lead');

    assert.equal(condStep.output.conditionMet, true, 'Condition should evaluate true for 140 > 60');
    assert.equal(vipStep.status, 'succeeded', 'VIP lead step should succeed on true branch');
    assert.equal(emailStep.status, 'succeeded', 'Email dispatch should succeed on true branch');
    assert.equal(standardStep.status, 'skipped', 'Standard lead step should be skipped on true branch');
    recordPass('TEST 1: Condition True Branch Execution & Selective Pruning', 'VIP path executed (140s > 60s), False branch cleanly skipped.');

    // Run B: Dwell Time 25s (< 60s) -> False Branch
    const runLowDwellRes = await request(`/flows/${flowId}/trigger`, {
      method: 'POST',
      body: JSON.stringify({
        eventName: 'rfq_submitted',
        productName: 'Cryogenic Valve Assembly X-200',
        dwellDurationSeconds: 25,
        contact: {
          name: 'Junior Buyer',
          email: 'junior@smallshop.com',
          company: 'Small Shop Ltd',
        },
      }),
    });

    const stepsLow = runLowDwellRes.run.step_results;
    const condStepB = stepsLow.find((s) => s.nodeId === 'cond_dwell');
    const vipStepB = stepsLow.find((s) => s.nodeId === 'act_vip_lead');
    const emailStepB = stepsLow.find((s) => s.nodeId === 'act_send_spec');
    const standardStepB = stepsLow.find((s) => s.nodeId === 'act_standard_lead');

    assert.equal(condStepB.output.conditionMet, false, 'Condition should evaluate false for 25 > 60');
    assert.equal(vipStepB.status, 'skipped', 'VIP lead step should be skipped on false branch');
    assert.equal(emailStepB.status, 'skipped', 'Email spec step should be skipped on false branch');
    assert.equal(standardStepB.status, 'succeeded', 'Standard lead step should execute on false branch');
    recordPass('TEST 2: Condition False Branch Execution & Selective Pruning', 'Standard path executed (25s < 60s), VIP path cleanly skipped.');

    // -------------------------------------------------------------------------
    // TEST 3: Token Resolution & Dynamic Merge Tags
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Dynamic Context Variable & Chip Substitution ---');
    assert.equal(
      emailStep.output.subject,
      'VIP Spec Sheet: Cryogenic Valve Assembly X-200',
      'Dynamic token in subject must be substituted'
    );
    assert.equal(
      emailStep.output.recipient,
      'marcus.vance@cryocorp.com',
      'Dynamic token in recipient must be substituted'
    );
    recordPass('TEST 3: Dynamic Context Variable Interpolation', 'Resolved {{trigger.productName}} and {{trigger.contact.email}}');

    // -------------------------------------------------------------------------
    // TEST 4: PostgreSQL CRM Lead Table Integration
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: CRM Leads Table Persistence & Priority Scoring ---');
    const leadDbRes = await pool.query(
      `SELECT * FROM leads WHERE email = $1 AND organization_id = $2`,
      ['marcus.vance@cryocorp.com', orgId]
    );
    assert.equal(leadDbRes.rows.length, 1, 'Lead should be persisted in leads table');
    const leadRow = leadDbRes.rows[0];
    assert.equal(leadRow.priority, 'VIP');
    assert.equal(leadRow.status, 'Qualified');
    assert.equal(leadRow.score, 95);
    recordPass('TEST 4: CRM Leads Table Persistence', `Lead "${leadRow.name}" saved with VIP priority and score 95`);

    // -------------------------------------------------------------------------
    // TEST 5: PDF Spec Sheet Generator Action
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: 3D PDF Specification Sheet Generation ---');
    const specFlowRes = await request('/flows', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Auto Spec Sheet Workflow',
        triggerType: 'trigger_manual',
        flowDefinition: {
          schemaVersion: '1.0.0',
          trigger: { id: 't1', type: 'trigger_manual' },
          nodes: [
            { id: 't1', type: 'trigger_manual', data: { label: 'Manual Trigger', type: 'trigger_manual' } },
            {
              id: 'spec_1',
              type: 'pdf_spec_generator',
              data: {
                label: 'Generate Spec Sheet',
                type: 'pdf_spec_generator',
                params: { productName: 'Turbine Impeller Titanium Pro', sku: 'IMP-TITAN-001' },
              },
            },
          ],
          edges: [{ id: 'e1', source: 't1', target: 'spec_1' }],
          variables: [],
          settings: { concurrency: 5, timeoutSeconds: 60, retentionDays: 30 },
        },
      }),
    });

    const specRunRes = await request(`/flows/${specFlowRes.flow.id}/trigger`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const specStep = specRunRes.run.step_results.find((s) => s.nodeId === 'spec_1');
    assert.ok(specStep, 'Spec step must exist');
    assert.equal(specStep.status, 'succeeded');
    assert.ok(specStep.output.downloadUrl.includes('.pdf'), 'Must generate a downloadable PDF URL');
    assert.ok(specStep.output.metadata.dimensions, 'Must include technical dimensions');
    recordPass('TEST 5: 3D Product PDF Spec Sheet Generator', `Generated spec sheet: ${specStep.output.downloadUrl}`);

    // -------------------------------------------------------------------------
    // TEST 6: In-App Notification Creation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: In-App Notification Center Integration ---');
    const notifFlowRes = await request('/flows', {
      method: 'POST',
      body: JSON.stringify({
        name: 'In-App Alert Flow',
        triggerType: 'trigger_manual',
        flowDefinition: {
          schemaVersion: '1.0.0',
          trigger: { id: 't1', type: 'trigger_manual' },
          nodes: [
            { id: 't1', type: 'trigger_manual', data: { label: 'Manual Trigger', type: 'trigger_manual' } },
            {
              id: 'notif_1',
              type: 'send_notification',
              data: {
                label: 'Notify Team',
                type: 'send_notification',
                params: {
                  title: 'High-Value Inbound Lead Detected',
                  body: 'A prospect from CryoCorp examined the assembly for 140 seconds.',
                },
              },
            },
          ],
          edges: [{ id: 'e1', source: 't1', target: 'notif_1' }],
          variables: [],
          settings: { concurrency: 5, timeoutSeconds: 60, retentionDays: 30 },
        },
      }),
    });

    const notifRunRes = await request(`/flows/${notifFlowRes.flow.id}/trigger`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const notifDbRes = await pool.query(
      `SELECT * FROM notifications WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [orgId]
    );
    assert.ok(notifDbRes.rows.length >= 1, 'Notification must be inserted in notifications table');
    assert.equal(notifDbRes.rows[0].title, 'High-Value Inbound Lead Detected');
    recordPass('TEST 6: In-App Notification Delivery', `Notification saved in database (ID: ${notifDbRes.rows[0].id})`);

    // -------------------------------------------------------------------------
    // TEST 7: SSRF Security Guard & Outbox Dispatcher
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Outbox Dispatcher & SSRF Attack Mitigation ---');
    // Test SSRF Guard directly on private ranges
    assert.equal(isSafeDestinationUrl('http://localhost:3000/webhook'), false, 'Must block localhost');
    assert.equal(isSafeDestinationUrl('http://127.0.0.1:8080/exploit'), false, 'Must block 127.0.0.1');
    assert.equal(isSafeDestinationUrl('http://10.0.0.5/internal-api'), false, 'Must block 10.0.0.0/8');
    assert.equal(isSafeDestinationUrl('http://192.168.1.1/admin'), false, 'Must block 192.168.0.0/16');
    assert.equal(isSafeDestinationUrl('http://169.254.169.254/latest/meta-data/'), false, 'Must block AWS metadata');
    assert.equal(isSafeDestinationUrl('https://api.hubspot.com/v1/webhook'), true, 'Must allow public HTTPS webhook');

    // Enqueue an SSRF attack in outbox and verify it is rejected
    await pool.query(
      `INSERT INTO flow_event_outbox (organization_id, event_type, payload, destination_url, status)
       VALUES ($1, 'malicious_webhook', '{"test": 1}'::jsonb, 'http://169.254.169.254/latest/meta-data/', 'pending')`,
      [orgId]
    );

    // Enqueue an internal local event without destination_url (should be marked delivered)
    await pool.query(
      `INSERT INTO flow_event_outbox (organization_id, event_type, payload, destination_url, status)
       VALUES ($1, 'internal_event', '{"test": 2}'::jsonb, null, 'pending')`,
      [orgId]
    );

    // Process outbox batch
    const outboxBatchRes = await request('/flows/outbox/process', {
      method: 'POST',
      body: JSON.stringify({ limit: 10 }),
    });

    assert.ok(outboxBatchRes.summary.processedCount >= 2, 'Should process both items');
    assert.ok(outboxBatchRes.summary.deliveredCount >= 1, 'Internal event delivered');
    assert.ok(outboxBatchRes.summary.failedCount >= 1, 'SSRF attack rejected');

    const rejectedRow = await pool.query(
      `SELECT * FROM flow_event_outbox WHERE destination_url = 'http://169.254.169.254/latest/meta-data/'`
    );
    assert.equal(rejectedRow.rows[0].status, 'rejected');
    assert.ok(rejectedRow.rows[0].last_error.includes('SSRF Guard'));
    recordPass('TEST 7: SSRF Protection & Outbox Processing', 'Blocked AWS metadata SSRF attack; internal event delivered.');

    // -------------------------------------------------------------------------
    // TEST 8: 3D Spatial Event Ingestion Listener
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: 3D Spatial Event Ingestion & Auto-Execution ---');
    // Publish the lead qualification flow so it is actively listening
    await request(`/flows/${flowId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ changeSummary: 'Published for spatial listener test' }),
    });

    // Ingest a spatial event from 3D Engine
    const spatialIngestRes = await request('/flows/events/spatial', {
      method: 'POST',
      body: JSON.stringify({
        eventType: 'rfq_submitted',
        sourceApp: 'engine',
        payload: {
          productName: 'Autonomous Hydraulic Actuator',
          dwellDurationSeconds: 150,
          contact: {
            name: 'Elena Rostova',
            email: 'elena.rostova@aerospace.org',
            company: 'Global Aerospace Consortium',
          },
        },
      }),
    });

    assert.equal(spatialIngestRes.success, true);
    assert.ok(spatialIngestRes.triggeredFlowsCount >= 1, 'Should trigger at least 1 matching published flow');
    assert.ok(spatialIngestRes.flowRunIds.length >= 1, 'Must return generated flowRunIds');
    recordPass(
      'TEST 8: 3D Spatial Event Ingestion & Auto-Execution',
      `Auto-triggered ${spatialIngestRes.triggeredFlowsCount} flow run(s) from "rfq_submitted" event`
    );

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passed} OF 8 PHASE 4 ACTION & CONNECTOR TESTS PASSED (100%)!`);
    console.log('================================================================\n');
  } finally {
    await pool.end();
  }
}

runPhase4Tests().catch((err) => {
  console.error('\n❌ Phase 4 Test Suite Failed:', err);
  pool.end();
  process.exit(1);
});
