import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const hubRouter = Router();

// ==========================================
// 1. PUBLIC FEED
// ==========================================
hubRouter.get(
  '/feed',
  asyncHandler(async (req, res) => {
    const { rows } = await query(`
      SELECT p.*, c.name as company_name, c.logo_url as company_logo, 
             u.name as creator_name, u.avatar_url as creator_avatar,
             (p.likes_count * 5 + p.views_count * 1) as trending_score
      FROM products p
      JOIN organizations c ON p.organization_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.is_public = true AND p.status = 'Published'
      ORDER BY trending_score DESC, p.created_at DESC
      LIMIT 50
    `);
    res.json(rows);
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
