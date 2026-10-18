import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { experienceService } from '../services/engine/experienceService.js';
import { enforceQuota } from '../middleware/entitlement.js';
import { pool } from '../db/pool.js';
import { saveSceneDocument, assertGlbIntegrityUnchanged } from '../services/engine/sceneDocumentService.js';
import { compileCircuitGraph, CHIP_CATALOG, TOTAL_REGISTERED_CHIPS } from '../services/engine/circuitsCompiler.js';
import { interpretCircuitIR } from '../services/engine/circuitsInterpreter.js';

export const engineRouter = express.Router();

// ---------------------------------------------------------
// PUBLIC ENDPOINTS (NO AUTH REQUIRED)
// ---------------------------------------------------------

// GET /api/engine/published/:slug (Public experience delivery for Spatial Hub / Viewer)
engineRouter.get('/published/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const snapshot = await experienceService.getPublishedBySlug(slug);
    if (!snapshot) return res.status(404).json({ error: 'Published experience not found' });
    res.json(snapshot);
  } catch (error) {
    console.error('Engine GET Published Error:', error);
    res.status(500).json({ error: 'Failed to fetch published experience' });
  }
});

// POST /api/engine/published/:slug/circuits/execute (Public Circuit IR execution for Player)
engineRouter.post('/published/:slug/circuits/execute', async (req, res) => {
  try {
    const { slug } = req.params;
    const { eventTrigger, eventPayload, initialContext } = req.body;
    const expRes = await pool.query(
      `SELECT organization_id, circuits_ir, published_snapshot FROM spatial_experiences WHERE slug = $1 AND status = 'Published'`,
      [slug]
    );
    if (expRes.rows.length === 0) return res.status(404).json({ error: 'Published experience not found' });
    const exp = expRes.rows[0];
    const ir = exp.published_snapshot?.circuitsIR || exp.circuits_ir;
    if (!ir) return res.status(400).json({ error: 'Experience does not have compiled circuits' });

    const result = await interpretCircuitIR(ir, eventTrigger, eventPayload, {
      ...initialContext,
      organizationId: exp.organization_id
    });
    res.json(result);
  } catch (error) {
    console.error('Engine Published Circuit Execution Error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute circuit' });
  }
});

// ---------------------------------------------------------
// AUTHENTICATED SPATIAL ENGINE AUTHORING API
// ---------------------------------------------------------

engineRouter.use(requireAuth);

// GET /api/engine/experiences (List experiences)
engineRouter.get('/experiences', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { status, search } = req.query;
    const experiences = await experienceService.listExperiences(organization_id, { status, search });
    res.json(experiences);
  } catch (error) {
    console.error('Engine GET Experiences Error:', error);
    res.status(500).json({ error: 'Failed to list experiences' });
  }
});

// POST /api/engine/experiences (Create experience)
engineRouter.post('/experiences', enforceQuota('3d_models'), async (req, res) => {
  try {
    const { organization_id, id: userId } = req.user;
    const created = await experienceService.createExperience(organization_id, userId, req.body);
    res.status(201).json(created);
  } catch (error) {
    console.error('Engine Create Experience Error:', error);
    res.status(400).json({ error: error.message || 'Failed to create experience' });
  }
});

// GET /api/engine/experiences/:id (Fetch experience detail)
engineRouter.get('/experiences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const experience = await experienceService.getExperience(id, organization_id);
    if (!experience) return res.status(404).json({ error: 'Experience not found' });
    res.json(experience);
  } catch (error) {
    console.error('Engine GET Experience Detail Error:', error);
    res.status(500).json({ error: 'Failed to fetch experience detail' });
  }
});

// PATCH /api/engine/experiences/:id (Update general experience properties)
engineRouter.patch('/experiences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const updated = await experienceService.updateExperience(id, organization_id, req.body);
    if (!updated) return res.status(404).json({ error: 'Experience not found' });
    res.json(updated);
  } catch (error) {
    console.error('Engine Update Experience Error:', error);
    res.status(500).json({ error: 'Failed to update experience' });
  }
});

