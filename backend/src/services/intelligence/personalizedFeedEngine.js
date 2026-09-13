import { query } from '../../db/pool.js';
import { behaviorProfileService } from './behaviorProfileService.js';
import { rankingService } from './rankingService.js';

export class PersonalizedFeedEngine {
  /**
   * Generates a personalized content feed for Spatial Hub.
   */
  async getPersonalizedFeed({ organizationId, userId = null, visitorId = null, leadId = null, limit = 20, offset = 0 }) {
    // 1. Fetch user behavior profile for scoring
    const userProfile = await behaviorProfileService.getUserBehaviorProfile({
      organizationId,
      userId,
      visitorId,
      leadId,
    });

    // 2. Fetch candidate public/published products and experiences
    const sql = `
      SELECT p.*, c.name as company_name, c.logo_url as company_logo,
             u.name as creator_name, u.avatar_url as creator_avatar
      FROM products p
      JOIN organizations c ON p.organization_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.status = 'Published' AND (p.is_public = true OR p.organization_id = $1)
      ORDER BY p.created_at DESC
      LIMIT 100
    `;

    const { rows: candidates } = await query(sql, [organizationId]);

    // 3. Rank candidates using RankingService
    const rankedFeed = rankingService.rankItems(candidates, userProfile);

    // Apply pagination
    const paginated = rankedFeed.slice(offset, offset + limit);

    return {
      items: paginated,
      totalCount: rankedFeed.length,
      hasMore: offset + limit < rankedFeed.length,
    };
  }

  /**
   * Generates trending products/experiences feed.
   */
  async getTrendingFeed({ organizationId, limit = 10 }) {
    const sql = `
      SELECT p.*, c.name as company_name, c.logo_url as company_logo,
             (p.likes_count * 5 + p.views_count * 1) as trending_score
      FROM products p
      JOIN organizations c ON p.organization_id = c.id
      WHERE p.status = 'Published' AND (p.is_public = true OR p.organization_id = $1)
      ORDER BY trending_score DESC, p.created_at DESC
      LIMIT $2
    `;

    const { rows } = await query(sql, [organizationId, Math.min(limit, 50)]);
    return rows;
  }
}

export const personalizedFeedEngine = new PersonalizedFeedEngine();
