import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { 
  getOrganizationShowcase, 
  getPublishedCatalog, 
  getPublishedExperience, 
  capturePublicLead, 
  generateSocialMeta 
} from '../services/hub/hubService.js';

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
      params.push(cursor);
      whereClause += ` AND p.created_at < $${params.length}`;
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
    const nextCursor = items.length > 0 && hasMore ? items[items.length - 1].created_at : null;

    if (isPaginated) {
      res.json({
        items,
        nextCursor,
        hasMore,
        count: items.length
      });
    } else {
      res.json(items);
    }
  })
);

// ==========================================
// 2. SEARCH
// ==========================================
const searchSchema = z.object({ query: z.object({ query: z.string().optional(), category: z.string().optional() }) });
hubRouter.get(
  '/search',
  validate(searchSchema),
  asyncHandler(async (req, res) => {
    const { query: searchQuery, category } = req.validated.query;
    let sql = `
      SELECT p.*, c.name as company_name, u.name as creator_name
      FROM products p
      JOIN organizations c ON p.organization_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.is_public = true AND p.status = 'Published'
    `;
    const params = [];
    if (searchQuery) {
      params.push(`%${searchQuery}%`);
      sql += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR $${params.length} = ANY(p.tags))`;
    }
    if (category) {
      params.push(category);
      sql += ` AND p.category = $${params.length}`;
    }
    sql += ` ORDER BY p.created_at DESC LIMIT 50`;
    const { rows } = await query(sql, params);
    res.json(rows);
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
             u.name as creator_name, u.avatar_url as creator_avatar
      FROM products p
      JOIN organizations c ON p.organization_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1 AND p.is_public = true AND p.status = 'Published'
    `, [id]);
    
    if (!rows[0]) throw new ApiError(404, 'Public product not found');
    res.json(rows[0]);
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

// Social Meta Previews (OpenGraph)
hubRouter.get(
  '/meta/:type/:slug',
  asyncHandler(async (req, res) => {
    const meta = await generateSocialMeta(req.params.type, req.params.slug);
    res.json(meta);
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

// ==========================================
// 4. SOCIAL INTERACTIONS (Requires Auth)
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

// Report Content
const reportSchema = z.object({ reason: z.string().min(1) });
hubRouter.post(
  '/:entityType/:entityId/report',
  validate(interactionSchema, 'params'),
  validate(reportSchema),
  asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.validated.params;
    const { reason } = req.validated.body;
    
    const { rows } = await query(`
      INSERT INTO moderation_reports (reporter_id, entity_type, entity_id, reason) 
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [req.user.id, entityType, entityId, reason]);
    
    res.status(201).json(rows[0]);
  })
);
