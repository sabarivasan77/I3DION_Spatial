import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { query } from '../../db/pool.js';
import { ApiError } from '../../utils/errors.js';

/**
 * Generate a cryptographically secure, non-enumerable short code
 * with >= 96 bits of random entropy (12 bytes = 96 bits = 16 base64url chars).
 */
export function generateShortCode() {
  return crypto.randomBytes(12).toString('base64url');
}

/**
 * Create a persistent, republish-safe short link
 */
export async function createShortLink({
  organizationId,
  productId = null,
  productSlug = null,
  targetUrl,
  title = null,
  campaign = null,
  utmSource = null,
  utmMedium = null,
  expiresAt = null,
  password = null
}) {
  if (!organizationId) throw new ApiError(400, 'organizationId is required');
  if (!targetUrl) throw new ApiError(400, 'targetUrl is required');

  const shortCode = generateShortCode();
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  const { rows } = await query(`
    INSERT INTO qr_codes (
      organization_id, product_id, product_slug, target_url, short_code,
      title, campaign, utm_source, utm_medium, expires_at, password_hash,
      is_paused, visits_count, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11,
      false, 0, now(), now()
    )
    RETURNING id, organization_id, product_id, product_slug, target_url, short_code,
              title, campaign, utm_source, utm_medium, expires_at, is_paused, visits_count, created_at
  `, [
    organizationId, productId, productSlug, targetUrl, shortCode,
    title || productSlug || 'Product QR Code', campaign, utmSource, utmMedium, expiresAt, passwordHash
  ]);

  return rows[0];
}

/**
 * Resolve short link with status checks (paused, expired, password-protected)
 * and truthfully records "QR-attributed visit".
 */
export async function resolveShortLink(codeOrId, visitorInfo = {}) {
  const { rows } = await query(`
    SELECT * FROM qr_codes 
    WHERE short_code = $1 OR id::text = $1
    LIMIT 1
  `, [codeOrId]);

  if (!rows[0]) {
    throw new ApiError(404, 'QR short link not found');
  }

  const qr = rows[0];

  // 1. Paused check
  if (qr.is_paused) {
    return {
      status: 'paused',
      title: qr.title,
      message: 'This QR link has been paused by the campaign manager.'
    };
  }

  // 2. Expiration check
  if (qr.expires_at && new Date() > new Date(qr.expires_at)) {
    return {
      status: 'expired',
      title: qr.title,
      message: 'This QR link has expired.'
    };
  }

  // 3. Password check
  if (qr.password_hash) {
    return {
      status: 'password_required',
      id: qr.id,
      title: qr.title
    };
  }

  // 4. Truthful visit attribution: increment visits_count
  await query(`
    UPDATE qr_codes 
    SET visits_count = visits_count + 1, last_visited_at = now(), updated_at = now()
    WHERE id = $1
  `, [qr.id]);

  // 5. Record QR-attributed visit in analytics_events
  try {
    await query(`
      INSERT INTO analytics_events (
        organization_id, event_type, entity_type, entity_id, session_id,
        metadata, created_at
      ) VALUES (
        $1, 'qr_landing', 'product', $2, $3,
        $4, now()
      )
    `, [
      qr.organization_id,
      qr.product_id,
      visitorInfo.sessionId || null,
      JSON.stringify({
        shortCode: qr.short_code,
        campaign: qr.campaign,
        utmSource: qr.utm_source,
        utmMedium: qr.utm_medium,
        userAgent: visitorInfo.userAgent || null,
        ip: visitorInfo.ip || null
      })
    ]);
  } catch (err) {
    console.warn('[QR Analytics Warning] Could not record analytics event:', err.message);
  }

  // Build target URL with campaign parameters if present
  let resolvedUrl = qr.target_url;
  if (qr.campaign || qr.utm_source) {
    const urlObj = new URL(resolvedUrl, 'http://localhost');
    if (qr.campaign) urlObj.searchParams.set('campaign', qr.campaign);
    if (qr.utm_source) urlObj.searchParams.set('utm_source', qr.utm_source);
    if (qr.utm_medium) urlObj.searchParams.set('utm_medium', qr.utm_medium);
    resolvedUrl = urlObj.pathname + urlObj.search + urlObj.hash;
  }

  return {
    status: 'active',
    id: qr.id,
    targetUrl: resolvedUrl,
    campaign: qr.campaign,
    productId: qr.product_id,
    visitsCount: qr.visits_count + 1
  };
}

/**
 * Verify password for protected short link
 */
export async function unlockShortLink(codeOrId, password) {
  const { rows } = await query(`
    SELECT * FROM qr_codes 
    WHERE short_code = $1 OR id::text = $1
    LIMIT 1
  `, [codeOrId]);

  if (!rows[0]) throw new ApiError(404, 'QR short link not found');
  const qr = rows[0];

  if (!qr.password_hash) {
    return resolveShortLink(codeOrId);
  }

  const valid = await bcrypt.compare(password, qr.password_hash);
  if (!valid) throw new ApiError(401, 'Incorrect password');

  // Increment visit on successful unlock
  await query(`
    UPDATE qr_codes 
    SET visits_count = visits_count + 1, last_visited_at = now()
    WHERE id = $1
  `, [qr.id]);

  return {
    status: 'active',
    targetUrl: qr.target_url,
    campaign: qr.campaign
  };
}

/**
 * Re-point an existing short link to a new destination URL
 * (Crucial for printed QR codes: physical printed QR code never breaks!)
 */
export async function repointShortLink(id, newTargetUrl, organizationId) {
  if (!newTargetUrl) throw new ApiError(400, 'newTargetUrl is required');

  const { rows } = await query(`
    UPDATE qr_codes
    SET target_url = $1, updated_at = now()
    WHERE id = $2 AND ($3::uuid IS NULL OR organization_id = $3::uuid)
    RETURNING *
  `, [newTargetUrl, id, organizationId || null]);

  if (!rows[0]) throw new ApiError(404, 'QR link not found or access denied');
  return rows[0];
}

/**
 * Update short link settings (pause/resume, expiration, title)
 */
export async function updateShortLinkSettings(id, updates, organizationId) {
  const fields = [];
  const params = [id];

  if (updates.isPaused !== undefined) {
    params.push(updates.isPaused);
    fields.push(`is_paused = $${params.length}`);
  }
  if (updates.expiresAt !== undefined) {
    params.push(updates.expiresAt);
    fields.push(`expires_at = $${params.length}`);
  }
  if (updates.title !== undefined) {
    params.push(updates.title);
    fields.push(`title = $${params.length}`);
  }
  if (updates.campaign !== undefined) {
    params.push(updates.campaign);
    fields.push(`campaign = $${params.length}`);
  }

  if (fields.length === 0) return null;

  params.push(organizationId || null);
  const orgParam = `$${params.length}`;

  const { rows } = await query(`
    UPDATE qr_codes
    SET ${fields.join(', ')}, updated_at = now()
    WHERE id = $1 AND (${orgParam}::uuid IS NULL OR organization_id = ${orgParam}::uuid)
    RETURNING *
  `, params);

  if (!rows[0]) throw new ApiError(404, 'QR link not found');
  return rows[0];
}

/**
 * List all QR short links for an organization with real analytics
 */
export async function listShortLinks(organizationId) {
  const { rows } = await query(`
    SELECT q.*, p.name as product_name, p.slug as product_real_slug
    FROM qr_codes q
    LEFT JOIN products p ON q.product_id = p.id
    WHERE q.organization_id = $1
    ORDER BY q.created_at DESC
  `, [organizationId]);
  return rows;
}
