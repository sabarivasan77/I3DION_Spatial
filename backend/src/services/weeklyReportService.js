import { query } from '../db/pool.js';
import { emailService } from './emailService.js';

export class WeeklyReportService {
  /**
   * Generate weekly report metrics for an organization
   */
  async generateWeeklyReport(organizationId) {
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Fetch Organization & Subscriptions
    const orgRes = await query(`SELECT name FROM organizations WHERE id = $1`, [organizationId]);
    const orgName = orgRes.rows[0]?.name || 'Organization';

    // 2. Aggregate analytics over past 7 days
    const analyticsRes = await query(
      `SELECT
         count(*) FILTER (WHERE event_type = 'product_view')::int as product_views,
         count(*) FILTER (WHERE event_type = 'ar_launch')::int as ar_sessions,
         count(*) FILTER (WHERE event_type = 'qr_scan')::int as qr_scans
       FROM analytics_events
       WHERE organization_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [organizationId, periodStart, periodEnd]
    );

    const leadsRes = await query(
      `SELECT count(*)::int as leads_count
       FROM leads
       WHERE organization_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [organizationId, periodStart, periodEnd]
    );

    const topProductRes = await query(
      `SELECT p.name, count(*)::int as views
       FROM analytics_events ae
       JOIN products p ON ae.product_id = p.id
       WHERE ae.organization_id = $1 AND ae.event_type = 'product_view' AND ae.created_at >= $2
       GROUP BY p.name
       ORDER BY views DESC LIMIT 1`,
      [organizationId, periodStart]
    );

    const metricsSummary = {
      productViews: analyticsRes.rows[0]?.product_views || 0,
      arSessions: analyticsRes.rows[0]?.ar_sessions || 0,
      qrScans: analyticsRes.rows[0]?.qr_scans || 0,
      leadsCount: leadsRes.rows[0]?.leads_count || 0,
      topProduct: topProductRes.rows[0]?.name || 'None',
    };

    // 3. Find recipients (Admins and Owners)
    const usersRes = await query(
      `SELECT id, email, role FROM users 
       WHERE organization_id = $1 AND role = ANY(ARRAY['Admin'::user_role, 'Super Admin'::user_role, 'Company Admin'::user_role])`,
      [organizationId]
    );

    const recipients = usersRes.rows.map((u) => u.email);

    // 4. Record in weekly_reports table
    const reportRes = await query(
      `INSERT INTO weekly_reports (organization_id, period_start, period_end, metrics_summary, recipients)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [organizationId, periodStart, periodEnd, JSON.stringify(metricsSummary), JSON.stringify(recipients)]
    );

    // 5. Send weekly digest email to recipients
    for (const email of recipients) {
      await emailService.sendWeeklyReportEmail(email, orgName, metricsSummary).catch((err) => {
        console.warn(`Could not send weekly report email to ${email}:`, err.message);
      });
    }

    return reportRes.rows[0];
  }
}

export const weeklyReportService = new WeeklyReportService();
