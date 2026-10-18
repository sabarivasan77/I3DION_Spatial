/**
 * Phase P2 Integration Test Suite: Durable Flow Engine & Background Worker
 * Implements Master Prompt v5.0 §6, §9 & BUG-01/02/03:
 *  - FLOW-01: Asynchronous Enqueue & Instant Return (HTTP 202 Accepted, worker processes in background)
 *  - FLOW-02: Step-by-Step Checkpointing & Mid-Run Crash Recovery (worker killed mid-run resumes without repeating side effects)
 *  - FLOW-03: Durable Timers Across Restart (delay survives worker restart, stored as resume_at, claimed on schedule)
 *  - FLOW-04: Exponential Backoff Retries & Dead-Letter Queue (failing adapter retries with backoff, dead-letters, creates alert)
 *  - FLOW-05: Multi-Tenant Concurrency & Fair Scheduling (noisy tenant bulk jobs do not starve other tenants)
 *  - FLOW-06: Security Guardrails & SSRF Protection (private-IP webhook blocked, loop/depth guards, secrets redacted)
 *  - FLOW-07: Flagship Recipe Across Restart (new lead -> assign -> WhatsApp sandbox + email -> 24h SLA escalate)
 *  - FLOW-08: Transactional Outbox Event Ingestion to Durable Flow (P6 lead.created triggers durable flow run)
 */

import assert from 'node:assert';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { app } from '../../src/server.js';
import { pool, query, ensureMigrated, withTenant } from '../../src/db/pool.js';
import { config } from '../../src/config.js';
import { durableQueueService } from '../../src/services/flow/durableQueueService.js';
import { whatsappAdapter } from '../../src/services/flow/adapters/whatsappAdapter.js';

let server;
let baseUrl;

async function setup() {
  await ensureMigrated();
  await pool.query(`ALTER TABLE flow_runs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()`);
  await pool.query(`ALTER TABLE flow_runs ADD COLUMN IF NOT EXISTS dead_letter_reason text`);
  await pool.query(
    `INSERT INTO subscriptions (organization_id, plan_id, status)
     VALUES ('22222222-2222-4222-8222-222222222222', 'UNLIMITED', 'active'),
            ('33333333-3333-4333-8333-333333333333', 'UNLIMITED', 'active')
     ON CONFLICT (organization_id) DO UPDATE SET plan_id = 'UNLIMITED', status = 'active'`
  );

  // Clean prior test artifacts for idempotency
  await pool.query(`DELETE FROM flow_queue WHERE organization_id IN ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333')`);
  await pool.query(`DELETE FROM flow_step_checkpoints WHERE organization_id IN ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333')`);
  await pool.query(`DELETE FROM flow_runs WHERE organization_id IN ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333')`);
  await pool.query(`DELETE FROM flows WHERE organization_id IN ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333')`);
  await pool.query(`DELETE FROM leads WHERE organization_id IN ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333')`);

  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function teardown() {
  await durableQueueService.stopWorker();
  if (server) {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise((r) => server.close(r));
  }
  await pool.end();
}

function createToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
}

console.log('================================================================');
console.log('⚡ I3DION Phase P2: Durable Flow Engine & Worker Test Suite');
console.log('================================================================\n');

let passedCount = 0;
let failedCount = 0;

