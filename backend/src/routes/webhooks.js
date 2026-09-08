import express from 'express';
import { billingProvider } from '../services/billing/billingProvider.js';
import { pool } from '../db/pool.js';
import { subscriptionService } from '../services/subscription/subscriptionService.js';

const router = express.Router();

/**
 * POST /api/v1/webhooks/razorpay
 * Idempotent Razorpay Webhook Handler with raw HMAC verification
 */
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body.toString();

  // Verify HMAC signature
  const isValid = billingProvider.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    console.warn('⚠️ Invalid Razorpay webhook signature');
    return res.status(400).send('Invalid signature');
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    return res.status(400).send('Invalid JSON payload');
  }

  const eventId = event.event_id || event.payload?.payment?.entity?.id || `${Date.now()}`;
  const eventType = event.event;

  try {
    // Check webhook idempotency
    const existing = await pool.query(
      `SELECT id FROM billing_events WHERE provider = 'razorpay' AND provider_event_id = $1`,
      [eventId]
    );

    if (existing.rows.length > 0) {
      console.log(`ℹ️ Webhook event ${eventId} already processed.`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Process event types
    switch (eventType) {
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        const orgId = payment.notes?.organizationId;
        const planId = payment.notes?.planId;
        const cycle = payment.notes?.billingCycle || 'monthly';

        if (orgId && planId) {
          await subscriptionService.changePlan(orgId, planId, cycle);
        }
        break;
      }
      case 'subscription.charged': {
        const subEntity = event.payload.subscription.entity;
        const orgId = subEntity.notes?.organizationId;
        if (orgId) {
          await pool.query(
            `UPDATE subscriptions SET status = 'active', current_period_end = now() + interval '30 days' WHERE organization_id = $1`,
            [orgId]
          );
        }
        break;
      }
      case 'subscription.halted':
      case 'payment.failed': {
        const entity = event.payload.payment?.entity || event.payload.subscription?.entity;
        const orgId = entity?.notes?.organizationId;
        if (orgId) {
          await pool.query(
            `UPDATE subscriptions SET status = 'payment_failed' WHERE organization_id = $1`,
            [orgId]
          );
        }
        break;
      }
    }

    // Save event for idempotency
    await pool.query(
      `INSERT INTO billing_events (provider, provider_event_id, event_type, payload)
       VALUES ('razorpay', $1, $2, $3)
       ON CONFLICT (provider, provider_event_id) DO NOTHING`,
      [eventId, eventType, event]
    );

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Error processing webhook event:', err);
    res.status(500).send('Webhook processing error');
  }
});

export default router;
