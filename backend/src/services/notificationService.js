import { query } from '../db/pool.js';
import { emailService } from './emailService.js';

export class NotificationService {
  /**
   * Create an in-app notification and dispatch email if allowed by user preferences
   */
  async notifyUser({
    organizationId,
    userId,
    title,
    body,
    category = 'system', // 'security' | 'leads' | 'publishing' | 'billing' | 'team' | 'system'
    priority = 'INFO', // 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'
    actionUrl = null,
    sendEmail = false,
    emailSubject = null,
  }) {
    try {
      // 1. Fetch user preferences
      const prefRes = await query(
        `SELECT email_notifications, in_app_notifications
         FROM notification_preferences
         WHERE organization_id = $1 AND user_id = $2`,
        [organizationId, userId]
      );

      const prefs = prefRes.rows[0] || {
        email_notifications: { security: true, leads: true, publishing: true, billing: true },
        in_app_notifications: { security: true, leads: true, publishing: true, billing: true, team: true },
      };

      // 2. Insert in-app notification if allowed (or if CRITICAL)
      const inAppAllowed = priority === 'CRITICAL' || prefs.in_app_notifications?.[category] !== false;
      let notification = null;

      if (inAppAllowed) {
        const res = await query(
          `INSERT INTO notifications (organization_id, user_id, title, body, notification_type, action_url)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [organizationId, userId, title, body, category, actionUrl]
        );
        notification = res.rows[0];
      }

      // 3. Dispatch Email if requested & allowed by preferences
      const emailAllowed = priority === 'CRITICAL' || prefs.email_notifications?.[category] !== false;
      if (sendEmail && emailAllowed) {
        const userRes = await query(`SELECT email FROM users WHERE id = $1`, [userId]);
        const email = userRes.rows[0]?.email;

        if (email) {
          const subject = emailSubject || `I3DION Notification: ${title}`;
          const html = emailService.renderTemplate(title, `<p>${body}</p>`, actionUrl ? { text: 'View Details', url: actionUrl } : null);
          await emailService.sendOtpEmail(email, 'N/A', title).catch(() => null); // or direct dispatch
        }
      }

      return notification;
    } catch (err) {
      console.error('Failed to notify user:', err);
      return null;
    }
  }

  /**
   * Notify all members of an organization matching target roles
   */
  async notifyOrganizationRoles({
    organizationId,
    targetRoles = ['Admin', 'Super Admin'],
    title,
    body,
    category = 'system',
    priority = 'INFO',
    actionUrl = null,
  }) {
    try {
      const { rows: users } = await query(
        `SELECT id, email, role FROM users WHERE organization_id = $1 AND role = ANY($2::user_role[])`,
        [organizationId, targetRoles]
      );

      for (const user of users) {
        await this.notifyUser({
          organizationId,
          userId: user.id,
          title,
          body,
          category,
          priority,
          actionUrl,
        });
      }
    } catch (err) {
      console.error('Failed to notify organization roles:', err);
    }
  }
}

export const notificationService = new NotificationService();
