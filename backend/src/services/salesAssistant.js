import { pool } from '../db/pool.js';

class SalesAssistant {
  /**
   * Generates automated insights based on lead behavior.
   */
  async generateInsights(organizationId) {
    console.log('[SalesAssistant] Running daily insight generation...');
    try {
      // Rule 1: High engagement but no quote request
      await pool.query(`
        INSERT INTO ai_insights_log (organization_id, entity_type, entity_id, insight_type, message, urgency)
        SELECT 
          $1 as organization_id,
          'lead' as entity_type,
          l.id as entity_id,
          'action_required' as insight_type,
          'Customer ' || l.name || ' downloaded multiple technical documents but hasn''t requested a quote. Suggest sending a product quotation.' as message,
          'high' as urgency
        FROM leads l
        LEFT JOIN viewer_sessions vs ON vs.lead_id = l.id
        LEFT JOIN analytics_events a ON a.session_id = vs.visitor_id
        WHERE l.organization_id = $1
          AND l.status NOT IN ('Proposal Sent', 'Closed', 'Lost')
        GROUP BY l.id
        HAVING COUNT(a.id) FILTER (WHERE a.event_type = 'model_download' OR a.event_type = 'brochure_download') >= 2
          AND COUNT(a.id) FILTER (WHERE a.event_type = 'quote_request') = 0
        ON CONFLICT DO NOTHING
      `, [organizationId]);

      // Rule 2: Stopped at cart/quote
      await pool.query(`
        INSERT INTO ai_insights_log (organization_id, entity_type, entity_id, insight_type, message, urgency)
        SELECT 
          $1 as organization_id,
          'lead' as entity_type,
          l.id as entity_id,
          'action_required' as insight_type,
          'Customer ' || l.name || ' stopped just before completing a quotation request. Recommend sending a reminder email.' as message,
          'medium' as urgency
        FROM leads l
        LEFT JOIN viewer_sessions vs ON vs.lead_id = l.id
        LEFT JOIN analytics_events a ON a.session_id = vs.visitor_id
        WHERE l.organization_id = $1
          AND l.status = 'New'
        GROUP BY l.id
        HAVING COUNT(a.id) FILTER (WHERE a.event_type = 'contact_sales') > 0
          AND COUNT(a.id) FILTER (WHERE a.event_type = 'quote_request') = 0
        ON CONFLICT DO NOTHING
      `, [organizationId]);

      // Rule 3: Returning cold leads
      await pool.query(`
        INSERT INTO ai_insights_log (organization_id, entity_type, entity_id, insight_type, message, urgency)
        SELECT 
          $1 as organization_id,
          'lead' as entity_type,
          l.id as entity_id,
          'trend_spotted' as insight_type,
          'Lead ' || l.name || ' returned to the platform after 14 days of inactivity. Good time to follow up.' as message,
          'medium' as urgency
        FROM leads l
        LEFT JOIN viewer_sessions vs ON vs.lead_id = l.id
        LEFT JOIN analytics_events a ON a.session_id = vs.visitor_id
        WHERE l.organization_id = $1
        GROUP BY l.id
        HAVING MAX(a.created_at) > now() - interval '1 day'
           AND MIN(a.created_at) < now() - interval '14 days'
        ON CONFLICT DO NOTHING
      `, [organizationId]);
      
      console.log('[SalesAssistant] Insight generation complete.');
    } catch (err) {
      console.error('[SalesAssistant] Error generating insights:', err);
    }
  }

  async getInsights(organizationId) {
    try {
      const res = await pool.query(`
        SELECT * FROM ai_insights_log 
        WHERE organization_id = $1 AND is_dismissed = false
        ORDER BY urgency DESC, created_at DESC
        LIMIT 50
      `, [organizationId]);
      return res.rows;
    } catch (err) {
      console.error('[SalesAssistant] Error fetching insights:', err);
      return [];
    }
  }
}

export const salesAssistant = new SalesAssistant();
