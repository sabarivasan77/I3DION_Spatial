import { query } from '../../db/pool.js';
import { behaviorProfileService } from './behaviorProfileService.js';
import { rankingService } from './rankingService.js';

export class RecommendationService {
  /**
   * Generates explainable 3D product recommendations.
   */
  async getRecommendedProducts({ organizationId, userId = null, visitorId = null, leadId = null, currentProductId = null, limit = 6 }) {
    if (!organizationId) {
      throw new Error('organizationId required for recommendations');
    }

    // 1. Get user behavior profile
    const profile = await behaviorProfileService.getUserBehaviorProfile({
      organizationId,
      userId,
      visitorId,
      leadId,
    });

    // 2. Fetch published candidates
    let sql = `
      SELECT p.*, c.name as company_name
      FROM products p
      JOIN organizations c ON p.organization_id = c.id
      WHERE p.status = 'Published' AND (p.is_public = true OR p.organization_id = $1)
    `;
    const params = [organizationId];

    if (currentProductId) {
      params.push(currentProductId);
      sql += ` AND p.id != $${params.length}`;
    }

    sql += ` ORDER BY p.created_at DESC LIMIT 50`;

    const { rows: candidates } = await query(sql, params);

    // 3. Score & rank candidates
    const ranked = rankingService.rankItems(candidates, profile);

    // 4. Return explainable recommendations
    return ranked.slice(0, limit).map((item) => ({
      recommendationId: `rec_${item.id.slice(0, 8)}`,
      entityType: 'product',
      entityId: item.id,
      name: item.name,
      category: item.category,
      imageUrl: item.image_url,
      modelUrl: item.model_url,
      companyName: item.company_name,
      score: item._rankingScore,
      reasons: item._matchReasons || ['Recommended for your visual exploration'],
    }));
  }

  /**
   * Generates next best action guidance based on interaction context.
   */
  async getNextBestAction({ organizationId, userId = null, visitorId = null, currentProductId = null }) {
    // Fetch recent events for context
    let eventCondition = 'organization_id = $1';
    const params = [organizationId];

    if (userId) {
      params.push(userId);
      eventCondition += ` AND user_id = $${params.length}`;
    } else if (visitorId) {
      params.push(visitorId);
      eventCondition += ` AND visitor_id = $${params.length}`;
    }

    const { rows: recentEvents } = await query(
      `SELECT event_type, metadata, created_at FROM analytics_events 
       WHERE ${eventCondition} ORDER BY created_at DESC LIMIT 20`,
      params
    );

    const eventTypes = recentEvents.map((e) => e.event_type);
    const hasSpecView = eventTypes.includes('specification_view');
    const hasArLaunch = eventTypes.includes('ar_launch');
    const hasQuoteRequest = eventTypes.includes('quote_request');
    const viewCount = eventTypes.filter((t) => t === 'product_view').length;

    if (hasQuoteRequest) {
      return {
        actionType: 'CONNECT_SALES',
        title: 'Connect with Sales Team',
        description: 'Your quote request is being processed. Schedule a direct call with an application engineer.',
        ctaLabel: 'Schedule Call',
        ctaUrl: '/hub/enquiries',
        priority: 'HIGH',
      };
    }

    if (viewCount >= 2 && !hasSpecView) {
      return {
        actionType: 'INSPECT_SPECS',
        title: 'Inspect Technical Specs',
        description: 'Dive into material grades, pressure ratings, and CAD dimensions for this asset.',
        ctaLabel: 'View Specifications',
        ctaUrl: currentProductId ? `/hub/product/${currentProductId}` : '/hub/search',
        priority: 'MEDIUM',
      };
    }

    if (!hasArLaunch) {
      return {
        actionType: 'LAUNCH_AR',
        title: 'Launch 1:1 Scale AR',
        description: 'Experience this product anchored directly in your physical environment using WebXR AR.',
        ctaLabel: 'View in AR',
        ctaUrl: currentProductId ? `/hub/product/${currentProductId}` : '/hub',
        priority: 'HIGH',
      };
    }

    return {
      actionType: 'EXPLORE_CATALOG',
      title: 'Explore Spatial Catalog',
      description: 'Discover related industrial products and 3D showcases in your workspace.',
      ctaLabel: 'Explore Catalog',
      ctaUrl: '/hub',
      priority: 'LOW',
    };
  }
}

export const recommendationService = new RecommendationService();
