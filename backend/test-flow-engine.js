import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { pool, ensureMigrated, withTenant } from './src/db/pool.js';
import {
  createFlow,
  getFlowById,
  listFlows,
  executeFlowRun,
  enqueueOutboxEvent
} from './src/services/flow/flowExecutor.js';

async function runFlowEngineTests() {
  console.log('--- STARTING PHASE F-A: FLOW CORE ENGINE VERIFICATION ---');
  await ensureMigrated();

  const orgA = crypto.randomUUID();
  const orgB = crypto.randomUUID();

  console.log(`Setting up test organizations: Org A=${orgA}, Org B=${orgB}`);

  await pool.query(
    'INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3), ($4, $5, $6) ON CONFLICT DO NOTHING',
    [orgA, 'Flow Org A', `flow-org-a-${Date.now()}`, orgB, 'Flow Org B', `flow-org-b-${Date.now()}`]
  );

  let flowAId = null;

  try {
    // -------------------------------------------------------------
    // TEST FLOW-01: Create flow with triggers & steps
    // -------------------------------------------------------------
    console.log('[RUNNING] FLOW-01: Create flow definition with steps...');
    const flowDef = await createFlow({
      organizationId: orgA,
      name: 'Lead Routing Pipeline',
      description: 'Auto notify on new RFQ and queue webhook',
      triggerType: 'event',
      triggerConfig: { event: 'lead_form_submitted' },
      steps: [
        {
          type: 'send_notification',
          params: { title: 'New RFQ Inbound', body: 'Customer requested 3D model specs' },
        },
        {
          type: 'webhook_dispatch',
          params: { eventType: 'crm_sync' },
        },
      ],
      status: 'active',
    });

    assert.ok(flowDef.id, 'FLOW-01 FAILED: Missing flow ID');
    assert.equal(flowDef.organization_id, orgA);
    assert.equal(flowDef.name, 'Lead Routing Pipeline');
    flowAId = flowDef.id;
    console.log(`  -> FLOW-01 PASSED (Flow definition created: ${flowAId})`);

    // -------------------------------------------------------------
    // TEST FLOW-02: Execute flow run and record step outputs
    // -------------------------------------------------------------
    console.log('[RUNNING] FLOW-02: Execute flow run pipeline...');
    const runResult = await executeFlowRun({
      flowId: flowAId,
      organizationId: orgA,
      triggerPayload: { leadId: crypto.randomUUID(), name: 'Industrial Partner' },
    });

    assert.equal(runResult.status, 'completed', `FLOW-02 FAILED: Flow run status is ${runResult.status}`);
    assert.equal(runResult.flow_id, flowAId);

    const stepResults = Array.isArray(runResult.step_results)
      ? runResult.step_results
      : JSON.parse(runResult.step_results || '[]');

    assert.equal(stepResults.length, 2, 'FLOW-02 FAILED: Expected 2 step results');
    assert.equal(stepResults[0].status, 'success');
    assert.equal(stepResults[0].output.notified, true);
    assert.equal(stepResults[1].output.dispatchedToOutbox, true);
    console.log('  -> FLOW-02 PASSED (Flow run pipeline executed and step results verified)');

    // -------------------------------------------------------------
    // TEST FLOW-03: Multi-tenant isolation for flows
    // -------------------------------------------------------------
    console.log('[RUNNING] FLOW-03: Flow multi-tenant isolation...');
    // Org B attempts to retrieve Org A's flow
    const orgBFlow = await getFlowById(orgB, flowAId);
    assert.equal(orgBFlow, null, 'FLOW-03 FAILED: Org B was able to view Org A flow!');

    // Org B lists flows
    const orgBFlows = await listFlows(orgB);
    assert.equal(orgBFlows.length, 0, 'FLOW-03 FAILED: Org B listed Org A flows!');

    // Org B attempts to execute Org A's flow
    let crossTenantError = false;
    try {
      await executeFlowRun({
        flowId: flowAId,
        organizationId: orgB,
        triggerPayload: {},
      });
    } catch {
      crossTenantError = true;
    }
    assert.equal(crossTenantError, true, 'FLOW-03 FAILED: Org B executed Org A flow without error!');
    console.log('  -> FLOW-03 PASSED (Multi-tenant isolation strictly enforced for flows)');

    // -------------------------------------------------------------
    // TEST FLOW-04: Transactional event outbox enqueue
    // -------------------------------------------------------------
    console.log('[RUNNING] FLOW-04: Transactional event outbox enqueue...');
    const outboxItem = await enqueueOutboxEvent({
      organizationId: orgA,
      eventType: 'spatial.model.viewed',
      payload: { modelId: 'model-arm-123', dwellTimeSec: 45 },
    });

    assert.ok(outboxItem.id, 'FLOW-04: Missing outbox ID');
    assert.equal(outboxItem.status, 'pending');
    assert.equal(outboxItem.event_type, 'spatial.model.viewed');
    console.log('  -> FLOW-04 PASSED (Transactional outbox enqueued successfully)');

    console.log('\n======================================================');
    console.log('ALL PHASE F-A FLOW ENGINE TESTS PASSED (4/4)!');
    console.log('======================================================\n');
  } finally {
    // Cleanup
    if (flowAId) {
      await pool.query('DELETE FROM flows WHERE id = $1', [flowAId]);
    }
    await pool.query('DELETE FROM organizations WHERE id IN ($1, $2)', [orgA, orgB]);
    await pool.end();
  }
}

runFlowEngineTests().catch((err) => {
  console.error('FLOW ENGINE TEST SUITE FAILED:', err);
  process.exit(1);
});
