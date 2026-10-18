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

// ====================================================
// UNIVERSAL COMMAND PALETTE (Phase P9)
// Fast multi-entity search and navigation shortcuts
// ====================================================
searchRouter.get(
  '/command-palette',
  asyncHandler(async (req, res) => {
    const organizationId = req.organizationId || req.user?.organizationId || req.user?.organization_id;
    const { q = '', limit = 15 } = req.query;
    const searchTerm = q.trim();
    const likePattern = `%${searchTerm}%`;

    const items = [];

    // Quick platform action shortcuts
    const standardActions = [
      { id: 'act-new-prod', title: 'New 3D Product', subtitle: 'Upload CAD model or specification', category: 'actions', icon: 'Box', action: { type: 'navigate', url: '/products/new' } },
      { id: 'act-new-exp', title: 'New Spatial Experience', subtitle: 'Launch Omni Engine 3D editor', category: 'actions', icon: 'Layers', action: { type: 'navigate', url: '/engine/new' } },
      { id: 'act-new-flow', title: 'New Automation Flow', subtitle: 'Open Flow Durable Designer', category: 'actions', icon: 'GitFork', action: { type: 'navigate', url: '/flows/designer' } },
      { id: 'act-approvals', title: 'Pending Approvals', subtitle: 'Open Unified Approvals Centre', category: 'actions', icon: 'CheckCircle', action: { type: 'navigate', url: '/approvals' } },
      { id: 'act-lens', title: 'Spatial Lens Analytics', subtitle: 'View live telemetry & funnel', category: 'actions', icon: 'BarChart2', action: { type: 'navigate', url: '/sales-intelligence' } }
    ];

    if (!searchTerm) {
      // Return default navigation items when empty query
      return res.json({ items: standardActions, total: standardActions.length });
    }

    // Filter matching standard actions
    for (const act of standardActions) {
      if (act.title.toLowerCase().includes(searchTerm.toLowerCase()) || act.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) {
        items.push(act);
      }
    }

    // Search Catalogs
    const catRes = await query(
      `SELECT id, name, description FROM catalogs WHERE organization_id = $1 AND name ILIKE $2 LIMIT 4`,
      [organizationId, likePattern]
    ).catch(() => ({ rows: [] }));
    for (const cat of catRes.rows) {
      items.push({
        id: `cat-${cat.id}`,
        title: cat.name,
        subtitle: cat.description || 'Omni Studio Catalog',
        category: 'catalogs',
        icon: 'BookOpen',
        action: { type: 'navigate', url: `/catalogs/${cat.id}` }
      });
    }

    // Search Spatial Experiences
    const expRes = await query(
      `SELECT id, name, slug FROM spatial_experiences WHERE organization_id = $1 AND (name ILIKE $2 OR slug ILIKE $2) LIMIT 4`,
      [organizationId, likePattern]
    ).catch(() => ({ rows: [] }));
    for (const exp of expRes.rows) {
      items.push({
        id: `exp-${exp.id}`,
        title: exp.name,
        subtitle: `Twin slug: ${exp.slug}`,
        category: 'experiences',
        icon: 'Cuboid',
        action: { type: 'navigate', url: `/engine/experiences/${exp.id}` }
      });
    }

    // Search Vault Assets
    const assetRes = await query(
      `SELECT id, name, type FROM vault_assets WHERE organization_id = $1 AND name ILIKE $2 LIMIT 4`,
      [organizationId, likePattern]
    ).catch(() => ({ rows: [] }));
    for (const ast of assetRes.rows) {
      items.push({
        id: `ast-${ast.id}`,
        title: ast.name,
        subtitle: `Vault Asset (${ast.type})`,
        category: 'assets',
        icon: 'FileCode',
        action: { type: 'navigate', url: `/vault/assets/${ast.id}` }
      });
    }

    // Search Flows
    const flowRes = await query(
      `SELECT id, name, status FROM flows WHERE organization_id = $1 AND name ILIKE $2 LIMIT 4`,
      [organizationId, likePattern]
    ).catch(() => ({ rows: [] }));
    for (const fl of flowRes.rows) {
      items.push({
        id: `fl-${fl.id}`,
        title: fl.name,
        subtitle: `Flow Recipe (${fl.status})`,
        category: 'flows',
        icon: 'GitFork',
        action: { type: 'navigate', url: `/flows/${fl.id}` }
      });
    }

    res.json({
      items: items.slice(0, Number(limit) || 15),
      total: items.length
    });
  })
);

