import { EventEmitter } from 'events';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { recalculateLeadScore } from '../scoringEngine.js';

export const intelligenceEventBus = new EventEmitter();

// Increase max listeners for multi-service intelligence consumers
intelligenceEventBus.setMaxListeners(30);

export const eventSchema = z.object({
  organizationId: z.string().uuid('Valid organization ID required'),
  userId: z.string().uuid().nullable().optional(),
  sessionId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  applicationId: z.string().default('hub'),
  entityType: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  productId: z.string().uuid().nullable().optional(),
  catalogId: z.string().uuid().nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  visitorId: z.string().nullable().optional(),
  eventType: z.string().min(1, 'Event type is required'),
  metadata: z.record(z.any()).default({}),
  source: z.string().default('web_app'),
  timestamp: z.string().optional(),
});

export class EventService {
  /**
   * Ingests a single structured interaction event.
   */
  async ingestEvent(rawPayload) {
    const validated = eventSchema.parse(rawPayload);

    const {
      organizationId,
      userId,
      sessionId,
      projectId,
      applicationId,
      entityType,
      entityId,
      productId,
      catalogId,
      leadId,
      visitorId,
      eventType,
      metadata,
      source,
    } = validated;

    // Resolve product_id / catalog_id from entity fields if applicable
    const resolvedProductId = productId || (entityType === 'product' && entityId ? entityId : null);
    const resolvedCatalogId = catalogId || (entityType === 'catalog' && entityId ? entityId : null);

    const sql = `
      INSERT INTO analytics_events (
        organization_id, user_id, session_id, project_id, application_id,
        entity_type, entity_id, product_id, catalog_id, lead_id, visitor_id,
        event_type, metadata, source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      organizationId,
      userId || null,
      sessionId || null,
      projectId || null,
      applicationId || 'hub',
      entityType || null,
      entityId || null,
      resolvedProductId || null,
      resolvedCatalogId || null,
      leadId || null,
      visitorId || null,
      eventType,
      JSON.stringify(metadata || {}),
      source || 'web_app',
    ];

    const { rows } = await query(sql, values);
    const insertedEvent = rows[0];

    // Trigger lead score recalculation if lead_id present
    if (leadId) {
      recalculateLeadScore(leadId, organizationId).catch((err) => {
        console.error('[EventService] Error triggering lead recalculation:', err.message);
      });
    }

    // Emit event asynchronously on event bus for internal listeners
    intelligenceEventBus.emit('event:ingested', insertedEvent);
    intelligenceEventBus.emit(`event:${eventType}`, insertedEvent);

    return insertedEvent;
  }

  /**
   * Ingests a batch of events efficiently.
   */
  async ingestBatchEvents(rawBatch) {
    if (!Array.isArray(rawBatch) || rawBatch.length === 0) {
      return [];
    }

    const results = [];
    for (const item of rawBatch) {
      try {
        const res = await this.ingestEvent(item);
        results.push(res);
      } catch (err) {
        console.warn('[EventService] Skipping invalid batch item:', err.message);
      }
    }
    return results;
  }

  /**
   * Retrieves events scoped strictly by organization ID with filtering options.
   */
  async getEvents({ organizationId, userId, sessionId, projectId, eventType, limit = 50, offset = 0 }) {
    if (!organizationId) {
      throw new Error('organizationId is required for tenant isolation');
    }

    let sql = `
      SELECT e.*, u.name as user_name, u.avatar_url as user_avatar
      FROM analytics_events e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.organization_id = $1
    `;
    const params = [organizationId];

    if (userId) {
      params.push(userId);
      sql += ` AND e.user_id = $${params.length}`;
    }

    if (sessionId) {
      params.push(sessionId);
      sql += ` AND e.session_id = $${params.length}`;
    }

    if (projectId) {
      params.push(projectId);
      sql += ` AND e.project_id = $${params.length}`;
    }

    if (eventType) {
      params.push(eventType);
      sql += ` AND e.event_type = $${params.length}`;
    }

    sql += ` ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Math.min(limit, 200), offset);

    const { rows } = await query(sql, params);
    return rows;
  }
}

export const eventService = new EventService();
