import { query } from '../../db/pool.js';

/**
 * I3DION Flow Engine - Shared Automation Platform Service
 * Evaluates triggers, conditions, and actions across the ecosystem.
 */
export async function executeFlowRules({ organizationId, eventType, payload = {} }) {
  if (!organizationId) {
    return { executed: false, reason: 'missing_organization_id' };
  }

  const results = {
    eventType,
    rulesEvaluated: 0,
    rulesTriggered: 0,
    notificationsCreated: 0,
    actionsExecuted: []
  };

  try {
    // 1. Fetch any configured automation rules
    const { rows: rules } = await query(
      `SELECT * FROM automation_rules 
       WHERE organization_id = $1 AND (event_type = $2 OR event_type = 'ALL') AND is_active = true`,
      [organizationId, eventType]
    );
    results.rulesEvaluated = rules.length;

    // 2. Evaluate and execute custom rules if present
    for (const rule of rules) {
      let conditionsMet = true;
      if (rule.conditions && typeof rule.conditions === 'object' && Object.keys(rule.conditions).length > 0) {
        for (const [key, expectedValue] of Object.entries(rule.conditions)) {
          if (payload[key] !== undefined && payload[key] !== expectedValue) {
            conditionsMet = false;
            break;
          }
        }
      }

      if (conditionsMet) {
        results.rulesTriggered++;
        results.actionsExecuted.push(rule.name || rule.channel || 'automation_rule');

        // Check for specific actions in rule
        if (rule.conditions?.autoAssignUserId && payload.leadId) {
          await query(
            `UPDATE leads SET assigned_to = $1, updated_at = now() WHERE id = $2 AND organization_id = $3`,
            [rule.conditions.autoAssignUserId, payload.leadId, organizationId]
          );
        }
      }
    }

    // 3. Built-in Flagship Flow Template: "New lead -> notify owner + assign"
    if (eventType === 'lead_form_submitted' || eventType === 'lead_created') {
      const { rows: admins } = await query(
        `SELECT id, name, email FROM users 
         WHERE organization_id = $1 AND role IN ('Admin', 'Manager')`,
        [organizationId]
      );

      const leadTitle = `New Lead: ${payload.name || 'Inbound Prospect'}`;
      const leadBody = `${payload.name || 'A customer'} (${payload.email || 'no email'}) requested a ${payload.intent || 'quote'} for ${payload.productName || 'spatial catalog'}.`;

      for (const admin of admins) {
        await query(
          `INSERT INTO notifications (
             organization_id, user_id, title, body, notification_type, action_url, is_read_mobile, is_read_web
           ) VALUES ($1, $2, $3, $4, 'lead_alert', '/leads', false, false)`,
          [organizationId, admin.id, leadTitle, leadBody]
        );
        results.notificationsCreated++;
      }

      // Auto-assign lead to the first Admin/Manager if not already assigned
      if (payload.leadId && admins.length > 0) {
        await query(
          `UPDATE leads 
           SET assigned_to = COALESCE(assigned_to, $1), updated_at = now() 
           WHERE id = $2 AND organization_id = $3 AND assigned_to IS NULL`,
          [admins[0].id, payload.leadId, organizationId]
        );
      }

      // Record audit log
      if (payload.leadId) {
        try {
          await query(
            `INSERT INTO audit_logs (organization_id, action, entity_type, entity_id, details)
             VALUES ($1, 'create', 'lead', $2, $3)`,
            [
              organizationId,
              payload.leadId,
              JSON.stringify({
                flowTrigger: 'lead_form_submitted',
                notificationsSent: results.notificationsCreated,
                autoAssignedTo: admins[0]?.id || null
              })
            ]
          );
        } catch (auditErr) {
          console.warn('Flow audit logging note:', auditErr.message);
        }
      }
    }

    return results;
  } catch (err) {
    console.error('Error in executeFlowRules:', err);
    return { executed: false, error: err.message };
  }
}
