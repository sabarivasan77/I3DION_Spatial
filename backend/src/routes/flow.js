import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createFlow,
  getFlowById,
  listFlows,
  executeFlowRun,
  enqueueOutboxEvent
} from '../services/flow/flowExecutor.js';
import { withTenant } from '../db/pool.js';

const flowRouter = express.Router();

flowRouter.use(requireAuth);

// GET /api/flows
flowRouter.get('/', async (req, res) => {
  try {
    const flows = await listFlows(req.user.organization_id);
    res.json({ flows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/flows
flowRouter.post('/', async (req, res) => {
  try {
    const { name, description, triggerType, triggerConfig, steps, status } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Flow name is required' });
    }
    const flow = await createFlow({
      organizationId: req.user.organization_id,
      name,
      description,
      triggerType,
      triggerConfig,
      steps,
      status,
    });
    res.status(201).json({ flow });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/flows/:id
flowRouter.get('/:id', async (req, res) => {
  try {
    const flow = await getFlowById(req.user.organization_id, req.params.id);
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    res.json({ flow });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/flows/:id/trigger
flowRouter.post('/:id/trigger', async (req, res) => {
  try {
    const run = await executeFlowRun({
      flowId: req.params.id,
      organizationId: req.user.organization_id,
      triggerPayload: req.body || {},
    });
    res.json({ run });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/flows/:id/runs
flowRouter.get('/:id/runs', async (req, res) => {
  try {
    const runs = await withTenant(req.user.organization_id, async (client) => {
      const result = await client.query(
        'SELECT * FROM flow_runs WHERE flow_id = $1 ORDER BY started_at DESC LIMIT 50',
        [req.params.id]
      );
      return result.rows;
    });
    res.json({ runs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/flows/events (Transactional Outbox Enqueue)
flowRouter.post('/events', async (req, res) => {
  try {
    const { eventType, payload } = req.body;
    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }
    const outboxItem = await enqueueOutboxEvent({
      organizationId: req.user.organization_id,
      eventType,
      payload,
    });
    res.status(201).json({ outboxItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export { flowRouter };
