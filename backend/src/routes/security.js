import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { logAudit } from '../utils/audit.js';
import { hashToken } from '../services/tokens.js';

export const securityRouter = Router();

// Only Company Admins or Super Admins can access the security dashboard
securityRouter.use(requireAuth);
securityRouter.use(requireRole(['Super Admin', 'Company Admin']));

/**
 * Get Security Dashboard Statistics
 */
securityRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const { company_id } = req.user;

    const [usersRes, failedLoginsRes, alertsRes] = await Promise.all([
      query('SELECT count(*) as total FROM users WHERE company_id = $1', [company_id]),
      query('SELECT sum(failed_login_attempts) as total_failed FROM users WHERE company_id = $1', [company_id]),
      query('SELECT count(*) as active_alerts FROM security_alerts WHERE company_id = $1 AND is_resolved = false', [company_id]),
    ]);

    res.json({
      activeUsers: parseInt(usersRes.rows[0].total || 0),
      failedLogins: parseInt(failedLoginsRes.rows[0].total_failed || 0),
      activeAlerts: parseInt(alertsRes.rows[0].active_alerts || 0),
    });
  })
);

/**
 * Get active sessions for the company
 */
securityRouter.get(
  '/sessions',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT s.id, s.device_info, s.ip_address, s.created_at, s.expires_at, u.email, u.name 
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE u.company_id = $1 AND s.is_revoked = false AND s.expires_at > now()
       ORDER BY s.created_at DESC`,
      [req.user.company_id]
    );

    res.json(rows);
  })
);

/**
 * Revoke a specific session
 */
securityRouter.post(
  '/sessions/:id/revoke',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { rows } = await query(
      `UPDATE user_sessions s
       SET is_revoked = true
       FROM users u
       WHERE s.id = $1 AND s.user_id = u.id AND u.company_id = $2
       RETURNING s.id`,
      [id, req.user.company_id]
    );

    if (!rows[0]) {
      throw new ApiError(404, 'Session not found or already revoked');
    }

    logAudit({
      companyId: req.user.company_id,
      userId: req.user.id,
      action: 'session_revoked',
      entityType: 'user_sessions',
      entityId: id,
      req
    });

    res.json({ message: 'Session revoked successfully' });
  })
);

/**
 * Get Audit Logs
 */
securityRouter.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit || 50);
    const { rows } = await query(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.ip_address, a.created_at, u.email, u.name
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.company_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2`,
      [req.user.company_id, limit]
    );

    res.json(rows);
  })
);

/**
 * Get Security Alerts
 */
securityRouter.get(
  '/alerts',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT sa.id, sa.alert_type, sa.severity, sa.is_resolved, sa.created_at, u.email
       FROM security_alerts sa
       LEFT JOIN users u ON sa.user_id = u.id
       WHERE sa.company_id = $1
       ORDER BY sa.created_at DESC
       LIMIT 50`,
      [req.user.company_id]
    );

    res.json(rows);
  })
);
