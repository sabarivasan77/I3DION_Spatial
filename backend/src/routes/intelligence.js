import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { eventService } from '../services/intelligence/eventService.js';
import { sessionService } from '../services/intelligence/sessionService.js';
import { activityStreamService } from '../services/intelligence/activityStreamService.js';
import { behaviorProfileService } from '../services/intelligence/behaviorProfileService.js';
import { engagementScoringService } from '../services/intelligence/engagementScoringService.js';
import { personalizedFeedEngine } from '../services/intelligence/personalizedFeedEngine.js';
import { recommendationService } from '../services/intelligence/recommendationService.js';
import { leadIntentService } from '../services/intelligence/leadIntentService.js';
import { leadScoringEngine } from '../services/intelligence/leadScoringEngine.js';
import { analyticsService } from '../services/intelligence/analyticsService.js';
import { algorithmConfigService } from '../services/intelligence/algorithmConfigService.js';
import { auditService } from '../services/intelligence/auditService.js';

export const intelligenceRouter = Router();

/**
 * Helper to resolve tenant organizationId from req.user or header/query.
 */
function resolveOrganizationId(req) {
  const orgId = req.user?.organizationId || req.user?.organization_id || req.query.organizationId || req.body?.organizationId || req.headers['x-organization-id'];
  if (!orgId) {
    throw new ApiError(400, 'organizationId is required for tenant isolation');
  }
  return orgId;
}

// ----------------------------------------------------
// 1. EVENT INGESTION (Public / Authenticated)
// ----------------------------------------------------
intelligenceRouter.post(
  '/events',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const payload = {
      ...req.body,
      organizationId: orgId,
      userId: req.user?.id || req.body.userId || null,
    };
    const event = await eventService.ingestEvent(payload);
    res.status(201).json({ success: true, event });
  })
);

intelligenceRouter.post(
  '/events/batch',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const batch = (req.body.events || []).map((e) => ({
      ...e,
      organizationId: orgId,
      userId: req.user?.id || e.userId || null,
    }));
    const events = await eventService.ingestBatchEvents(batch);
    res.status(201).json({ success: true, count: events.length, events });
  })
);

intelligenceRouter.get(
  '/events',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const { userId, sessionId, projectId, eventType, limit, offset } = req.query;
    const events = await eventService.getEvents({
      organizationId: orgId,
      userId,
      sessionId,
      projectId,
      eventType,
      limit: Number(limit) || 50,
      offset: Number(offset) || 0,
    });
    res.json(events);
  })
);

// ----------------------------------------------------
// 2. SESSION & ACTIVITY INTELLIGENCE
// ----------------------------------------------------
intelligenceRouter.post(
  '/sessions/heartbeat',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const session = await sessionService.createOrUpdateSession({
      ...req.body,
      organizationId: orgId,
      userId: req.user?.id || req.body.userId || null,
    });
    res.json({ success: true, session });
  })
);

intelligenceRouter.get(
  '/sessions/active',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const sessions = await sessionService.getActiveSessions(orgId);
    res.json(sessions);
  })
);

intelligenceRouter.get(
  '/activity-stream',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const stream = await activityStreamService.getActivityStream({
      organizationId: orgId,
      limit: Number(req.query.limit) || 30,
    });
    res.json(stream);
  })
);

// ----------------------------------------------------
// 3. BEHAVIOR PROFILE & ENGAGEMENT SCORING
// ----------------------------------------------------
intelligenceRouter.get(
  '/behavior-profile',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const profile = await behaviorProfileService.getUserBehaviorProfile({
      organizationId: orgId,
      userId: req.user?.id || req.query.userId || null,
      visitorId: req.query.visitorId || null,
      leadId: req.query.leadId || null,
    });
    res.json(profile);
  })
);

intelligenceRouter.get(
  '/engagement-score',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const result = await engagementScoringService.calculateEngagementScore({
      organizationId: orgId,
      userId: req.user?.id || req.query.userId || null,
      visitorId: req.query.visitorId || null,
      leadId: req.query.leadId || null,
    });
    res.json(result);
  })
);

