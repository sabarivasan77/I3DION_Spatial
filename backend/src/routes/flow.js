import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorizationEngine.js';
import {
  createFlow,
  getFlowById,
  listFlows,
  updateFlow,
  publishFlow,
  duplicateFlow,
  archiveFlow,
  listFlowVersions,
} from '../services/flow/flowPersistenceService.js';
import { executeFlowRun, enqueueOutboxEvent } from '../services/flow/flowExecutor.js';
import {
  listOrganizationRuns,
  getRunDetails,
  retryRun,
  getFlowAnalytics,
} from '../services/flow/flowMonitoringService.js';
import {
  listRecipes,
  getRecipe,
  instantiateRecipe,
  exportFlowDefinition,
  importFlowDefinition,
} from '../services/flow/flowRecipeService.js';
import {
  getOrganizationPlan,
  setOrganizationPlan,
} from '../services/billing/quotaService.js';
import { withTenant } from '../db/pool.js';

const flowRouter = express.Router();

// Require authenticated user with active organization
flowRouter.use(requireAuth);

// Helper to extract organizationId safely
function getOrgId(req) {
  const orgId = req.user?.organization_id || req.user?.organizationId;
  if (!orgId) {
    const err = new Error('Organization context required');
    err.status = 400;
    throw err;
  }
  return orgId;
}

