/**
 * OmniStudio Analytics Service
 * Tracks runtime interaction events (screen views, 3D plays, AR launches, lead submissions)
 */
import { pool } from '../../db/pool.js';

export const analyticsService = {
  /**
   * Tracks a runtime event
   */
  trackEvent: async ({ project_id, organization_id, user_id, event_type, target_id, target_name, metadata }) => {
    try {
      const query = `
        INSERT INTO vault_audit_logs (
          organization_id, user_id, action, resource_type, resource_id, details
        ) VALUES ($1, $2, $3, 'studio_runtime_event', $4, $5)
        RETURNING *
      `;
      const details = JSON.stringify({
        project_id,
        event_type,
        target_id,
        target_name,
        metadata: metadata || {}
      });

      const res = await pool.query(query, [
        organization_id,
        user_id || null,
        `STUDIO_RUNTIME_${(event_type || 'EVENT').toUpperCase()}`,
        project_id,
        details
      ]);

      return res.rows[0];
    } catch (err) {
      console.error('Analytics tracking error:', err);
      return null;
    }
  }
};
