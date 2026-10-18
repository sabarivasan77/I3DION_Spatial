import { Router } from 'express';
import { playerService } from '../services/player/playerService.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { authorize } from '../middleware/authorizationEngine.js';
import { publicLeadsLimiter, publicEventsLimiter, enforcePayloadCap } from '../middleware/rateLimiters.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { query } from '../db/pool.js';

export const playerRouter = Router();

// ============================================================================
// PUBLIC ENDPOINTS (Accessed by browser player, PWA, and QR scans)
// ============================================================================

/**
 * GET /api/public/player/q/:shortCode
 * Resolves non-enumerable short link, checks password/expiration,
 * filters audience-restricted fields server-side, and returns catalog payload.
 */
playerRouter.get(
  ['/public/q/:shortCode', '/q/:shortCode'],
  asyncHandler(async (req, res) => {
    const { shortCode } = req.params;
    const { password, visitorId } = req.query;

    const result = await playerService.resolveCatalogLink(shortCode, {
      password: password ? String(password) : null,
      visitorId: visitorId ? String(visitorId) : null
    });

    res.json(result);
  })
);

/**
 * POST /api/player/q/:shortCode/verify-password
 * Verifies password for password-protected catalog links
 */
playerRouter.post(
  ['/public/q/:shortCode/verify-password', '/q/:shortCode/verify-password'],
  enforcePayloadCap(1024),
  asyncHandler(async (req, res) => {
    const { shortCode } = req.params;
    const { password, visitorId } = req.body;

    if (!password) {
      throw new ApiError(400, 'Password is required');
    }

    const result = await playerService.resolveCatalogLink(shortCode, {
      password: String(password),
      visitorId: visitorId ? String(visitorId) : null
    });

    res.json(result);
  })
);

/**
 * POST /api/player/rfq
 * Captures Quote Basket / RFQ submission from Catalog Player with idempotency & Flow outbox
 */
playerRouter.post(
  ['/public/rfq', '/rfq'],
  publicLeadsLimiter,
  enforcePayloadCap(8192),
  asyncHandler(async (req, res) => {
    const result = await playerService.submitCatalogRfq(req.body);
    res.status(201).json(result);
  })
);

// ============================================================================
// AUTHENTICATED MANAGEMENT ENDPOINTS (Omni Studio Campaign & QR Manager)
// ============================================================================

/**
 * POST /api/player/links
 * Creates a new stable campaign link & non-enumerable QR code
 */
playerRouter.post(
  '/links',
  requireAuth,
  requireTenant,
  authorize('studio:create'),
  asyncHandler(async (req, res) => {
    const { organization_id } = req.user;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const link = await playerService.createCatalogLink({
      ...req.body,
      organizationId: organization_id,
      baseUrl
    });

    res.status(201).json({
      success: true,
      link
    });
  })
);

/**
 * GET /api/player/links
 * Lists all active campaign links and QR metrics for the tenant
 */
playerRouter.get(
  '/links',
  requireAuth,
  requireTenant,
  authorize('studio:read'),
  asyncHandler(async (req, res) => {
    const { organization_id } = req.user;
    const { catalogId } = req.query;

    let sql = `
      SELECT id, short_code, label, campaign, audience_role,
             expires_at, visits_count, created_at, updated_at
      FROM catalog_links
      WHERE organization_id = $1
    `;
    const params = [organization_id];

    if (catalogId) {
      sql += ` AND catalog_id = $2`;
      params.push(catalogId);
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);
    res.json({
      success: true,
      links: result.rows
    });
  })
);

/**
 * GET /api/player/links/:shortCode/print-sheet
 * Returns high-res vector printable QR layout with campaign branding
 */
playerRouter.get(
  '/links/:shortCode/print-sheet',
  asyncHandler(async (req, res) => {
    const { shortCode } = req.params;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const sheet = await playerService.generatePrintQrSheet(shortCode, {
      title: req.query.title ? String(req.query.title) : 'Product Catalog',
      baseUrl
    });

    res.json({
      success: true,
      sheet
    });
  })
);
