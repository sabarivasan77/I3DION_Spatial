import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { requirePermission } from '../middleware/permissions.js';
import { subscriptionService } from '../services/subscription/subscriptionService.js';
import { entitlementService } from '../services/entitlement/entitlementService.js';
import { billingProvider } from '../services/billing/billingProvider.js';
import { pool } from '../db/pool.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireTenant);

/**
 * GET /api/v1/billing/plans
 * List available SaaS plans
 */
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await subscriptionService.getAllPlans();
    res.json({ plans });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/billing/subscription
 * Get active subscription details and entitlement caps
 */
router.get('/subscription', async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getOrganizationSubscription(req.organizationId);
    res.json({ subscription });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/billing/usage
 * Get current resource counters and plan limits
 */
router.get('/usage', async (req, res, next) => {
  try {
    const data = await entitlementService.getOrganizationEntitlementsAndUsage(req.organizationId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/billing/checkout
 * Initiate checkout order for plan upgrade
 */
router.post('/checkout', requirePermission('billing.manage'), async (req, res, next) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;
    const planRes = await pool.query(`SELECT * FROM plans WHERE id = $1`, [planId]);
    if (planRes.rows.length === 0) {
      return res.status(404).json({ error: 'PLAN_NOT_FOUND', message: 'Target plan does not exist' });
    }

    const plan = planRes.rows[0];
    const amountInr = billingCycle === 'yearly' ? plan.price_yearly_inr : plan.price_monthly_inr;

    if (amountInr === 0) {
      // Free plan switch directly
      const sub = await subscriptionService.changePlan(req.organizationId, planId, billingCycle);
      return res.json({ success: true, isFree: true, subscription: sub });
    }

    const order = await billingProvider.createOrder({
      amountInr,
      currency: 'INR',
      receipt: `rcpt_${req.organizationId.slice(0, 8)}_${Date.now()}`,
      notes: { organizationId: req.organizationId, planId, billingCycle }
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: billingProvider.keyId,
      planId,
      billingCycle
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/billing/verify
 * Verify payment signature and complete subscription upgrade
 */
router.post('/verify', requirePermission('billing.manage'), async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billingCycle } = req.body;

    const isValid = billingProvider.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isValid) {
      return res.status(400).json({ error: 'INVALID_SIGNATURE', message: 'Payment verification failed.' });
    }

    // Record Payment
    await pool.query(
      `INSERT INTO payments (organization_id, razorpay_payment_id, razorpay_order_id, amount_inr, status)
       VALUES ($1, $2, $3, $4, 'captured')
       ON CONFLICT (razorpay_payment_id) DO NOTHING`,
      [req.organizationId, razorpay_payment_id, razorpay_order_id, 0]
    );

    // Apply plan upgrade
    const sub = await subscriptionService.changePlan(req.organizationId, planId, billingCycle);

    res.json({ success: true, message: 'Plan upgraded successfully!', subscription: sub });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/billing/cancel
 * Cancel subscription at period end
 */
router.post('/cancel', requirePermission('billing.manage'), async (req, res, next) => {
  try {
    const sub = await subscriptionService.cancelSubscription(req.organizationId);
    res.json({ success: true, message: 'Subscription will cancel at period end.', subscription: sub });
  } catch (err) {
    next(err);
  }
});

export default router;
