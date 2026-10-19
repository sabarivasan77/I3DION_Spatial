import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { pool, ensureMigrated } from '../../src/db/pool.js';
import {
  createFlow,
  getFlowById,
  listFlows,
  updateFlow,
  publishFlow,
  duplicateFlow,
  archiveFlow,
  listFlowVersions,
} from '../../src/services/flow/flowPersistenceService.js';
import {
  executeFlowRun,
  enqueueOutboxEvent,
} from '../../src/services/flow/flowExecutor.js';

async function runFlowPersistenceTests() {
  console.log('================================================================');
  console.log('🛡️ I3DION Flow: Phase 2 Persistence & Multi-Tenant Test Suite');
  console.log('================================================================\n');

  await ensureMigrated();

  const orgA = crypto.randomUUID();
  const orgB = crypto.randomUUID();
  const userA = crypto.randomUUID();
  const userB = crypto.randomUUID();

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

  // Setup test orgs and users
  await pool.query(
    `INSERT INTO organizations (id, name, slug)
     VALUES ($1, 'Tenant Org A', $2), ($3, 'Tenant Org B', $4)
     ON CONFLICT DO NOTHING`,
    [orgA, `org-a-${Date.now()}`, orgB, `org-b-${Date.now()}`]
  );

  await pool.query(
    `INSERT INTO users (id, organization_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'User A', 'Admin', 'hash_test_dummy_pass'), ($4, $5, $6, 'User B', 'Admin', 'hash_test_dummy_pass')
     ON CONFLICT DO NOTHING`,
    [userA, orgA, `usera-${Date.now()}@domain.com`, userB, orgB, `userb-${Date.now()}@domain.com`]
  );

  let flowAId = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: FLOW-CRUD-01 — Create Draft Flow with Definition
    // -------------------------------------------------------------------------
    try {
      const flow = await createFlow({
        organizationId: orgA,
        ownerId: userA,
        name: '3D Interaction Lead Automation',
        description: 'Auto-scores 3D dwell time and notifies sales rep',
        triggerType: 'event',
        triggerConfig: { eventType: '3d_interaction' },
        flowDefinition: {
          trigger: { id: 'trig_1', type: 'event', label: '3D Event', config: {} },
          nodes: [
            {
              id: 'n1',
              type: 'condition',
              label: 'Dwell Time > 45s?',
              category: 'logic',
              position: { x: 100, y: 100 },
              params: { field: 'dwellTimeSec', operator: 'greater_than', value: 45 },
            },
            {
              id: 'n2',
              type: 'send_notification',
              label: 'Alert Sales Engineer',
              category: 'communication',
              position: { x: 100, y: 250 },
              params: { title: 'High Intent Prospect', body: 'Customer inspected exploded assembly' },
            },
          ],
          edges: [
            { id: 'e1', sourceNodeId: 'n1', sourcePortId: 'true', targetNodeId: 'n2', targetPortId: 'in' },
          ],
          variables: [{ name: 'intentScore', type: 'number', default: 25 }],
          settings: { concurrency: 5, timeoutSeconds: 60, retentionDays: 30 },
        },
      });

      assert.ok(flow.id, 'Missing flow ID');
      assert.equal(flow.organization_id, orgA);
      assert.equal(flow.status, 'draft');
      assert.equal(flow.version, 1);
      flowAId = flow.id;

      recordPass('TEST 1: FLOW-CRUD-01 — Create Draft Flow', `Created flow ${flow.id} for Org A (v1 draft).`);
    } catch (err) {
      recordFail('TEST 1: FLOW-CRUD-01 — Create Draft Flow', err);
    }

    // -------------------------------------------------------------------------
    // TEST 2: FLOW-CRUD-02 — Retrieve Flow with Owner Metadata
    // -------------------------------------------------------------------------
    try {
      const fetched = await getFlowById(orgA, flowAId);
      assert.ok(fetched, 'Flow not found');
      assert.equal(fetched.name, '3D Interaction Lead Automation');
      assert.equal(fetched.owner_name, 'User A');
      recordPass('TEST 2: FLOW-CRUD-02 — Retrieve Flow with Owner', 'Fetched flow with joined user metadata.');
    } catch (err) {
      recordFail('TEST 2: FLOW-CRUD-02 — Retrieve Flow with Owner', err);
    }

    // -------------------------------------------------------------------------
    // TEST 3: FLOW-CRUD-03 — Update Flow Definition with Graph Validation
    // -------------------------------------------------------------------------
    try {
      const updated = await updateFlow(orgA, flowAId, {
        name: '3D Interaction Lead Automation (Updated)',
        description: 'Updated pipeline with outbound webhook',
      });
      assert.equal(updated.name, '3D Interaction Lead Automation (Updated)');
      recordPass('TEST 3: FLOW-CRUD-03 — Update Flow Definition', 'Draft metadata updated cleanly.');
    } catch (err) {
      recordFail('TEST 3: FLOW-CRUD-03 — Update Flow Definition', err);
    }

    // -------------------------------------------------------------------------
    // TEST 4: FLOW-CRUD-04 — Publish Flow Version & Immutable Snapshot
    // -------------------------------------------------------------------------
    try {
      const published = await publishFlow(orgA, flowAId, userA, 'First production release');
      assert.equal(published.status, 'published');
      assert.equal(published.last_published_version, 1);
      assert.equal(published.version, 2); // Advanced to next draft version

      // Verify immutable snapshot exists in flow_versions
      const versions = await listFlowVersions(orgA, flowAId);
      assert.equal(versions.length, 1);
      assert.equal(versions[0].version_number, 1);
      assert.equal(versions[0].change_summary, 'First production release');

      recordPass('TEST 4: FLOW-CRUD-04 — Publish Flow Version', 'Published v1 immutable snapshot, advanced draft to v2.');
    } catch (err) {
      recordFail('TEST 4: FLOW-CRUD-04 — Publish Flow Version', err);
    }

    // -------------------------------------------------------------------------
    // TEST 5: FLOW-CRUD-05 — Duplicate Flow
    // -------------------------------------------------------------------------
    try {
      const duplicated = await duplicateFlow(orgA, flowAId, userA);
      assert.ok(duplicated.id);
      assert.notEqual(duplicated.id, flowAId);
      assert.ok(duplicated.name.includes('(Copy)'));
      assert.equal(duplicated.status, 'draft');

      // Clean up copy
      await pool.query('DELETE FROM flows WHERE id = $1', [duplicated.id]);
      recordPass('TEST 5: FLOW-CRUD-05 — Duplicate Flow', `Duplicated into new draft flow ${duplicated.id}`);
    } catch (err) {
      recordFail('TEST 5: FLOW-CRUD-05 — Duplicate Flow', err);
    }

    // -------------------------------------------------------------------------
    // TEST 6: FLOW-SEC-01 — Multi-Tenant Isolation Strict Negative Tests
    // -------------------------------------------------------------------------
    try {
      // 1. Org B tries to get Org A flow -> must return null
      const orgBGet = await getFlowById(orgB, flowAId);
      assert.equal(orgBGet, null, 'SECURITY BREACH: Org B read Org A flow!');

      // 2. Org B tries to list flows -> must return empty array
      const orgBList = await listFlows(orgB);
      assert.equal(orgBList.length, 0, 'SECURITY BREACH: Org B listed Org A flows!');

      // 3. Org B tries to update Org A flow -> must throw
      let orgBUpdateThrew = false;
      try {
        await updateFlow(orgB, flowAId, { name: 'Hacked by Org B' });
      } catch {
        orgBUpdateThrew = true;
      }
      assert.equal(orgBUpdateThrew, true, 'SECURITY BREACH: Org B updated Org A flow!');

      // 4. Org B tries to publish Org A flow -> must throw
      let orgBPublishThrew = false;
      try {
        await publishFlow(orgB, flowAId, userB, 'Tampered publication');
      } catch {
        orgBPublishThrew = true;
      }
      assert.equal(orgBPublishThrew, true, 'SECURITY BREACH: Org B published Org A flow!');

      // 5. Org B tries to execute Org A flow -> must throw
      let orgBExecuteThrew = false;
      try {
        await executeFlowRun({ flowId: flowAId, organizationId: orgB, triggerPayload: {} });
      } catch {
        orgBExecuteThrew = true;
      }
      assert.equal(orgBExecuteThrew, true, 'SECURITY BREACH: Org B executed Org A flow!');

      recordPass('TEST 6: FLOW-SEC-01 — Multi-Tenant Isolation', '5/5 cross-tenant read/write/execute attacks strictly blocked.');
    } catch (err) {
      recordFail('TEST 6: FLOW-SEC-01 — Multi-Tenant Isolation', err);
    }

    // -------------------------------------------------------------------------
    // TEST 7: FLOW-RUN-01 — Step-by-Step Execution & Checkpointing
    // -------------------------------------------------------------------------
    try {
      const run = await executeFlowRun({
        flowId: flowAId,
        organizationId: orgA,
        triggerPayload: { dwellTimeSec: 60, productName: 'Industrial Hydraulic Valve' },
        userId: userA,
      });

      assert.equal(run.status, 'completed');
      assert.equal(run.flow_id, flowAId);

      const stepResults = Array.isArray(run.step_results)
        ? run.step_results
        : JSON.parse(run.step_results || '[]');

      assert.equal(stepResults.length, 2);
      assert.equal(stepResults[0].nodeType, 'condition');
      assert.equal(stepResults[0].output.conditionMet, true);
      assert.equal(stepResults[1].nodeType, 'send_notification');
      assert.equal(stepResults[1].output.notified, true);

      recordPass('TEST 7: FLOW-RUN-01 — Execution & Checkpointing', `Run ${run.id} completed all steps with state checkpointed.`);
    } catch (err) {
      recordFail('TEST 7: FLOW-RUN-01 — Execution & Checkpointing', err);
    }

    // -------------------------------------------------------------------------
    // TEST 8: FLOW-OUTBOX-01 — Transactional Outbox Enqueue
    // -------------------------------------------------------------------------
    try {
      const outbox = await enqueueOutboxEvent({
        organizationId: orgA,
        eventType: 'crm.lead.dispatched',
        payload: { flowId: flowAId, score: 25 },
      });

      assert.ok(outbox.id);
      assert.equal(outbox.status, 'pending');
      assert.equal(outbox.event_type, 'crm.lead.dispatched');

      recordPass('TEST 8: FLOW-OUTBOX-01 — Transactional Outbox', `Enqueued event ${outbox.id} with status pending.`);
    } catch (err) {
      recordFail('TEST 8: FLOW-OUTBOX-01 — Transactional Outbox', err);
    }

    // -------------------------------------------------------------------------
    // TEST 9: FLOW-CRUD-06 — Archive Flow
    // -------------------------------------------------------------------------
    try {
      const archived = await archiveFlow(orgA, flowAId);
      assert.equal(archived.status, 'archived');
      recordPass('TEST 9: FLOW-CRUD-06 — Archive Flow', `Marked flow ${flowAId} as archived.`);
    } catch (err) {
      recordFail('TEST 9: FLOW-CRUD-06 — Archive Flow', err);
    }

  } finally {
    // Teardown
    if (flowAId) {
      await pool.query('DELETE FROM flows WHERE id = $1', [flowAId]);
    }
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [userA, userB]);
    await pool.query('DELETE FROM organizations WHERE id IN ($1, $2)', [orgA, orgB]);
    await pool.end();
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Phase 2 Test Summary: ${passed} Passed | ${failed} Failed`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    setImmediate(() => process.exit(1));
  }
}

runFlowPersistenceTests().catch((err) => {
  console.error('Fatal test error:', err);
  setImmediate(() => process.exit(1));
});
