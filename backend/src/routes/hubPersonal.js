import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const hubPersonalRouter = Router();

hubPersonalRouter.use(requireAuth); // All personal routes require auth

const contentIdSchema = z.object({
  params: z.object({
    contentId: z.string().uuid()
  })
});

const contentSchema = z.object({
  body: z.object({
    contentId: z.string().uuid(),
    contentType: z.string().min(1)
  })
});

// ==========================================
// SAVED ITEMS
// ==========================================

hubPersonalRouter.get(
  '/saved',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { rows } = await query(`
      SELECT * FROM saved_items 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);
    res.json(rows);
  })
);

hubPersonalRouter.post(
  '/saved',
  validate(contentSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { contentId, contentType } = req.validated.body;
    
    const { rows } = await query(`
      INSERT INTO saved_items (user_id, content_id, content_type) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (user_id, content_id) DO NOTHING
      RETURNING *
    `, [userId, contentId, contentType]);
    
    res.json({ success: true, item: rows[0] || null });
  })
);

hubPersonalRouter.delete(
  '/saved/:contentId',
  validate(contentIdSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { contentId } = req.validated.params;
    
    await query(`
      DELETE FROM saved_items 
      WHERE user_id = $1 AND content_id = $2
    `, [userId, contentId]);
    
    res.json({ success: true });
  })
);

// ==========================================
// LIKED ITEMS
// ==========================================

hubPersonalRouter.get(
  '/liked',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { rows } = await query(`
      SELECT * FROM liked_items 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);
    res.json(rows);
  })
);

hubPersonalRouter.post(
  '/liked',
  validate(contentSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { contentId, contentType } = req.validated.body;
    
    const { rows } = await query(`
      INSERT INTO liked_items (user_id, content_id, content_type) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (user_id, content_id) DO NOTHING
      RETURNING *
    `, [userId, contentId, contentType]);
    
    // Attempt to increment likes_count on products if it's a product
    if (contentType === 'product') {
       await query(`UPDATE products SET likes_count = likes_count + 1 WHERE id = $1`, [contentId]).catch(() => {});
    }
    
    res.json({ success: true, item: rows[0] || null });
  })
);

hubPersonalRouter.delete(
  '/liked/:contentId',
  validate(contentIdSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { contentId } = req.validated.params;
    
    const { rowCount } = await query(`
      DELETE FROM liked_items 
      WHERE user_id = $1 AND content_id = $2
    `, [userId, contentId]);
    
    // Try decrementing if we actually deleted
    if (rowCount > 0) {
      await query(`UPDATE products SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1`, [contentId]).catch(() => {});
    }
    
    res.json({ success: true });
  })
);

// ==========================================
// SUBSCRIPTIONS
// ==========================================

hubPersonalRouter.get(
  '/subscriptions',
  asyncHandler(async (req, res) => {
    // Assuming the user has an organization_id attached to their context
    const orgId = req.user.organization_id;
    
    if (!orgId) {
      return res.json({ subscription: null });
    }
    
    const { rows } = await query(`
      SELECT * FROM hub_subscriptions 
      WHERE organization_id = $1
    `, [orgId]);
    
    res.json({ subscription: rows[0] || null });
  })
);
