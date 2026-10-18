import { Router } from 'express';
import { printEngine } from '../services/print/printEngine.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { authorize } from '../middleware/authorizationEngine.js';
import { enforcePayloadCap } from '../middleware/rateLimiters.js';
import { asyncHandler, ApiError } from '../utils/errors.js';

export const printRouter = Router();

/**
 * POST /api/print/catalog/render
 * Compiles an App Definition (i3dion.catalog/1) into an immutable, print-ready PDF
 */
printRouter.post(
  '/catalog/render',
  requireAuth,
  requireTenant,
  authorize('studio:read'),
  enforcePayloadCap(1024 * 1024), // 1MB payload cap
  asyncHandler(async (req, res) => {
    const { organization_id } = req.user;
    const { catalogDoc, pageSize, watermark, includeToc, dealerInfo } = req.body;

    if (!catalogDoc) {
      throw new ApiError(400, 'Catalog document definition is required for rendering');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const result = await printEngine.renderCatalogPdf(catalogDoc, {
      organizationId: organization_id,
      pageSize,
      watermark,
      includeToc: includeToc !== false,
      baseUrl,
      dealerInfo
    });

    res.json(result);
  })
);

/**
 * POST /api/print/quote/gst
 * Generates an India-ready GST commercial quotation PDF document
 */
printRouter.post(
  '/quote/gst',
  requireAuth,
  requireTenant,
  authorize('studio:read'),
  enforcePayloadCap(512 * 1024),
  asyncHandler(async (req, res) => {
    const quotePayload = req.body;
    const result = await printEngine.renderIndiaGstQuotePdf(quotePayload);
    res.json(result);
  })
);

/**
 * POST /api/print/batch/dealer
 * Initiates batch dealer-personalized PDF generation with progress & partial failure tolerance
 */
printRouter.post(
  '/batch/dealer',
  requireAuth,
  requireTenant,
  authorize('studio:read'),
  enforcePayloadCap(2 * 1024 * 1024),
  asyncHandler(async (req, res) => {
    const { organization_id } = req.user;
    const { catalogDoc, dealers, resumeFromDealerId } = req.body;

    if (!catalogDoc || !Array.isArray(dealers)) {
      throw new ApiError(400, 'catalogDoc and dealers array are required for batch export');
    }

    const result = await printEngine.generateBatchDealerPdfs({
      catalogDoc,
      dealers,
      organizationId: organization_id,
      resumeFromDealerId
    });

    res.json(result);
  })
);
