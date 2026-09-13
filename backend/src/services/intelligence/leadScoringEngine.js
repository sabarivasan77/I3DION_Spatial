import { query } from '../../db/pool.js';
import { leadIntentService } from './leadIntentService.js';

export class LeadScoringEngine {
  /**
   * Recalculates lead score, conversion probability, and qualification status.
   */
  async recalculateLeadScore(leadId, organizationId) {
    if (!leadId || !organizationId) {
      return null;
    }

    // 1. Fetch organization algorithm threshold config
    const configRes = await query(
      `SELECT lead_cold_threshold, lead_warm_threshold, lead_hot_threshold, lead_high_intent_threshold
       FROM algorithm_configs WHERE organization_id = $1`,
      [organizationId]
    );

    const cfg = configRes.rows[0] || {
      lead_cold_threshold: 24,
      lead_warm_threshold: 49,
      lead_hot_threshold: 74,
      lead_high_intent_threshold: 100,
    };

    // 2. Evaluate intent score & signals
    const intentResult = await leadIntentService.evaluateIntent({
      organizationId,
      leadId,
    });

    const score = intentResult.intentScore;

    // 3. Map score to classification using configurable thresholds
    let classification = 'COLD';
    if (score >= Number(cfg.lead_high_intent_threshold)) {
      classification = 'HIGH_INTENT';
    } else if (score >= Number(cfg.lead_hot_threshold)) {
      classification = 'HOT';
    } else if (score >= Number(cfg.lead_warm_threshold)) {
      classification = 'WARM';
    }

    // Conversion probability percentage calculation
    const conversionProbability = Math.min(95, Math.round(score * 0.85));

    // 4. Update lead score & status in leads table
    await query(
      `UPDATE leads 
       SET score = $1, 
           status = CASE 
             WHEN $1 >= 50 AND status = 'New' THEN 'Qualified'::lead_status 
             ELSE status 
           END,
           updated_at = now()
       WHERE id = $2 AND organization_id = $3`,
      [score, leadId, organizationId]
    );

    // 5. Upsert into user_behavior_profiles
    await query(
      `INSERT INTO user_behavior_profiles (organization_id, lead_id, engagement_score, intent_score, lead_classification, updated_at)
       VALUES ($1, $2, $3, $3, $4, now())
       ON CONFLICT (id) DO UPDATE SET
         engagement_score = EXCLUDED.engagement_score,
         intent_score = EXCLUDED.intent_score,
         lead_classification = EXCLUDED.lead_classification,
         updated_at = now()`,
      [organizationId, leadId, score, classification]
    );

    return {
      leadId,
      score,
      classification,
      conversionProbability,
      signals: intentResult.signals,
    };
  }

  /**
   * Recommends products for a lead based on commercial interest history.
   */
  async getLeadProductRecommendations(leadId, organizationId, limit = 5) {
    const { rows: viewed } = await query(
      `SELECT DISTINCT p.category, p.id
       FROM analytics_events e
       JOIN products p ON e.product_id = p.id
       WHERE e.lead_id = $1 AND e.organization_id = $2 AND p.status = 'Published'`,
      [leadId, organizationId]
    );

    if (viewed.length === 0) {
      const { rows: top } = await query(
        `SELECT id, name, category, image_url, model_url FROM products
         WHERE organization_id = $1 AND status = 'Published'
         ORDER BY views_count DESC LIMIT $2`,
        [organizationId, limit]
      );
      return top;
    }

    const categories = Array.from(new Set(viewed.map((v) => v.category)));
    const excludeIds = viewed.map((v) => v.id);

    const { rows: recommended } = await query(
      `SELECT id, name, category, image_url, model_url FROM products
       WHERE organization_id = $1 AND status = 'Published'
         AND category = ANY($2::text[])
         AND id != ALL($3::uuid[])
       ORDER BY views_count DESC LIMIT $4`,
      [organizationId, categories, excludeIds.length ? excludeIds : ['00000000-0000-0000-0000-000000000000'], limit]
    );

    return recommended;
  }
}

export const leadScoringEngine = new LeadScoringEngine();
