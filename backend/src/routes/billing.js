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
 * GET /api/v1/billing/invoices
 * List billing invoice history for organization
 */
router.get('/invoices', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, invoice_number, plan_id, amount_inr, tax_inr, status, period_start, period_end, pdf_url, created_at
       FROM invoices
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [req.organizationId]
    );
    res.json({ invoices: result.rows });
  } catch (err) {
    console.warn('Invoices query fallback:', err.message);
    res.json({ invoices: [] });
  }
});

/**
 * GET /api/v1/billing/info
 * Get organization billing information
 */
router.get('/info', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT billing_name, billing_email, phone, tax_id, address_line1, address_line2, city, state, postal_code, country
       FROM organization_billing_info
       WHERE organization_id = $1`,
      [req.organizationId]
    );

    if (result.rows.length === 0) {
      // Fallback default from organization & user context
      const orgRes = await pool.query(`SELECT name FROM organizations WHERE id = $1`, [req.organizationId]);
      return res.json({
        billingInfo: {
          billing_name: orgRes.rows[0]?.name || req.user.name,
          billing_email: req.user.email,
          phone: '',
          tax_id: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'India'
        }
      });
    }

    res.json({ billingInfo: result.rows[0] });
  } catch (err) {
    console.warn('Billing info query fallback:', err.message);
    res.json({
      billingInfo: {
        billing_name: req.user.name,
        billing_email: req.user.email,
        phone: '',
        tax_id: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India'
      }
    });
  }
});

/**
 * PUT /api/v1/billing/info
 * Update organization billing information
 */
router.put('/info', requirePermission('billing.manage'), async (req, res, next) => {
  try {
    const { billing_name, billing_email, phone, tax_id, address_line1, address_line2, city, state, postal_code, country } = req.body;

    const result = await pool.query(
      `INSERT INTO organization_billing_info 
         (organization_id, billing_name, billing_email, phone, tax_id, address_line1, address_line2, city, state, postal_code, country, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
       ON CONFLICT (organization_id) DO UPDATE SET
         billing_name = EXCLUDED.billing_name,
         billing_email = EXCLUDED.billing_email,
         phone = EXCLUDED.phone,
         tax_id = EXCLUDED.tax_id,
         address_line1 = EXCLUDED.address_line1,
         address_line2 = EXCLUDED.address_line2,
         city = EXCLUDED.city,
         state = EXCLUDED.state,
         postal_code = EXCLUDED.postal_code,
         country = EXCLUDED.country,
         updated_at = now()
       RETURNING *`,
      [req.organizationId, billing_name, billing_email, phone, tax_id, address_line1, address_line2, city, state, postal_code, country || 'India']
    );

    res.json({ success: true, billingInfo: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/billing/enterprise-inquiry
 * Submit custom Enterprise plan request
 */
router.post('/enterprise-inquiry', async (req, res, next) => {
  try {
    const { company_name, work_email, contact_name, phone, expected_product_count, expected_catalog_usage, team_size, required_features, message } = req.body;

    const result = await pool.query(
      `INSERT INTO enterprise_requests 
         (organization_id, user_id, company_name, work_email, contact_name, phone, expected_product_count, expected_catalog_usage, team_size, required_features, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        req.organizationId,
        req.user.id,
        company_name || req.user.name,
        work_email || req.user.email,
        contact_name || req.user.name,
        phone || null,
        expected_product_count || 100,
        expected_catalog_usage || 50,
        team_size || 10,
        JSON.stringify(required_features || []),
        message || null
      ]
    );

    res.json({
      success: true,
      message: 'Your Enterprise request has been received. Our sales team will contact you shortly.',
      request: result.rows[0]
    });
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

    if (planId === 'ENTERPRISE') {
      return res.status(400).json({
        error: 'ENTERPRISE_CUSTOM',
        message: 'Enterprise plans require a custom commercial offer. Please use Contact Sales.'
      });
    }

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

    // Authoritative Server-Side Order Record (Finding C2 / Annex A8)
    await pool.query(
      `INSERT INTO orders (id, organization_id, user_id, plan_id, billing_cycle, amount_paise, amount_inr, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'created')
       ON CONFLICT (id) DO UPDATE SET
         plan_id = EXCLUDED.plan_id,
         billing_cycle = EXCLUDED.billing_cycle,
         amount_paise = EXCLUDED.amount_paise,
         amount_inr = EXCLUDED.amount_inr,
         status = 'created',
         updated_at = now()`,
      [order.id, req.organizationId, req.user?.id || null, planId, billingCycle, order.amount, amountInr, order.currency || 'INR']
    );

    res.json({
      success: true,
      order_id: order.id,
      orderId: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: billingProvider.keyId,
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
 * Enforces Annex A8: Plan is loaded from authoritative server-side order (ignores client-supplied planId)
 */
router.post('/verify', requirePermission('billing.manage'), async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: 'failure',
        error: 'MISSING_PAYMENT_FIELDS',
        message: 'Order ID, Payment ID, and Signature are required.'
      });
    }

    // 1. Authoritative Order Lookup: verify order belongs to this tenant
    const orderRes = await pool.query(
      `SELECT * FROM orders WHERE id = $1 AND organization_id = $2`,
      [razorpay_order_id, req.organizationId]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({
        status: 'failure',
        error: 'ORDER_NOT_FOUND',
        message: 'Authoritative checkout order not found for this organization.'
      });
    }

    const order = orderRes.rows[0];

    // Idempotent return if order was already marked paid
    if (order.status === 'paid') {
      const currentSub = await subscriptionService.getOrganizationSubscription(req.organizationId);
      return res.json({
        status: 'success',
        success: true,
        message: 'Payment was already processed.',
        subscription: currentSub
      });
    }

    // 2. Length-safe constant-time signature verification
    const isValid = billingProvider.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isValid) {
      return res.status(400).json({
        status: 'failure',
        error: 'INVALID_SIGNATURE',
        message: 'Invalid payment signature'
      });
    }

    // 3. Server-to-server payment status verification
    const payment = await billingProvider.fetchPayment(razorpay_payment_id);
    if (!payment || payment.status !== 'captured') {
      return res.status(400).json({
        status: 'failure',
        error: 'PAYMENT_NOT_CAPTURED',
        message: 'Payment has not been captured.'
      });
    }

    // If provider returns an exact amount, verify that amount matches the stored order amount
    if (payment.amount !== null && payment.amount !== undefined && payment.amount !== order.amount_paise) {
      return res.status(400).json({
        status: 'failure',
        error: 'AMOUNT_MISMATCH',
        message: 'Payment amount does not match stored order amount.'
      });
    }

    // 4. Extract authoritative plan and pricing from stored order (IGNORING any client input)
    const authoritativePlanId = order.plan_id;
    const authoritativeCycle = order.billing_cycle;
    const amountInr = Number(order.amount_inr);
    const taxInr = Math.round(amountInr * 0.18 * 100) / 100;

    // Record Payment
    await pool.query(
      `INSERT INTO payments (organization_id, razorpay_payment_id, razorpay_order_id, amount_inr, status)
       VALUES ($1, $2, $3, $4, 'captured')
       ON CONFLICT (razorpay_payment_id) DO NOTHING`,
      [req.organizationId, razorpay_payment_id, razorpay_order_id, amountInr]
    );

    // Record Invoice with real amount
    const invNum = `INV-${Date.now().toString().slice(-6)}`;
    await pool.query(
      `INSERT INTO invoices (organization_id, invoice_number, plan_id, amount_inr, tax_inr, status, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5, 'paid', now(), now() + (CASE WHEN $6 = 'yearly' THEN interval '1 year' ELSE interval '1 month' END))`,
      [req.organizationId, invNum, authoritativePlanId, amountInr, taxInr, authoritativeCycle]
    );

    // Apply plan upgrade from authoritative order
    const sub = await subscriptionService.changePlan(req.organizationId, authoritativePlanId, authoritativeCycle);

    // Mark order paid
    await pool.query(
      `UPDATE orders SET status = 'paid', updated_at = now() WHERE id = $1`,
      [order.id]
    );

    // Record audit log
    await pool.query(
      `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, 'billing.plan_upgraded', 'subscription', $3, $4)`,
      [req.organizationId, req.user?.id || null, sub?.id || null, JSON.stringify({ planId: authoritativePlanId, billingCycle: authoritativeCycle, amountInr, orderId: order.id })]
    ).catch(() => {});

    res.json({
      status: 'success',
      success: true,
      message: 'Payment verified successfully',
      subscription: sub
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/billing/invoices/:id
 * Retrieve specific invoice details
 */
router.get('/invoices/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, invoice_number, plan_id, amount_inr, tax_inr, status, period_start, period_end, pdf_url, created_at
       FROM invoices
       WHERE id = $1 AND organization_id = $2`,
      [req.params.id, req.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'INVOICE_NOT_FOUND', message: 'Invoice not found' });
    }

    res.json({ invoice: result.rows[0] });
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

    // Record audit log
    await pool.query(
      `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, 'billing.subscription_cancelled', 'subscription', $3, $4)`,
      [req.organizationId, req.user?.id || null, sub?.id || null, JSON.stringify({ cancelled_at: new Date() })]
    ).catch(() => {});

    res.json({ success: true, message: 'Subscription will cancel at period end.', subscription: sub });
  } catch (err) {
    next(err);
  }
});

export default router;
