import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { validate } from '../middleware/validate.js';
import { getPublicProductDetailsBySlug, getProductBySlug } from '../services/productFlow.js';
import { trackEvent } from '../services/trackingEngine.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

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
    const product = await getPublicProductDetailsBySlug(req.params.slug);
    if (!product) throw new ApiError(404, 'Product not found or unavailable');
    res.json(product);
  }),
);

// POST /api/public/leads - Anonymous Lead Capture from Public Product Page
publicRouter.post(
  '/leads',
  validate(publicLeadSchema),
  asyncHandler(async (req, res) => {
    const { slug, visitorId, name, email, phone, company, intent, message } = req.validated.body;

    const product = await getProductBySlug(slug);
    if (!product) throw new ApiError(404, 'Product not found');

    // Check if lead already exists for this email & organization
    let leadId = null;
    const existing = await query(
      'SELECT id, name FROM leads WHERE email = $1 AND organization_id = $2 LIMIT 1',
      [email, product.organization_id]
    );

    const sourceMap = {
      quote: 'Public Quote Request',
      demo: 'AR Experience Demo Request',
      brochure: 'Public Brochure Download',
      contact: 'Public Contact Sales'
    };

    if (existing.rows.length > 0) {
      leadId = existing.rows[0].id;
      await query(
        `UPDATE leads SET 
           name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           organization = COALESCE($3, organization),
           notes = CASE WHEN $4::text IS NOT NULL THEN COALESCE(notes || E'\n', '') || $4 ELSE notes END,
           updated_at = now()
         WHERE id = $5`,
        [name, phone || null, company || null, message ? `[${intent.toUpperCase()}] ${message}` : null, leadId]
      );
    } else {
      const inserted = await query(
        `INSERT INTO leads (organization_id, product_id, name, email, phone, organization, status, source, notes)
         VALUES ($1, $2, $3, $4, $5, $6, 'New', $7, $8)
         RETURNING id`,
        [
          product.organization_id,
          product.id,
          name,
          email,
          phone || null,
          company || null,
          sourceMap[intent] || 'Public Product Page',
          message ? `[${intent.toUpperCase()}] ${message}` : null
        ]
      );
      leadId = inserted.rows[0].id;
    }

    // Track lead capture event
    await trackEvent({
      organizationId: product.organization_id,
      productId: product.id,
      visitorId,
      leadId,
      eventType: intent === 'quote' ? 'quote_request' : (intent === 'brochure' ? 'brochure_download' : 'lead_created'),
      metadata: { name, email, phone, company, intent, message }
    });

    res.status(201).json({
      success: true,
      leadId,
      message: 'Thank you! Your request has been sent to our team.'
    });
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
  validate(publicEventSchema),
  asyncHandler(async (req, res) => {
    const { slug, eventType, metadata, durationSeconds, sessionId, visitorId } = req.validated.body;

    let product = null;
    if (slug) {
      product = await getProductBySlug(slug);
    }

    const eventMetadata = {
      ...metadata,
      sessionId: sessionId ?? metadata.sessionId ?? null,
      durationSeconds: durationSeconds ?? metadata.durationSeconds ?? null,
      source: metadata.source ?? 'public',
      userAgent: req.headers['user-agent'] ?? null,
      referrer: req.headers.referer ?? req.headers.referrer ?? null,
      path: req.originalUrl,
    };

    const event = await trackEvent({
      organizationId: product ? product.organization_id : (metadata.organizationId || null),
      productId: product ? product.id : null,
      visitorId: visitorId || metadata.visitorId || null,
      eventType,
      metadata: eventMetadata,
    });

    res.status(201).json(event || { success: true });
  }),
);

