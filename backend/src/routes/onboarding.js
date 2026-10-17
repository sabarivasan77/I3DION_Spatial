import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { onboardingService } from '../services/onboarding/onboardingService.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireTenant);

/**
 * GET /api/onboarding/status
 * Get real-time progression across the 5 canonical products
 */
router.get('/status', async (req, res, next) => {
  try {
    const status = await onboardingService.getOnboardingStatus(req.organizationId);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/onboarding/dismiss
 * Dismiss onboarding checklist banner
 */
router.post('/dismiss', async (req, res, next) => {
  try {
    await onboardingService.dismissOnboarding(req.organizationId);
    res.json({ success: true, message: 'Onboarding checklist dismissed' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/onboarding/reset
 * Reset onboarding checklist
 */
router.post('/reset', async (req, res, next) => {
  try {
    await onboardingService.resetOnboarding(req.organizationId);
    const status = await onboardingService.getOnboardingStatus(req.organizationId);
    res.json({ success: true, message: 'Onboarding checklist reset', status });
  } catch (err) {
    next(err);
  }
});

export default router;
