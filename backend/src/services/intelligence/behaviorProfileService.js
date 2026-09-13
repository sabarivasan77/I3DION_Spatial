import { query } from '../../db/pool.js';
import { recencyDecayEngine } from './recencyDecayEngine.js';

export class BehaviorProfileService {
  /**
   * Computes and retrieves a user/visitor's behavioral interest profile.
   */
  async getUserBehaviorProfile({ organizationId, userId = null, visitorId = null, leadId = null }) {
    if (!organizationId) {
      throw new Error('organizationId required for behavior profile');
    }

    let eventCondition = 'e.organization_id = $1';
    const params = [organizationId];

    if (userId) {
      params.push(userId);
      eventCondition += ` AND e.user_id = $${params.length}`;
    } else if (leadId) {
      params.push(leadId);
      eventCondition += ` AND e.lead_id = $${params.length}`;
    } else if (visitorId) {
      params.push(visitorId);
      eventCondition += ` AND e.visitor_id = $${params.length}`;
    } else {
      return this.getDefaultProfile();
    }

    // Fetch user interaction events joined with product category/industry
    const sql = `
      SELECT e.event_type, e.created_at, e.metadata, p.id as product_id, p.category, p.name as product_name
      FROM analytics_events e
      LEFT JOIN products p ON e.product_id = p.id
      WHERE ${eventCondition}
      ORDER BY e.created_at DESC
      LIMIT 200
    `;

    const { rows: events } = await query(sql, params);

    const categoryWeights = {};
    const productInteractions = {};
    let totalScore = 0;

    const eventWeights = {
      product_view: 2,
      model_rotation: 4,
      specification_view: 5,
      ar_launch: 8,
      quote_request: 25,
      contact_sales: 30,
      brochure_download: 10,
    };

    for (const event of events) {
      const baseWeight = eventWeights[event.event_type] || 1;
      const decayMultiplier = recencyDecayEngine.calculateDecayMultiplier(event.created_at, 14);
      const effectiveWeight = baseWeight * decayMultiplier;

      totalScore += effectiveWeight;

      if (event.category) {
        categoryWeights[event.category] = (categoryWeights[event.category] || 0) + effectiveWeight;
      }

      if (event.product_id) {
        productInteractions[event.product_id] = (productInteractions[event.product_id] || 0) + effectiveWeight;
      }
    }

    // Normalize category weights
    const sortedCategories = Object.entries(categoryWeights)
      .sort((a, b) => b[1] - a[1])
      .map(([category, weight]) => ({ category, weight: Math.round(weight * 10) / 10 }));

    const topProductIds = Object.entries(productInteractions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const profile = {
      organizationId,
      userId,
      visitorId,
      leadId,
      topCategories: sortedCategories,
      topProductIds,
      totalBehaviorScore: Math.round(totalScore * 10) / 10,
      lastActiveAt: events[0]?.created_at || new Date().toISOString(),
    };

    // Upsert into user_behavior_profiles table
    try {
      await query(
        `INSERT INTO user_behavior_profiles (
          organization_id, user_id, visitor_id, lead_id, category_weights,
          product_interactions, engagement_score, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, now())
        ON CONFLICT (id) DO UPDATE SET
          category_weights = EXCLUDED.category_weights,
          product_interactions = EXCLUDED.product_interactions,
          engagement_score = EXCLUDED.engagement_score,
          updated_at = now()`,
        [
          organizationId,
          userId,
          visitorId,
          leadId,
          JSON.stringify(categoryWeights),
          JSON.stringify(productInteractions),
          profile.totalBehaviorScore,
        ]
      );
    } catch (e) {
      // Non-blocking log
    }

    return profile;
  }

  getDefaultProfile() {
    return {
      topCategories: [],
      topProductIds: [],
      totalBehaviorScore: 0,
      lastActiveAt: new Date().toISOString(),
    };
  }
}

export const behaviorProfileService = new BehaviorProfileService();
