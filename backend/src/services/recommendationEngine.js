import { pool } from '../db/pool.js';

class RecommendationEngine {
  /**
   * Generates a hybrid recommendation combining Collaborative Filtering (CF)
   * and Content-Based Filtering (CB).
   * 
   * @param {string} organizationId - Target company
   * @param {string} sessionId - Visitor session ID or Lead ID
   * @returns {Promise<Array>} List of recommended product IDs and scores
   */
  async getHybridRecommendations(organizationId, sessionId) {
    try {
      // 1. Fetch user's recent product views (Content basis)
      const res = await pool.query(`
        SELECT metadata->>'product_id' as product_id
        FROM analytics_events 
        WHERE session_id = $1 AND event_type IN ('product_view', 'ar_launch', 'model_download')
          AND metadata->>'product_id' IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 10
      `, [sessionId]);

      const recentProductIds = res.rows.map(r => r.product_id);

      // 2. Mock Hybrid scoring:
      // In a full implementation, we would multiply the TF-IDF item-item matrix 
      // by the user-item interaction vector. Here we fallback to popular items 
      // in the same category as recently viewed items.
      
      let recommendations = [];
      if (recentProductIds.length > 0) {
        // Content-based heuristic: recommend products in the same category
        const cbRes = await pool.query(`
          WITH recent_cats AS (
            SELECT category FROM products WHERE id = ANY($1::uuid[])
          )
          SELECT p.id, p.name, p.category, 0.7 as score
          FROM products p
          WHERE p.organization_id = $2 
            AND p.status = 'Published'
            AND p.category IN (SELECT category FROM recent_cats)
            AND p.id != ALL($1::uuid[])
          LIMIT 5
        `, [recentProductIds, organizationId]);
        recommendations.push(...cbRes.rows);
      }

      // Collaborative-based heuristic: most popular overall that user hasn't seen
      const cfRes = await pool.query(`
        SELECT p.id, p.name, p.category, 0.4 as score
        FROM products p
        LEFT JOIN analytics_events a ON a.metadata->>'product_id' = p.id::text 
          AND a.event_type = 'product_view'
        WHERE p.organization_id = $2 AND p.status = 'Published'
          AND p.id != ALL($1::uuid[])
        GROUP BY p.id
        ORDER BY COUNT(a.id) DESC
        LIMIT (5 - $3)
      `, [recentProductIds.length ? recentProductIds : ['00000000-0000-0000-0000-000000000000'], organizationId, recommendations.length]);
      
      recommendations.push(...cfRes.rows);

      // Sort by score descending
      return recommendations.sort((a, b) => b.score - a.score);
      
    } catch (err) {
      console.error('[RecommendationEngine] Error getting recommendations:', err);
      return [];
    }
  }

  /**
   * Frequently Viewed Together (Market Basket Analysis approximation)
   * Finds products that are viewed in the same sessions as the given product.
   */
  async getFrequentlyViewedTogether(organizationId, productId) {
    try {
      const res = await pool.query(`
        WITH sessions_with_product AS (
          SELECT DISTINCT session_id 
          FROM analytics_events 
          WHERE metadata->>'product_id' = $1
        )
        SELECT p.id, p.name, p.image_url, COUNT(*) as co_views
        FROM analytics_events a
        JOIN sessions_with_product s ON a.session_id = s.session_id
        JOIN products p ON p.id::text = a.metadata->>'product_id'
        WHERE a.metadata->>'product_id' != $1
          AND p.organization_id = $2
          AND p.status = 'Published'
        GROUP BY p.id
        ORDER BY co_views DESC
        LIMIT 4
      `, [productId, organizationId]);

      return res.rows;
    } catch (err) {
      console.error('[RecommendationEngine] Error getting FVT:', err);
      return [];
    }
  }
}

export const recommendationEngine = new RecommendationEngine();