// DELETE /api/engine/experiences/:id (Archive experience)
engineRouter.delete('/experiences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    await experienceService.updateExperience(id, organization_id, { status: 'Archived' });
    res.json({ message: 'Experience archived successfully' });
  } catch (error) {
    console.error('Engine Archive Experience Error:', error);
    res.status(500).json({ error: 'Failed to archive experience' });
  }
});

// POST /api/engine/experiences/:id/hotspots (Add/update spatial 3D hotspot pin)
engineRouter.post('/experiences/:id/hotspots', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const hotspot = await experienceService.addOrUpdateHotspot(id, organization_id, req.body);
    res.json(hotspot);
  } catch (error) {
    console.error('Engine Add Hotspot Error:', error);
    res.status(400).json({ error: error.message || 'Failed to add hotspot' });
  }
});

// DELETE /api/engine/experiences/:id/hotspots/:hotspotId (Remove hotspot pin)
engineRouter.delete('/experiences/:id/hotspots/:hotspotId', async (req, res) => {
  try {
    const { id, hotspotId } = req.params;
    const { organization_id } = req.user;
    const result = await experienceService.removeHotspot(id, organization_id, hotspotId);
    res.json(result);
  } catch (error) {
    console.error('Engine Remove Hotspot Error:', error);
    res.status(500).json({ error: error.message || 'Failed to remove hotspot' });
  }
});

// PATCH /api/engine/experiences/:id/scene (Update camera, lighting, HDRI)
engineRouter.patch('/experiences/:id/scene', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const updated = await experienceService.updateExperience(id, organization_id, { scene_config: req.body });
    res.json(updated?.scene_config);
  } catch (error) {
    console.error('Engine Update Scene Error:', error);
    res.status(500).json({ error: 'Failed to update scene configuration' });
  }
});

// PATCH /api/engine/experiences/:id/animation (Update exploded view and timeline)
engineRouter.patch('/experiences/:id/animation', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const updated = await experienceService.updateExperience(id, organization_id, { animation_config: req.body });
    res.json(updated?.animation_config);
  } catch (error) {
    console.error('Engine Update Animation Error:', error);
    res.status(500).json({ error: 'Failed to update animation configuration' });
  }
});

// PATCH /api/engine/experiences/:id/blueprint (Update blueprint dimensions and callouts)
engineRouter.patch('/experiences/:id/blueprint', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const updated = await experienceService.updateExperience(id, organization_id, { blueprint_config: req.body });
    res.json(updated?.blueprint_config);
  } catch (error) {
    console.error('Engine Update Blueprint Error:', error);
    res.status(500).json({ error: 'Failed to update blueprint configuration' });
  }
});

// GET /api/engine/experiences/:id/ar-config (Resolve device capability matrix)
engineRouter.get('/experiences/:id/ar-config', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const userAgent = req.headers['user-agent'] || '';
    const arLaunch = await experienceService.resolveArLaunch(id, organization_id, userAgent);
    res.json(arLaunch);
  } catch (error) {
    console.error('Engine AR Config Error:', error);
    res.status(500).json({ error: 'Failed to resolve AR configuration' });
  }
});

// POST /api/engine/experiences/:id/publish (Universal Publishing Ceremony)
engineRouter.post('/experiences/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId } = req.user;
    const published = await experienceService.publishExperience(id, organization_id, userId);
    res.json(published);
  } catch (error) {
    console.error('Engine Publish Experience Error:', error);
    res.status(400).json({ error: error.message || 'Failed to publish experience' });
  }
});

