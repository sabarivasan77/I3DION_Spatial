import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
import { config } from '../config.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { 
  getOrganizationShowcase, 
  getPublishedCatalog, 
  listPublishedCatalogs,
  getPublishedExperience, 
  capturePublicLead, 
  submitHubRfq,
  submitModerationReport,
  generateSocialMeta,
  generateHtmlMetaTags
} from '../services/hub/hubService.js';
import { trackEvent } from '../services/trackingEngine.js';
import {
  addPublicAssetAccessUrls,
  addPublicModelDownloadMetadata,
} from '../services/hub/publicAssetUrls.js';
import { 
  hubRfqLimiter, 
  hubReportLimiter, 
  hubTelemetryLimiter, 
  hubSearchLimiter, 
  enforcePayloadCap 
} from '../middleware/rateLimiters.js';

export const hubRouter = Router();

// ==========================================
// 1. PUBLIC FEED
// ==========================================
hubRouter.get(
  '/feed',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const cursor = req.query.cursor;
    const category = req.query.category;
    const sort = req.query.sort || 'popular';
    const search = req.query.search;
    const isPaginated = req.query.paginated === 'true' || Boolean(cursor);

    let whereClause = `WHERE p.is_public = true AND p.status = 'Published'`;
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      whereClause += ` AND p.category = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereClause += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR $${params.length} = ANY(p.tags))`;
    }

    if (cursor) {
      if (cursor.includes('_')) {
        const [cursorScore, cursorCreatedAt] = cursor.split('_');
        params.push(Number(cursorScore) || 0);
        const scoreIdx = params.length;
        params.push(cursorCreatedAt);
        const timeIdx = params.length;
        whereClause += ` AND ((p.likes_count * 5 + p.views_count * 1) < $${scoreIdx} OR ((p.likes_count * 5 + p.views_count * 1) = $${scoreIdx} AND p.created_at < $${timeIdx}))`;
      } else {
        params.push(cursor);
        whereClause += ` AND p.created_at < $${params.length}`;
      }
    }

    let orderClause = `ORDER BY trending_score DESC, p.created_at DESC`;
    if (sort === 'newest') {
      orderClause = `ORDER BY p.created_at DESC`;
    } else if (sort === 'alphabetical') {
      orderClause = `ORDER BY p.name ASC`;
    }

    params.push(limit + 1);
    const limitParam = `$${params.length}`;

    const sql = `
      SELECT p.*, c.name as company_name, c.logo_url as company_logo, c.is_verified as company_verified,
             u.name as creator_name, u.avatar_url as creator_avatar,
             (p.likes_count * 5 + p.views_count * 1) as trending_score
      FROM products p
      JOIN organizations c ON p.organization_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ${limitParam}
    `;

    const { rows } = await query(sql, params);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    let nextCursor = null;
    if (items.length > 0 && hasMore) {
      const last = items[items.length - 1];
      const isoCreated = new Date(last.created_at).toISOString();
      nextCursor = sort === 'popular' ? `${last.trending_score}_${isoCreated}` : isoCreated;
    }

    if (isPaginated) {
      res.json({
        items: items.map(addPublicAssetAccessUrls),
        nextCursor,
        hasMore,
        count: items.length
      });
    } else {
      res.json(items.map(addPublicAssetAccessUrls));
    }
  })
);

// ==========================================
// 2. FULL-TEXT SEARCH & FACETED DISCOVERY
// ==========================================
const searchSchema = z.object({
  query: z.object({
    query: z.string().optional(),
    q: z.string().optional(),
    category: z.string().optional(),
    license: z.string().optional(),
    organizationId: z.string().optional(),
    format: z.string().optional(),
    sort: z.enum(['relevant', 'relevance', 'newest', 'popular', 'alphabetical']).optional().default('relevant'),
    limit: z.coerce.number().min(1).max(100).optional().default(50)
  })
});

