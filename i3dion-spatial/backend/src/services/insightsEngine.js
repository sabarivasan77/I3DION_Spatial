import { query } from '../db/pool.js';

export async function generateInsights(companyId) {
  const insights = [];

  try {
    // 1. Most active product
    const { rows: topProducts } = await query(
      `SELECT p.name, COUNT(a.id) as interactions
       FROM products p
       LEFT JOIN analytics_events a ON p.id = a.product_id
       WHERE p.company_id = $1
       GROUP BY p.id
       ORDER BY interactions DESC
       LIMIT 1`,
      [companyId]
    );

    if (topProducts.length > 0 && topProducts[0].interactions > 0) {
      insights.push({
        type: 'trending',
        message: `"${topProducts[0].name}" is your most trending product with ${topProducts[0].interactions} recent interactions.`,
        urgency: 'medium'
      });
    }

    // 2. High intent leads
    const { rows: hotLeads } = await query(
      `SELECT COUNT(*) as count FROM lead_intelligence li
       JOIN leads l ON li.lead_id = l.id
       WHERE l.company_id = $1 AND li.lead_category IN ('Hot', 'SQL', 'High Intent') AND l.status = 'New'`,
      [companyId]
    );

    if (hotLeads.length > 0 && hotLeads[0].count > 0) {
      insights.push({
        type: 'action_required',
        message: `You have ${hotLeads[0].count} new high-intent leads waiting for contact.`,
        urgency: 'high'
      });
    }

    // 3. AR Conversion Impact
    const { rows: arImpact } = await query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN a.event_type = 'ar_launch' THEN a.lead_id END) as ar_leads,
        COUNT(DISTINCT a.lead_id) as total_leads
       FROM analytics_events a
       WHERE a.company_id = $1 AND a.lead_id IS NOT NULL`,
      [companyId]
    );

    if (arImpact.length > 0 && arImpact[0].total_leads > 0 && arImpact[0].ar_leads > 0) {
      const arPercentage = Math.round((arImpact[0].ar_leads / arImpact[0].total_leads) * 100);
      insights.push({
        type: 'performance',
        message: `${arPercentage}% of your leads have engaged with Augmented Reality models.`,
        urgency: 'low'
      });
    }

    // 4. Source analysis
    const { rows: sources } = await query(
      `SELECT source, COUNT(*) as count 
       FROM leads 
       WHERE company_id = $1
       GROUP BY source
       ORDER BY count DESC
       LIMIT 1`,
      [companyId]
    );

    if (sources.length > 0 && sources[0].count > 0) {
      insights.push({
        type: 'marketing',
        message: `Most of your leads (${sources[0].count}) are coming from "${sources[0].source}".`,
        urgency: 'low'
      });
    }

  } catch (err) {
    console.error('Error generating insights:', err);
  }

  return insights;
}
