import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { recommendationEngine } from '../services/recommendationEngine.js';
import { salesAssistant } from '../services/salesAssistant.js';

export const aiRouter = Router();

// Allow some public routes or use requireAuth for all?
// The landing page personalization needs to work for public (via visitor_id/session_id)
// We can use an optionalAuth middleware, but for now we'll allow it public and read from headers.

aiRouter.get('/recommendations', asyncHandler(async (req, res) => {
  // If user is authenticated, use their companyId, otherwise expect it from query/header
  const companyId = req.user?.companyId || req.query.companyId;
  const sessionId = req.headers['x-visitor-id'] || req.query.sessionId || 'anonymous';

  if (!companyId) {
    return res.status(400).json({ message: 'Missing company ID for recommendations' });
  }

  const recommendations = await recommendationEngine.getHybridRecommendations(companyId, sessionId);
  res.json({ recommendations });
}));

aiRouter.get('/frequently-viewed', asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId || req.query.companyId;
  const productId = req.query.productId;

  if (!companyId || !productId) {
    return res.status(400).json({ message: 'Missing company ID or product ID' });
  }

  const items = await recommendationEngine.getFrequentlyViewedTogether(companyId, productId);
  res.json({ items });
}));

// Sales Assistant Insights (Requires Auth)
aiRouter.get('/insights', requireAuth, asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const insights = await salesAssistant.getInsights(companyId);
  res.json({ insights });
}));

// AI Dashboard Metrics (Requires Auth)
aiRouter.get('/dashboard', requireAuth, asyncHandler(async (req, res) => {
  const { query } = await import('../db/pool.js');
  const companyId = req.user.companyId;
  
  const metricsRes = await query(`
    SELECT status, COUNT(*) as count 
    FROM ml_models 
    GROUP BY status
  `);

  const activeModelRes = await query(`
    SELECT name, version, metrics, updated_at
    FROM ml_models
    WHERE status = 'Active'
  `);

  res.json({
    model_stats: metricsRes.rows,
    active_models: activeModelRes.rows
  });
}));