hubRouter.get(
  '/search',
  hubSearchLimiter,
  validate(searchSchema),
  asyncHandler(async (req, res) => {
    const { 
      query: qParam, 
      q, 
      category, 
      license, 
      organizationId,
      format,
      sort, 
      limit 
    } = req.validated.query;

    const textSearch = (qParam || q || '').trim();

    let whereClause = `WHERE p.is_public = true AND p.status = 'Published'`;
    const params = [];

    // Full-Text Search
    if (textSearch) {
      params.push(`%${textSearch}%`);
      const termIdx = params.length;
      whereClause += ` AND (
        p.name ILIKE $${termIdx} 
        OR p.description ILIKE $${termIdx} 
        OR $${termIdx} = ANY(p.tags)
        OR c.name ILIKE $${termIdx}
      )`;
    }

    // Category Facet Filter
    if (category && category !== 'All') {
      params.push(category);
      whereClause += ` AND p.category = $${params.length}`;
    }

    // License Facet Filter
    if (license && license !== 'All') {
      params.push(license);
      whereClause += ` AND ($${params.length} = ANY(p.license_spdx) OR p.license_spdx @> ARRAY[$${params.length}]::text[])`;
    }

    // Organization Filter
    if (organizationId && organizationId !== 'All') {
      params.push(organizationId);
      whereClause += ` AND (p.organization_id::text = $${params.length} OR c.slug = $${params.length})`;
    }

    // Sorting
    let orderClause = 'ORDER BY p.views_count DESC, p.created_at DESC';
    if (sort === 'newest') {
      orderClause = 'ORDER BY p.created_at DESC';
    } else if (sort === 'alphabetical') {
      orderClause = 'ORDER BY p.name ASC';
    } else if (sort === 'popular') {
      orderClause = 'ORDER BY (p.likes_count * 5 + p.views_count) DESC, p.created_at DESC';
    } else if (sort === 'relevant' || sort === 'relevance') {
      if (textSearch) {
        orderClause = `ORDER BY 
          CASE WHEN p.name ILIKE $1 THEN 1 ELSE 2 END,
          (p.likes_count * 5 + p.views_count) DESC,
          p.created_at DESC`;
      } else {
        orderClause = 'ORDER BY (p.likes_count * 5 + p.views_count) DESC, p.created_at DESC';
      }
    }

    params.push(limit);
    const limitIdx = params.length;

    const sql = `
      SELECT p.*, 
             c.name as company_name, 
             c.logo_url as company_logo, 
             c.is_verified as company_verified,
             u.name as creator_name, 
             u.avatar_url as creator_avatar
      FROM products p
      JOIN organizations c ON p.organization_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      ${whereClause}
      ${orderClause}
      LIMIT $${limitIdx}
    `;

    const { rows } = await query(sql, params);

    // Compute dynamic Facets across published catalog
    const { rows: categoryFacets } = await query(`
      SELECT p.category, count(*)::int as count
      FROM products p
      WHERE p.is_public = true AND p.status = 'Published'
      GROUP BY p.category
      ORDER BY count DESC
    `);

    const { rows: licenseFacets } = await query(`
      SELECT unnest(p.license_spdx) as spdx, count(*)::int as count
      FROM products p
      WHERE p.is_public = true AND p.status = 'Published'
      GROUP BY spdx
      ORDER BY count DESC
    `);

    if (req.query.format === 'verbose') {
      res.json({
        items: rows,
        total: rows.length,
        facets: {
          categories: categoryFacets,
          licenses: licenseFacets
        }
      });
    } else {
      res.json(rows);
    }
  })
);

// ==========================================
// 3. GET PRODUCT DETAILS & COMMENTS
// ==========================================
const idParamLocal = z.object({ params: z.object({ id: z.string().uuid() }) });
hubRouter.get(
  '/products/:id',
  validate(idParamLocal),
  asyncHandler(async (req, res) => {
    const { id } = req.validated.params;
    
    // Increment view count
    await query(`UPDATE products SET views_count = views_count + 1 WHERE id = $1`, [id]);
    
    const { rows } = await query(`
      SELECT p.*, c.name as company_name, c.logo_url as company_logo,
             u.name as creator_name, u.avatar_url as creator_avatar,
             pa.size_bytes as model_size_bytes,
             pa.checksum_sha256 as model_checksum_sha256
      FROM products p
      JOIN organizations c ON p.organization_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN product_assets pa ON pa.id = p.model_asset_id AND pa.product_id = p.id
      WHERE p.id = $1 AND p.is_public = true AND p.status = 'Published'
    `, [id]);
    
    if (!rows[0]) throw new ApiError(404, 'Public product not found');
    res.json(await addPublicModelDownloadMetadata(rows[0]));
  })
);

