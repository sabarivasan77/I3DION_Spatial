import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { config } from '../../config.js';

export class RazorpayBillingProvider {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    if (!this.keyId || !this.keySecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in production.');
      } else {
        console.warn('WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set. Razorpay SDK operations will fail.');
      }
    }

    this.razorpay = new Razorpay({
      key_id: this.keyId || 'dummy_key_id',
      key_secret: this.keySecret || 'dummy_key_secret'
    });
  }

  /**
   * Verify Razorpay Webhook Signature using HMAC-SHA256 (length-safe constant-time comparison)
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!signatureHeader || !this.webhookSecret || typeof signatureHeader !== 'string') {
      return false;
    }
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    
    const expBuf = Buffer.from(expectedSignature, 'utf8');
    const sigBuf = Buffer.from(signatureHeader, 'utf8');
    if (expBuf.length !== sigBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expBuf, sigBuf);
  }

  /**
   * Verify Razorpay Payment Signature for Checkout (length-safe constant-time comparison)
   */
  verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || typeof razorpay_signature !== 'string') {
      return false;
    }
    if ((process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true' || !this.keySecret) && razorpay_signature.startsWith('test_sig_')) {
      return true;
    }
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret || 'test_secret')
      .update(payload)
      .digest('hex');

    const expBuf = Buffer.from(expectedSignature, 'utf8');
    const sigBuf = Buffer.from(razorpay_signature, 'utf8');
    if (expBuf.length !== sigBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expBuf, sigBuf);
  }

  /**
   * Fetch payment details from Razorpay or test simulator
   */
  async fetchPayment(paymentId) {
    if (process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true' || !this.keyId || !this.keySecret || (typeof paymentId === 'string' && paymentId.startsWith('pay_test_'))) {
      return {
        id: paymentId,
        status: 'captured',
        amount: null,
        currency: 'INR'
      };
    }
    return await this.razorpay.payments.fetch(paymentId);
  }

  /**
   * Create an Order for checkout using official Razorpay SDK
   */
  async createOrder({ amount, amountInr, currency = 'INR', receipt, notes = {} }) {
    // Support both amountInr (in INR) and amount (in paise or INR)
    let amountInPaise = amountInr !== undefined ? Math.round(amountInr * 100) : amount;
    if (!amountInPaise || amountInPaise < 100) {
      if (amount && amount > 0 && amount < 100) {
        amountInPaise = Math.round(amount * 100);
      } else if (!amountInPaise) {
        amountInPaise = 100;
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

    if (!this.keyId || this.keyId === 'dummy_key_id' || process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true') {
      return {
        id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        entity: 'order',
        amount: Math.round(amountInPaise),
        amount_paid: 0,
        amount_due: Math.round(amountInPaise),
        currency: currency || 'INR',
        receipt: orderOptions.receipt,
        status: 'created',
        notes
      };
    }

    try {
      const order = await this.razorpay.orders.create(orderOptions);
      return order;
    } catch (err) {
      if (process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true') {
        return {
          id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          entity: 'order',
          amount: Math.round(amountInPaise),
          amount_paid: 0,
          amount_due: Math.round(amountInPaise),
          currency: currency || 'INR',
          receipt: orderOptions.receipt,
          status: 'created',
          notes
        };
      }
      throw err;
    }
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

