import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { requirePermission } from '../middleware/permissions.js';
import { setPublishingAccessForProduct, getPublishingAccessForProduct } from '../services/productFlow.js';
import { notificationService } from '../services/notificationService.js';
import { query } from '../db/pool.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireTenant);

/**
 * GET /api/v1/publishing/product/:id
 * Get publishing access settings and visibility policy
 */
router.get('/product/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const access = await getPublishingAccessForProduct(id);
    res.json({ access });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/publishing/product/:id
 * Update product visibility and approval workflow state
 */
router.post('/product/:id', requirePermission('products.update'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { visibility = 'PUBLIC', approvalStatus = 'PUBLISHED', restrictedUserIds = [], restrictedTeamIds = [] } = req.body;

    const access = await setPublishingAccessForProduct({
      organizationId: req.organizationId,
      productId: id,
      visibility,
      approvalStatus,
      userId: req.user.id,
      restrictedUserIds,
      restrictedTeamIds,
    });

    // Fetch product name for notification
    const prodRes = await query('SELECT name FROM products WHERE id = $1', [id]);
    const productName = prodRes.rows[0]?.name || 'Spatial Product';

    // Trigger Notification to Organization Admins
    if (approvalStatus === 'PUBLISHED') {
      await notificationService.notifyOrganizationRoles({
        organizationId: req.organizationId,
        targetRoles: ['Admin', 'Super Admin', 'Company Admin', 'Manager'],
        title: `Product Published: ${productName}`,
        body: `${req.user.name} published ${productName} with ${visibility} visibility.`,
        category: 'publishing',
        priority: 'INFO',
        actionUrl: `/products`,
      });
    } else if (approvalStatus === 'PENDING_REVIEW') {
      await notificationService.notifyOrganizationRoles({
        organizationId: req.organizationId,
        targetRoles: ['Admin', 'Super Admin', 'Company Admin'],
        title: `Publish Approval Required: ${productName}`,
        body: `${req.user.name} requested publication approval for ${productName}.`,
        category: 'publishing',
        priority: 'WARNING',
        actionUrl: `/products`,
      });
    }

    res.json({ success: true, access });
  } catch (err) {
    next(err);
  }
});

export default router;
