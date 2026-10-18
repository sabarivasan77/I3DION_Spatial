import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool } from './src/db/pool.js';
import { config } from './src/config.js';
import { runDisasterRecoveryDrill } from './scripts/backup-and-restore-drill.js';

const BASE_URL = 'http://localhost:4000/api';

async function runPhase7Tests() {
  console.log('================================================================');
  console.log('🏆 I3DION Flow: Phase 7 Commercial Readiness & Release Ceremony');
  console.log('================================================================\n');

  const orgAId = crypto.randomUUID();
  const userAId = crypto.randomUUID();
  const orgBId = crypto.randomUUID();
  const userBId = crypto.randomUUID();

  // Setup Org A & User A
  await pool.query(
    `INSERT INTO organizations (id, name, slug) VALUES ($1, 'Enterprise Org A', $2) ON CONFLICT DO NOTHING`,
    [orgAId, `ent-org-a-${Date.now()}`]
  );
  await pool.query(
    `INSERT INTO users (id, organization_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'Enterprise Officer A', 'Admin', 'hash_test') ON CONFLICT DO NOTHING`,
    [userAId, orgAId, `officer-a-${Date.now()}@i3dion.com`]
  );

  // Setup Org B & User B
  await pool.query(
    `INSERT INTO organizations (id, name, slug) VALUES ($1, 'Startup Org B', $2) ON CONFLICT DO NOTHING`,
    [orgBId, `startup-org-b-${Date.now()}`]
  );
  await pool.query(
    `INSERT INTO users (id, organization_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'Founder B', 'Admin', 'hash_test') ON CONFLICT DO NOTHING`,
    [userBId, orgBId, `founder-b-${Date.now()}@startup.com`]
  );

  const tokenA = jwt.sign(
    { sub: userAId, userId: userAId, organization_id: orgAId, role: 'Admin', email: `officer-a@i3dion.com` },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const tokenB = jwt.sign(
    { sub: userBId, userId: userBId, organization_id: orgBId, role: 'Admin', email: `founder-b@startup.com` },
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
    return { status: res.status, ok: res.ok, data, headers: res.headers };
  }

  let passed = 0;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Quota Enforcement on Default Free Tier (Limit = 3 flows)
    // -------------------------------------------------------------------------
    console.log('Test 1: Quota Enforcement — Free Tier Limit of 3 Active Workflows...');
    const initialQuotaRes = await request('/flows/quota', {}, tokenA);
    assert.equal(initialQuotaRes.status, 200);
    assert.equal(initialQuotaRes.data.plan.id, 'FREE');
    assert.equal(initialQuotaRes.data.plan.maxActiveFlows, 3);
    console.log(`  ✓ Verified Org A default plan: FREE (Limit: ${initialQuotaRes.data.plan.maxActiveFlows} flows)`);

    // Create 3 flows (allowed under Free tier)
    for (let i = 1; i <= 3; i++) {
      const flowRes = await request('/flows', {
        method: 'POST',
        body: JSON.stringify({
          name: `Free Flow ${i}`,
          description: `Testing quota limits ${i}`,
          triggerType: 'trigger_manual',
        }),
      }, tokenA);
      assert.equal(flowRes.status, 201, `Failed to create flow ${i}`);
    }
    console.log('  ✓ Created 3 allowable workflows on Free tier');

    // Attempt to create 4th flow (must be blocked with 403 QUOTA_FLOWS_EXCEEDED)
    const blockedRes = await request('/flows', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Blocked 4th Flow',
        description: 'Should exceed quota',
        triggerType: 'trigger_manual',
      }),
    }, tokenA);

    assert.equal(blockedRes.status, 403, 'Should return HTTP 403 Forbidden');
    assert(
      blockedRes.data.error.includes('Workflow creation limit reached'),
      `Expected quota error message, got: ${blockedRes.data.error}`
    );
    console.log('  ✓ 4th workflow creation blocked with HTTP 403 quota boundary');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 2: Commercial Plan Upgrade Unlocks Workflows
    // -------------------------------------------------------------------------
    console.log('\nTest 2: Commercial Plan Upgrade — Upgrading Org A to BUSINESS Tier...');
    const upgradeRes = await request('/flows/plan/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId: 'BUSINESS' }),
    }, tokenA);

    assert.equal(upgradeRes.status, 200);
    assert.equal(upgradeRes.data.quota.plan.id, 'BUSINESS');
    assert.equal(upgradeRes.data.quota.plan.maxActiveFlows, 50);
    console.log('  ✓ Upgraded Org A subscription to BUSINESS (50 active flows allowed)');

    // Attempting to create the 4th flow now succeeds
    const unblockedRes = await request('/flows', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Now Allowed 4th Flow',
        description: 'Allowed after upgrade',
        triggerType: 'trigger_manual',
      }),
    }, tokenA);

    assert.equal(unblockedRes.status, 201);
    assert.equal(unblockedRes.data.flow.name, 'Now Allowed 4th Flow');
    console.log('  ✓ Successfully created 4th workflow after tier upgrade');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 3: Multi-Tenant Billing and Quota Isolation
    // -------------------------------------------------------------------------
    console.log('\nTest 3: Multi-Tenant Billing Isolation — Org B remains on FREE tier...');
    const orgBQuotaRes = await request('/flows/quota', {}, tokenB);
    assert.equal(orgBQuotaRes.status, 200);
    assert.equal(orgBQuotaRes.data.plan.id, 'FREE', 'Org B must not inherit Org A upgrade');
    assert.equal(orgBQuotaRes.data.usage.activeFlows, 0, 'Org B usage must be 0');
    console.log('  ✓ Verified strict tenant isolation: Org B remains unaffected on FREE tier');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 4: End-to-End Ecosystem Autonomous Flow Execution & Outbox Dispatch
    // -------------------------------------------------------------------------
    console.log('\nTest 4: End-to-End Ecosystem Integration (3D Event -> Flow -> Outbox)...');

    // Create a complete production workflow responding to spatial engine event
    const e2eFlowRes = await request('/flows', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ecosystem 3D Scene Configurator Alert',
        description: 'Auto-dispatches webhook and email on 3D inspection',
        triggerType: 'trigger_event',
        triggerConfig: { eventName: 'spatial.engine.hotspot_inspected' },
        flowDefinition: {
          schemaVersion: '1.0',
          nodes: [
            {
              id: 'node_trigger',
              type: 'trigger_event',
              position: { x: 100, y: 100 },
              data: {
                label: '3D Hotspot Inspected',
                category: 'trigger',
                params: { eventName: 'spatial.engine.hotspot_inspected' },
              },
            },
            {
              id: 'node_compose',
              type: 'compose',
              position: { x: 100, y: 220 },
              data: {
                label: 'Format Audit Log',
                category: 'data',
                params: {
                  template: 'Hotspot {{trigger.hotspotId}} inspected on asset {{trigger.assetId}} by {{trigger.userEmail}}',
                },
              },
            },
            {
              id: 'node_outbox',
              type: 'outbox_webhook',
              position: { x: 100, y: 340 },
              data: {
                type: 'outbox_webhook',
                label: 'Queue Partner Webhook',
                category: 'integration',
                params: {
                  destinationUrl: 'https://webhook.site/i3dion-flow-ecosystem-test',
                  retryAttempts: 3,
                },
              },
            },
          ],
          edges: [
            { id: 'e1', source: 'node_trigger', target: 'node_compose' },
            { id: 'e2', source: 'node_compose', target: 'node_outbox' },
          ],
        },
      }),
    }, tokenA);

    assert.equal(e2eFlowRes.status, 201);
    const flowId = e2eFlowRes.data.flow.id;

    // Publish flow
    const publishRes = await request(`/flows/${flowId}/publish`, { method: 'POST' }, tokenA);
    assert.equal(publishRes.status, 200);
    assert.equal(publishRes.data.flow.status, 'published');
    console.log('  ✓ Published active ecosystem workflow');

    // Ingest Spatial Event simulating 3D Engine user interaction
    const ingestRes = await request('/flows/events/spatial', {
      method: 'POST',
      body: JSON.stringify({
        eventType: 'spatial.engine.hotspot_inspected',
        sourceApp: 'engine',
        payload: {
          assetId: 'ast_turbine_99',
          hotspotId: 'pin_rotor_blade',
          userEmail: 'engineer@aerotech.com',
        },
      }),
    }, tokenA);

    assert.equal(ingestRes.status, 200);
    assert.equal(ingestRes.data.triggeredFlowsCount, 1);
    const runId = ingestRes.data.flowRunIds[0];
    console.log(`  ✓ 3D Engine event triggered workflow execution run: ${runId}`);

    // Verify run status
    const runDetailsRes = await request(`/flows/runs/${runId}`, {}, tokenA);
    assert.equal(runDetailsRes.status, 200);
    assert.equal(runDetailsRes.data.run.status, 'completed');
    console.log('  ✓ Autonomous execution run completed with all steps passed');

    // Verify Outbox Event was recorded
    const outboxRes = await request('/flows/outbox', {}, tokenA);
    assert.equal(outboxRes.status, 200);
    assert(outboxRes.data.outbox.length > 0, 'Outbox should contain queued event');
    console.log('  ✓ Secure outbox event queued in PostgreSQL');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 5: Operational Disaster Recovery Backup & Restore Drill
    // -------------------------------------------------------------------------
    console.log('\nTest 5: Disaster Recovery & Parity Verification Drill...');
    const drReport = await runDisasterRecoveryDrill();
    assert.equal(drReport.status, 'success');
    assert.equal(drReport.parityVerified, true);
    assert.equal(drReport.cleanedUp, true);
    console.log('  ✓ Disaster recovery snapshot & restored sandbox verified 100% data parity');
    passed++;

    console.log('\n================================================================');
    console.log(`🎉 ALL PHASE 7 RELEASE CEREMONY TESTS PASSED (${passed}/5)`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ Phase 7 Test Suite Failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runPhase7Tests();
