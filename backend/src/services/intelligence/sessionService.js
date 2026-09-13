import { query } from '../../db/pool.js';
import { intelligenceEventBus } from './eventService.js';

export class SessionService {
  constructor() {
    // Register automatic session tracking on event ingestion
    intelligenceEventBus.on('event:ingested', (event) => {
      this.handleEventForSession(event).catch((err) => {
        console.error('[SessionService] Error processing event for session:', err.message);
      });
    });
  }

  /**
   * Upserts or updates an active visitor/user session.
   */
  async createOrUpdateSession({
    sessionId,
    organizationId,
    userId = null,
    leadId = null,
    visitorId = null,
    applicationId = 'hub',
    projectId = null,
    metadata = {},
  }) {
    if (!sessionId || !organizationId) {
      return null;
    }

    const sql = `
      INSERT INTO intelligence_sessions (
        session_id, organization_id, user_id, lead_id, visitor_id,
        application_id, project_id, metadata, last_active_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
      ON CONFLICT (session_id) DO UPDATE SET
        user_id = COALESCE(EXCLUDED.user_id, intelligence_sessions.user_id),
        lead_id = COALESCE(EXCLUDED.lead_id, intelligence_sessions.lead_id),
        visitor_id = COALESCE(EXCLUDED.visitor_id, intelligence_sessions.visitor_id),
        application_id = COALESCE(EXCLUDED.application_id, intelligence_sessions.application_id),
        project_id = COALESCE(EXCLUDED.project_id, intelligence_sessions.project_id),
        last_active_at = now(),
        updated_at = now()
      RETURNING *
    `;

    const { rows } = await query(sql, [
      sessionId,
      organizationId,
      userId || null,
      leadId || null,
      visitorId || null,
      applicationId || 'hub',
      projectId || null,
      JSON.stringify(metadata || {}),
    ]);

    return rows[0];
  }

  /**
   * Internal handler to update session statistics when an event occurs.
   */
  async handleEventForSession(event) {
    if (!event.session_id || !event.organization_id) return;

    // Ensure session record exists
    await this.createOrUpdateSession({
      sessionId: event.session_id,
      organizationId: event.organization_id,
      userId: event.user_id,
      leadId: event.lead_id,
      visitorId: event.visitor_id,
      applicationId: event.application_id,
      projectId: event.project_id,
    });

    const isCta = ['quote_request', 'contact_sales', 'lead_created', 'brochure_download'].includes(event.event_type);
    const isSearch = event.event_type === 'search_performed' && event.metadata?.query;
    const isProduct = ['product_view', 'model_rotation', 'specification_view'].includes(event.event_type) && event.product_id;

    // Build JSON updates for session arrays
    const searchItem = isSearch ? JSON.stringify({ query: event.metadata.query, at: new Date() }) : null;
    const productId = isProduct ? event.product_id : null;
    const appId = event.application_id || 'hub';

    const updateSql = `
      UPDATE intelligence_sessions SET
        interactions_count = interactions_count + 1,
        cta_clicks_count = cta_clicks_count + (CASE WHEN $2 THEN 1 ELSE 0 END),
        duration_seconds = GREATEST(duration_seconds, EXTRACT(EPOCH FROM (now() - started_at))::integer),
        last_active_at = now(),
        apps_opened = CASE 
          WHEN $3::text IS NOT NULL AND NOT (apps_opened @> jsonb_build_array($3::text)) 
          THEN apps_opened || jsonb_build_array($3::text) 
          ELSE apps_opened 
        END,
        products_viewed = CASE 
          WHEN $4::text IS NOT NULL AND NOT (products_viewed @> jsonb_build_array($4::text)) 
          THEN products_viewed || jsonb_build_array($4::text) 
          ELSE products_viewed 
        END,
        searches_performed = CASE 
          WHEN $5::text IS NOT NULL 
          THEN searches_performed || $5::jsonb 
          ELSE searches_performed 
        END,
        engagement_depth_score = (
          (interactions_count + 1) * 0.5 + 
          (cta_clicks_count + (CASE WHEN $2 THEN 1 ELSE 0 END)) * 3.0 + 
          jsonb_array_length(products_viewed) * 2.0
        ),
        updated_at = now()
      WHERE session_id = $1 AND organization_id = $6
    `;

    await query(updateSql, [
      event.session_id,
      isCta,
      appId,
      productId,
      searchItem,
      event.organization_id,
    ]);
  }

  /**
   * Gets active sessions for an organization (active within last 30 minutes).
   */
  async getActiveSessions(organizationId) {
    const { rows } = await query(
      `SELECT s.*, u.name as user_name, u.email as user_email
       FROM intelligence_sessions s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.organization_id = $1 AND s.last_active_at >= (now() - INTERVAL '30 minutes')
       ORDER BY s.last_active_at DESC LIMIT 50`,
      [organizationId]
    );
    return rows;
  }
}

export const sessionService = new SessionService();
