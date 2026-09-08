import crypto from 'node:crypto';
import { config } from '../../config.js';

export class RazorpayBillingProvider {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
  }

  /**
   * Verify Razorpay Webhook Signature using HMAC-SHA256
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!signatureHeader || !this.webhookSecret) {
      return false;
    }
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signatureHeader)
    );
  }

  /**
   * Verify Razorpay Payment Signature for Checkout
   */
  verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false;
    }
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === razorpay_signature;
  }

  /**
   * Create an Order for checkout
   */
  async createOrder({ amountInr, currency = 'INR', receipt, notes = {} }) {
    const amountInPaise = Math.round(amountInr * 100);
    const authHeader = 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt,
        notes
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.description || 'Failed to create Razorpay order');
    }
    return data;
  }

  /**
   * Create or fetch customer in Razorpay
   */
  async createCustomer({ name, email, phone }) {
    const authHeader = 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({ name, email, contact: phone })
    });

    const data = await res.json();
    if (!res.ok && res.status !== 400) {
      throw new Error(data.error?.description || 'Failed to create customer');
    }
    return data;
  }
}

export const billingProvider = new RazorpayBillingProvider();
