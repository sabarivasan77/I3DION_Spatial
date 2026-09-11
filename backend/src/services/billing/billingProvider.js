import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { config } from '../../config.js';

export class RazorpayBillingProvider {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TaoMEJWYCgt4Xz';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'fOTIh0JDvGa65UH4sitvlVP1';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';

    this.razorpay = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret
    });
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
   * Create an Order for checkout using official Razorpay SDK
   */
  async createOrder({ amount, amountInr, currency = 'INR', receipt, notes = {} }) {
    // Support both amountInr (in INR) and amount (in paise or INR)
    let amountInPaise = amountInr !== undefined ? Math.round(amountInr * 100) : amount;
    if (!amountInPaise || amountInPaise < 100) {
      // If amount provided in INR (e.g. 500), convert to paise (50000)
      if (amount && amount > 0 && amount < 100) {
        amountInPaise = Math.round(amount * 100);
      } else if (!amountInPaise) {
        amountInPaise = 100; // minimum 100 paise
      }
    }
    if (amountInPaise < 100) {
      amountInPaise = 100;
    }

    const orderOptions = {
      amount: Math.round(amountInPaise),
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes
    };

    const order = await this.razorpay.orders.create(orderOptions);
    return order;
  }

  /**
   * Create or fetch customer in Razorpay
   */
  async createCustomer({ name, email, phone }) {
    try {
      const customer = await this.razorpay.customers.create({
        name,
        email,
        contact: phone
      });
      return customer;
    } catch (err) {
      return { id: `cust_${Date.now()}`, name, email };
    }
  }
}

export const billingProvider = new RazorpayBillingProvider();

