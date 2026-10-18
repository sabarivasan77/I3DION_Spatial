import crypto from 'node:crypto';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import { query, withTenant } from '../../db/pool.js';
import { ApiError } from '../../utils/errors.js';
import { trackEvent } from '../trackingEngine.js';

export class PlayerService {
  /**
   * Generates a non-enumerable cryptographically secure short code with >= 96 bits entropy.
   * 18 characters of base64url = 18 * log2(64) = 108 bits of entropy (exceeds 96-bit requirement).
   */
  generateNonEnumerableCode() {
    return crypto.randomBytes(16).toString('base64url').slice(0, 18);
  }

  /**
   * Creates a stable short-link and non-enumerable campaign QR code
   */
  async createCatalogLink({
    organizationId,
    catalogId,
    projectId,
    label = 'Default Link',
    campaign = 'Direct',
    audienceRole = 'public',
    hiddenFields = ['dealer_price', 'cost_margin', 'internal_notes'],
    password = null,
    expiresAt = null,
    dealerInfo = {},
    baseUrl = 'https://app.i3dion.com'
  }) {
    const shortCode = this.generateNonEnumerableCode();
    const targetUrl = `${baseUrl}/q/${shortCode}`;

    // Hash password if protected
    let passwordHash = null;
    if (password && password.trim() !== '') {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Generate QR Codes (SVG vector and PNG DataURL)
    const qrSvg = await QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      }
    });

    const qrPngUrl = await QRCode.toDataURL(targetUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      }
    });

    const insertSql = `
      INSERT INTO catalog_links (
        organization_id, catalog_id, project_id, short_code, label, campaign,
        audience_role, hidden_fields, password_hash, expires_at, dealer_info,
        qr_svg, qr_png_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const res = await query(insertSql, [
      organizationId,
      catalogId || null,
      projectId || null,
      shortCode,
      label,
      campaign,
      audienceRole,
      JSON.stringify(hiddenFields),
      passwordHash,
      expiresAt,
      JSON.stringify(dealerInfo),
      qrSvg,
      qrPngUrl
    ]);

    return {
      ...res.rows[0],
      shortUrl: targetUrl
    };
  }

  /**
   * Resolves a public short code with password checks, expiration checks,
   * attribution tracking, and SERVER-SIDE audience data filtering.
   */
  async resolveCatalogLink(shortCode, { password = null, visitorId = null } = {}) {
    // 1. Fetch link metadata
    const linkRes = await query(
      `SELECT * FROM catalog_links WHERE short_code = $1`,
      [shortCode]
    );

    if (linkRes.rows.length === 0) {
      throw new ApiError(404, 'Catalog link not found or invalid');
    }

    const link = linkRes.rows[0];

    // 2. Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      throw new ApiError(410, 'This catalog link has expired');
    }

    // 3. Check password protection
    if (link.password_hash) {
      if (!password) {
        return {
          requiresPassword: true,
          label: link.label,
          campaign: link.campaign,
          shortCode: link.short_code
        };
      }
      const isMatch = await bcrypt.compare(password, link.password_hash);
      if (!isMatch) {
        throw new ApiError(401, 'Invalid password for this catalog');
      }
    }

    // 4. Increment visits counter
    await query(
      `UPDATE catalog_links SET visits_count = visits_count + 1, updated_at = NOW() WHERE id = $1`,
      [link.id]
    );

    // 5. Ingest attribution telemetry ("QR-attributed visit")
    try {
      await trackEvent({
        organizationId: link.organization_id,
        eventType: 'catalog.viewed',
        visitorId: visitorId || `visitor-${shortCode}`,
        metadata: {
          shortCode: link.short_code,
          campaign: link.campaign,
          attributionMetric: 'QR-attributed visit',
          audienceRole: link.audience_role
        }
      });
    } catch {
      // Telemetry should never block catalog delivery
    }

    // 6. Fetch published catalog definition
    let catalogDoc = null;
    let catalogName = 'Catalog Showcase';

    if (link.catalog_id) {
      const catRes = await query(
        `SELECT id, name, slug, published_snapshot, branding FROM catalogs WHERE id = $1`,
        [link.catalog_id]
      );
      if (catRes.rows.length > 0) {
        catalogDoc = catRes.rows[0].published_snapshot || catRes.rows[0].branding || {};
        catalogName = catRes.rows[0].name;
      }
    } else if (link.project_id) {
      const projRes = await query(
        `SELECT id, name, project_document FROM studio_projects WHERE id = $1`,
        [link.project_id]
      );
      if (projRes.rows.length > 0) {
        catalogDoc = projRes.rows[0].project_document || {};
        catalogName = projRes.rows[0].name;
      }
    }

    if (!catalogDoc) {
      catalogDoc = {
        schema: 'i3dion.catalog/1',
        meta: { name: catalogName, slug: shortCode },
        pages: []
      };
    }

    // 7. SERVER-SIDE AUDIENCE FILTERING
    // Strictly strip hidden fields and audience-restricted prices from the payload
    const hiddenFieldsList = Array.isArray(link.hidden_fields)
      ? link.hidden_fields
      : JSON.parse(link.hidden_fields || '[]');

    const sanitizedDoc = this.filterAudienceData(catalogDoc, link.audience_role, hiddenFieldsList);

    return {
      success: true,
      requiresPassword: false,
      catalog: sanitizedDoc,
      audienceRole: link.audience_role,
      campaign: link.campaign,
      label: link.label,
      dealerInfo: link.dealer_info || {},
      shortCode: link.short_code
    };
  }

  /**
   * Recursively filters audience-restricted fields and prices server-side.
   * Guarantees that forbidden data is never present in network JSON or client bundle.
   */
  filterAudienceData(obj, audienceRole, hiddenFields = []) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const defaultHiddenFields = audienceRole === 'public'
      ? ['dealer_price', 'dealerPrice', 'wholesale_price', 'cost_margin', 'costMargin', 'internal_notes', 'internalNotes']
      : [];

    const allHidden = new Set([...hiddenFields, ...defaultHiddenFields]);

    function sanitize(item) {
      if (Array.isArray(item)) {
        return item.map(sanitize);
      }
      if (item !== null && typeof item === 'object') {
        const clean = {};
        for (const [key, val] of Object.entries(item)) {
          if (!allHidden.has(key)) {
            clean[key] = sanitize(val);
          }
        }
        return clean;
      }
      return item;
    }

    return sanitize(obj);
  }

  /**
   * Submits an RFQ quote basket with idempotency, anti-bot check, and Flow lead outbox trigger
   */
  async submitCatalogRfq({
    shortCode = null,
    catalogId = null,
    organizationId,
    name,
    email,
    phone = '',
    company = '',
    items = [],
    message = '',
    intent = 'quote',
    idempotencyKey = null,
    botCheck = '', // Honeypot field (must be empty)
    consent = { consentGiven: true, consentText: 'I agree to be contacted regarding this quotation.' }
  }) {
    // 1. Anti-bot honeypot check
    if (botCheck && botCheck.trim() !== '') {
      throw new ApiError(400, 'Spam bot submission rejected');
    }

    if (!name || !email) {
      throw new ApiError(400, 'Name and email are required for RFQ submission');
    }

    // 2. Resolve organization ID from shortCode if not directly provided
    let targetOrgId = organizationId;
    let campaignLabel = 'Direct';

    if (shortCode) {
      const linkRes = await query(
        `SELECT organization_id, campaign, catalog_id FROM catalog_links WHERE short_code = $1`,
        [shortCode]
      );
      if (linkRes.rows.length > 0) {
        targetOrgId = linkRes.rows[0].organization_id;
        campaignLabel = linkRes.rows[0].campaign;
        if (!catalogId) catalogId = linkRes.rows[0].catalog_id;
      }
    }

    if (!targetOrgId) {
      throw new ApiError(400, 'Unable to identify target organization for RFQ');
    }

    // 3. Idempotency Key deduplication (critical for offline sync reconnect)
    if (idempotencyKey) {
      const existingRes = await query(
        `SELECT id, created_at FROM leads WHERE metadata->>'idempotencyKey' = $1 AND organization_id = $2`,
        [idempotencyKey, targetOrgId]
      );
      if (existingRes.rows.length > 0) {
        return {
          success: true,
          leadId: existingRes.rows[0].id,
          isDuplicate: true,
          message: 'RFQ already processed previously'
        };
      }
    }

    // 4. Insert Lead record
    const leadMetadata = {
      shortCode,
      campaign: campaignLabel,
      catalogId,
      items,
      idempotencyKey,
      consent,
      source: 'catalog_rfq'
    };

    const insertLeadSql = `
      INSERT INTO leads (
        organization_id, name, email, phone, organization,
        intent, message, metadata, source, status, qr_attributed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'catalog_rfq', 'New', $9)
      RETURNING id, name, email, created_at
    `;

    const leadRes = await query(insertLeadSql, [
      targetOrgId,
      name,
      email,
      phone,
      company,
      intent,
      message,
      JSON.stringify(leadMetadata),
      Boolean(shortCode)
    ]);

    const lead = leadRes.rows[0];

    // 5. Ingest into Transactional Flow Outbox (so Flow automation triggers instantly)
    try {
      const outboxSql = `
        INSERT INTO flow_event_outbox (
          organization_id, event_type, payload, status
        ) VALUES ($1, 'lead.created', $2, 'pending')
      `;
      await query(outboxSql, [
        targetOrgId,
        JSON.stringify({
          leadId: lead.id,
          name: lead.name,
          email: lead.email,
          campaign: campaignLabel,
          itemsCount: items.length,
          items,
          source: 'catalog_rfq'
        })
      ]);
    } catch (err) {
      console.warn('Flow event outbox enqueue warning:', err);
    }

    // 6. Record analytics event
    try {
      await trackEvent({
        organizationId: targetOrgId,
        eventType: 'rfq.submitted',
        visitorId: `visitor-${email}`,
        leadId: lead.id,
        metadata: {
          leadId: lead.id,
          shortCode,
          campaign: campaignLabel,
          itemCount: items.length
        }
      });
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      leadId: lead.id,
      isDuplicate: false,
      message: 'RFQ received successfully. Our sales engineers will review your specifications.'
    };
  }

  /**
   * Generates a printable QR layout with campaign labels
   */
  async generatePrintQrSheet(shortCode, { title = 'Product Catalog', baseUrl = 'https://app.i3dion.com' } = {}) {
    const linkRes = await query(`SELECT * FROM catalog_links WHERE short_code = $1`, [shortCode]);
    if (linkRes.rows.length === 0) {
      throw new ApiError(404, 'Short code not found');
    }
    const link = linkRes.rows[0];
    const targetUrl = `${baseUrl}/q/${shortCode}`;

    const svg = await QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    });

    return {
      shortCode,
      targetUrl,
      title,
      label: link.label,
      campaign: link.campaign,
      svgHtml: `
        <div style="font-family: sans-serif; text-align: center; border: 2px solid #0F172A; border-radius: 12px; padding: 24px; width: 280px; margin: auto;">
          <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #0F172A;">${title}</h2>
          <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748B;">Campaign: ${link.campaign}</p>
          <div style="width: 200px; height: 200px; margin: auto;">${svg}</div>
          <p style="margin: 16px 0 4px 0; font-size: 11px; font-weight: bold; color: #2563EB;">SCAN FOR 3D & AR EXPERIENCE</p>
          <p style="margin: 0; font-size: 10px; color: #94A3B8;">${targetUrl}</p>
        </div>
      `
    };
  }
}

export const playerService = new PlayerService();
