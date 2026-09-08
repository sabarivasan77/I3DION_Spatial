import { pool } from '../db/pool.js';

class PredictionEngine {
  /**
   * Predict conversion probability for a lead using heuristic ML feature weights.
   * A real model would use logistic regression or XGBoost.
   */
  async predictLeadConversion(organizationId, leadId) {
    try {
      // Fetch lead's interaction history
      const res = await pool.query(`
        SELECT 
          l.score,
          COUNT(a.id) as total_events,
          COUNT(a.id) FILTER (WHERE a.event_type = 'model_download') as downloads,
          COUNT(a.id) FILTER (WHERE a.event_type = 'ar_launch') as ar_usage,
          COUNT(a.id) FILTER (WHERE a.event_type = 'quote_request') as quote_requests
        FROM leads l
        LEFT JOIN viewer_sessions vs ON vs.lead_id = l.id
        LEFT JOIN analytics_events a ON a.session_id = vs.visitor_id
        WHERE l.id = $1 AND l.organization_id = $2
        GROUP BY l.id
      `, [leadId, organizationId]);

      if (res.rows.length === 0) return 0;
      
      const stats = res.rows[0];
      
      // Basic Logistic Regression-style heuristic weighting
      let rawScore = -2.0; // Base intercept
      rawScore += (parseInt(stats.total_events) * 0.05);
      rawScore += (parseInt(stats.downloads) * 0.4);
      rawScore += (parseInt(stats.ar_usage) * 0.3);
      rawScore += (parseInt(stats.quote_requests) * 2.0);
      rawScore += (parseInt(stats.score) * 0.01); // Existing static score

      // Sigmoid function to map to 0-1 probability
      const probability = 1 / (1 + Math.exp(-rawScore));
      const percentage = Math.round(probability * 100);

      // Cache prediction
      await this.cachePrediction(leadId, percentage);

      return percentage;
    } catch (err) {
      console.error('[PredictionEngine] Error predicting lead conversion:', err);
      return 0;
    }
  }

  async cachePrediction(leadId, percentage) {
    try {
      await pool.query(`
        INSERT INTO ai_predictions (entity_type, entity_id, prediction_type, prediction_value, confidence, updated_at)
        VALUES ('lead', $1, 'conversion_probability', $2, 0.85, now())
        ON CONFLICT (entity_type, entity_id, prediction_type)
        DO UPDATE SET prediction_value = EXCLUDED.prediction_value, updated_at = now()
      `, [leadId, percentage]);
    } catch (err) {
      // ignore conflict if model mapping isn't fully established in this mock
    }
  }
}

export const predictionEngine = new PredictionEngine();