// -----------------------------------------------------------------------------
// 1. LIST FLOWS
// -----------------------------------------------------------------------------
// GET /api/flows?status=active&search=rfq&limit=20&offset=0
flowRouter.get('/', authorize('flow:read'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { status, search, limit, offset } = req.query;

    const flows = await listFlows(orgId, {
      status: status || null,
      search: search || null,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
    });

    res.json({ flows });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. CREATE FLOW
// -----------------------------------------------------------------------------
// POST /api/flows
flowRouter.post('/', authorize('flow:create'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { name, description, triggerType, triggerConfig, flowDefinition } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Flow name is required' });
    }

    const flow = await createFlow({
      organizationId: orgId,
      ownerId: req.user.id,
      name,
      description,
      triggerType,
      triggerConfig,
      flowDefinition,
    });

    res.status(201).json({ flow });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// ANALYTICS OVERVIEW
// -----------------------------------------------------------------------------
// GET /api/flows/analytics/overview
flowRouter.get('/analytics/overview', authorize('flow:read'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const analytics = await getFlowAnalytics(orgId, null);
    res.json(analytics);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// LIST ALL ORGANIZATION RUNS
// -----------------------------------------------------------------------------
// GET /api/flows/runs/all
flowRouter.get('/runs/all', authorize('flow:read'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { status, search, limit, offset, flowId } = req.query;
    const result = await listOrganizationRuns(orgId, {
      flowId: flowId || null,
      status: status || null,
      search: search || null,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// GET SINGLE RUN DETAILS WITH STEP RESULTS
// -----------------------------------------------------------------------------
// GET /api/flows/runs/:runId
flowRouter.get('/runs/:runId', authorize('flow:read'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const run = await getRunDetails(orgId, req.params.runId);
    if (!run) {
      return res.status(404).json({ error: 'Run not found or access denied' });
    }
    res.json({ run });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// RETRY RUN
// -----------------------------------------------------------------------------
// POST /api/flows/runs/:runId/retry
flowRouter.post('/runs/:runId/retry', authorize('flow:execute'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const newRun = await retryRun(
      orgId,
      req.params.runId,
      req.user.id,
      req.body?.triggerPayload || null
    );
    res.json({ run: newRun });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// COMMERCIAL QUOTA & SUBSCRIPTIONS
// -----------------------------------------------------------------------------
// GET /api/flows/quota
flowRouter.get('/quota', authorize('flow:read'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const quota = await getOrganizationPlan(orgId);
    res.json(quota);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/flows/plan/upgrade
flowRouter.post('/plan/upgrade', authorize('org:update'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'planId is required (e.g. STARTER, BUSINESS, UNLIMITED)' });
    }
    const updated = await setOrganizationPlan(orgId, planId);
    const quota = await getOrganizationPlan(orgId);
    res.json({ success: true, subscription: updated, quota });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// RECIPES / INDUSTRIAL TEMPLATES
// -----------------------------------------------------------------------------
// GET /api/flows/recipes
flowRouter.get('/recipes', authorize('flow:read'), (req, res) => {
  try {
    const recipes = listRecipes();
    res.json({ recipes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/flows/recipes/:key
flowRouter.get('/recipes/:key', authorize('flow:read'), (req, res) => {
  try {
    const recipe = getRecipe(req.params.key);
    res.json({ recipe });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/flows/recipes/:key/instantiate
flowRouter.post('/recipes/:key/instantiate', authorize('flow:create'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const flow = await instantiateRecipe(
      orgId,
      req.user.id,
      req.params.key,
      req.body?.nameOverride || null
    );
    res.status(201).json({ flow });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// IMPORT FLOW DEFINITION PACKAGE
// -----------------------------------------------------------------------------
// POST /api/flows/import
flowRouter.post('/import', authorize('flow:create'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const flow = await importFlowDefinition(orgId, req.user.id, req.body);
    res.status(201).json({ flow });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// COMMERCIAL READINESS & QUOTA ENDPOINTS
// -----------------------------------------------------------------------------
// GET /api/flows/quota
flowRouter.get('/quota', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await getOrganizationPlan(orgId);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/flows/plan/upgrade
flowRouter.post('/plan/upgrade', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'planId is required (FREE, STARTER, BUSINESS, UNLIMITED)' });
    }
    const subscription = await setOrganizationPlan(orgId, planId);
    const quotaData = await getOrganizationPlan(orgId);
    res.json({
      success: true,
      subscription,
      quota: quotaData,
    });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// EVENT INGESTION & OUTBOX ROUTES (MUST BE BEFORE /:id TO AVOID COLLISION)
// -----------------------------------------------------------------------------
// POST /api/flows/events
flowRouter.post('/events', authorize('flow:execute'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { eventType, payload } = req.body;
    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    const outboxItem = await enqueueOutboxEvent({
      organizationId: orgId,
      eventType,
      payload: payload || {},
      destinationUrl: req.body.destinationUrl || null,
    });

    res.status(202).json({ outboxItem });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/flows/events/spatial
flowRouter.post('/events/spatial', authorize('flow:execute'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { eventType, payload, sourceApp } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    const { ingestSpatialEvent } = await import('../services/flow/spatialTriggerService.js');
    const result = await ingestSpatialEvent({
      organizationId: orgId,
      eventType,
      payload: payload || {},
      sourceApp: sourceApp || 'engine',
      userId: req.user?.id || null,
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/flows/outbox/process
flowRouter.post('/outbox/process', authorize('flow:execute'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { limit } = req.body;

    const { processPendingOutboxEvents } = await import('../services/flow/outboxDispatcher.js');
    const summary = await processPendingOutboxEvents({
      organizationId: orgId,
      limit: parseInt(limit, 10) || 20,
    });

    res.json({ summary });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/flows/outbox
flowRouter.get('/outbox', authorize('flow:read'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const items = await withTenant(orgId, async (client) => {
      const result = await client.query(
        `SELECT * FROM flow_event_outbox
         WHERE organization_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [orgId]
      );
      return result.rows;
    });

    res.json({ outbox: items });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. GET FLOW DETAILS
// -----------------------------------------------------------------------------
// GET /api/flows/:id
flowRouter.get('/:id', authorize('flow:read'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const flow = await getFlowById(orgId, req.params.id);

    if (!flow) {
      return res.status(404).json({ error: 'Flow not found or access denied' });
    }

    res.json({ flow });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// EXPORT FLOW DEFINITION PACKAGE
// -----------------------------------------------------------------------------
// GET /api/flows/:id/export
flowRouter.get('/:id/export', authorize('flow:read'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const exportBundle = await exportFlowDefinition(orgId, req.params.id);
    const safeName = exportBundle.flow.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.flow.json"`);
    res.json(exportBundle);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 4. UPDATE FLOW
// -----------------------------------------------------------------------------
// PUT /api/flows/:id
flowRouter.put('/:id', authorize('flow:update'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const updated = await updateFlow(orgId, req.params.id, req.body);
    res.json({ flow: updated });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 5. PUBLISH FLOW VERSION
// -----------------------------------------------------------------------------
// POST /api/flows/:id/publish
flowRouter.post('/:id/publish', authorize('flow:publish'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { changeSummary } = req.body;

    const published = await publishFlow(
      orgId,
      req.params.id,
      req.user.id,
      changeSummary || 'Published version'
    );

    res.json({ flow: published });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 6. DUPLICATE FLOW
// -----------------------------------------------------------------------------
// POST /api/flows/:id/duplicate
flowRouter.post('/:id/duplicate', authorize('flow:create'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const duplicated = await duplicateFlow(orgId, req.params.id, req.user.id);
    res.status(201).json({ flow: duplicated });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 7. ARCHIVE / DELETE FLOW
// -----------------------------------------------------------------------------
// DELETE /api/flows/:id
flowRouter.delete('/:id', authorize('flow:archive'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const archived = await archiveFlow(orgId, req.params.id);
    res.json({ success: true, flow: archived });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 8. LIST PUBLISHED VERSIONS
// -----------------------------------------------------------------------------
// GET /api/flows/:id/versions
flowRouter.get('/:id/versions', authorize('flow:read'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const versions = await listFlowVersions(orgId, req.params.id);
    res.json({ versions });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 9. TRIGGER TEST RUN / EXECUTE FLOW
// -----------------------------------------------------------------------------
// POST /api/flows/:id/trigger
flowRouter.post('/:id/trigger', authorize('flow:execute'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const run = await executeFlowRun({
      flowId: req.params.id,
      organizationId: orgId,
      triggerPayload: req.body || {},
      userId: req.user.id,
    });
    res.json({ run });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 10. LIST EXECUTION RUNS FOR FLOW
// -----------------------------------------------------------------------------
// GET /api/flows/:id/runs
flowRouter.get('/:id/runs', authorize('flow:read'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const result = await listOrganizationRuns(orgId, {
      flowId: req.params.id,
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0,
      status: req.query.status || null,
    });
    res.json({ runs: result.runs, total: result.total });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// GET PER-FLOW ANALYTICS
// -----------------------------------------------------------------------------
// GET /api/flows/:id/analytics
flowRouter.get('/:id/analytics', authorize('flow:read'), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const analytics = await getFlowAnalytics(orgId, req.params.id);
    res.json(analytics);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});



export default flowRouter;
