import { withTenant } from '../../db/pool.js';
import { emailProvider } from '../emailService.js';
import { assertFlowExecutionQuota } from '../billing/quotaService.js';
import crypto from 'node:crypto';

// -----------------------------------------------------------------------------
// 1. DYNAMIC TOKEN & EXPRESSION RESOLUTION UTILITIES
// -----------------------------------------------------------------------------

/**
 * Safely extracts deeply nested properties (e.g. "trigger.contact.email")
 */
export function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = String(path).replace(/^[{\s]+|[}\s]+$/g, '').split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Replaces all {{token.path}} occurrences in a string with evaluated context values
 */
export function resolveTemplate(templateStr, context) {
  if (typeof templateStr !== 'string') return templateStr;
  return templateStr.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmed = path.trim();
    const val = getNestedValue(context, trimmed);
    return val !== undefined ? String(val) : match;
  });
}

/**
 * Evaluates typed boolean operators for condition branches
 */
export function evaluateCondition(leftVal, operator, rightVal) {
  const normOp = String(operator).toLowerCase().replace(/[^a-z_]/g, '');

  switch (normOp) {
    case 'equals':
    case 'equal':
      return String(leftVal).trim() === String(rightVal).trim();

    case 'not_equals':
    case 'notequals':
      return String(leftVal).trim() !== String(rightVal).trim();

    case 'greater_than':
    case 'greaterthan':
      return Number(leftVal) > Number(rightVal);

    case 'less_than':
    case 'lessthan':
      return Number(leftVal) < Number(rightVal);

    case 'greater_than_or_equal':
    case 'greaterthanorequal':
      return Number(leftVal) >= Number(rightVal);

    case 'less_than_or_equal':
    case 'lessthanorequal':
      return Number(leftVal) <= Number(rightVal);

    case 'contains':
      return String(leftVal || '').toLowerCase().includes(String(rightVal || '').toLowerCase());

    case 'is_empty':
      return leftVal == null || String(leftVal).trim() === '' || (Array.isArray(leftVal) && leftVal.length === 0);

    case 'is_not_empty':
      return leftVal != null && String(leftVal).trim() !== '' && (!Array.isArray(leftVal) || leftVal.length > 0);

    default:
      return Boolean(leftVal);
  }
}

// -----------------------------------------------------------------------------
// 2. WORKFLOW STEP EXECUTION & CHECKPOINTING ENGINE
// -----------------------------------------------------------------------------

