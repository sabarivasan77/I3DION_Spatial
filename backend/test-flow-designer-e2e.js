import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool } from './src/db/pool.js';
import { config } from './src/config.js';

const BASE_URL = 'http://localhost:4000/api';

async function runDesignerE2ETest() {
  console.log('================================================================');
  console.log('🎨 I3DION Flow: Phase 3 Designer End-to-End Verification Test');
  console.log('================================================================\n');

  const orgId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  // 1. Ensure test org and user exist in DB
  await pool.query(
    `INSERT INTO organizations (id, name, slug) VALUES ($1, 'Designer Test Org', $2) ON CONFLICT DO NOTHING`,
    [orgId, `designer-org-${Date.now()}`]
  );
  await pool.query(
    `INSERT INTO users (id, organization_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'Designer Engineer', 'Admin', 'hash_test') ON CONFLICT DO NOTHING`,
    [userId, orgId, `designer-${Date.now()}@domain.com`]
  );

  const token = jwt.sign(
    { sub: userId, userId, organization_id: orgId, role: 'Admin', email: `designer-${Date.now()}@domain.com` },
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

  try {
    // Test 1: Create a flow representing the "3D RFQ Lead Scoring" template
    console.log('1. Creating 3D RFQ workflow with 5 nodes in DAG...');
    const templateNodes = [
      {
        id: 't1',
        type: 'customFlowNode',
        position: { x: 260, y: 60 },
        data: {
          label: '3D Spatial Event: RFQ',
          type: 'trigger_event',
          category: 'trigger',
          params: { eventName: 'rfq_submitted', appKey: 'engine' },
        },
      },
      {
        id: 'c1',
        type: 'customFlowNode',
        position: { x: 260, y: 200 },
        data: {
          label: 'Evaluate Dwell Time',
          type: 'condition',
          category: 'logic',
          params: { leftOperand: 'trigger.dwellDurationSeconds', operator: 'greaterThan', rightOperand: 60 },
        },
      },
      {
        id: 'a1',
        type: 'customFlowNode',
        position: { x: 120, y: 350 },
        data: {
          label: 'Route VIP Lead',
          type: 'crm_create_lead',
          category: 'ecosystem',
          params: { leadStatus: 'VIP', notifySales: true },
        },
      },
      {
        id: 'a2',
        type: 'customFlowNode',
        position: { x: 120, y: 480 },
        data: {
          label: 'Email 3D PDF Spec',
          type: 'email_send',
          category: 'communication',
          params: { to: '{{trigger.contact.email}}', subject: 'Your requested 3D specifications are ready' },
        },
      },
      {
        id: 'a3',
        type: 'customFlowNode',
        position: { x: 420, y: 350 },
        data: {
          label: 'Standard Lead Capture',
          type: 'crm_create_lead',
          category: 'ecosystem',
          params: { leadStatus: 'Standard' },
        },
      },
    ];

    const templateEdges = [
      { id: 'e_t1_c1', source: 't1', target: 'c1' },
      { id: 'e_c1_a1', source: 'c1', sourceHandle: 'condition_true', target: 'a1' },
      { id: 'e_a1_a2', source: 'a1', target: 'a2' },
      { id: 'e_c1_a3', source: 'c1', sourceHandle: 'condition_false', target: 'a3' },
    ];

    const flowPayload = {
      name: '3D RFQ Lead Scoring & Instant Spec Sheet',
      description: 'Automates lead qualification and PDF spec delivery based on 3D viewer dwell engagement.',
      triggerType: 'trigger_event',
      triggerConfig: { eventName: 'rfq_submitted' },
      flowDefinition: {
        schemaVersion: '1.0.0',
        trigger: { id: 't1', type: 'trigger_event' },
        nodes: templateNodes,
        edges: templateEdges,
        variables: [{ name: 'leadScore', type: 'number', default: 50 }],
        settings: { concurrency: 5, timeoutSeconds: 60, retentionDays: 30 },
      },
    };

    const createRes = await request('/flows', {
      method: 'POST',
      body: JSON.stringify(flowPayload),
    });

    const flowId = createRes.flow.id;
    assert.ok(flowId, 'Flow ID must be returned');
    assert.equal(createRes.flow.status, 'draft', 'New flow should start as draft');
    console.log('✓ Created flow with ID:', flowId);

    // Test 2: Update Flow in Designer (simulate node parameter update)
    console.log('2. Simulating node parameter update from Designer Inspector...');
    templateNodes[1].data.params.rightOperand = 90; // change threshold to 90s
    flowPayload.flowDefinition.nodes = templateNodes;

    const updateRes = await request(`/flows/${flowId}`, {
      method: 'PUT',
      body: JSON.stringify({
        flowDefinition: flowPayload.flowDefinition,
      }),
    });
    assert.equal(
      updateRes.flow.flow_definition.nodes[1].data.params.rightOperand,
      90,
      'Updated node param should persist'
    );
    console.log('✓ Node parameter updated and persisted.');

    // Test 3: Execute Test Run via backend trigger
    console.log('3. Triggering live test run via /api/flows/:id/trigger...');
    const triggerPayload = {
      eventName: 'rfq_submitted',
      productName: 'Executive Ergonomic Chair Pro',
      dwellDurationSeconds: 125,
      contact: {
        name: 'Sarah Chen',
        email: 'sarah.chen@acmedesign.com',
        company: 'Acme Architecture',
      },
      viewerSessionId: 'sess_99341',
    };

    const runRes = await request(`/flows/${flowId}/trigger`, {
      method: 'POST',
      body: JSON.stringify(triggerPayload),
    });

    const run = runRes.run;
    assert.ok(run.id, 'Run ID must be generated');
    assert.equal(run.status, 'completed', 'Run status should be completed');
    assert.ok(run.completed_at, 'Run must record finish timestamp');
    console.log('✓ Test run completed successfully in database with ID:', run.id);

    // Test 4: Verify Run History
    console.log('4. Listing flow execution runs...');
    const runsRes = await request(`/flows/${flowId}/runs`);
    assert.ok(Array.isArray(runsRes.runs), 'Runs must be an array');
    assert.ok(runsRes.runs.length >= 1, 'Should have at least 1 run record');
    console.log('✓ Found run in history:', runsRes.runs[0].id, 'Status:', runsRes.runs[0].status);

    // Test 5: Publish Flow Version
    console.log('5. Publishing flow version from Designer Command Bar...');
    const pubRes = await request(`/flows/${flowId}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        changeSummary: 'Release v1: 3D RFQ Lead Scoring with 90s threshold',
      }),
    });
    assert.equal(pubRes.flow.status, 'published', 'Flow should transition to published');
    assert.equal(pubRes.flow.version, 2, 'Published version should increment to 2');
    console.log('✓ Flow published as version:', pubRes.flow.version);

    // Test 6: Verify Version History
    console.log('6. Verifying immutable version snapshot in flow_versions...');
    const versionsRes = await request(`/flows/${flowId}/versions`);
    assert.ok(Array.isArray(versionsRes.versions), 'Versions must be an array');
    assert.equal(versionsRes.versions.length, 1, 'Should have 1 version record');
    assert.equal(
      versionsRes.versions[0].change_summary,
      'Release v1: 3D RFQ Lead Scoring with 90s threshold'
    );
    console.log('✓ Verified version snapshot in flow_versions.');

    // Test 7: Duplicate Flow
    console.log('7. Duplicating flow...');
    const dupRes = await request(`/flows/${flowId}/duplicate`, {
      method: 'POST',
    });
    assert.ok(dupRes.flow.id, 'Duplicated flow must have an ID');
    assert.equal(dupRes.flow.name, '3D RFQ Lead Scoring & Instant Spec Sheet (Copy)');
    console.log('✓ Successfully duplicated flow:', dupRes.flow.id);

    console.log('\n================================================================');
    console.log('🎉 ALL 7 PHASE 3 DESIGNER E2E TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');
  } finally {
    await pool.end();
  }
}

runDesignerE2ETest().catch((err) => {
  console.error('Test failed:', err);
  pool.end();
  process.exit(1);
});