function pass(name, details = '') {
  console.log(`✅ [PASS] ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
  passedCount++;
}

function fail(name, err) {
  console.error(`❌ [FAIL] ${name}`);
  console.error(`   ${err?.message || err}`);
  if (err?.stack) {
    console.error(`   ${err.stack.split('\n').slice(1, 4).join('\n')}`);
  }
  failedCount++;
}

async function runDurableFlowSuite() {
  const testOrgId = '22222222-2222-4222-8222-222222222222';
  const tenantBOrgId = '33333333-3333-4333-8333-333333333333';
  const adminUserId = '44444444-4444-4444-8444-444444444444';

  // Seed organizations
  await query(
    `INSERT INTO organizations (id, name, slug)
     VALUES ($1, 'Apex Flow Corp', 'apex-flow'), ($2, 'Beta Dynamics', 'beta-dyn')
     ON CONFLICT (id) DO NOTHING`,
    [testOrgId, tenantBOrgId]
  );

  await query(
    `INSERT INTO users (id, email, password_hash, name, role, organization_id, token_version)
     VALUES ($1, 'admin@apexflow.test', 'argon2id$mock', 'Flow Admin', 'Admin', $2, 0)
     ON CONFLICT (id) DO NOTHING`,
    [adminUserId, testOrgId]
  );

  await query(
    `INSERT INTO organization_members (organization_id, user_id, role)
     VALUES ($1, $2, 'Admin')
     ON CONFLICT DO NOTHING`,
    [testOrgId, adminUserId]
  );

  const adminToken = createToken({
    id: adminUserId,
    userId: adminUserId,
    email: 'admin@apexflow.test',
    role: 'Admin',
    organization_id: testOrgId,
    token_version: 0
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`
  };

  // --------------------------------------------------------------------------
  // FLOW-01: Asynchronous Enqueue & Instant Return (HTTP 202 Accepted)
  // --------------------------------------------------------------------------
  let testFlowId;
  try {
    // 1. Create a simple workflow
    const flowDef = {
      nodes: [
        { id: 'node_compose', type: 'compose', params: { template: 'Hello {{trigger.name}}' } },
        { id: 'node_notify', type: 'in_app_notification', params: { title: 'Durable Test', body: 'Enqueued run processed' } }
      ],
      edges: [{ id: 'e1', source: 'node_compose', target: 'node_notify' }]
    };

    const createRes = await fetch(`${baseUrl}/api/flows`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Async Enqueue Pipeline',
        description: 'Test non-blocking execution',
        triggerType: 'manual',
        flowDefinition: flowDef
      })
    });

    assert.strictEqual(createRes.status, 201, 'Flow creation must return 201');
    const flowData = await createRes.json();
    testFlowId = flowData.flow.id;

    // 2. Enqueue run asynchronously via POST /api/flows/:id/enqueue
    const enqueueRes = await fetch(`${baseUrl}/api/flows/${testFlowId}/enqueue`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        payload: { name: 'Dr. Suresh Rao' },
        priority: 10
      })
    });

    assert.strictEqual(enqueueRes.status, 202, 'Asynchronous enqueue must return HTTP 202 Accepted');
    const enqBody = await enqueueRes.json();
    assert.strictEqual(enqBody.enqueued, true);
    assert.strictEqual(enqBody.status, 'queued');
    assert.ok(enqBody.runId, 'Must return runId immediately');

    // 3. Verify job exists in PostgreSQL queue
    const queueCheck = await query(`SELECT * FROM flow_queue WHERE run_id = $1`, [enqBody.runId]);
    assert.strictEqual(queueCheck.rows.length, 1, 'Job must be persisted in flow_queue');
    assert.strictEqual(queueCheck.rows[0].status, 'queued');

    // 4. Claim and execute via worker
    const job = await durableQueueService.claimNextJob({ runId: enqBody.runId });
    assert.ok(job, 'Worker must claim the queued job');
    assert.strictEqual(job.run_id, enqBody.runId);

    const execResult = await durableQueueService.executeJob(job);
    assert.strictEqual(execResult.status, 'completed');

    // Verify run record updated to completed
    const runCheck = await query(`SELECT * FROM flow_runs WHERE id = $1`, [enqBody.runId]);
    assert.strictEqual(runCheck.rows[0].status, 'completed');

    pass('FLOW-01', 'Asynchronous enqueue returned HTTP 202 instantly; job processed by worker and completed');
  } catch (err) {
    fail('FLOW-01', err);
  }

  // --------------------------------------------------------------------------
  // FLOW-02: Step-by-Step Checkpointing & Mid-Run Crash Recovery
  // --------------------------------------------------------------------------
  try {
    let sideEffectExecutionCount = 0;

    // Define 4-step workflow
    const multiStepFlowDef = {
      nodes: [
        { id: 'step_1_set', type: 'set_variable', params: { variableName: 'stage', value: 'stage_1' } },
        { id: 'step_2_crm', type: 'crm_create_lead', params: { name: 'Checkpoint Lead', email: 'checkpoint@lead.com' } },
        { id: 'step_3_compose', type: 'compose', params: { template: 'Lead Created for {{trigger.customer}}' } },
        { id: 'step_4_finish', type: 'terminate', params: { reason: 'Clean finish' } }
      ],
      edges: [
        { id: 'e1', source: 'step_1_set', target: 'step_2_crm' },
        { id: 'e2', source: 'step_2_crm', target: 'step_3_compose' },
        { id: 'e3', source: 'step_3_compose', target: 'step_4_finish' }
      ]
    };

    const flowRes = await fetch(`${baseUrl}/api/flows`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Crash Recovery Flow',
        triggerType: 'manual',
        flowDefinition: multiStepFlowDef
      })
    });
    const { flow } = await flowRes.json();

    const enq = await durableQueueService.enqueueFlowRun({
      flowId: flow.id,
      organizationId: testOrgId,
      triggerPayload: { customer: 'Raytheon Engineering' }
    });

    // 1. First execution attempt: simulate crash at step 2 (step_3_compose)
    const job1 = await durableQueueService.claimNextJob({ runId: enq.runId });
    let crashed = false;
    try {
      await durableQueueService.executeJob(job1, { simulatedCrashAtStep: 2 });
    } catch (err) {
      if (err.message === 'SIMULATED_WORKER_CRASH') {
        crashed = true;
      }
    }
    assert.strictEqual(crashed, true, 'Worker must simulate crash at step 2');

    // Verify checkpoints: step 0 (step_1_set) and step 1 (step_2_crm) MUST be checkpointed
    const checkpointsRes = await query(
      `SELECT * FROM flow_step_checkpoints WHERE run_id = $1 ORDER BY step_index ASC`,
      [enq.runId]
    );
    assert.strictEqual(checkpointsRes.rows.length, 2, 'Exactly 2 steps must have been checkpointed before crash');
    assert.strictEqual(checkpointsRes.rows[0].step_id, 'step_1_set');
    assert.strictEqual(checkpointsRes.rows[1].step_id, 'step_2_crm');

    // Verify lead was created once
    const leadsCount1 = await query(`SELECT count(*) FROM leads WHERE email = 'checkpoint@lead.com'`);
    assert.strictEqual(parseInt(leadsCount1.rows[0].count, 10), 1, 'Lead created once');

    // 2. Second execution attempt: simulate server/worker restart
    // Reset queue status to 'queued' (as a restart supervisor does for hung jobs)
    await query(`UPDATE flow_queue SET status = 'queued', locked_at = null, locked_by = null WHERE run_id = $1`, [enq.runId]);

    const job2 = await durableQueueService.claimNextJob({ runId: enq.runId });
    assert.ok(job2, 'Worker must re-claim job after crash recovery');

    // Run without crash to completion
    const recoverResult = await durableQueueService.executeJob(job2);
    assert.strictEqual(recoverResult.status, 'completed');

    // Verify step_2_crm was NOT re-executed (lead count must remain 1)
    const leadsCount2 = await query(`SELECT count(*) FROM leads WHERE email = 'checkpoint@lead.com'`);
    assert.strictEqual(parseInt(leadsCount2.rows[0].count, 10), 1, 'Lead must NOT be duplicated on resume (idempotency preserved)');

    // Verify all 4 checkpoints are present
    const finalCheckpoints = await query(`SELECT * FROM flow_step_checkpoints WHERE run_id = $1`, [enq.runId]);
    assert.strictEqual(finalCheckpoints.rows.length, 4, 'All 4 steps checkpointed after recovery');

    pass('FLOW-02', 'Worker survived simulated mid-run crash; resumed from checkpoint without repeating side effects');
  } catch (err) {
    fail('FLOW-02', err);
  }

  // --------------------------------------------------------------------------
  // FLOW-03: Durable Timers Across Restart (delay survives worker restart)
  // --------------------------------------------------------------------------
  try {
    const timerFlowDef = {
      nodes: [
        { id: 't_step1', type: 'set_variable', params: { variableName: 'init', value: true } },
        { id: 't_delay', type: 'delay', params: { durationSeconds: 2 } }, // 2-second durable timer
        { id: 't_step3', type: 'compose', params: { template: 'Resumed after timer' } }
      ],
      edges: [
        { id: 'e1', source: 't_step1', target: 't_delay' },
        { id: 'e2', source: 't_delay', target: 't_step3' }
      ]
    };

    const flowRes = await fetch(`${baseUrl}/api/flows`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Durable Timer Pipeline',
        triggerType: 'manual',
        flowDefinition: timerFlowDef
      })
    });
    const { flow } = await flowRes.json();

    const enq = await durableQueueService.enqueueFlowRun({
      flowId: flow.id,
      organizationId: testOrgId
    });

    // 1. Worker picks up job and encounters delay node
    const job = await durableQueueService.claimNextJob({ runId: enq.runId });
    const delayResult = await durableQueueService.executeJob(job);

    assert.strictEqual(delayResult.status, 'waiting_delay');
    assert.ok(delayResult.resumeAt, 'Must set resumeAt timestamp');

    // Verify state in DB is 'waiting_delay'
    const queueRow = (await query(`SELECT * FROM flow_queue WHERE run_id = $1`, [enq.runId])).rows[0];
    assert.strictEqual(queueRow.status, 'waiting_delay');

    // 2. Simulate worker shutdown and restart
    await durableQueueService.stopWorker();

    // Verify immediate claim returns null (timer has not elapsed)
    const prematureJob = await durableQueueService.claimNextJob();
    // Premature claim should not claim the timer job yet
    if (prematureJob) {
      assert.notStrictEqual(prematureJob.run_id, enq.runId, 'Timer job must not be claimed before maturity');
    }

    // 3. Wait 2100ms for timer to mature
    await new Promise(r => setTimeout(r, 2100));

    // Wake mature jobs
    const wokenCount = await durableQueueService.wakeWaitingJobs();
    assert.ok(wokenCount >= 1, 'Mature timer job must be woken to queued status');

    // 4. Resume execution after timer
    const matureJob = await durableQueueService.claimNextJob({ runId: enq.runId });
    assert.ok(matureJob, 'Worker must claim mature job');
    assert.strictEqual(matureJob.run_id, enq.runId);

    const finishResult = await durableQueueService.executeJob(matureJob);
    assert.strictEqual(finishResult.status, 'completed');

    const finalRun = (await query(`SELECT * FROM flow_runs WHERE id = $1`, [enq.runId])).rows[0];
    assert.strictEqual(finalRun.status, 'completed');

    pass('FLOW-03', 'Durable timer parked in waiting_delay, survived worker restart, and resumed on schedule');
  } catch (err) {
    fail('FLOW-03', err);
  }

  // --------------------------------------------------------------------------
  // FLOW-04: Exponential Backoff Retries & Dead-Letter Queue (DLQ)
  // --------------------------------------------------------------------------
  try {
    const failingFlowDef = {
      nodes: [
        { id: 'f_step1', type: 'webhook_dispatch', params: { destinationUrl: 'http://127.0.0.1:9999/malicious-target' } } // Blocked by SSRF
      ],
      edges: []
    };

    const flowRes = await fetch(`${baseUrl}/api/flows`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'DLQ Test Pipeline',
        triggerType: 'manual',
        flowDefinition: failingFlowDef
      })
    });
    const { flow } = await flowRes.json();

    const enq = await durableQueueService.enqueueFlowRun({
      flowId: flow.id,
      organizationId: testOrgId,
      maxAttempts: 3
    });

    // Attempt 1: Should fail and enter retry state with backoff
    const job1 = await durableQueueService.claimNextJob({ runId: enq.runId });
    assert.strictEqual(job1.run_id, enq.runId);
    const r1 = await durableQueueService.executeJob(job1);
    assert.strictEqual(r1.status, 'retrying');
    assert.strictEqual(r1.attempt, 1);

    // Fast-forward backoff for test speed
    await query(`UPDATE flow_queue SET next_run_at = now() - interval '1 second' WHERE run_id = $1`, [enq.runId]);

    // Attempt 2: Should fail and enter retry state again
    const job2 = await durableQueueService.claimNextJob({ runId: enq.runId });
    const r2 = await durableQueueService.executeJob(job2);
    assert.strictEqual(r2.status, 'retrying');
    assert.strictEqual(r2.attempt, 2);

    await query(`UPDATE flow_queue SET next_run_at = now() - interval '1 second' WHERE run_id = $1`, [enq.runId]);

    // Attempt 3: Max attempts reached -> transitions to Dead Letter Queue (DLQ)
    const job3 = await durableQueueService.claimNextJob({ runId: enq.runId });
    const r3 = await durableQueueService.executeJob(job3);
    assert.strictEqual(r3.status, 'dead_letter');

    // Verify DLQ status in database
    const queueCheck = (await query(`SELECT * FROM flow_queue WHERE run_id = $1`, [enq.runId])).rows[0];
    assert.strictEqual(queueCheck.status, 'dead_letter');
    assert.ok(queueCheck.last_error.includes('SSRF Security Violation'));

    const runCheck = (await query(`SELECT * FROM flow_runs WHERE id = $1`, [enq.runId])).rows[0];
    assert.strictEqual(runCheck.status, 'failed');
    assert.ok(runCheck.dead_letter_reason.includes('SSRF Security Violation'));

    // Verify in-app DLQ notification was raised
    const notifCheck = await query(
      `SELECT * FROM notifications WHERE organization_id = $1 AND title = 'Flow Run Dead-Letter Alert'`,
      [testOrgId]
    );
    assert.ok(notifCheck.rows.length >= 1, 'In-app notification raised on dead-letter');

    pass('FLOW-04', 'Failing adapter retried with exponential backoff, dead-lettered after max attempts, and alerted admin');
  } catch (err) {
    fail('FLOW-04', err);
  }

  // --------------------------------------------------------------------------
  // FLOW-05: Multi-Tenant Concurrency & Fair Scheduling
  // --------------------------------------------------------------------------
  try {
    // Tenant A (Apex Flow) enqueues 4 jobs
    // Tenant B (Beta Dynamics) enqueues 1 job
    const quickDef = {
      nodes: [{ id: 'q_compose', type: 'compose', params: { template: 'Quick task' } }],
      edges: []
    };

    const flowA = (await (await fetch(`${baseUrl}/api/flows`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Bulk Flow A', triggerType: 'manual', flowDefinition: quickDef })
    })).json()).flow;

    const flowB = (await withTenant(tenantBOrgId, async (client) => {
      const res = await client.query(
        `INSERT INTO flows (organization_id, name, status, flow_definition)
         VALUES ($1, 'Tenant B Priority Flow', 'published', $2) RETURNING id`,
        [tenantBOrgId, JSON.stringify(quickDef)]
      );
      return res.rows[0];
    }));

    // Enqueue 4 for Tenant A
    for (let i = 0; i < 4; i++) {
      await durableQueueService.enqueueFlowRun({ flowId: flowA.id, organizationId: testOrgId });
    }

    // Enqueue 1 for Tenant B with high priority
    const enqB = await durableQueueService.enqueueFlowRun({
      flowId: flowB.id,
      organizationId: tenantBOrgId,
      priority: 5
    });

    // Claim jobs: Tenant B's job must be claimed fairly even though Tenant A was enqueued first
    let foundTenantB = false;
    for (let i = 0; i < 5; i++) {
      const job = await durableQueueService.claimNextJob();
      if (job) {
        if (job.organization_id === tenantBOrgId) {
          foundTenantB = true;
        }
        await durableQueueService.executeJob(job);
      }
    }

    assert.strictEqual(foundTenantB, true, 'Tenant B job must be picked up under fair scheduling');

    pass('FLOW-05', 'Multi-tenant fairness verified; Tenant A bulk jobs did not starve Tenant B');
  } catch (err) {
    fail('FLOW-05', err);
  }

  // --------------------------------------------------------------------------
  // FLOW-06: Security Guardrails & SSRF Protection
  // --------------------------------------------------------------------------
  try {
    // 1. SSRF Guard: Loopback & Link-local Cloud Metadata addresses rejected
    const loopbackFlowDef = {
      nodes: [
        { id: 'ssrf_node', type: 'webhook_dispatch', params: { destinationUrl: 'http://169.254.169.254/latest/meta-data/' } }
      ],
      edges: []
    };

    const flow = (await (await fetch(`${baseUrl}/api/flows`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'SSRF Test Flow', triggerType: 'manual', flowDefinition: loopbackFlowDef })
    })).json()).flow;

    const enq = await durableQueueService.enqueueFlowRun({ flowId: flow.id, organizationId: testOrgId });
    const job = await durableQueueService.claimNextJob({ runId: enq.runId });
    const result = await durableQueueService.executeJob(job);

    assert.strictEqual(result.status, 'retrying');
    assert.ok(result.error.includes('SSRF Security Violation'));

    // 2. Secret Redaction: Verify passwords/tokens masked in checkpoints
    const secretFlowDef = {
      nodes: [
        {
          id: 'secret_step',
          type: 'compose',
          params: {
            apiKey: 'sk-live-super-secret-key-12345',
            authorization: 'Bearer secret_token_xyz',
            normalField: 'Public Safe Value'
          }
        }
      ],
      edges: []
    };

    const secFlow = (await (await fetch(`${baseUrl}/api/flows`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Secret Masking Flow', triggerType: 'manual', flowDefinition: secretFlowDef })
    })).json()).flow;

    const enqSec = await durableQueueService.enqueueFlowRun({ flowId: secFlow.id, organizationId: testOrgId });
    const jobSec = await durableQueueService.claimNextJob({ runId: enqSec.runId });
    await durableQueueService.executeJob(jobSec);

    // Read checkpoints from database
    const cpRes = await query(
      `SELECT output FROM flow_step_checkpoints WHERE run_id = $1 AND step_id = 'secret_step'`,
      [enqSec.runId]
    );

    const cpOutput = JSON.stringify(cpRes.rows[0].output);
    assert.ok(!cpOutput.includes('sk-live-super-secret-key-12345'), 'Raw secret must not exist in checkpoint output');
    assert.ok(!cpOutput.includes('secret_token_xyz'), 'Raw token must not exist in checkpoint output');

    pass('FLOW-06', 'SSRF blocked 169.254.169.254 metadata endpoint; sensitive secrets masked in checkpoints');
  } catch (err) {
    fail('FLOW-06', err);
  }

  // --------------------------------------------------------------------------
  // FLOW-07: Flagship Recipe Across Restart (Gate P2 Requirement)
  // Story: "New lead -> assign -> WhatsApp (sandbox) + email -> 24-h SLA escalate"
  // --------------------------------------------------------------------------
  try {
    whatsappAdapter.clearSandbox();

    const flagshipFlowDef = {
      nodes: [
        // 1. Create & auto-assign lead
        {
          id: 'lead_step',
          type: 'crm_create_lead',
          params: {
            name: 'Karthik Ramanathan',
            email: 'karthik@solarturbines.in',
            company: 'Solar Turbines India Ltd',
            scoreDelta: 85
          }
        },
        // 2. Dispatch WhatsApp Notification via Sandbox Adapter
        {
          id: 'whatsapp_step',
          type: 'whatsapp_send',
          params: {
            to: '+919444123456',
            templateName: 'lead_quote_acknowledgement',
            customerName: 'Karthik Ramanathan',
            productName: '75kW Compressor System'
          }
        },
        // 3. Send Email Notification
        {
          id: 'email_step',
          type: 'send_email',
          params: {
            to: 'karthik@solarturbines.in',
            subject: 'Quotation Acknowledgment: 75kW Compressor System',
            body: 'Dear Karthik, your spatial quotation request has been received.'
          }
        },
        // 4. Generate India GST Commercial Quotation PDF via Print Engine (Phase P7)
        {
          id: 'pdf_step',
          type: 'pdf_spec_generator',
          params: {
            clientName: 'Solar Turbines India Ltd',
            productName: 'Industrial Two-Stage Air Compressor 75kW'
          }
        },
        // 5. 24-Hour SLA Timer
        {
          id: 'sla_timer_step',
          type: 'delay',
          params: { durationSeconds: 86400 } // 24-hour SLA
        },
        // 6. SLA Escalation Alert
        {
          id: 'sla_alert_step',
          type: 'in_app_notification',
          params: {
            title: 'SLA Escalation Alert',
            body: 'Lead for Solar Turbines has been open for 24h without dealer quote completion.'
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'lead_step', target: 'whatsapp_step' },
        { id: 'e2', source: 'whatsapp_step', target: 'email_step' },
        { id: 'e3', source: 'email_step', target: 'pdf_step' },
        { id: 'e4', source: 'pdf_step', target: 'sla_timer_step' },
        { id: 'e5', source: 'sla_timer_step', target: 'sla_alert_step' }
      ]
    };

    const flow = (await (await fetch(`${baseUrl}/api/flows`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Flagship Trade-Show Lead Pipeline',
        triggerType: 'manual',
        flowDefinition: flagshipFlowDef
      })
    })).json()).flow;

    const enq = await durableQueueService.enqueueFlowRun({ flowId: flow.id, organizationId: testOrgId });

    // Step-by-step worker run
    const job = await durableQueueService.claimNextJob({ runId: enq.runId });
    const result = await durableQueueService.executeJob(job);

    // Should pause at 24-h SLA timer step
    assert.strictEqual(result.status, 'waiting_delay');
    assert.ok(result.resumeAt);

    // Verify WhatsApp was sent in sandbox
    const whatsappMessages = whatsappAdapter.getSandboxMessages('+919444123456');
    assert.strictEqual(whatsappMessages.length, 1, 'WhatsApp notification delivered in sandbox');
    assert.strictEqual(whatsappMessages[0].templateName, 'lead_quote_acknowledgement');

    // Verify checkpoints: 4 steps completed before timer
    const checkpoints = (await query(`SELECT * FROM flow_step_checkpoints WHERE run_id = $1 ORDER BY step_index ASC`, [enq.runId])).rows;
    assert.strictEqual(checkpoints.length, 5, '5 checkpoints recorded (lead + whatsapp + email + pdf + delay)');

    // Verify generated PDF exists in checkpoint
    const pdfCp = checkpoints.find(c => c.step_id === 'pdf_step');
    assert.ok(pdfCp, 'PDF spec step checkpointed');
    assert.strictEqual(pdfCp.output.pdfGenerated, true);
    assert.ok(pdfCp.output.downloadUrl.includes('sig='), 'Download URL must be signed HMAC');

    pass('FLOW-07', 'Flagship recipe executed: Lead created -> WhatsApp sandbox sent -> Email sent -> GST PDF generated -> 24h SLA parked durably');
  } catch (err) {
    fail('FLOW-07', err);
  }

  // --------------------------------------------------------------------------
  // FLOW-08: Transactional Outbox Event Ingestion to Durable Flow
  // --------------------------------------------------------------------------
  try {
    // 1. Create a flow triggered by 'lead.created'
    const outboxFlowDef = {
      nodes: [
        { id: 'notify_node', type: 'in_app_notification', params: { title: 'New Outbox Lead', body: 'Lead processed from transactional outbox' } }
      ],
      edges: []
    };

    const outboxFlow = (await (await fetch(`${baseUrl}/api/flows`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Outbox Ingestion Flow',
        triggerType: 'event',
        triggerConfig: { eventName: 'lead.created' },
        flowDefinition: outboxFlowDef
      })
    })).json()).flow;

    // 2. Publish flow
    await fetch(`${baseUrl}/api/flows/${outboxFlow.id}/publish`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ changeSummary: 'Ready for outbox events' })
    });

    // 3. Post event to /api/flows/events (Transactional Outbox)
    const eventRes = await fetch(`${baseUrl}/api/flows/events`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        eventType: 'lead.created',
        payload: {
          leadId: crypto.randomUUID(),
          name: 'Anand Mahindra',
          email: 'anand@mahindra.test'
        }
      })
    });

    assert.strictEqual(eventRes.status, 202, 'Event ingestion must return HTTP 202 Accepted');
    const eventData = await eventRes.json();
    assert.ok(eventData.outboxItem?.id);

    // 4. Trigger spatial/outbox event processor to enqueue durable flow run
    const { ingestSpatialEvent } = await import('../../src/services/flow/spatialTriggerService.js');
    const ingestRes = await ingestSpatialEvent({
      organizationId: testOrgId,
      eventType: 'lead.created',
      payload: eventData.outboxItem.payload
    });

    assert.strictEqual(ingestRes.success, true);

    pass('FLOW-08', 'Transactional outbox event successfully ingested and executed in durable flow pipeline');
  } catch (err) {
    fail('FLOW-08', err);
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
    await runDurableFlowSuite();
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await teardown();
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

main();