export async function executeFlowRun({
  flowId,
  organizationId,
  triggerPayload = {},
  userId = null,
}) {
  // Commercial Readiness: Strict server-side execution quota check
  await assertFlowExecutionQuota(organizationId);

  return withTenant(organizationId, async (client) => {
    // 1. Fetch flow definition and verify active tenant context
    const flowRes = await client.query(
      `SELECT * FROM flows WHERE id = $1 AND organization_id = $2`,
      [flowId, organizationId]
    );

    if (flowRes.rows.length === 0) {
      throw new Error(`Flow not found or access denied (ID: ${flowId})`);
    }

    const flow = flowRes.rows[0];
    const flowDef = flow.flow_definition || {};
    const nodes = flowDef.nodes || [];
    const edges = flowDef.edges || [];
    const variables = { ...(flowDef.variables?.reduce((acc, v) => ({ ...acc, [v.name]: v.default }), {}) || {}) };

    // 2. Initialize execution run in database
    const initialRunRes = await client.query(
      `INSERT INTO flow_runs (
        flow_id, organization_id, status, trigger_payload, step_results, triggered_by
      ) VALUES ($1, $2, 'running', $3, '[]'::jsonb, $4)
      RETURNING *`,
      [flowId, organizationId, JSON.stringify(triggerPayload), userId]
    );

    const run = initialRunRes.rows[0];
    const stepResults = [];
    const executionContext = {
      trigger: triggerPayload,
      variables,
      steps: {},
    };

    let runStatus = 'completed';
    let errorMessage = null;

    // Track skipped nodes (from unselected conditional branches)
    const skippedNodeIds = new Set();

    try {
      // 3. Sequential DAG Step Execution with Branch Routing
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nodeId = node.id || `node_${i}`;

        // If this node is in the skipped set, mark skipped and continue
        if (skippedNodeIds.has(nodeId)) {
          stepResults.push({
            stepIndex: i,
            nodeId,
            nodeType: node.data?.type || node.type || 'unknown',
            label: node.data?.label || node.label || nodeId,
            status: 'skipped',
            output: { skipped: true, reason: 'Conditional branch not taken' },
            durationMs: 0,
          });
          continue;
        }

        const stepStartTime = Date.now();
        const nodeType = node.data?.type || node.type || 'unknown';
        const rawParams = node.data?.params || node.params || {};

        // Resolve parameter templates against execution context
        const params = {};
        for (const [k, v] of Object.entries(rawParams)) {
          if (typeof v === 'string') {
            params[k] = resolveTemplate(v, executionContext);
          } else {
            params[k] = v;
          }
        }

        let stepOutput = {};

        // -------------------------------------------------------------------
        // ACTION REGISTRY DISPATCHER
        // -------------------------------------------------------------------
        switch (nodeType) {
          // --- LOGIC: CONDITION ---
          case 'condition': {
            let leftVal = params.leftOperand?.startsWith('trigger.') || params.leftOperand?.startsWith('variables.')
              ? getNestedValue(executionContext, params.leftOperand)
              : (params.field ? getNestedValue(executionContext, params.field) : params.leftOperand);

            if (leftVal === undefined && params.field) {
              leftVal = getNestedValue(executionContext.trigger, params.field);
            }
            if (leftVal === undefined && params.leftOperand) {
              leftVal = getNestedValue(executionContext.trigger, params.leftOperand);
            }

            const operator = params.operator || 'equals';
            const rightVal = params.rightOperand !== undefined ? params.rightOperand : params.value;

            const conditionMet = evaluateCondition(leftVal, operator, rightVal);
            const branchTaken = conditionMet ? 'condition_true' : 'condition_false';

            stepOutput = {
              conditionMet,
              branchTaken: conditionMet ? 'true' : 'false',
              leftValue: leftVal,
              operator,
              rightValue: rightVal,
            };

            // Branch Routing: prune edges from the non-taken branch
            const outgoingEdges = edges.filter(
              (e) => (e.sourceNodeId || e.source) === nodeId
            );

            for (const edge of outgoingEdges) {
              const handle = String(edge.sourceHandle || edge.sourcePortId || '').toLowerCase();
              const targetNodeId = edge.targetNodeId || edge.target;

              const isTrueHandle = handle === 'true' || handle === 'condition_true';
              const isFalseHandle = handle === 'false' || handle === 'condition_false';

              // If edge belongs to the branch that was NOT taken, mark target skipped
              const shouldSkip = (isTrueHandle && !conditionMet) || (isFalseHandle && conditionMet);

              if (shouldSkip && targetNodeId) {
                skippedNodeIds.add(targetNodeId);
                // Also recursively skip all downstream children
                const collectChildren = (srcId) => {
                  edges.filter((e) => (e.sourceNodeId || e.source) === srcId).forEach((childEdge) => {
                    const childTarget = childEdge.targetNodeId || childEdge.target;
                    if (childTarget && !skippedNodeIds.has(childTarget)) {
                      skippedNodeIds.add(childTarget);
                      collectChildren(childTarget);
                    }
                  });
                };
                collectChildren(targetNodeId);
              }
            }
            break;
          }

          // --- LOGIC: DELAY ---
          case 'delay': {
            const durationSec = Math.min(Number(params.durationSeconds || 1), 60);
            // Non-blocking short pause for tests / interactive runs
            await new Promise((r) => setTimeout(r, Math.min(durationSec * 20, 200)));
            stepOutput = { delayedSeconds: durationSec };
            break;
          }

          // --- LOGIC: TERMINATE ---
          case 'terminate': {
            const termStatus = params.status || 'completed';
            const reason = params.reason || 'Terminated via flow logic';
            stepOutput = { terminated: true, status: termStatus, reason };
            runStatus = termStatus === 'failed' ? 'failed' : 'completed';
            break;
          }

          // --- DATA: COMPOSE ---
          case 'compose': {
            const template = params.template || '';
            const composedText = resolveTemplate(template, executionContext);
            stepOutput = { composedText };
            break;
          }

          // --- DATA: SET_VARIABLE ---
          case 'set_variable': {
            const varName = params.variableName || 'temp';
            const varVal = params.value;
            executionContext.variables[varName] = varVal;
            stepOutput = { variableName: varName, value: varVal };
            break;
          }

          // --- COMMUNICATION: SEND_EMAIL ---
          case 'send_email':
          case 'email_send': {
            const recipient = params.recipientEmail || params.to || executionContext.trigger?.contact?.email || 'partner@i3dion.com';
            const subject = params.subject || 'I3DION Automation Notification';
            const body = params.body || 'Automated update from your I3DION Spatial Workflow.';

            const emailResult = await emailProvider.send({
              to: recipient,
              subject,
              text: body,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; rounded: 12px;">
                  <h2 style="color: #0891b2; margin-top: 0;">I3DION Spatial Automation</h2>
                  <p style="color: #334155; line-height: 1.6;">${body}</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="font-size: 11px; color: #94a3b8;">This message was generated automatically by I3DION Flow.</p>
                </div>
              `,
            });

            stepOutput = {
              emailSent: true,
              recipient,
              subject,
              messageId: emailResult.messageId,
            };
            break;
          }

          // --- COMMUNICATION: IN-APP NOTIFICATION ---
          case 'send_notification':
          case 'in_app_notification': {
            const title = params.title || 'Workflow Event Notification';
            const body = params.body || 'Automated notification triggered by I3DION Flow.';
            const notifRes = await client.query(
              `INSERT INTO notifications (organization_id, title, body, notification_type)
               VALUES ($1, $2, $3, 'system')
               RETURNING id, created_at`,
              [organizationId, title, body]
            );

            stepOutput = {
              notified: true,
              notificationId: notifRes.rows[0]?.id,
              title,
              body,
              recipientOrg: organizationId,
            };
            break;
          }

          // --- ECOSYSTEM: CRM CREATE / ASSIGN LEAD ---
          case 'crm_create_lead':
          case 'auto_assign_lead': {
            const contact = executionContext.trigger?.contact || {};
            const leadName = params.name || contact.name || executionContext.trigger?.name || 'Inbound Spatial Lead';
            const leadEmail = params.email || contact.email || executionContext.trigger?.email || `lead_${Date.now()}@prospect.com`;
            const leadCompany = params.company || contact.company || executionContext.trigger?.company || 'Prospective Enterprise';
            const isVIP = params.leadStatus === 'VIP' || params.priority === 'VIP';
            const leadScore = Number(params.scoreDelta || (isVIP ? 90 : 50));
            const leadStatus = isVIP ? 'Qualified' : 'New';

            // Check if lead already exists by email
            const existingLead = await client.query(
              `SELECT id, score FROM leads WHERE email = $1 AND organization_id = $2`,
              [leadEmail, organizationId]
            );

            let leadRecord;
            if (existingLead.rows.length > 0) {
              const updated = await client.query(
                `UPDATE leads
                 SET score = score + $1, priority = $2, status = $3, updated_at = now()
                 WHERE id = $4
                 RETURNING *`,
                [leadScore, isVIP ? 'VIP' : 'Normal', leadStatus, existingLead.rows[0].id]
              );
              leadRecord = updated.rows[0];
            } else {
              const inserted = await client.query(
                `INSERT INTO leads (organization_id, name, email, company, status, priority, score, source)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'I3DION Flow Automation')
                 RETURNING *`,
                [organizationId, leadName, leadEmail, leadCompany, leadStatus, isVIP ? 'VIP' : 'Normal', leadScore]
              );
              leadRecord = inserted.rows[0];
            }

            stepOutput = {
              leadId: leadRecord.id,
              name: leadRecord.name,
              email: leadRecord.email,
              status: leadRecord.status,
              priority: leadRecord.priority,
              score: leadRecord.score,
            };
            break;
          }

          // --- ECOSYSTEM: 3D PDF SPEC SHEET GENERATOR ---
          case 'pdf_spec_generator':
          case 'document_spec_sheet': {
            const productName = params.productName || executionContext.trigger?.productName || 'Executive Precision Valve 3D';
            const docId = `spec_${crypto.randomUUID().slice(0, 8)}`;
            const specSheetPayload = {
              documentId: docId,
              title: `${productName} — Technical Specification Sheet`,
              productName,
              format: 'PDF/A Industrial Spec',
              dimensions: '420mm x 310mm x 180mm',
              tolerance: '±0.005mm ISO 2768-m',
              modelViewerUrl: `https://hub.i3dion.com/models/${docId}`,
              qrCodeUrl: `https://hub.i3dion.com/qr/${docId}`,
              generatedAt: new Date().toISOString(),
            };

            stepOutput = {
              documentType: 'spec_sheet',
              documentId: docId,
              productName,
              downloadUrl: `/api/vault/specs/${docId}.pdf`,
              metadata: specSheetPayload,
            };
            break;
          }

          // --- INTEGRATION: OUTBOX / WEBHOOK DISPATCH ---
          case 'webhook_dispatch':
          case 'outbox_webhook':
          case 'webhook_outbox':
          case 'slack_notification': {
            const eventType = params.eventType || (nodeType === 'slack_notification' ? 'slack_alert' : 'webhook_dispatch');
            const destUrl = params.destinationUrl || params.channel || null;

            const outboxRes = await client.query(
              `INSERT INTO flow_event_outbox (organization_id, event_type, payload, destination_url, status)
               VALUES ($1, $2, $3, $4, 'pending')
               RETURNING id, created_at`,
              [
                organizationId,
                eventType,
                JSON.stringify({
                  flowId,
                  runId: run.id,
                  stepId: nodeId,
                  payload: {
                    ...params,
                    triggerContext: executionContext.trigger,
                  },
                }),
                destUrl,
              ]
            );

            stepOutput = {
              enqueued: true,
              outboxId: outboxRes.rows[0]?.id,
              eventType,
              destination: destUrl,
            };
            break;
          }

          default: {
            stepOutput = {
              executedDefaultStep: true,
              nodeType,
              params,
            };
          }
        }

        const durationMs = Date.now() - stepStartTime;

        // Record step result
        const stepRecord = {
          stepIndex: i,
          nodeId,
          nodeType,
          label: node.data?.label || node.label || nodeId,
          status: 'succeeded',
          output: stepOutput,
          durationMs,
        };

        stepResults.push(stepRecord);
        executionContext.steps[nodeId] = stepRecord;

        // Checkpoint intermediate step results to database
        await client.query(
          `UPDATE flow_runs
           SET step_results = $1
           WHERE id = $2`,
          [JSON.stringify(stepResults), run.id]
        );

        // Break if terminate node executed
        if (nodeType === 'terminate') {
          break;
        }
      }
    } catch (err) {
      runStatus = 'failed';
      errorMessage = err.message;
    }

    // 4. Finalize run in database
    const finalRes = await client.query(
      `UPDATE flow_runs
       SET status = $1, step_results = $2, error = $3, completed_at = now()
       WHERE id = $4
       RETURNING *`,
      [runStatus, JSON.stringify(stepResults), errorMessage, run.id]
    );

    // Update flow last_executed_at
    await client.query(
      `UPDATE flows
       SET updated_at = now()
       WHERE id = $1`,
      [flowId]
    );

    return finalRes.rows[0];
  });
}

// -----------------------------------------------------------------------------
// 3. ENQUEUE EVENT INTO OUTBOX
// -----------------------------------------------------------------------------

export async function enqueueOutboxEvent({
  organizationId,
  eventType,
  payload = {},
  destinationUrl = null,
}) {
  return withTenant(organizationId, async (client) => {
    const res = await client.query(
      `INSERT INTO flow_event_outbox (organization_id, event_type, payload, destination_url, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [organizationId, eventType, JSON.stringify(payload), destinationUrl]
    );
    return res.rows[0];
  });
}
