import { Router } from 'express';
import { query } from '../db/pool.js';
import { generateInsights } from '../services/insightsEngine.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

// GET /api/analytics/dashboard - Executive Dashboard Metrics
analyticsRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;

    // Aggregate counts
    const { rows: metrics } = await query(
      `SELECT
        (SELECT COUNT(*) FROM leads WHERE company_id = $1) as total_leads,
        (SELECT COUNT(*) FROM leads WHERE company_id = $1 AND status != 'Closed' AND status != 'Lost') as active_leads,
        (SELECT COUNT(*) FROM lead_intelligence li JOIN leads l ON li.lead_id = l.id WHERE l.company_id = $1 AND li.lead_category IN ('Hot', 'SQL', 'High Intent')) as hot_leads,
        (SELECT COUNT(*) FROM analytics_events WHERE company_id = $1 AND event_type = 'qr_scan') as qr_scans,
        (SELECT COUNT(*) FROM analytics_events WHERE company_id = $1 AND event_type = 'ar_launch') as ar_launches,
        (SELECT COUNT(*) FROM analytics_events WHERE company_id = $1 AND event_type IN ('page_view', 'product_view')) as product_views
      `,
      [companyId]
    );

    res.json(metrics[0]);
  })
);

// GET /api/analytics/insights - AI Insights
analyticsRouter.get(
  '/insights',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const insights = await generateInsights(companyId);
    res.json(insights);
  })
);

// GET /api/analytics/top-products - Top Products
analyticsRouter.get(
  '/top-products',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const { rows: topProducts } = await query(
      `SELECT p.id, p.name, p.slug, COUNT(a.id) as interactions,
        COUNT(CASE WHEN a.event_type = 'ar_launch' THEN 1 END) as ar_launches,
        COUNT(CASE WHEN a.event_type = 'qr_scan' THEN 1 END) as qr_scans
       FROM products p
       LEFT JOIN analytics_events a ON p.id = a.product_id
       WHERE p.company_id = $1
       GROUP BY p.id
       ORDER BY interactions DESC
       LIMIT 5`,
      [companyId]
    );
    res.json(topProducts);
  })
);

// GET /api/analytics/product/:id - Product specific intelligence
analyticsRouter.get(
  '/product/:id',
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;
    const productId = req.params.id;

    const { rows: metrics } = await query(
      `SELECT
        COUNT(*) as total_interactions,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(CASE WHEN event_type = 'qr_scan' THEN 1 END) as qr_scans,
        COUNT(CASE WHEN event_type = 'ar_launch' THEN 1 END) as ar_launches,
        COUNT(DISTINCT lead_id) as leads_generated
       FROM analytics_events
       WHERE company_id = $1 AND product_id = $2`,
      [companyId, productId]
    );
    res.json(metrics[0]);
  })
);
