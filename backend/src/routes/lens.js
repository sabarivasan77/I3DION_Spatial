import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/errors.js';
import { 
  ingestTelemetryEvent, 
  getLensOverview, 
  getLensFunnel, 
  getLensQRAttribution, 
  getLensHotspotHeatmap, 
  getMetricDefinitions 
} from '../services/lens/lensService.js';
import { query } from '../db/pool.js';
import { publicEventsLimiter, enforcePayloadCap } from '../middleware/rateLimiters.js';

export const lensRouter = Router();

// ====================================================
// 1. PUBLIC TELEMETRY INGESTION (Unauthenticated)
// ====================================================
const telemetryEventSchema = z.object({
  body: z.object({
    eventId: z.string().uuid().optional(),
    type: z.string().min(2),
    timestamp: z.string().optional(),
    organizationId: z.string().uuid(),
    sourceProduct: z.enum(['hub', 'vault', 'studio', 'engine', 'lens']).default('hub'),
    publishedRef: z.object({
      snapshotId: z.string().uuid().optional(),
      contentType: z.enum(['catalog', 'experience', 'product_showcase']).optional(),
      contentId: z.string().uuid().optional(),
      slug: z.string().optional()
    }).optional(),
    sessionId: z.string().optional(),
    visitorId: z.string().optional(),
    properties: z.record(z.unknown()).optional().default({}),
    device: z.object({
      deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional(),
      os: z.string().optional(),
      browser: z.string().optional(),
      arSupported: z.boolean().optional(),
      arMode: z.string().optional(),
      viewportWidth: z.number().optional(),
      viewportHeight: z.number().optional()
    }).optional(),
    dwellDurationSeconds: z.number().nonnegative().optional(),
    dedupeKey: z.string().optional()
  })
});

lensRouter.post(
  '/events',
  publicEventsLimiter,
  enforcePayloadCap(4096),
  validate(telemetryEventSchema),
  asyncHandler(async (req, res) => {
    const userAgent = req.headers['user-agent'] || null;
    const referrer = req.headers.referer || req.headers.referrer || null;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    
    // Privacy-safe IP subnet mask
    const clientIpSubnet = clientIp.includes(':')
      ? clientIp.split(':').slice(0, 3).join(':') + '::xxxx'
      : clientIp.split('.').slice(0, 3).join('.') + '.0';

    const result = await ingestTelemetryEvent(req.validated.body, {
      userAgent,
      referrer,
      clientIpSubnet
    });

    res.status(201).json(result);
  })
);

// Machine-Readable Metric Definitions (Public)
lensRouter.get(
  '/definitions',
  asyncHandler(async (_req, res) => {
    const defs = getMetricDefinitions();
    res.json(defs);
  })
);

// ====================================================
// 2. AUTHENTICATED LENS ANALYTICS (Tenant Isolated)
// ====================================================
lensRouter.use(requireAuth);

function resolveOrgId(req) {
  return req.organizationId || req.user?.organizationId || req.user?.organization_id;
}

// Overview KPI Metrics
lensRouter.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const overview = await getLensOverview(orgId);
    res.json(overview);
  })
);

// Conversion Funnel
lensRouter.get(
  '/funnel',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const funnel = await getLensFunnel(orgId);
    res.json(funnel);
  })
);

// QR Attribution Breakdown
lensRouter.get(
  '/qr-attribution',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const qrAttribution = await getLensQRAttribution(orgId);
    res.json(qrAttribution);
  })
);

// 3D Hotspot Engagement Heatmap
lensRouter.get(
  '/hotspots',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const hotspots = await getLensHotspotHeatmap(orgId);
    res.json(hotspots);
  })
);

// Live Leads List with Intelligence
lensRouter.get(
  '/leads',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const { rows: leads } = await query(
      `SELECT l.*, 
              COALESCE(l.score, 0) as behavior_score,
              u.name as assigned_to_name,
              (SELECT COUNT(*) FROM analytics_events ae WHERE ae.lead_id = l.id) as total_interactions
       FROM leads l
       LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.organization_id = $1
       ORDER BY l.created_at DESC
       LIMIT 100`,
      [orgId]
    );
    res.json(leads);
  })
);