hubRouter.get(
  '/:entityType/:id/comments',
  asyncHandler(async (req, res) => {
    const { id, entityType } = req.params;
    if (!['product', 'catalog'].includes(entityType)) throw new ApiError(400, 'Invalid entity type');
    const { rows } = await query(`
      SELECT c.*, u.name as user_name, u.avatar_url as user_avatar
      FROM hub_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.entity_type = $1 AND c.entity_id = $2
      ORDER BY c.created_at DESC
    `, [entityType, id]);
    res.json(rows);
  })
);

// ==========================================
// 3.5 SPATIAL HUB PUBLIC DELIVERY & SHOWCASE
// ==========================================

// Public Organization Showcase
hubRouter.get(
  '/showcase/:identifier',
  asyncHandler(async (req, res) => {
    const showcase = await getOrganizationShowcase(req.params.identifier);
    res.json(showcase);
  })
);

// Public Organization Storefront Alias (/org/:identifier)
hubRouter.get(
  '/org/:identifier',
  asyncHandler(async (req, res) => {
    const showcase = await getOrganizationShowcase(req.params.identifier);
    res.json(showcase);
  })
);

// Public Curated Collection Route with Server-Side Audience Filtering
hubRouter.get(
  '/collections/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows: collRows } = await query(
      `SELECT c.*, o.name as org_name, o.logo_url as org_logo, o.is_verified as org_verified
       FROM vault_collections c
       JOIN organizations o ON c.organization_id = o.id
       WHERE c.id = $1`,
      [id]
    );

    if (!collRows[0]) {
      throw new ApiError(404, 'Collection not found');
    }

    const collection = collRows[0];

    // Server-side audience filtering: Only return public assets for public callers
    const { rows: assets } = await query(
      `SELECT id, name, original_name, category, type, mime_type, public_url, preview_url, poster_url,
              size_bytes, license_spdx, license_artist, attribution_required, is_demo_model, tags
       FROM vault_assets
       WHERE collection_id = $1 AND is_deleted = false AND status = 'Ready' AND visibility = 'Public'
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      collection,
      items: assets,
      totalCount: assets.length
    });
  })
);

// Public Published Catalog
const publishedCatalogListSchema = z.object({
  query: z.object({
    search: z.string().trim().max(100).optional().default(''),
    limit: z.coerce.number().int().min(1).max(50).optional().default(30),
    offset: z.coerce.number().int().min(0).max(5000).optional().default(0),
  }),
});

hubRouter.get(
  '/catalogs',
  validate(publishedCatalogListSchema),
  asyncHandler(async (req, res) => {
    const result = await listPublishedCatalogs(req.validated.query);
    res.json({
      ...result,
      hasMore: result.offset + result.items.length < result.total,
    });
  })
);

hubRouter.get(
  '/catalogs/:slug',
  asyncHandler(async (req, res) => {
    const catalog = await getPublishedCatalog(req.params.slug);
    res.json(catalog);
  })
);

// Public Published 3D/AR Experience
hubRouter.get(
  '/experiences/:slug',
  asyncHandler(async (req, res) => {
    const experience = await getPublishedExperience(req.params.slug);
    res.json(experience);
  })
);


// Public Lead Capture Form (with Consent & Honeypot Anti-Spam)
const publicHubLeadSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    company: z.string().optional(),
    intent: z.enum(['quote', 'demo', 'technical_spec', 'contact_sales', 'brochure', 'contact']).default('quote'),
    message: z.string().optional(),
    source: z.string().optional().default('Spatial Hub'),
    qrAttributed: z.boolean().optional().default(false),
    slug: z.string().optional(),
    catalogId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    experienceId: z.string().uuid().optional(),
    organizationId: z.string().uuid().optional(),
    visitorId: z.string().optional(),
    consent: z.object({
      consentGiven: z.boolean(),
      consentText: z.string().optional(),
      consentTimestamp: z.string().optional()
    }),
    hp_token: z.string().optional(),
    website_trap: z.string().optional()
  })
});

hubRouter.post(
  '/leads',
  validate(publicHubLeadSchema),
  asyncHandler(async (req, res) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const result = await capturePublicLead(req.validated.body, clientIp);
    res.status(201).json(result);
  })
);

// Public Hub RFQ / Quote Basket Submission
const publicHubRfqSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    company: z.string().optional(),
    intent: z.string().optional().default('quote'),
    timeline: z.string().optional().default('1-3 months'),
    targetDelivery: z.string().optional(),
    message: z.string().optional(),
    campaign: z.string().optional().default('Direct Hub'),
    shortCode: z.string().nullable().optional(),
    qrAttributed: z.boolean().optional().default(false),
    idempotencyKey: z.string().optional(),
    organizationId: z.string().uuid().optional(),
    items: z.array(z.object({
      productId: z.string().uuid().optional(),
      name: z.string(),
      modelUrl: z.string().optional(),
      posterUrl: z.string().optional(),
      quantity: z.number().int().min(1).default(1),
      notes: z.string().optional()
    })).min(1, 'At least one item required in RFQ'),
    consent: z.object({
      consentGiven: z.boolean(),
      consentText: z.string().optional(),
      consentTimestamp: z.string().optional()
    }),
    hp_token: z.string().optional(),
    website_trap: z.string().optional()
  })
});

hubRouter.post(
  '/rfq',
  hubRfqLimiter,
  validate(publicHubRfqSchema),
  asyncHandler(async (req, res) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const result = await submitHubRfq(req.validated.body, clientIp);
    res.status(201).json(result);
  })
);

// ==========================================
// 4. PUBLIC MODERATION & ABUSE REPORTING (HUB-15)
// ==========================================
const publicReportSchema = z.object({
  body: z.object({
    entityType: z.enum(['product', 'catalog', 'comment', 'organization', 'shortlink']),
    entityId: z.string().min(1, 'Entity ID or code required'),
    reason: z.string().min(3, 'Reason must be at least 3 characters').max(500),
    details: z.string().max(2000).optional(),
    reporterEmail: z.string().email().optional(),
    hp_token: z.string().optional(),
    website_trap: z.string().optional()
  })
});

hubRouter.post(
  '/report',
  hubReportLimiter,
  validate(publicReportSchema),
  asyncHandler(async (req, res) => {
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, config.jwtSecret);
        userId = decoded.sub || decoded.userId || null;
      } catch {
        // Optional auth: ignore token errors for public reporting
      }
    }
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const result = await submitModerationReport(req.validated.body, clientIp, userId);
    res.status(201).json(result);
  })
);

// ==========================================
// 5. HUB TELEMETRY INGESTION (HUB-15 / Lens)
// ==========================================
const hubTelemetrySchema = z.object({
  body: z.object({
    eventType: z.enum([
      'product_view',
      '3d_interaction',
      'viewer.3d_interacted',
      'ar_launch',
      'ar.launch_attempted',
      'ar.launch_succeeded',
      'basket.item_added',
      'rfq.submitted',
      'search',
      'share.clicked',
      'model_download'
    ]),
    productId: z.string().uuid().optional(),
    catalogId: z.string().uuid().optional(),
    organizationId: z.string().uuid().optional(),
    visitorId: z.string().optional(),
    metadata: z.record(z.unknown()).optional().default({})
  })
});

hubRouter.post(
  '/telemetry',
  hubTelemetryLimiter,
  enforcePayloadCap(8192),
  validate(hubTelemetrySchema),
  asyncHandler(async (req, res) => {
    const { eventType, productId, catalogId, visitorId, metadata } = req.validated.body;
    let organizationId = req.validated.body.organizationId;

    if (!organizationId && productId) {
      const prodRes = await query(`SELECT organization_id FROM products WHERE id = $1`, [productId]);
      if (prodRes.rows.length > 0) {
        organizationId = prodRes.rows[0].organization_id;
      }
    }

    if (!organizationId) {
      const orgRes = await query(`SELECT id FROM organizations LIMIT 1`);
      if (orgRes.rows.length > 0) {
        organizationId = orgRes.rows[0].id;
      }
    }

    if (productId && eventType === 'product_view') {
      try {
        await query(`UPDATE products SET views_count = views_count + 1 WHERE id = $1`, [productId]);
      } catch (err) {
        console.warn('Could not update views_count:', err);
      }
    }

    const event = await trackEvent({
      organizationId,
      productId: productId || null,
      catalogId: catalogId || null,
      visitorId: visitorId || 'anonymous_hub_user',
      eventType,
      metadata
    });

    res.status(201).json({ success: true, event });
  })
);

// ==========================================
// 6. DYNAMIC SOCIAL METADATA & SSR SHARING (HUB-13)
// ==========================================
hubRouter.get(
  '/meta/:type/:identifier',
  asyncHandler(async (req, res) => {
    const { type, identifier } = req.params;
    const meta = await generateSocialMeta(type, identifier);
    const htmlTags = generateHtmlMetaTags(meta);
    res.json({ ...meta, meta, htmlTags });
  })
);

hubRouter.get(
  '/share/:type/:identifier',
  asyncHandler(async (req, res) => {
    const { type, identifier } = req.params;
    const meta = await generateSocialMeta(type, identifier);
    const tags = generateHtmlMetaTags(meta);
    const redirectUrl = meta.url;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${tags}
  <meta http-equiv="refresh" content="0; url=${redirectUrl}" />
  <script>window.location.href = ${JSON.stringify(redirectUrl)};</script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; text-align: center; margin: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155;">
    <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${meta.title}</h1>
    <p style="color: #94a3b8; line-height: 1.5;">${meta.description}</p>
    ${meta.image ? `<img src="${meta.image}" alt="${meta.title}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0;" />` : ''}
    <p><a href="${redirectUrl}" style="display: inline-block; padding: 10px 20px; background: #06b6d4; color: #000; font-weight: bold; border-radius: 6px; text-decoration: none;">View 3D Model in Spatial Hub</a></p>
  </div>
</body>
</html>`);
  })
);

