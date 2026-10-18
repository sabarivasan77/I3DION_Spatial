import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { evaluatePermission, ROLE_PERMISSIONS_TABLE } from '../services/core/permissionService.js';
import { query } from '../db/pool.js';
import { approvalService } from '../services/core/approvalService.js';

export const coreRouter = Router();

coreRouter.use(requireAuth);
coreRouter.use(requireTenant);

/**
 * GET /api/core/me
 * Single Sign-On Context for current session
 */
coreRouter.get('/me', async (req, res, next) => {
  try {
    const userRes = await query(
      `SELECT u.id, u.name, u.email, u.role, u.organization_id, o.name as organization_name, o.logo_url as organization_logo
       FROM users u
       JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    const row = userRes.rows[0];
    res.json({
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        organizationId: row.organization_id,
        organizationName: row.organization_name,
        organizationLogo: row.organization_logo,
      },
      permissions: ROLE_PERMISSIONS_TABLE[row.role] || []
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/core/permission-check
 * Evaluates permission decision for action and optional resource
 */
coreRouter.get('/permission-check', async (req, res, next) => {
  try {
    const { action, resourceId } = req.query;
    if (!action) {
      return res.status(400).json({ error: 'ACTION_REQUIRED', message: 'Query parameter action is required' });
    }

    const decision = await evaluatePermission({
      user: req.user,
      action: String(action),
      targetOrganizationId: req.organizationId,
      resourceId: resourceId ? String(resourceId) : null,
    });

    res.json(decision);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/core/launcher
 * Returns permitted applications for the current user's role and organization
 */
coreRouter.get('/launcher', async (req, res, next) => {
  try {
    const userRole = req.user.role || 'Viewer';
    const permissions = ROLE_PERMISSIONS_TABLE[userRole] || [];
    const isSuperOrAdmin = permissions.includes('*');

    // Fetch live counts for Home cards
    const [productsCountRes, catalogsCountRes, leadsCountRes] = await Promise.all([
      query(`SELECT count(*)::int as count FROM products WHERE organization_id = $1`, [req.organizationId]).catch(() => ({ rows: [{ count: 0 }] })),
      query(`SELECT count(*)::int as count FROM studio_projects WHERE organization_id = $1`, [req.organizationId]).catch(() => ({ rows: [{ count: 0 }] })),
      query(`SELECT count(*)::int as count FROM leads WHERE organization_id = $1`, [req.organizationId]).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    const apps = [
      {
        id: 'hub',
        name: 'Spatial Hub',
        tagline: 'Public Discovery & AR Delivery',
        path: '/hub/feed',
        icon: 'Globe',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 border-indigo-200',
        allowed: true,
        stats: `${productsCountRes.rows[0]?.count || 0} Published`,
      },
      {
        id: 'vault',
        name: 'Spatial Vault',
        tagline: 'Authoritative CAD Assets & Product Data',
        path: '/vault/workspace',
        icon: 'Database',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 border-amber-200',
        allowed: isSuperOrAdmin || permissions.includes('vault.asset.read'),
        stats: `${productsCountRes.rows[0]?.count || 0} Assets`,
      },
      {
        id: 'omni-studio',
        name: 'Omni Studio',
        tagline: 'Interactive Catalog Composer',
        path: '/studio/projects',
        icon: 'LayoutTemplate',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        allowed: isSuperOrAdmin || permissions.includes('studio.catalog.read'),
        stats: `${catalogsCountRes.rows[0]?.count || 0} Catalogs`,
      },
      {
        id: 'engine',
        name: 'Spatial Engine',
        tagline: '3D/AR Experience & Hotspot Authoring',
        path: '/engine/workspace',
        icon: 'Box',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50 border-cyan-200',
        allowed: isSuperOrAdmin || permissions.includes('engine.experience.read'),
        stats: 'Interactive 3D/AR',
      },
      {
        id: 'lens',
        name: 'Spatial Lens',
        tagline: 'Buyer Telemetry & Lead Intent',
        path: '/sales-intelligence',
        icon: 'BarChart3',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 border-emerald-200',
        allowed: isSuperOrAdmin || permissions.includes('lens.analytics.read'),
        stats: `${leadsCountRes.rows[0]?.count || 0} Active Leads`,
      },
    ];

    res.json({
      organization: {
        id: req.organizationId,
        name: req.user.organizationName,
      },
      apps: apps.filter(app => app.allowed),
    });
  } catch (err) {
    next(err);
  }
});

// ====================================================
// UNIFIED APPROVALS CENTRE (Phase P9)
// ====================================================

// GET /api/core/approvals (List pending/resolved approvals)
coreRouter.get('/approvals', async (req, res, next) => {
  try {
    const { status, resourceType } = req.query;
    const approvals = await approvalService.listApprovals(req.organizationId, { status, resourceType });
    res.json(approvals);
  } catch (err) {
    next(err);
  }
});

// POST /api/core/approvals (Submit approval request)
coreRouter.post('/approvals', async (req, res, next) => {
  try {
    const { resourceType, resourceId, versionId, notes } = req.body;
    const approval = await approvalService.submitForApproval(req.organizationId, req.user.id, {
      resourceType,
      resourceId,
      versionId,
      notes
    });
    res.status(201).json(approval);
  } catch (err) {
    next(err);
  }
});

// POST /api/core/approvals/:id/resolve (Resolve approval request)
coreRouter.post('/approvals/:id/resolve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const resolved = await approvalService.resolveApproval(req.organizationId, req.user.id, id, {
      status,
      notes
    });
    res.json(resolved);
  } catch (err) {
    next(err);
  }
});

