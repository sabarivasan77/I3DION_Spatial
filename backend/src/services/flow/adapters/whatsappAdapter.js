/**
 * I3DION Spatial — WhatsApp Business Platform Adapter (Phase P2)
 * Implements Master Prompt v5.0 §6 & Decision D-08:
 *  - Official WhatsApp Business Platform Cloud API template messaging
 *  - Sandbox mode with delivery ledger for testing and local development
 *  - Interactive template buttons (View 3D Model, Request Quote, Confirm SLA)
 *  - Multi-language template parameter substitution
 */

import crypto from 'node:crypto';

export class WhatsAppAdapter {
  constructor(options = {}) {
    this.sandboxMode = options.sandboxMode !== false; // Default to sandbox per Decision D-08
    this.phoneNumberId = options.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || 'sandbox_phone_123';
    this.accessToken = options.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || 'sandbox_token_abc';
    this.sentMessagesLedger = [];
  }

  /**
   * Sends a templated WhatsApp message per Meta WhatsApp Business Platform specifications
   */
  async sendTemplateMessage({
    to,
    templateName,
    languageCode = 'en',
    headerValues = [],
    bodyValues = [],
    buttonPayloads = [],
    metadata = {}
  }) {
    if (!to) {
      throw new Error('Recipient phone number (to) is required');
    }
    if (!templateName) {
      throw new Error('WhatsApp templateName is required');
    }

    const messageId = `wamid.HBgM${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const formattedPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: String(to).replace(/[^0-9+]/g, ''),
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          ...(headerValues.length > 0 ? [{
            type: 'header',
            parameters: headerValues.map(val => ({ type: 'text', text: String(val) }))
          }] : []),
          ...(bodyValues.length > 0 ? [{
            type: 'body',
            parameters: bodyValues.map(val => ({ type: 'text', text: String(val) }))
          }] : []),
          ...(buttonPayloads.length > 0 ? buttonPayloads.map((btn, idx) => ({
            type: 'button',
            sub_type: btn.type || 'url',
            index: String(idx),
            parameters: [{ type: 'text', text: String(btn.text || btn.payload) }]
          })) : [])
        ]
      }
    };

    if (this.sandboxMode) {
      const record = {
        messageId,
        to: formattedPayload.to,
        templateName,
        languageCode,
        payload: formattedPayload,
        status: 'delivered',
        timestamp,
        metadata
      };
      this.sentMessagesLedger.push(record);

      return {
        success: true,
        sandbox: true,
        messageId,
        recipient: formattedPayload.to,
        template: templateName,
        status: 'delivered',
        sentAt: timestamp
      };
    }

    // Live API dispatch (Meta Cloud API)
    const url = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`
      },
      body: JSON.stringify(formattedPayload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`WhatsApp API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    return {
      success: true,
      sandbox: false,
      messageId: data.messages?.[0]?.id || messageId,
      recipient: formattedPayload.to,
      status: 'sent'
    };
  }

  /**
   * Retrieves messages sent in sandbox mode for verification and test assertions
   */
  getSandboxMessages(toPhone = null) {
    if (!toPhone) return [...this.sentMessagesLedger];
    const cleanPhone = String(toPhone).replace(/[^0-9+]/g, '');
    return this.sentMessagesLedger.filter(m => m.to === cleanPhone);
  }

  clearSandbox() {
    this.sentMessagesLedger = [];
  }
}

export const whatsappAdapter = new WhatsAppAdapter();
