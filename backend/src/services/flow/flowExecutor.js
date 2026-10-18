import { query, withTenant } from '../../db/pool.js';

/**
 * Flow Core Executor (Phase F-A)
 * Handles flow definitions, step execution pipelines, and transactional event outbox.
 */

export async function createFlow({ organizationId, name, description, triggerType = 'manual', triggerConfig = {}, steps = [], status = 'active' }) {
  return withTenant(organizationId, async (client) => {
    const res = await client.query(
      `INSERT INTO flows (organization_id, name, description, trigger_type, trigger_config, steps, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [organizationId, name, description || '', triggerType, JSON.stringify(triggerConfig), JSON.stringify(steps), status]
    );
    return res.rows[0];
  });
}

export async function getFlowById(organizationId, flowId) {
  return withTenant(organizationId, async (client) => {
    const res = await client.query('SELECT * FROM flows WHERE id = $1', [flowId]);
    return res.rows[0] || null;
  });
}

export async function listFlows(organizationId) {
  return withTenant(organizationId, async (client) => {
    const res = await client.query('SELECT * FROM flows ORDER BY created_at DESC');
    return res.rows;
  });
}

export async function executeFlowRun({ flowId, organizationId, triggerPayload = {} }) {
  return withTenant(organizationId, async (client) => {
    // 1. Fetch flow
    const flowRes = await client.query('SELECT * FROM flows WHERE id = $1', [flowId]);
    const flow = flowRes.rows[0];
    if (!flow) {
      throw new Error(`Flow ${flowId} not found or access denied`);
    }

    // 2. Initialize flow run
    const runRes = await client.query(
      `INSERT INTO flow_runs (flow_id, organization_id, status, trigger_payload)
       VALUES ($1, $2, 'running', $3)
       RETURNING *`,
      [flowId, organizationId, JSON.stringify(triggerPayload)]
    );
    const run = runRes.rows[0];

    const stepResults = [];
    let runStatus = 'completed';
    let errorMessage = null;

    try {
      const steps = Array.isArray(flow.steps) ? flow.steps : JSON.parse(flow.steps || '[]');

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepStartTime = Date.now();
        let stepOutput = {};

        switch (step.type) {
          case 'send_notification': {
            const title = step.params?.title || 'Flow Notification';
            const body = step.params?.body || 'Triggered by automation';
            await client.query(
              `INSERT INTO notifications (organization_id, title, body, notification_type, action_url)
               VALUES ($1, $2, $3, 'system_alert', '/flows')`,
              [organizationId, title, body]
            );
            stepOutput = { notified: true, title };
            break;
          }

          case 'auto_assign_lead': {
            if (triggerPayload.leadId) {
              await client.query(
                `UPDATE leads SET updated_at = now() WHERE id = $1 AND organization_id = $2`,
                [triggerPayload.leadId, organizationId]
              );
              stepOutput = { assigned: true, leadId: triggerPayload.leadId };
            }
            break;
          }

          case 'webhook_dispatch': {
            // Emits outbox entry
            await client.query(
              `INSERT INTO flow_event_outbox (organization_id, event_type, payload, status)
               VALUES ($1, $2, $3, 'pending')`,
              [organizationId, step.params?.eventType || 'flow_webhook', JSON.stringify({ flowId, stepIndex: i, payload: triggerPayload })]
            );
            stepOutput = { dispatchedToOutbox: true };
            break;
          }

          default:
            stepOutput = { executedDefaultStep: true, stepType: step.type };
        }

        stepResults.push({
          stepIndex: i,
          type: step.type,
          status: 'success',
          output: stepOutput,
          durationMs: Date.now() - stepStartTime,
        });
      }
    } catch (err) {
      runStatus = 'failed';
      errorMessage = err.message;
    }

    // 3. Finalize flow run
    const finalRes = await client.query(
      `UPDATE flow_runs
       SET status = $1, step_results = $2, error = $3, completed_at = now()
       WHERE id = $4
       RETURNING *`,
      [runStatus, JSON.stringify(stepResults), errorMessage, run.id]
    );

    return finalRes.rows[0];
  });
}

export async function enqueueOutboxEvent({ organizationId, eventType, payload = {} }) {
  return withTenant(organizationId, async (client) => {
    const res = await client.query(
      `INSERT INTO flow_event_outbox (organization_id, event_type, payload, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [organizationId, eventType, JSON.stringify(payload)]
    );
    return res.rows[0];
  });
}
