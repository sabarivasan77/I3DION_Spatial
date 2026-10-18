import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool } from './src/db/pool.js';
import { config } from './src/config.js';

const BASE_URL = 'http://localhost:4000/api';

async function runPhase5MonitoringTests() {
  console.log('================================================================');
  console.log('⚡ I3DION Flow: Phase 5 Monitoring, Analytics & Runs Test Suite');
  console.log('================================================================\n');

  const orgAId = crypto.randomUUID();
  const userAId = crypto.randomUUID();
  const orgBId = crypto.randomUUID();
  const userBId = crypto.randomUUID();

  // 1. Fixture: Setup Org A and User A
  await pool.query(
    `INSERT INTO organizations (id, name, slug) VALUES ($1, 'Monitoring Org A', $2) ON CONFLICT DO NOTHING`,
    [orgAId, `org-a-${Date.now()}`]
  );
  await pool.query(
    `INSERT INTO users (id, organization_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'Monitoring Admin', 'Admin', 'hash_test') ON CONFLICT DO NOTHING`,
    [userAId, orgAId, `admin-a-${Date.now()}@domain.com`]
  );

  // Setup Org B and User B for multi-tenant isolation testing
  await pool.query(
    `INSERT INTO organizations (id, name, slug) VALUES ($1, 'Monitoring Org B', $2) ON CONFLICT DO NOTHING`,
    [orgBId, `org-b-${Date.now()}`]
  );
  await pool.query(
    `INSERT INTO users (id, organization_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'Other Tenant User', 'Admin', 'hash_test') ON CONFLICT DO NOTHING`,
    [userBId, orgBId, `admin-b-${Date.now()}@domain.com`]
  );

  const tokenA = jwt.sign(
    { sub: userAId, userId: userAId, organization_id: orgAId, role: 'Admin', email: `admin-a@domain.com` },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const tokenB = jwt.sign(
    { sub: userBId, userId: userBId, organization_id: orgBId, role: 'Admin', email: `admin-b@domain.com` },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  async function request(path, options = {}, token = tokenA) {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  }

  let passed = 0;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Create a test flow and execute multiple runs
    // -------------------------------------------------------------------------
    console.log('Test 1: Setting up automation flow and generating execution runs...');

    const flowDefinition = {
      schemaVersion: '1.0',
      nodes: [
        {
          id: 'n_trigger',
          type: 'trigger_event',
          position: { x: 100, y: 100 },
          data: {
            label: '3D Spatial Event',
            category: 'trigger',
            params: { eventName: 'spatial.model.viewed' },
          },
        },
        {
          id: 'n_condition',
          type: 'condition',
          position: { x: 300, y: 100 },
          data: {
            label: 'Dwell Time Check',
            category: 'logic',
            params: {
              field: 'dwellTimeSec',
              operator: 'greater_than',
              value: 30,
            },
          },
        },
        {
          id: 'n_crm',
          type: 'crm_create_lead',
          position: { x: 500, y: 50 },
          data: {
            label: 'Create High-Intent Lead',
            category: 'action',
            params: {
              company: 'Industrial Automation Corp',
              contactName: '{{trigger.userName}}',
              email: '{{trigger.userEmail}}',
              leadScore: 85,
            },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'n_trigger', target: 'n_condition' },
        { id: 'e2', source: 'n_condition', target: 'n_crm', sourceHandle: 'true' },
      ],
    };

    const createRes = await request('/flows', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Phase 5 Telemetry Flow',
        description: 'Testing live monitoring, latency analytics, and retries',
        triggerType: 'trigger_event',
        triggerConfig: { eventName: 'spatial.model.viewed' },
        flowDefinition,
      }),
    });

    assert.equal(createRes.status, 201, 'Flow should be created');
    const flowId = createRes.data.flow.id;

    // Run 1: Condition matches (dwellTimeSec: 45) -> creates lead
    const run1Res = await request(`/flows/${flowId}/trigger`, {
      method: 'POST',
      body: JSON.stringify({
        eventName: 'spatial.model.viewed',
        dwellTimeSec: 45,
        userName: 'Elena Rostova',
        userEmail: 'elena@turbine-tech.com',
      }),
    });
    assert.equal(run1Res.status, 200);
    const run1Id = run1Res.data.run.id;
    assert.equal(run1Res.data.run.status, 'completed');

    // Run 2: Condition does not match (dwellTimeSec: 10) -> child skipped, completed
    const run2Res = await request(`/flows/${flowId}/trigger`, {
      method: 'POST',
      body: JSON.stringify({
        eventName: 'spatial.model.viewed',
        dwellTimeSec: 10,
        userName: 'Quick Visitor',
        userEmail: 'visitor@anon.com',
      }),
    });
    assert.equal(run2Res.status, 200);
    const run2Id = run2Res.data.run.id;
    assert.equal(run2Res.data.run.status, 'completed');

    console.log(`  ✓ Flow created (ID: ${flowId}) and 2 runs executed (Run 1: ${run1Id}, Run 2: ${run2Id})`);
    passed++;

    // -------------------------------------------------------------------------
    // TEST 2: GET /api/flows/runs/all with pagination and filtering
    // -------------------------------------------------------------------------
    console.log('\nTest 2: GET /api/flows/runs/all with pagination and filtering...');

    const allRunsRes = await request('/flows/runs/all?limit=10&offset=0');
    assert.equal(allRunsRes.status, 200);
    assert(Array.isArray(allRunsRes.data.runs), 'Should return runs array');
    assert(allRunsRes.data.total >= 2, `Total runs should be >= 2 (got ${allRunsRes.data.total})`);

    const runIds = allRunsRes.data.runs.map((r) => r.id);
    assert(runIds.includes(run1Id), 'all runs list must include run 1');
    assert(runIds.includes(run2Id), 'all runs list must include run 2');

    // Filter by flowId
    const flowFilteredRes = await request(`/flows/runs/all?flowId=${flowId}`);
    assert.equal(flowFilteredRes.status, 200);
    assert.equal(flowFilteredRes.data.runs.length, 2, 'Should return exactly 2 runs for this flow');

    // Filter by status=completed
    const completedRes = await request('/flows/runs/all?status=completed');
    assert.equal(completedRes.status, 200);
    assert(completedRes.data.runs.every((r) => r.status === 'completed'), 'All returned runs must be completed');

    console.log(`  ✓ Returned ${allRunsRes.data.runs.length} runs with valid pagination (total: ${allRunsRes.data.total})`);
    passed++;

    // -------------------------------------------------------------------------
    // TEST 3: GET /api/flows/runs/:runId details & multi-tenant isolation
    // -------------------------------------------------------------------------
    console.log('\nTest 3: GET /api/flows/runs/:runId details & multi-tenant isolation...');

    const detailRes = await request(`/flows/runs/${run1Id}`);
    assert.equal(detailRes.status, 200);
    const runDetail = detailRes.data.run;

    assert.equal(runDetail.id, run1Id);
    assert.equal(runDetail.flow_id, flowId);
    assert.equal(runDetail.status, 'completed');
    assert(Array.isArray(runDetail.step_results), 'step_results must be parsed as an array');
    assert(runDetail.step_results.length >= 2, 'Should have executed trigger and condition steps');
    assert(typeof runDetail.duration_ms === 'number', 'duration_ms must be a valid number');
    assert.equal(runDetail.trigger_payload.userName, 'Elena Rostova');

    // Multi-tenant boundary check: Org B must NOT be able to view Org A's run
    const unauthorizedRes = await request(`/flows/runs/${run1Id}`, {}, tokenB);
    assert.equal(
      unauthorizedRes.status,
      404,
      'Tenant B must receive 404 when attempting to inspect Tenant A run'
    );

    console.log(`  ✓ Run detail successfully loaded with ${runDetail.step_results.length} steps, duration: ${runDetail.duration_ms}ms`);
    console.log(`  ✓ Multi-tenant boundary verified: Tenant B received 404 for Tenant A run`);
    passed++;

    // -------------------------------------------------------------------------
    // TEST 4: POST /api/flows/runs/:runId/retry re-execution
    // -------------------------------------------------------------------------
    console.log('\nTest 4: POST /api/flows/runs/:runId/retry re-execution...');

    // Retry with original payload
    const retryRes = await request(`/flows/runs/${run1Id}/retry`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    assert.equal(retryRes.status, 200);
    assert(retryRes.data.run, 'Should return retried run object');
    const retriedRun = retryRes.data.run;
    assert.notEqual(retriedRun.id, run1Id, 'Retried run should receive a new distinct run ID');
    assert.equal(retriedRun.status, 'completed', 'Retried run should complete');
    const retriedPayload = retriedRun.trigger_payload || retriedRun.triggerPayload;
    assert.equal(retriedPayload?.userName, 'Elena Rostova', 'Retried run should use original payload');

    // Retry with overridden payload
    const overrideRes = await request(`/flows/runs/${run2Id}/retry`, {
      method: 'POST',
      body: JSON.stringify({
        triggerPayload: {
          eventName: 'spatial.model.viewed',
          dwellTimeSec: 120, // Now exceeds 30 threshold!
          userName: 'Overridden Executive',
          userEmail: 'vip@override.com',
        },
      }),
    });

    assert.equal(overrideRes.status, 200);
    const overrideRun = overrideRes.data.run;
    const overridePayload = overrideRun.trigger_payload || overrideRun.triggerPayload;
    assert.equal(overridePayload?.dwellTimeSec, 120);
    assert.equal(overridePayload?.userName, 'Overridden Executive');
    assert.equal(overrideRun.status, 'completed');

    console.log(`  ✓ Re-execution verified: created new Run ${retriedRun.id.slice(0, 8)}... with original payload`);
    console.log(`  ✓ Override payload re-execution verified: dwellTimeSec updated to 120`);
    passed++;

    // -------------------------------------------------------------------------
    // TEST 5: GET /api/flows/:id/analytics per-flow latency percentiles
    // -------------------------------------------------------------------------
    console.log('\nTest 5: GET /api/flows/:id/analytics per-flow latency percentiles...');

    const flowAnalyticsRes = await request(`/flows/${flowId}/analytics`);
    assert.equal(flowAnalyticsRes.status, 200);
    const flowAnalytics = flowAnalyticsRes.data;

    assert(flowAnalytics.overview, 'Should contain overview object');
    assert(flowAnalytics.overview.totalRuns >= 4, `Total runs should be >= 4 (got ${flowAnalytics.overview.totalRuns})`);
    assert.equal(flowAnalytics.overview.failedRuns, 0, 'Failed runs should be 0');
    assert.equal(flowAnalytics.overview.successRate, 100, 'Success rate should be 100%');
    assert(typeof flowAnalytics.overview.avgDurationMs === 'number', 'avgDurationMs should be number');
    assert(typeof flowAnalytics.overview.p50DurationMs === 'number', 'p50DurationMs should be number');
    assert(typeof flowAnalytics.overview.p90DurationMs === 'number', 'p90DurationMs should be number');
    assert(typeof flowAnalytics.overview.p95DurationMs === 'number', 'p95DurationMs should be number');
    assert(Array.isArray(flowAnalytics.dailyHistory), 'dailyHistory must be an array');
    assert(Array.isArray(flowAnalytics.topErrors), 'topErrors must be an array');

    console.log(`  ✓ Analytics computed: ${flowAnalytics.overview.totalRuns} runs, avg: ${flowAnalytics.overview.avgDurationMs}ms, p50: ${flowAnalytics.overview.p50DurationMs}ms, p95: ${flowAnalytics.overview.p95DurationMs}ms`);
    passed++;

    // -------------------------------------------------------------------------
    // TEST 6: GET /api/flows/analytics/overview organization-wide metrics
    // -------------------------------------------------------------------------
    console.log('\nTest 6: GET /api/flows/analytics/overview organization-wide metrics...');

    const orgOverviewRes = await request('/flows/analytics/overview');
    assert.equal(orgOverviewRes.status, 200);
    const orgOverview = orgOverviewRes.data;

    assert(orgOverview.overview, 'Should contain overview object');
    assert(orgOverview.overview.totalRuns >= 4, 'Org overview total runs should reflect all runs');
    assert(orgOverview.dailyHistory.length > 0, 'dailyHistory should contain today entry');

    console.log(`  ✓ Organization-wide metrics verified: ${orgOverview.overview.totalRuns} total organization runs`);
    passed++;

    console.log('\n================================================================');
    console.log(`🎉 ALL PHASE 5 MONITORING & RUNS TESTS PASSED (${passed}/${passed})`);
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ Phase 5 Test Failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runPhase5MonitoringTests();