// ----------------------------------------------------
// 4. PERSONALIZED FEED & TRENDING
// ----------------------------------------------------
intelligenceRouter.get(
  '/feed/personalized',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const feed = await personalizedFeedEngine.getPersonalizedFeed({
      organizationId: orgId,
      userId: req.user?.id || req.query.userId || null,
      visitorId: req.query.visitorId || null,
      leadId: req.query.leadId || null,
      limit: Number(req.query.limit) || 20,
      offset: Number(req.query.offset) || 0,
    });
    res.json(feed);
  })
);

intelligenceRouter.get(
  '/feed/trending',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const trending = await personalizedFeedEngine.getTrendingFeed({
      organizationId: orgId,
      limit: Number(req.query.limit) || 10,
    });
    res.json(trending);
  })
);

// ----------------------------------------------------
// 5. EXPLAINABLE RECOMMENDATIONS & NEXT BEST ACTION
// ----------------------------------------------------
intelligenceRouter.get(
  '/recommendations/products',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const recommendations = await recommendationService.getRecommendedProducts({
      organizationId: orgId,
      userId: req.user?.id || req.query.userId || null,
      visitorId: req.query.visitorId || null,
      leadId: req.query.leadId || null,
      currentProductId: req.query.currentProductId || null,
      limit: Number(req.query.limit) || 6,
    });
    res.json(recommendations);
  })
);

intelligenceRouter.get(
  '/recommendations/next-best-action',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const action = await recommendationService.getNextBestAction({
      organizationId: orgId,
      userId: req.user?.id || req.query.userId || null,
      visitorId: req.query.visitorId || null,
      currentProductId: req.query.currentProductId || null,
    });
    res.json(action);
  })
);

// ----------------------------------------------------
// 6. LEAD INTENT & SCORING
// ----------------------------------------------------
intelligenceRouter.get(
  '/leads/intent',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const intent = await leadIntentService.evaluateIntent({
      organizationId: orgId,
      leadId: req.query.leadId || null,
      userId: req.query.userId || null,
      visitorId: req.query.visitorId || null,
    });
    res.json(intent);
  })
);

intelligenceRouter.post(
  '/leads/recalculate-score',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const { leadId } = req.body;
    if (!leadId) throw new ApiError(400, 'leadId is required');
    const result = await leadScoringEngine.recalculateLeadScore(leadId, orgId);
    res.json(result);
  })
);

intelligenceRouter.get(
  '/leads/:leadId/recommendations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const recommendations = await leadScoringEngine.getLeadProductRecommendations(
      req.params.leadId,
      orgId,
      Number(req.query.limit) || 5
    );
    res.json(recommendations);
  })
);

// ----------------------------------------------------
// 7. ANALYTICS & PROJECT INTELLIGENCE
// ----------------------------------------------------
intelligenceRouter.get(
  '/analytics/overview',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const analytics = await analyticsService.getOverallAnalytics({
      organizationId: orgId,
      timeframeDays: Number(req.query.timeframeDays) || 30,
    });
    res.json(analytics);
  })
);

intelligenceRouter.get(
  '/analytics/projects/:projectId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const analytics = await analyticsService.getProjectAnalytics({
      organizationId: orgId,
      projectId: req.params.projectId,
    });
    res.json(analytics);
  })
);

// ----------------------------------------------------
// 8. ALGORITHM ADMIN, CONFIG & AUDIT
// ----------------------------------------------------
intelligenceRouter.get(
  '/algorithm-config',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const config = await algorithmConfigService.getAlgorithmConfig(orgId);
    res.json(config);
  })
);

intelligenceRouter.put(
  '/algorithm-config',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const updated = await algorithmConfigService.updateAlgorithmConfig({
      organizationId: orgId,
      userId: req.user.id,
      configPayload: req.body,
    });
    res.json({ success: true, config: updated });
  })
);

intelligenceRouter.get(
  '/audit-logs',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = resolveOrganizationId(req);
    const logs = await auditService.getAuditLogs({
      organizationId: orgId,
      limit: Number(req.query.limit) || 50,
      offset: Number(req.query.offset) || 0,
    });
    res.json(logs);
  })
);
