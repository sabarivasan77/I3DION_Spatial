import { query } from '../../db/pool.js';
import { recencyDecayEngine } from './recencyDecayEngine.js';

export class EngagementScoringService {
  /**
   * Calculates a transparent, weighted engagement score (0-100) for a user/visitor/lead.
   */
  async calculateEngagementScore({ organizationId, userId = null, visitorId = null, leadId = null }) {
    if (!organizationId) {
      throw new Error('organizationId required for engagement scoring');
    }

    // 1. Fetch organization custom algorithm configuration if present
    const configRes = await query(
      `SELECT recency_decay_half_life_days, frequency_weight, recency_weight, depth_weight, intent_weight
       FROM algorithm_configs WHERE organization_id = $1`,
      [organizationId]
    );

    const cfg = configRes.rows[0] || {
      recency_decay_half_life_days: 14,
      frequency_weight: 1.5,
      recency_weight: 2.0,
      depth_weight: 1.2,
      intent_weight: 3.0,
    };

    // 2. Fetch recent events for target user/visitor/lead
    let eventCondition = 'organization_id = $1';
    const params = [organizationId];

    if (userId) {
      params.push(userId);
      eventCondition += ` AND user_id = $${params.length}`;
    } else if (leadId) {
      params.push(leadId);
      eventCondition += ` AND lead_id = $${params.length}`;
    } else if (visitorId) {
      params.push(visitorId);
      eventCondition += ` AND visitor_id = $${params.length}`;
    } else {
      return { score: 0, breakdown: { recency: 0, frequency: 0, depth: 0, intent: 0 } };
    }

    const sql = `
      SELECT event_type, created_at, metadata
      FROM analytics_events
      WHERE ${eventCondition}
      ORDER BY created_at DESC
      LIMIT 150
    `;

    const { rows: events } = await query(sql, params);

    if (events.length === 0) {
      return { score: 0, breakdown: { recency: 0, frequency: 0, depth: 0, intent: 0 } };
    }

    // 3. Compute component scores
    const frequencyScore = Math.min(25, events.length * 1.2 * Number(cfg.frequency_weight));

    const mostRecentTimestamp = events[0].created_at;
    const recencyMultiplier = recencyDecayEngine.calculateDecayMultiplier(mostRecentTimestamp, cfg.recency_decay_half_life_days);
    const recencyScore = Math.round(25 * recencyMultiplier * Number(cfg.recency_weight));

    const distinctProducts = new Set(events.map((e) => e.metadata?.productId || e.product_id).filter(Boolean));
    const depthScore = Math.min(25, (distinctProducts.size * 5 + events.length * 0.3) * Number(cfg.depth_weight));

    let commercialIntentPoints = 0;
    for (const e of events) {
      const decay = recencyDecayEngine.calculateDecayMultiplier(e.created_at, cfg.recency_decay_half_life_days);
      if (['quote_request', 'contact_sales', 'lead_created'].includes(e.event_type)) {
        commercialIntentPoints += 12 * decay;
      } else if (['ar_launch', 'brochure_download', 'specification_view'].includes(e.event_type)) {
        commercialIntentPoints += 6 * decay;
      }
    }
    const intentScore = Math.min(25, Math.round(commercialIntentPoints * Number(cfg.intent_weight)));

    const rawTotal = recencyScore + frequencyScore + depthScore + intentScore;
    const normalizedScore = Math.min(100, Math.round(rawTotal));

    return {
      score: normalizedScore,
      breakdown: {
        recency: Math.round(recencyScore),
        frequency: Math.round(frequencyScore),
        depth: Math.round(depthScore),
        intent: Math.round(intentScore),
      },
      lastActiveAt: mostRecentTimestamp,
    };
  }
}

export const engagementScoringService = new EngagementScoringService();
