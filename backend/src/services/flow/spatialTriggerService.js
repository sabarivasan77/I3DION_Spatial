import { withTenant } from '../../db/pool.js';
import { executeFlowRun } from './flowExecutor.js';

/**
 * 3D Spatial Event Ingestion Service
 * Connects events from Spatial Hub, Spatial Engine, and Omni Studio to active published flows.
 */
export async function ingestSpatialEvent({
  organizationId,
  eventType,
  payload = {},
  sourceApp = 'engine',
  userId = null,
}) {
  if (!organizationId) {
    throw new Error('organizationId is required for spatial event ingestion');
  }
  if (!eventType) {
    throw new Error('eventType is required');
  }

  return withTenant(organizationId, async (client) => {
    // 1. Log event in analytics_events table if available
    try {
      await client.query(
        `INSERT INTO analytics_events (organization_id, product_id, event_type, metadata)
         VALUES ($1, $2, $3, $4)`,
        [
          organizationId,
          payload.productId || null,
          'product_view', // mapped canonical type
          JSON.stringify({ rawEventType: eventType, sourceApp, ...payload }),
        ]
      );
    } catch {
      // Non-blocking telemetry
    }

    // 2. Discover active published workflows in this tenant configured with trigger_event
    const flowsRes = await client.query(
      `SELECT id, name, trigger_config, flow_definition
       FROM flows
       WHERE organization_id = $1
         AND status = 'published'
         AND (trigger_type = 'trigger_event' OR trigger_type = 'trigger_webhook')`,
      [organizationId]
    );

    const matchingFlows = flowsRes.rows.filter((flow) => {
      const triggerCfg = flow.trigger_config || {};
      const defTrigger = flow.flow_definition?.trigger?.config || {};
      const targetEvent = triggerCfg.eventName || defTrigger.eventName;

      // If no specific event is configured, or it matches eventType
      return !targetEvent || targetEvent === '*' || targetEvent === eventType;
    });

    const flowRunIds = [];

    // 3. Trigger execution runs for all matching workflows
    for (const flow of matchingFlows) {
      try {
        const enrichedPayload = {
          ...payload,
          eventName: eventType,
          sourceApp,
          ingestedAt: new Date().toISOString(),
        };

        const run = await executeFlowRun({
          flowId: flow.id,
          organizationId,
          triggerPayload: enrichedPayload,
          userId,
        });

        if (run?.id) {
          flowRunIds.push(run.id);
        }
      } catch (runErr) {
        console.error(`[SpatialTrigger] Failed to execute flow ${flow.id}:`, runErr.message);
      }
    }

    return {
      success: true,
      eventType,
      sourceApp,
      triggeredFlowsCount: flowRunIds.length,
      flowRunIds,
    };
  });
}
