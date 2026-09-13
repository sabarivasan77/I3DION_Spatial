import { query } from '../../db/pool.js';

export class AnalyticsService {
  /**
   * Calculates overall ecosystem & organization intelligence metrics.
   */
  async getOverallAnalytics({ organizationId, timeframeDays = 30 }) {
    if (!organizationId) {
      throw new Error('organizationId required for analytics');
    }

    const intervalSql = `INTERVAL '${Math.min(365, Math.max(1, timeframeDays))} days'`;

    // 1. Session & User Metrics
    const sessionRes = await query(
      `SELECT 
         COUNT(DISTINCT session_id) as total_sessions,
         COUNT(DISTINCT user_id) as total_users,
         COUNT(DISTINCT visitor_id) as total_visitors,
         COALESCE(AVG(duration_seconds), 0) as avg_session_duration,
         COALESCE(SUM(cta_clicks_count), 0) as total_cta_clicks,
         COALESCE(AVG(engagement_depth_score), 0) as avg_engagement_score
       FROM intelligence_sessions
       WHERE organization_id = $1 AND last_active_at >= (now() - ${intervalSql})`,
      [organizationId]
    );

    const sessionData = sessionRes.rows[0] || {};

    // 2. Interaction Event Totals
    const eventRes = await query(
      `SELECT 
         COUNT(*) filter (where event_type = 'product_view') as product_views,
         COUNT(*) filter (where event_type IN ('model_rotation', 'model_interaction')) as model_interactions,
         COUNT(*) filter (where event_type = 'specification_view') as spec_views,
         COUNT(*) filter (where event_type IN ('ar_launch', 'ar_session')) as ar_launches,
         COUNT(*) filter (where event_type = 'quote_request') as quote_requests,
         COUNT(*) filter (where event_type = 'brochure_download') as brochure_downloads
       FROM analytics_events
       WHERE organization_id = $1 AND created_at >= (now() - ${intervalSql})`,
      [organizationId]
    );

    const eventData = eventRes.rows[0] || {};

    // 3. Lead Conversion Metrics
    const leadRes = await query(
      `SELECT 
         COUNT(*) as total_leads,
         COUNT(*) filter (where status = 'Qualified' OR status = 'Proposal Sent' OR status = 'Closed') as qualified_leads,
         COUNT(*) filter (where status = 'Closed') as converted_leads
       FROM leads
       WHERE organization_id = $1 AND created_at >= (now() - ${intervalSql})`,
      [organizationId]
    );

    const leadData = leadRes.rows[0] || {};
    const totalLeads = Number(leadData.total_leads) || 0;
    const convertedLeads = Number(leadData.converted_leads) || 0;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;

    return {
      organizationId,
      timeframeDays,
      metrics: {
        totalSessions: Number(sessionData.total_sessions) || 0,
        activeUsers: Number(sessionData.total_users) || 0,
        activeVisitors: Number(sessionData.total_visitors) || 0,
        avgSessionDurationSeconds: Math.round(Number(sessionData.avg_session_duration)),
        totalCtaClicks: Number(sessionData.total_cta_clicks) || 0,
        avgEngagementScore: Math.round(Number(sessionData.avg_engagement_score) * 10) / 10,
        productViews: Number(eventData.product_views) || 0,
        modelInteractions: Number(eventData.model_interactions) || 0,
        specificationViews: Number(eventData.spec_views) || 0,
        arLaunches: Number(eventData.ar_launches) || 0,
        quoteRequests: Number(eventData.quote_requests) || 0,
        brochureDownloads: Number(eventData.brochure_downloads) || 0,
        totalLeads,
        qualifiedLeads: Number(leadData.qualified_leads) || 0,
        convertedLeads,
        conversionRatePercent: conversionRate,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Scoped intelligence calculations for a specific project.
   */
  async getProjectAnalytics({ organizationId, projectId }) {
    if (!organizationId || !projectId) {
      throw new Error('organizationId and projectId required');
    }

    const { rows: events } = await query(
      `SELECT 
         COUNT(*) as total_events,
         COUNT(DISTINCT session_id) as total_sessions,
         COUNT(*) filter (where event_type = 'product_view') as product_views,
         COUNT(*) filter (where event_type IN ('model_rotation', 'model_interaction')) as model_interactions,
         COUNT(*) filter (where event_type = 'quote_request') as quote_requests
       FROM analytics_events
       WHERE organization_id = $1 AND project_id = $2`,
      [organizationId, projectId]
    );

    const data = events[0] || {};

    return {
      organizationId,
      projectId,
      totalEvents: Number(data.total_events) || 0,
      totalSessions: Number(data.total_sessions) || 0,
      productViews: Number(data.product_views) || 0,
      modelInteractions: Number(data.model_interactions) || 0,
      quoteRequests: Number(data.quote_requests) || 0,
    };
  }
}

export const analyticsService = new AnalyticsService();
