import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { 
  createShortLink, 
  resolveShortLink, 
  unlockShortLink, 
  repointShortLink, 
  updateShortLinkSettings, 
  listShortLinks 
} from '../services/qr/qrShortlinkService.js';

export const qrRouter = Router();

// Per-IP rate limiter on resolver (200 requests/minute per §7.2 / §7.4)
export const qrResolverLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many QR resolution requests from this IP. Please try again in a moment.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ==========================================
// 1. PUBLIC RESOLVER ENDPOINT (Used by /q/:id landing)
// ==========================================
qrRouter.get(
  '/resolve/:shortCode',
  qrResolverLimiter,
  asyncHandler(async (req, res) => {
    const { shortCode } = req.params;
    const result = await resolveShortLink(shortCode, {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    res.json(result);
  })
);

qrRouter.post(
  '/resolve/:shortCode/unlock',
  qrResolverLimiter,
  asyncHandler(async (req, res) => {
    const { shortCode } = req.params;
    const { password } = req.body;
    if (!password) throw new ApiError(400, 'Password is required');
    const result = await unlockShortLink(shortCode, password);
    res.json(result);
  })
);

// ==========================================
// 2. ORG SHORT LINK MANAGEMENT
// ==========================================
const createSchema = z.object({
  body: z.object({
    productId: z.string().uuid().optional().nullable(),
    productSlug: z.string().optional().nullable(),
    targetUrl: z.string().min(1),
    title: z.string().optional(),
    campaign: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    expiresAt: z.string().datetime().optional().nullable(),
    password: z.string().optional().nullable()
  })
});

qrRouter.post(
  '/shortlinks',
  requireAuth,
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const organizationId = req.user.organization_id;
    const shortLink = await createShortLink({
      organizationId,
      ...req.validated.body
    });
    res.status(201).json(shortLink);
  })
);

qrRouter.get(
  '/shortlinks',
  requireAuth,
  asyncHandler(async (req, res) => {
    const organizationId = req.user.organization_id;
    const links = await listShortLinks(organizationId);
    res.json(links);
  })
);

const updateSchema = z.object({
  body: z.object({
    targetUrl: z.string().optional(),
    title: z.string().optional(),
    campaign: z.string().optional(),
    isPaused: z.boolean().optional(),
    expiresAt: z.string().datetime().optional().nullable()
  })
});

qrRouter.patch(
  '/shortlinks/:id',
  requireAuth,
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const organizationId = req.user.organization_id;
    const { id } = req.params;
    const { targetUrl, ...otherUpdates } = req.validated.body;

    let updated = null;
    if (targetUrl) {
      updated = await repointShortLink(id, targetUrl, organizationId);
    }
    if (Object.keys(otherUpdates).length > 0) {
      updated = await updateShortLinkSettings(id, otherUpdates, organizationId);
    }

    res.json(updated);
  })
);

// ==========================================
// 3. ROOT BROWSER SHORT LINK RESOLVER (/q/:shortCode)
// ==========================================
export const rootQrResolver = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;
  try {
    const result = await resolveShortLink(shortCode, {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    if (result.status === 'active') {
      return res.redirect(result.targetUrl);
    }

    if (result.status === 'paused') {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Link Paused - I3DION Spatial</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="font-family:system-ui,-apple-system,sans-serif;background:#0F172A;color:white;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="background:#1E293B;padding:32px;border-radius:24px;max-width:400px;text-align:center;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
            <div style="font-size:36px;margin-bottom:12px;">⏸️</div>
            <h2 style="margin:0 0 8px 0;font-size:20px;">QR Link Paused</h2>
            <p style="color:#94A3B8;font-size:14px;margin:0 0 24px 0;">This short link has been temporarily paused by the campaign owner.</p>
            <a href="/hub" style="display:inline-block;background:#2563EB;color:white;padding:10px 20px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:13px;">Return to Spatial Hub</a>
          </div>
        </body>
        </html>
      `);
    }

    if (result.status === 'expired') {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Link Expired - I3DION Spatial</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="font-family:system-ui,-apple-system,sans-serif;background:#0F172A;color:white;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="background:#1E293B;padding:32px;border-radius:24px;max-width:400px;text-align:center;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
            <div style="font-size:36px;margin-bottom:12px;">⌛</div>
            <h2 style="margin:0 0 8px 0;font-size:20px;">QR Link Expired</h2>
            <p style="color:#94A3B8;font-size:14px;margin:0 0 24px 0;">This short link campaign has ended.</p>
            <a href="/hub" style="display:inline-block;background:#2563EB;color:white;padding:10px 20px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:13px;">Return to Spatial Hub</a>
          </div>
        </body>
        </html>
      `);
    }

    // Password required -> redirect to frontend landing page to enter password
    return res.redirect(`/q/${shortCode}`);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>QR Code Not Found - I3DION</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="font-family:system-ui,sans-serif;background:#0F172A;color:white;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="background:#1E293B;padding:32px;border-radius:24px;max-width:400px;text-align:center;">
            <div style="font-size:36px;margin-bottom:12px;">🔍</div>
            <h2 style="margin:0 0 8px 0;font-size:20px;">QR Link Not Found</h2>
            <p style="color:#94A3B8;font-size:14px;margin:0 0 24px 0;">The requested QR link does not exist or has been removed.</p>
            <a href="/hub" style="display:inline-block;background:#2563EB;color:white;padding:10px 20px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:13px;">Open Spatial Hub</a>
          </div>
        </body>
        </html>
      `);
    }
    throw err;
  }
});