// ==========================================
// 7. SOCIAL INTERACTIONS (Requires Auth)
// ==========================================
hubRouter.use(requireAuth); // All routes below require login

const interactionSchema = z.object({
  params: z.object({
    entityType: z.enum(['product', 'catalog', 'comment']),
    entityId: z.string().uuid()
  })
});

// Toggle Like
hubRouter.post(
  '/:entityType/:entityId/like',
  validate(interactionSchema),
  asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.validated.params;
    const userId = req.user.id;
    
    const existing = await query(`SELECT id FROM hub_interactions WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3 AND interaction_type = 'like'`, [userId, entityType, entityId]);
    
    if (existing.rows.length > 0) {
      await query(`DELETE FROM hub_interactions WHERE id = $1`, [existing.rows[0].id]);
      if (entityType === 'product') await query(`UPDATE products SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1`, [entityId]);
      res.json({ liked: false });
    } else {
      await query(`INSERT INTO hub_interactions (user_id, entity_type, entity_id, interaction_type) VALUES ($1, $2, $3, 'like')`, [userId, entityType, entityId]);
      if (entityType === 'product') await query(`UPDATE products SET likes_count = likes_count + 1 WHERE id = $1`, [entityId]);
      res.json({ liked: true });
    }
  })
);

// Add Comment
const commentSchema = interactionSchema.extend({
  body: z.object({ content: z.string().min(1) })
});
hubRouter.post(
  '/:entityType/:entityId/comments',
  validate(commentSchema),
  asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.validated.params;
    const { content } = req.validated.body;
    
    const { rows } = await query(`
      INSERT INTO hub_comments (user_id, entity_type, entity_id, content) 
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [req.user.id, entityType, entityId, content]);
    
    res.status(201).json(rows[0]);
  })
);

// Follow Creator
const followSchema = z.object({ id: z.string().uuid() });
hubRouter.post(
  '/creators/:id/follow',
  validate(followSchema, 'params'),
  asyncHandler(async (req, res) => {
    const followedId = req.validated.params.id;
    const followerId = req.user.id;
    
    if (followedId === followerId) throw new ApiError(400, 'Cannot follow yourself');
    
    const existing = await query(`SELECT * FROM hub_followers WHERE follower_id = $1 AND followed_id = $2`, [followerId, followedId]);
    
    if (existing.rows.length > 0) {
      await query(`DELETE FROM hub_followers WHERE follower_id = $1 AND followed_id = $2`, [followerId, followedId]);
      await query(`UPDATE creator_profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE user_id = $1`, [followedId]);
      res.json({ following: false });
    } else {
      await query(`INSERT INTO hub_followers (follower_id, followed_id) VALUES ($1, $2)`, [followerId, followedId]);
      // Ensure profile exists
      await query(`INSERT INTO creator_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET followers_count = creator_profiles.followers_count + 1`, [followedId]);
      res.json({ following: true });
    }
  })
);

// Report Content (Authenticated)
const reportSchema = z.object({ 
  reason: z.string().min(1),
  details: z.string().max(2000).optional()
});

hubRouter.post(
  '/:entityType/:entityId/report',
  validate(interactionSchema, 'params'),
  validate(reportSchema),
  asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.validated.params;
    const { reason, details = '' } = req.validated.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    
    const result = await submitModerationReport({
      entityType,
      entityId,
      reason,
      details
    }, clientIp, req.user.id);
    
    res.status(201).json(result.report || result);
  })
);
