import express from 'express';
import { requireAuth } from '../middleware/auth.js';
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
flowRouter.get('/', async (req, res) => {
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
flowRouter.post('/', async (req, res) => {
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
// 3. GET FLOW DETAILS
// -----------------------------------------------------------------------------
// GET /api/flows/:id
flowRouter.get('/:id', async (req, res) => {
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
// 4. UPDATE FLOW
// -----------------------------------------------------------------------------
// PUT /api/flows/:id
flowRouter.put('/:id', async (req, res) => {
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
flowRouter.post('/:id/publish', async (req, res) => {
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
flowRouter.post('/:id/duplicate', async (req, res) => {
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
flowRouter.delete('/:id', async (req, res) => {
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
flowRouter.get('/:id/versions', async (req, res) => {
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
flowRouter.post('/:id/trigger', async (req, res) => {
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
// 10. LIST EXECUTION RUNS
// -----------------------------------------------------------------------------
// GET /api/flows/:id/runs
flowRouter.get('/:id/runs', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const runs = await withTenant(orgId, async (client) => {
      const result = await client.query(
        `SELECT r.*, u.name as triggered_by_name
         FROM flow_runs r
         LEFT JOIN users u ON r.triggered_by = u.id
         WHERE r.flow_id = $1 AND r.organization_id = $2
         ORDER BY r.started_at DESC
         LIMIT 50`,
        [req.params.id, orgId]
      );
      return result.rows;
    });
    res.json({ runs });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 11. ENQUEUE OUTBOX EVENT
// -----------------------------------------------------------------------------
// POST /api/flows/events
flowRouter.post('/events', async (req, res) => {
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

// -----------------------------------------------------------------------------
// 12. INGEST 3D SPATIAL EVENT (HUB / ENGINE / STUDIO)
// -----------------------------------------------------------------------------
// POST /api/flows/events/spatial
flowRouter.post('/events/spatial', async (req, res) => {
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

// -----------------------------------------------------------------------------
// 13. PROCESS OUTBOX DISPATCH BATCH
// -----------------------------------------------------------------------------
// POST /api/flows/outbox/process
flowRouter.post('/outbox/process', async (req, res) => {
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

// -----------------------------------------------------------------------------
// 14. LIST OUTBOX EVENTS
// -----------------------------------------------------------------------------
// GET /api/flows/outbox
flowRouter.get('/outbox', async (req, res) => {
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

export default flowRouter;
