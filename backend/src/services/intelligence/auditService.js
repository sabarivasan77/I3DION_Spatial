import { query } from '../../db/pool.js';

export class AuditService {
  /**
   * Records an audit trail log entry for administration/security actions.
   */
  async logAction({ organizationId, actorId = null, action, entityType = null, entityId = null, details = {}, ipAddress = null, userAgent = null }) {
    if (!action) return null;

    const sql = `
      INSERT INTO intelligence_audit_logs (
        organization_id, actor_id, action, entity_type, entity_id, details, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const { rows } = await query(sql, [
      organizationId || null,
      actorId || null,
      action,
      entityType || null,
      entityId ? String(entityId) : null,
      JSON.stringify(details || {}),
      ipAddress || null,
      userAgent || null,
    ]);

    return rows[0];
  }

  /**
   * Retrieves audit logs for an organization.
   */
  async getAuditLogs({ organizationId, limit = 50, offset = 0 }) {
    if (!organizationId) {
      throw new Error('organizationId required for audit logs');
    }

    const { rows } = await query(
      `SELECT a.*, u.name as actor_name, u.email as actor_email
       FROM intelligence_audit_logs a
       LEFT JOIN users u ON a.actor_id = u.id
       WHERE a.organization_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [organizationId, Math.min(limit, 100), offset]
    );

    return rows;
  }
}

export const auditService = new AuditService();