// GET /api/engine/experiences/:id/qr (Generate vector/image QR Code)
engineRouter.get('/experiences/:id/qr', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { format = 'svg' } = req.query;
    const qrResult = await experienceService.generateQr(id, organization_id, { format });

    res.setHeader('Content-Type', qrResult.contentType);
    res.send(qrResult.content);
  } catch (error) {
    console.error('Engine QR Code Error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// GET /api/engine/chips (Catalog of ~70 registered chips across 5 domains)
engineRouter.get('/chips', (req, res) => {
  res.json({
    chips: CHIP_CATALOG,
    total: TOTAL_REGISTERED_CHIPS
  });
});

// GET /api/engine/experiences/:id/scene-document (Fetch non-destructive scene document & revision)
engineRouter.get('/experiences/:id/scene-document', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const expRes = await pool.query(
      `SELECT id, name, slug, revision, scene_document FROM spatial_experiences WHERE id = $1 AND organization_id = $2`,
      [id, organization_id]
    );
    if (expRes.rows.length === 0) return res.status(404).json({ error: 'Experience not found' });
    res.json(expRes.rows[0]);
  } catch (error) {
    console.error('Engine GET Scene Document Error:', error);
    res.status(500).json({ error: 'Failed to fetch scene document' });
  }
});

// POST /api/engine/experiences/:id/scene-document (Save scene document with OCC revision check)
engineRouter.post('/experiences/:id/scene-document', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { sceneDocument, expectedRevision, originalSha256 } = req.body;

    if (!sceneDocument) {
      return res.status(400).json({ error: 'Missing sceneDocument payload' });
    }

    const saved = await saveSceneDocument(id, organization_id, sceneDocument, expectedRevision);

    // Assert source GLB integrity remains untouched
    if (originalSha256) {
      await assertGlbIntegrityUnchanged(saved.vault_asset_id, originalSha256);
    }

    res.json(saved);
  } catch (error) {
    if (error.status === 409) {
      return res.status(409).json({
        error: error.message,
        currentRevision: error.currentRevision
      });
    }
    console.error('Engine Save Scene Document Error:', error);
    res.status(500).json({ error: error.message || 'Failed to save scene document' });
  }
});

// POST /api/engine/experiences/:id/circuits/compile (Compile visual graph to deterministic IR)
engineRouter.post('/experiences/:id/circuits/compile', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { graph, save = true } = req.body;

    if (!graph) {
      return res.status(400).json({ error: 'Missing circuit graph payload' });
    }

    const ir = compileCircuitGraph(graph);

    if (save) {
      await pool.query(
        `UPDATE spatial_experiences
         SET circuits_graph = $1, circuits_ir = $2, updated_at = NOW()
         WHERE id = $3 AND organization_id = $4`,
        [JSON.stringify(graph), JSON.stringify(ir), id, organization_id]
      );
    }

    res.json({
      valid: true,
      totalChips: ir.totalChips,
      ir
    });
  } catch (error) {
    console.error('Engine Circuits Compile Error:', error);
    res.status(400).json({ error: error.message || 'Circuit compilation failed' });
  }
});

// POST /api/engine/experiences/:id/circuits/execute (Execute Circuit IR in Editor runtime)
engineRouter.post('/experiences/:id/circuits/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { eventTrigger, eventPayload, initialContext, ir } = req.body;

    let circuitIR = ir;
    if (!circuitIR) {
      const expRes = await pool.query(
        `SELECT circuits_ir FROM spatial_experiences WHERE id = $1 AND organization_id = $2`,
        [id, organization_id]
      );
      if (expRes.rows.length === 0) return res.status(404).json({ error: 'Experience not found' });
      circuitIR = expRes.rows[0].circuits_ir;
    }

    if (!circuitIR) {
      return res.status(400).json({ error: 'No Circuit IR available for execution' });
    }

    const result = await interpretCircuitIR(circuitIR, eventTrigger, eventPayload, {
      ...initialContext,
      organizationId: organization_id
    });

    res.json(result);
  } catch (error) {
    console.error('Engine Circuits Execute Error:', error);
    res.status(500).json({ error: error.message || 'Circuit execution failed' });
  }
});

