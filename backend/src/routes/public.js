import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { config } from '../config.js';
import { validate } from '../middleware/validate.js';
import { getPublicProductDetailsBySlug, getProductBySlug } from '../services/productFlow.js';
import { trackEvent } from '../services/trackingEngine.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { publicLeadsLimiter, publicEventsLimiter, enforcePayloadCap } from '../middleware/rateLimiters.js';
import { addPublicAssetAccessUrls } from '../services/hub/publicAssetUrls.js';

export const publicRouter = Router();

const publicEventSchema = z.object({
  body: z.object({
    slug: z.string().min(2).optional(),
    eventType: z.enum([
      'page_view',
      'product_view',
      'catalog_view',
      'qr_scan',
      'qr_preview',
      'qr_download',
      'ar_launch',
      'ar_session',
      'session_duration',
      'lead_created',
      'hotspot_view',
      'animation_play',
      'user_register',
      'user_login',
      'brochure_download',
      'quote_request',
      'time_spent',
      'button_click',
      'model_rotation',
      'search',
      'exit_intent',
      'contact_sales',
      'model_download'
    ]),
    metadata: z.record(z.unknown()).optional().default({}),
    durationSeconds: z.number().int().min(0).optional(),
    sessionId: z.string().optional(),
    visitorId: z.string().optional(),
  }),
});

const publicLeadSchema = z.object({
  body: z.object({
    slug: z.string().min(2),
    visitorId: z.string(),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    company: z.string().optional(),
    intent: z.enum(['quote', 'demo', 'brochure', 'contact']).default('quote'),
    message: z.string().optional(),
  }),
});

// GET /api/public/products/:slug
publicRouter.get(
  '/products/:slug',
  asyncHandler(async (req, res) => {
    let authenticatedUser = null;
    const headerToken = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
    if (headerToken) {
      try {
        const payload = jwt.verify(headerToken, config.jwtSecret);
        const userRes = await query('SELECT id, name, email, organization_id, role FROM users WHERE id = $1', [payload.userId]);
        authenticatedUser = userRes.rows[0] || null;
      } catch (err) {
        // Unauthenticated or invalid token, proceed as anonymous
      }
    }

    const product = await getPublicProductDetailsBySlug(req.params.slug, authenticatedUser);
    if (!product) throw new ApiError(404, 'Product not found or unavailable');
    res.json(addPublicAssetAccessUrls(product));
  }),
);

// POST /api/public/leads - Anonymous Lead Capture from Public Product Page
publicRouter.post(
  '/leads',
  publicLeadsLimiter,
  validate(publicLeadSchema),
  asyncHandler(async (req, res) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const { capturePublicLead } = await import('../services/hub/hubService.js');
    const result = await capturePublicLead({
      ...req.validated.body,
      consent: req.validated.body.consent || { 
        consentGiven: true, 
        consentText: 'I agree to be contacted regarding this industrial equipment inquiry.' 
      }
    }, clientIp);

    res.status(201).json(result);
  })
);

// GET /api/public/visitor/:visitorId/context - Visitor recognition for returning visitors
publicRouter.get(
  '/visitor/:visitorId/context',
  asyncHandler(async (req, res) => {
    const { visitorId } = req.params;
    const { organizationId } = req.query;

    if (!visitorId) {
      return res.json({ returningVisitor: false });
    }

    let queryText = `
      SELECT l.name, l.email, l.organization as company
      FROM analytics_events ae
      JOIN leads l ON ae.lead_id = l.id
      WHERE ae.visitor_id = $1
    `;
    const params = [visitorId];

    if (organizationId) {
      queryText += ` AND ae.organization_id = $2`;
      params.push(organizationId);
    }

    queryText += ` ORDER BY ae.created_at DESC LIMIT 1`;

    const { rows } = await query(queryText, params);

    if (rows.length > 0) {
      return res.json({
        returningVisitor: true,
        visitor: {
          name: rows[0].name,
          email: rows[0].email,
          company: rows[0].company,
        }
      });
    }

    res.json({ returningVisitor: false });
  })
);

// POST /api/public/analytics/events
publicRouter.post(
  '/analytics/events',
  publicEventsLimiter,
  enforcePayloadCap(4096),
  validate(publicEventSchema),
  asyncHandler(async (req, res) => {
    const { slug, eventType, metadata, durationSeconds, sessionId, visitorId } = req.validated.body;

    let product = null;
    if (slug) {
      product = await getProductBySlug(slug);
    }

    const { ingestTelemetryEvent } = await import('../services/lens/lensService.js');
    const userAgent = req.headers['user-agent'] || null;
    const referrer = req.headers.referer || req.headers.referrer || null;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const clientIpSubnet = clientIp.includes(':')
      ? clientIp.split(':').slice(0, 3).join(':') + '::xxxx'
      : clientIp.split('.').slice(0, 3).join('.') + '.0';

    const orgId = product ? product.organization_id : (metadata.organizationId || null);

    if (!orgId) {
      return res.status(201).json({ success: true, note: 'unassociated_event_dropped' });
    }

    const event = await ingestTelemetryEvent({
      type: eventType,
      organizationId: orgId,
      publishedRef: product ? { contentType: 'product_showcase', contentId: product.id, slug: product.slug } : null,
      sessionId,
      visitorId,
      properties: { ...metadata, durationSeconds },
      dwellDurationSeconds: durationSeconds
    }, {
      userAgent,
      referrer,
      clientIpSubnet
    });

    res.status(201).json(event);
  }),
);
