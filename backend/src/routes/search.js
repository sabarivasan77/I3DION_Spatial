import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { searchEngine } from '../services/searchEngine.js';

export const searchRouter = Router();

searchRouter.use(requireAuth);

// GET /api/search?q=query&type=all|products|catalogs|leads&limit=20
searchRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const organizationId = req.organizationId || req.user?.organizationId || req.user?.organization_id;
    const { q = '', type = 'all', limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ products: [], catalogs: [], leads: [], total: 0 });
    }

    const searchTerm = q.trim();
    const likePattern = `%${searchTerm}%`;
    const results = { products: [], catalogs: [], leads: [], total: 0 };

    if (type === 'all' || type === 'products') {
      const semanticProducts = await searchEngine.semanticSearch(organizationId, searchTerm);
      results.products = semanticProducts.map(r => ({ ...r, _type: 'product' })).slice(0, Math.ceil(limit / (type === 'all' ? 3 : 1)));
    }

    if (type === 'all' || type === 'catalogs') {
      const { rows } = await query(
        `SELECT c.id, c.name, c.description, c.status, c.created_at,
                COUNT(cp.product_id) as product_count
         FROM catalogs c
         LEFT JOIN catalog_products cp ON c.id = cp.catalog_id
         WHERE c.organization_id = $1
           AND (c.name ILIKE $2 OR c.description ILIKE $2)
         GROUP BY c.id
         ORDER BY
           CASE WHEN c.name ILIKE $3 THEN 0 ELSE 1 END,
           c.updated_at DESC
         LIMIT $4`,
        [organizationId, likePattern, `%${searchTerm}%`, Math.ceil(limit / (type === 'all' ? 3 : 1))]
      );
      results.catalogs = rows.map(r => ({ ...r, _type: 'catalog' }));
    }

    if (type === 'all' || type === 'leads') {
      const { rows } = await query(
        `SELECT l.id, l.name, l.email, l.company, l.status, l.priority, l.created_at,
                li.behavior_score as score, li.lead_category as intent_level
         FROM leads l
         LEFT JOIN lead_intelligence li ON l.id = li.lead_id
         WHERE l.organization_id = $1
           AND (l.name ILIKE $2 OR l.company ILIKE $2 OR l.email ILIKE $2)
         ORDER BY
           CASE WHEN l.name ILIKE $3 THEN 0 ELSE 1 END,
           li.behavior_score DESC NULLS LAST,
           l.created_at DESC
         LIMIT $4`,
        [organizationId, likePattern, `%${searchTerm}%`, Math.ceil(limit / (type === 'all' ? 3 : 1))]
      );
      results.leads = rows.map(r => ({ ...r, _type: 'lead' }));
    }

    results.total = results.products.length + results.catalogs.length + results.leads.length;
    res.json(results);
  })
);
