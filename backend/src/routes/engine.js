import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { experienceService } from '../services/engine/experienceService.js';
import { enforceQuota } from '../middleware/entitlement.js';

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
