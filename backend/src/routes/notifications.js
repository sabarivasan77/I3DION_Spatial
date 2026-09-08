import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { query } from '../db/pool.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireTenant);

/**
 * GET /api/v1/notifications
 * Fetch in-app notifications for authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows: notifications } = await query(
      `SELECT * FROM notifications 
       WHERE organization_id = $1 AND user_id = $2
       ORDER BY created_at DESC LIMIT 50`,
      [req.organizationId, req.user.id]
    );

    const unreadCountRes = await query(
      `SELECT count(*)::int as unread
       FROM notifications
       WHERE organization_id = $1 AND user_id = $2 AND read_at IS NULL`,
      [req.organizationId, req.user.id]
    );

    res.json({
      notifications,
      unreadCount: unreadCountRes.rows[0]?.unread || 0,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(
      `UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2 AND organization_id = $3`,
      [id, req.user.id, req.organizationId]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET read_at = now() WHERE user_id = $1 AND organization_id = $2 AND read_at IS NULL`,
      [req.user.id, req.organizationId]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/notifications/preferences
 * Get notification preferences
 */
router.get('/preferences', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT email_notifications, in_app_notifications, weekly_report_enabled
       FROM notification_preferences
       WHERE organization_id = $1 AND user_id = $2`,
      [req.organizationId, req.user.id]
    );

    res.json({
      preferences: rows[0] || {
        email_notifications: { security: true, leads: true, publishing: true, billing: true, weekly_report: true },
        in_app_notifications: { security: true, leads: true, publishing: true, billing: true, team: true },
        weekly_report_enabled: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/notifications/preferences
 * Update notification preferences
 */
router.put('/preferences', async (req, res, next) => {
  try {
    const { email_notifications, in_app_notifications, weekly_report_enabled } = req.body;

    const { rows } = await query(
      `INSERT INTO notification_preferences (organization_id, user_id, email_notifications, in_app_notifications, weekly_report_enabled, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (organization_id, user_id) DO UPDATE SET
         email_notifications = COALESCE(EXCLUDED.email_notifications, notification_preferences.email_notifications),
         in_app_notifications = COALESCE(EXCLUDED.in_app_notifications, notification_preferences.in_app_notifications),
         weekly_report_enabled = COALESCE(EXCLUDED.weekly_report_enabled, notification_preferences.weekly_report_enabled),
         updated_at = now()
       RETURNING *`,
      [
        req.organizationId,
        req.user.id,
        JSON.stringify(email_notifications),
        JSON.stringify(in_app_notifications),
        weekly_report_enabled ?? true,
      ]
    );

    res.json({ success: true, preferences: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
