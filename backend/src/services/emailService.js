import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { query } from '../db/pool.js';

class EmailProvider {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      console.log('📧 SMTP Email Provider initialized.');
    } else {
      console.log('📧 Console Fallback Email Provider active (Logs emails locally).');
    }
  }

  async send({ to, subject, html, text }) {
    const from = process.env.EMAIL_FROM || '"I3DION Spatial" <notifications@i3dion.com>';

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({ from, to, subject, html, text });
        console.log(`📧 Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error(`❌ SMTP delivery failed to ${to}:`, err.message);
      }
    }

    // Fallback Console Logger for Development / Local Deployments
    console.log(`\n============== 📧 EMAIL DISPATCH [TO: ${to}] ==============`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text || html.replace(/<[^>]+>/g, '')}`);
    console.log(`===========================================================\n`);

    return { success: true, messageId: `fallback_${Date.now()}` };
  }
}

export const emailProvider = new EmailProvider();

export class EmailService {
  /**
   * Render branded HTML template wrapper
   */
  renderTemplate(title, bodyHtml, actionBtn = null) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #0b0f17; margin: 0; padding: 40px 20px; color: #e2e8f0; }
          .card { max-width: 580px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 20px; padding: 40px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
          .brand { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
          .brand span { color: #3b82f6; }
          h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }
          .otp-code { background: #0f172a; border: 1px border-blue-500/30; border-radius: 14px; padding: 16px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #60a5fa; margin: 24px 0; }
          .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 600; font-size: 14px; margin-top: 12px; }
          .footer { font-size: 12px; color: #64748b; margin-top: 32px; padding-top: 20px; border-top: 1px solid #1e293b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">
            <div class="brand">I3DION <span>SPATIAL</span></div>
          </div>
          <h1>${title}</h1>
          ${bodyHtml}
          ${actionBtn ? `<div style="text-align: center;"><a href="${actionBtn.url}" class="btn">${actionBtn.text}</a></div>` : ''}
          <div class="footer">
            © ${new Date().getFullYear()} I3DION Spatial Enterprise. All rights reserved.<br>
            Automated notification. Please do not reply directly to this message.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendOtpEmail(email, otpCode, purposeTitle) {
    const title = `Verification Code for ${purposeTitle}`;
    const bodyHtml = `
      <p>Use the following 6-digit verification code to complete your security verification. This code expires in <strong>10 minutes</strong>.</p>
      <div class="otp-code">${otpCode}</div>
      <p style="font-size: 12px; color: #64748b;">If you did not request this verification code, please ignore this message or contact your Organization Administrator.</p>
    `;
    return emailProvider.send({
      to: email,
      subject: `I3DION Verification Code: ${otpCode}`,
      html: this.renderTemplate(title, bodyHtml),
      text: `Your I3DION verification code for ${purposeTitle} is: ${otpCode}. Expire in 10 minutes.`,
    });
  }

  async sendInvitationEmail(email, orgName, inviterName, role, inviteUrl) {
    const title = `Invitation to Join ${orgName}`;
    const bodyHtml = `
      <p><strong>${inviterName}</strong> has invited you to join the <strong>${orgName}</strong> spatial catalog workspace as a <strong>${role}</strong>.</p>
      <p>Click the link below to accept your invitation and access spatial models, catalogs, and analytics.</p>
    `;
    return emailProvider.send({
      to: email,
      subject: `Invitation: Join ${orgName} on I3DION Spatial`,
      html: this.renderTemplate(title, bodyHtml, { text: 'Accept Invitation', url: inviteUrl }),
      text: `You have been invited to join ${orgName} as ${role}. Accept your invitation here: ${inviteUrl}`,
    });
  }

  async sendLeadNotificationEmail(email, leadName, productName, leadEmail, phone) {
    const title = `⚡ New High Intent Lead Received!`;
    const bodyHtml = `
      <p>A new lead has interacted with your spatial product <strong>${productName}</strong>.</p>
      <div style="background: #0f172a; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <p style="margin: 4px 0; color: #ffffff;"><strong>Name:</strong> ${leadName}</p>
        <p style="margin: 4px 0; color: #ffffff;"><strong>Email:</strong> ${leadEmail}</p>
        <p style="margin: 4px 0; color: #ffffff;"><strong>Phone:</strong> ${phone || 'N/A'}</p>
      </div>
      <p>Log in to your workspace to view behavioral analytics and intent scores.</p>
    `;
    return emailProvider.send({
      to: email,
      subject: `New Lead: ${leadName} for ${productName}`,
      html: this.renderTemplate(title, bodyHtml),
      text: `New lead received: ${leadName} (${leadEmail}) for ${productName}.`,
    });
  }

  async sendWeeklyReportEmail(email, orgName, metrics) {
    const title = `Weekly Analytics & Performance Digest — ${orgName}`;
    const bodyHtml = `
      <p>Here is your weekly spatial catalog activity summary for <strong>${orgName}</strong>:</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0;">
        <div style="background: #0f172a; padding: 14px; border-radius: 12px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Product Views</div>
          <div style="font-size: 24px; font-weight: 800; color: #ffffff;">${metrics.productViews || 0}</div>
        </div>
        <div style="background: #0f172a; padding: 14px; border-radius: 12px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">AR Launch Sessions</div>
          <div style="font-size: 24px; font-weight: 800; color: #60a5fa;">${metrics.arSessions || 0}</div>
        </div>
        <div style="background: #0f172a; padding: 14px; border-radius: 12px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">QR Scans</div>
          <div style="font-size: 24px; font-weight: 800; color: #ffffff;">${metrics.qrScans || 0}</div>
        </div>
        <div style="background: #0f172a; padding: 14px; border-radius: 12px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Leads Generated</div>
          <div style="font-size: 24px; font-weight: 800; color: #34d399;">${metrics.leadsCount || 0}</div>
        </div>
      </div>
    `;
    return emailProvider.send({
      to: email,
      subject: `Weekly Report: ${orgName} Spatial Analytics`,
      html: this.renderTemplate(title, bodyHtml),
      text: `Weekly summary for ${orgName}: ${metrics.productViews || 0} Views, ${metrics.arSessions || 0} AR Sessions, ${metrics.leadsCount || 0} Leads.`,
    });
  }
}

export const emailService = new EmailService();
