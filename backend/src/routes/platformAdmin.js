import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { pool } from '../db/pool.js';
import { ApiError } from '../utils/errors.js';

const router = express.Router();

router.use(requireAuth);

/**
 * Middleware: Ensure user is a Platform Admin (Super Admin)
 */
function requirePlatformAdmin(req, res, next) {
  if (req.user?.role !== 'Super Admin' && req.user?.role !== 'Admin') {
    return next(new ApiError(403, 'Platform Admin authorization required. Access denied.'));
  }
  next();
}

router.use(requirePlatformAdmin);

/**
 * GET /api/v1/platform-admin/enterprise/requests
 * List all Enterprise inquiries
 */
router.get('/enterprise/requests', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT er.*, o.name as organization_name, u.name as requester_name, s.plan_id as current_plan
       FROM enterprise_requests er
       LEFT JOIN organizations o ON er.organization_id = o.id
       LEFT JOIN users u ON er.user_id = u.id
       LEFT JOIN subscriptions s ON er.organization_id = s.organization_id
       ORDER BY er.created_at DESC`
    );
    res.json({ requests: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/platform-admin/enterprise/requests/:id/status
 * Update status of an Enterprise request
 */
router.patch('/enterprise/requests/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE enterprise_requests SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'REQUEST_NOT_FOUND', message: 'Enterprise request not found' });
    }

    res.json({ success: true, request: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/platform-admin/enterprise/offers
 * List created Enterprise custom offers
 */
router.get('/enterprise/offers', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT eo.*, o.name as organization_name
       FROM enterprise_offers eo
       JOIN organizations o ON eo.organization_id = o.id
       ORDER BY eo.created_at DESC`
    );
    res.json({ offers: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/platform-admin/enterprise/offers
 * Create a Custom Enterprise Offer for an Organization
 */
router.post('/enterprise/offers', async (req, res, next) => {
  try {
    const {
      organization_id,
      request_id,
      custom_price_inr,
      billing_interval = 'monthly',
      product_limit = 500,
      model_limit = 500,
      catalog_limit = 100,
      team_limit = 50,
      storage_limit_bytes = 536870912000,
      feature_entitlements = {},
      notes
    } = req.body;

    if (!organization_id) {
      return res.status(400).json({ error: 'MISSING_ORG', message: 'organization_id is required' });
    }

    const offerRes = await pool.query(
      `INSERT INTO enterprise_offers 
         (organization_id, request_id, created_by, status, custom_price_inr, billing_interval, product_limit, model_limit, catalog_limit, team_limit, storage_limit_bytes, feature_entitlements, notes)
       VALUES ($1, $2, $3, 'sent', $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        organization_id,
        request_id || null,
        req.user.id,
        custom_price_inr || 0,
        billing_interval,
        product_limit,
        model_limit,
        catalog_limit,
        team_limit,
        storage_limit_bytes,
        JSON.stringify(feature_entitlements),
        notes || null
      ]
    );

    if (request_id) {
      await pool.query(`UPDATE enterprise_requests SET status = 'offer_prepared' WHERE id = $1`, [request_id]);
    }

    res.json({ success: true, offer: offerRes.rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/platform-admin/enterprise/offers/:id/activate
 * Activate an Enterprise offer directly for an Organization
 */
router.post('/enterprise/offers/:id/activate', async (req, res, next) => {
  try {
    const { id } = req.params;

    const offerRes = await pool.query(`SELECT * FROM enterprise_offers WHERE id = $1`, [id]);
    if (offerRes.rows.length === 0) {
      return res.status(404).json({ error: 'OFFER_NOT_FOUND', message: 'Enterprise offer not found' });
    }

    const offer = offerRes.rows[0];

    // Mark offer active
    await pool.query(`UPDATE enterprise_offers SET status = 'active', updated_at = now() WHERE id = $1`, [id]);

    if (offer.request_id) {
      await pool.query(`UPDATE enterprise_requests SET status = 'active', updated_at = now() WHERE id = $1`, [offer.request_id]);
    }

    // Update Subscription table for the Organization
    const updatedSub = await pool.query(
      `UPDATE subscriptions
       SET plan_id = 'ENTERPRISE',
           billing_cycle = $1,
           status = 'active',
           custom_price_inr = $2,
           custom_max_products = $3,
           custom_max_catalogs = $4,
           custom_max_3d_models = $5,
           custom_max_team_members = $6,
           custom_max_storage_bytes = $7,
           custom_features = $8,
           enterprise_offer_id = $9,
           current_period_start = now(),
           current_period_end = now() + (CASE WHEN $1 = 'yearly' THEN interval '1 year' ELSE interval '1 month' END),
           updated_at = now()
       WHERE organization_id = $10
       RETURNING *`,
      [
        offer.billing_interval,
        offer.custom_price_inr,
        offer.product_limit,
        offer.catalog_limit,
        offer.model_limit,
        offer.team_limit,
        offer.storage_limit_bytes,
        JSON.stringify(offer.feature_entitlements),
        offer.id,
        offer.organization_id
      ]
    );

    res.json({
      success: true,
      message: 'Enterprise custom plan activated successfully!',
      subscription: updatedSub.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

export default router;
