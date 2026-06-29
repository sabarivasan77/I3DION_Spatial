import { pool } from '../db/pool.js';

class SearchEngine {
  /**
   * Smart Semantic Search approximation.
   * Maps synonymous terms, extracts industry keywords, and ranks by ML feature score
   * combined with standard text search.
   */
  async semanticSearch(companyId, query) {
    if (!query) return [];
    
    // 1. Semantic Synonym Expansion (Hardcoded mock for demonstration without LLMs)
    // A real implementation would convert `query` into a vector using an embedding model
    // and query PostgreSQL using pgvector (e.g. `ORDER BY embedding <-> $1`).
    const synonyms = {
      'compressor': ['pump', 'air machine', 'pneumatic', 'rotary screw'],
      'motor': ['engine', 'drive', 'actuator', 'generator'],
      'valve': ['pipe', 'control', 'fitting', 'regulator']
    };

    let searchTerms = [query.toLowerCase()];
    for (const [key, related] of Object.entries(synonyms)) {
      if (query.toLowerCase().includes(key)) {
        searchTerms.push(...related);
      }
    }

    // Convert expanded terms to TSQuery format (term1 | term2 | ...)
    const tsQueryStr = searchTerms.map(t => t.split(' ').join(' & ')).join(' | ');

    try {
      // Execute FTS (Full Text Search) with TF-IDF style ranking + Popularity Boost
      const res = await pool.query(`
        WITH fts_results AS (
          SELECT 
            id, name, category, image_url,
            ts_rank(to_tsvector('english', name || ' ' || COALESCE(category,'') || ' ' || COALESCE(description,'')), to_tsquery('english', $1)) as text_rank
          FROM products
          WHERE company_id = $2 AND status = 'Published'
            AND to_tsvector('english', name || ' ' || COALESCE(category,'') || ' ' || COALESCE(description,'')) @@ to_tsquery('english', $1)
        )
        SELECT 
          f.*,
          COALESCE(mf.feature_value, 0) as popularity_score,
          (f.text_rank * 0.7) + (COALESCE(mf.feature_value, 0) * 0.3) as final_score
        FROM fts_results f
        LEFT JOIN ml_feature_store mf 
          ON mf.entity_id = f.id 
          AND mf.entity_type = 'product' 
          AND mf.feature_name = 'overall_popularity'
        ORDER BY final_score DESC
        LIMIT 20
      `, [tsQueryStr, companyId]);

      // If no results found, log it for Keyword Discovery
      if (res.rows.length === 0) {
        await this.logKeywordDiscovery(companyId, query, 'low_result_keyword');
      }

      return res.rows;
    } catch (err) {
      console.error('[SearchEngine] Error during semantic search:', err);
      return [];
    }
  }

  /**
   * Log searches for AI Keyword Discovery
   */
  async logKeywordDiscovery(companyId, keyword, type = 'trending_keyword') {
    try {
      await pool.query(`
        INSERT INTO ai_insights_log (company_id, entity_type, entity_id, insight_type, message, urgency)
        VALUES ($1, 'search', '00000000-0000-0000-0000-000000000000', $2, $3, 'low')
      `, [companyId, type, `Keyword "${keyword}" was searched but yielded no results. Consider adding related products.`]);
    } catch (err) {
      console.error('[SearchEngine] Failed to log keyword:', err);
    }
  }
}

export const searchEngine = new SearchEngine();
