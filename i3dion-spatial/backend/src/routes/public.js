import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { getProductBySlug } from '../services/productFlow.js';
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
      'model_rotation'
    ]),
    metadata: z.record(z.unknown()).optional().default({}),
    durationSeconds: z.number().int().min(0).optional(),
    sessionId: z.string().optional(),
    visitorId: z.string().optional(),
  }),
});

publicRouter.get(
  '/products/:slug',
  asyncHandler(async (req, res) => {
    const product = await getProductBySlug(req.params.slug);
    if (!product) throw new ApiError(404, 'Product not found');
    res.json(product);
  }),
);

publicRouter.post(
  '/analytics/events',
  validate(publicEventSchema),
  asyncHandler(async (req, res) => {
    const { slug, eventType, metadata, durationSeconds, sessionId, visitorId } = req.validated.body;
    
    // We might track non-product events now, so product is optional if slug is not provided, 
    // but the schema requires slug. Let's make it optional if we are tracking generic events.
    // However, for now, we'll keep product resolution.
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
      companyId: product ? product.company_id : (metadata.companyId || null),
      productId: product ? product.id : null,
      visitorId: visitorId || metadata.visitorId || null,
      eventType,
      metadata: eventMetadata,
    });

    res.status(201).json(event);
  }),
);
