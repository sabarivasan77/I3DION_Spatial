import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { app } from '../../src/server.js';
import { pool, ensureMigrated } from '../../src/db/pool.js';
import { config } from '../../src/config.js';

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

async function runApiTests() {
  console.log('================================================================');
  console.log('🌐 I3DION Flow: Phase 2 HTTP REST API Route Verification');
  console.log('================================================================\n');

  await setup();

  const orgId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  // Insert test org and user
  await pool.query(
    `INSERT INTO organizations (id, name, slug) VALUES ($1, 'API Test Org', $2) ON CONFLICT DO NOTHING`,
    [orgId, `api-org-${Date.now()}`]
  );
  await pool.query(
    `INSERT INTO users (id, organization_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'API User', 'Admin', 'hash_test') ON CONFLICT DO NOTHING`,
    [userId, orgId, `api-user-${Date.now()}@domain.com`]
  );

  const jwtSecret = config.jwtSecret;
  const token = jwt.sign(
    { sub: userId, userId, organization_id: orgId, role: 'Admin', email: 'api-user@domain.com' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  let passed = 0;
  let failed = 0;

  function recordPass(name, detail) {
    passed++;
    console.log(`✅ [PASS] ${name}`);
    if (detail) console.log(`   ${detail}`);
  }

  function recordFail(name, err) {
    failed++;
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   ${err.message || err}`);
  }

  let createdFlowId = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Unauthenticated request is rejected (401)
    // -------------------------------------------------------------------------
    try {
      const unauthRes = await fetch(`${baseUrl}/api/flows`);
      assert.equal(unauthRes.status, 401);
      recordPass('TEST 1: Reject Unauthenticated Request', 'Returned HTTP 401 when Authorization header is absent.');
    } catch (err) {
      recordFail('TEST 1: Reject Unauthenticated Request', err);
    }

    // -------------------------------------------------------------------------
    // TEST 2: POST /api/flows (Create Flow)
    // -------------------------------------------------------------------------
    try {
      const createRes = await fetch(`${baseUrl}/api/flows`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'RFQ Inbound Auto-Responder',
          description: 'Auto-generates quotation email for prospective clients',
          triggerType: 'event',
          triggerConfig: { eventType: 'lead_form_submitted' },
          flowDefinition: {
            trigger: { id: 't1', type: 'event', label: 'RFQ Event', config: {} },
            nodes: [
              {
                id: 'n1',
                type: 'send_notification',
                label: 'Notify Engineering Team',
                category: 'communication',
                position: { x: 50, y: 100 },
                params: { title: 'New RFQ Inbound', body: '3D specifications requested' },
              },
            ],
            edges: [],
            variables: [],
            settings: { concurrency: 5, timeoutSeconds: 60, retentionDays: 30 },
          },
        }),
      });

      assert.equal(createRes.status, 201);
      const data = await createRes.json();
      assert.ok(data.flow?.id);
      assert.equal(data.flow.name, 'RFQ Inbound Auto-Responder');
      createdFlowId = data.flow.id;
      recordPass('TEST 2: POST /api/flows', `Created flow ${createdFlowId} via REST API.`);
    } catch (err) {
      recordFail('TEST 2: POST /api/flows', err);
    }

    // -------------------------------------------------------------------------
    // TEST 3: GET /api/flows (List Flows)
    // -------------------------------------------------------------------------
    try {
      const listRes = await fetch(`${baseUrl}/api/flows?status=all`, { headers });
      assert.equal(listRes.status, 200);
      const data = await listRes.json();
      assert.ok(Array.isArray(data.flows));
      assert.ok(data.flows.some((f) => f.id === createdFlowId));
      recordPass('TEST 3: GET /api/flows', `Listed ${data.flows.length} flows with tenant isolation.`);
    } catch (err) {
      recordFail('TEST 3: GET /api/flows', err);
    }

    // -------------------------------------------------------------------------
    // TEST 4: GET /api/flows/:id (Get Flow Details)
    // -------------------------------------------------------------------------
    try {
      const getRes = await fetch(`${baseUrl}/api/flows/${createdFlowId}`, { headers });
      assert.equal(getRes.status, 200);
      const data = await getRes.json();
      assert.equal(data.flow.id, createdFlowId);
      assert.equal(data.flow.status, 'draft');
      recordPass('TEST 4: GET /api/flows/:id', 'Retrieved flow detail with flow_definition.');
    } catch (err) {
      recordFail('TEST 4: GET /api/flows/:id', err);
    }

    // -------------------------------------------------------------------------
    // TEST 5: POST /api/flows/:id/publish (Publish Flow Version)
    // -------------------------------------------------------------------------
    try {
      const publishRes = await fetch(`${baseUrl}/api/flows/${createdFlowId}/publish`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ changeSummary: 'Release 1.0.0 via REST' }),
      });
      assert.equal(publishRes.status, 200);
      const data = await publishRes.json();
      assert.equal(data.flow.status, 'published');
      assert.equal(data.flow.last_published_version, 1);
      recordPass('TEST 5: POST /api/flows/:id/publish', 'Published flow and advanced version to 2.');
    } catch (err) {
      recordFail('TEST 5: POST /api/flows/:id/publish', err);
    }

    // -------------------------------------------------------------------------
    // TEST 6: POST /api/flows/:id/trigger (Execute Flow Run)
    // -------------------------------------------------------------------------
    try {
      const triggerRes = await fetch(`${baseUrl}/api/flows/${createdFlowId}/trigger`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ testRun: true, clientName: 'ACME Hydraulics' }),
      });
      assert.equal(triggerRes.status, 200);
      const data = await triggerRes.json();
      assert.ok(data.run?.id);
      assert.equal(data.run.status, 'completed');
      recordPass('TEST 6: POST /api/flows/:id/trigger', `Executed run ${data.run.id} with status completed.`);
    } catch (err) {
      recordFail('TEST 6: POST /api/flows/:id/trigger', err);
    }

    // -------------------------------------------------------------------------
    // TEST 7: GET /api/flows/:id/runs (List Runs)
    // -------------------------------------------------------------------------
    try {
      const runsRes = await fetch(`${baseUrl}/api/flows/${createdFlowId}/runs`, { headers });
      assert.equal(runsRes.status, 200);
      const data = await runsRes.json();
      assert.ok(Array.isArray(data.runs));
      assert.equal(data.runs.length, 1);
      recordPass('TEST 7: GET /api/flows/:id/runs', 'Fetched 1 execution run record.');
    } catch (err) {
      recordFail('TEST 7: GET /api/flows/:id/runs', err);
    }

    // -------------------------------------------------------------------------
    // TEST 8: POST /api/flows/events (Transactional Outbox)
    // -------------------------------------------------------------------------
    try {
      const eventRes = await fetch(`${baseUrl}/api/flows/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          eventType: 'spatial.model.viewed',
          payload: { modelId: 'valve-400', dwellTimeSec: 60 },
        }),
      });
      assert.equal(eventRes.status, 202);
      const data = await eventRes.json();
      assert.ok(data.outboxItem?.id);
      assert.equal(data.outboxItem.status, 'pending');
      recordPass('TEST 8: POST /api/flows/events', `Enqueued outbox item ${data.outboxItem.id} (HTTP 202 Accepted).`);
    } catch (err) {
      recordFail('TEST 8: POST /api/flows/events', err);
    }

  } finally {
    // Teardown
    if (createdFlowId) {
      await pool.query('DELETE FROM flows WHERE id = $1', [createdFlowId]);
    }
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.query('DELETE FROM organizations WHERE id = $1', [orgId]);
    await teardown();
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Phase 2 API Route Test Summary: ${passed} Passed | ${failed} Failed`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runApiTests().catch((err) => {
  console.error('Fatal API test error:', err);
  process.exit(1);
});
