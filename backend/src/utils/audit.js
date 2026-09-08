import { pool } from '../db/pool.js';

/**
 * Log a critical event to the audit_logs table asynchronously.
 * 
 * @param {Object} options
 * @param {string} options.organizationId
 * @param {string} options.userId
 * @param {string} options.action
 * @param {string} [options.entityType]
 * @param {string} [options.entityId]
 * @param {Object} [options.details]
 * @param {import('express').Request} [options.req]
 */
export async function logAudit({ organizationId, userId, action, entityType = null, entityId = null, details = null, req = null }) {
  // Fire and forget (don't block the main request thread)
  setImmediate(async () => {
    try {
      let ip = null;
      let userAgent = null;
      if (req) {
        ip = req.ip || req.connection.remoteAddress;
        userAgent = req.get('User-Agent');
      }

      await pool.query(
        `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, details, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [organizationId, userId, action, entityType, entityId, details, ip, userAgent]
      );
    } catch (err) {
      console.error('[Audit Logger Error]', err);
    }
  });
}

/**
 * Create a security alert asynchronously.
 */
export async function createSecurityAlert({ organizationId, userId, alertType, severity = 'Medium', details = null }) {
  setImmediate(async () => {
    try {
      await pool.query(
        `INSERT INTO security_alerts (organization_id, user_id, alert_type, severity, details) 
         VALUES ($1, $2, $3, $4, $5)`,
        [organizationId, userId, alertType, severity, details]
      );
    } catch (err) {
      console.error('[Security Alert Error]', err);
    }
  });
}
