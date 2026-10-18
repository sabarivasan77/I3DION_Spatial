import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth as authenticateToken } from '../middleware/auth.js';
import { can, authorize } from '../middleware/authorizationEngine.js';
import { projectService, defaultProjectDocument } from '../services/studio/projectService.js';
import { formulaService } from '../services/studio/formulaService.js';
import { bindingService } from '../services/studio/bindingService.js';
import { actionService } from '../services/studio/actionService.js';
import { versionService } from '../services/studio/versionService.js';
import { compilerService } from '../services/studio/compilerService.js';
import { analyticsService } from '../services/studio/analyticsService.js';
import { dataSourceService } from '../services/studio/dataSourceService.js';
import { schemaService } from '../services/studio/schemaService.js';
import { queryService } from '../services/studio/queryService.js';
import { recordService } from '../services/studio/recordService.js';
import { formService } from '../services/studio/formService.js';
import { catalogService } from '../services/studio/catalogService.js';
import { enforceQuota } from '../middleware/entitlement.js';

export const studioRouter = Router();

studioRouter.use(authenticateToken);

// ---------------------------------------------------------
// 1. GET /api/studio/projects (List projects for organization)
// ---------------------------------------------------------
studioRouter.get('/projects', authorize('studio:read'), async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { status, type, search } = req.query;

    let query = `
      SELECT p.*, u.name as owner_name, u.email as owner_email
      FROM studio_projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.organization_id = $1 AND p.status != 'Archived'
    `;
    const params = [organization_id];

    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND p.project_type = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    query += ` ORDER BY p.updated_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Studio GET Projects Error:', error);
    res.status(500).json({ error: 'Failed to fetch studio projects' });
  }
});

// ---------------------------------------------------------
// 2. POST /api/studio/projects (Create new low-code project)
// ---------------------------------------------------------
studioRouter.post('/projects', authorize('studio:create'), async (req, res) => {
  try {
    const { organization_id, id: userId } = req.user;
    const { name, description, project_type, visibility, template_id, project_document } = req.body;

    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const docToSave = projectService.validateDocument(project_document || defaultProjectDocument);

    const result = await pool.query(
      `INSERT INTO studio_projects (
        organization_id, owner_id, name, description, project_type, status, visibility, project_document
      ) VALUES ($1, $2, $3, $4, $5, 'Draft', $6, $7) RETURNING *`,
      [
        organization_id,
        userId,
        name,
        description || '',
        project_type || 'Application',
        visibility || 'Organization',
        JSON.stringify(docToSave)
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Studio POST Project Error:', error);
    res.status(500).json({ error: 'Failed to create studio project' });
  }
});

// ---------------------------------------------------------
// 3. GET /api/studio/projects/:id (Fetch single project detail)
// ---------------------------------------------------------
studioRouter.get('/projects/:id', authorize('studio:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const proj = await projectService.getProject(id, organization_id);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    res.json(proj);
  } catch (error) {
    console.error('Studio GET Project Detail Error:', error);
    res.status(500).json({ error: 'Failed to fetch project detail' });
  }
});

// ---------------------------------------------------------
// 4. PATCH /api/studio/projects/:id (Update project & document)
// ---------------------------------------------------------
studioRouter.patch('/projects/:id', authorize('studio:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const updated = await projectService.updateProjectDocument(id, organization_id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Studio PATCH Project Error:', error);
    res.status(500).json({ error: error.message || 'Failed to update project' });
  }
});

// ---------------------------------------------------------
// 5. DELETE /api/studio/projects/:id (Archive project)
// ---------------------------------------------------------
studioRouter.delete('/projects/:id', authorize('studio:delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    await pool.query(
      `UPDATE studio_projects SET status = 'Archived', updated_at = NOW() WHERE id = $1 AND organization_id = $2`,
      [id, organization_id]
    );

    res.json({ message: 'Project archived successfully' });
  } catch (error) {
    console.error('Studio DELETE Project Error:', error);
    res.status(500).json({ error: 'Failed to archive project' });
  }
});

// ---------------------------------------------------------
// 6. POST /api/studio/projects/:id/publish (Publish version)
// ---------------------------------------------------------
studioRouter.post('/projects/:id/publish', authorize('studio:publish'), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId } = req.user;
    const { change_summary } = req.body;

    const publishedProj = await versionService.publishVersion(id, organization_id, userId, change_summary);
    res.json(publishedProj);
  } catch (error) {
    console.error('Studio Publish Project Error:', error);
    res.status(500).json({ error: 'Failed to publish project' });
  }
});

// ---------------------------------------------------------
// 7. GET /api/studio/templates (List starter templates)
// ---------------------------------------------------------
studioRouter.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'tmpl-blank',
        name: 'Blank Application',
        description: 'Clean canvas starter for custom enterprise applications and 3D digital twins.',
        project_type: 'Application',
        thumbnail: '/templates/blank.png'
      },
      {
        id: 'tmpl-catalog',
        name: 'Industrial Equipment Catalog',
        description: 'Multi-screen product catalog with grid displays, specification tables, and CAD viewers.',
        project_type: 'Product Catalog',
        thumbnail: '/templates/catalog.png'
      },
      {
        id: 'tmpl-3d-showcase',
        name: '3D Spatial Asset Inspector',
        description: 'High-detail 3D model viewport with interactive camera orbits, hotspot pins, and exploded views.',
        project_type: '3D Experience',
        thumbnail: '/templates/3d.png'
      },
      {
        id: 'tmpl-ar-experience',
        name: 'Augmented Reality Product Launcher',
        description: 'Mobile-ready AR experience with QR code launcher and instant Scene Viewer integration.',
        project_type: 'AR Experience',
        thumbnail: '/templates/ar.png'
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error('Studio GET Templates Error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// ---------------------------------------------------------
// 8. GET /api/studio/projects/:id/versions (List project version history)
// ---------------------------------------------------------
studioRouter.get('/projects/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const versions = await versionService.getVersions(id, organization_id);
    res.json(versions);
  } catch (error) {
    console.error('Studio GET Versions Error:', error);
    res.status(500).json({ error: 'Failed to fetch project version history' });
  }
});

// ---------------------------------------------------------
// 9. POST /api/studio/projects/:id/restore/:version (Restore specific version)
// ---------------------------------------------------------
studioRouter.post('/projects/:id/restore/:version', async (req, res) => {
  try {
    const { id, version } = req.params;
    const { organization_id } = req.user;

    const restored = await versionService.restoreVersion(id, organization_id, parseInt(version, 10));
    res.json(restored);
  } catch (error) {
    console.error('Studio Restore Version Error:', error);
    res.status(500).json({ error: 'Failed to restore project version' });
  }
});

// ---------------------------------------------------------
// 10. POST /api/studio/formula/evaluate (Server-side formula evaluation)
// ---------------------------------------------------------
studioRouter.post('/formula/evaluate', async (req, res) => {
  try {
    const { expression, context } = req.body;
    const result = formulaService.evaluate(expression, context || {});
    res.json({ result });
  } catch (error) {
    console.error('Studio Formula Evaluate Error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// 11. POST /api/studio/bindings/resolve (Resolve Vault data binding)
// ---------------------------------------------------------
studioRouter.post('/bindings/resolve', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { binding } = req.body;
    const data = await bindingService.resolveBinding(binding, organization_id);
    res.json({ data });
  } catch (error) {
    console.error('Studio Resolve Binding Error:', error);
    res.status(500).json({ error: 'Failed to resolve data binding' });
  }
});

// ---------------------------------------------------------
// 12. POST /api/studio/actions/execute (Execute action sequence)
// ---------------------------------------------------------
studioRouter.post('/actions/execute', async (req, res) => {
  try {
    const { organization_id, id: userId } = req.user;
    const { action } = req.body;
    const result = await actionService.executeAction(action, organization_id, userId);
    res.json({ result });
  } catch (error) {
    console.error('Studio Execute Action Error:', error);
    res.status(500).json({ error: 'Failed to execute action' });
  }
});
// 13. POST /api/studio/projects/:id/screens (Add new screen/page)
// ---------------------------------------------------------
studioRouter.post('/projects/:id/screens', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { name, type = 'screen', background_color = '#FFFFFF' } = req.body;

    const proj = await projectService.getProject(id, organization_id);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    const doc = proj.project_document;
    const newScreen = {
      id: `screen-${Date.now()}`,
      name: name || `Screen ${doc.screens.length + 1}`,
      type,
      order: doc.screens.length + 1,
      background_color,
      padding: 24,
      is_initial: doc.screens.length === 0,
      variables: [],
      events: {}
    };

    doc.screens.push(newScreen);
    const updated = await projectService.updateProjectDocument(id, organization_id, { project_document: doc });
    res.status(201).json({ screen: newScreen, project: updated });
  } catch (error) {
    console.error('Studio Add Screen Error:', error);
    res.status(500).json({ error: 'Failed to add screen' });
  }
});

// ---------------------------------------------------------
// 14. POST /api/studio/iscript/validate (Validate iScript syntax)
// ---------------------------------------------------------
studioRouter.post('/iscript/validate', async (req, res) => {
  try {
    const { script } = req.body;
    const { scriptService } = await import('../services/studio/scriptService.js');
    const result = scriptService.validateSyntax(script);
    res.json(result);
  } catch (error) {
    console.error('Studio iScript Validate Error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// 15. GET /api/studio/projects/:id/export (Export .omni.json package)
// ---------------------------------------------------------
studioRouter.get('/projects/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const proj = await projectService.getProject(id, organization_id);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    const exportPackage = {
      package_format: 'omni.json',
      schema_version: '2.0',
      exported_at: new Date().toISOString(),
      project: {
        id: proj.id,
        name: proj.name,
        description: proj.description,
        project_type: proj.project_type,
        version: proj.version,
        visibility: proj.visibility,
        product_ids: proj.product_ids,
        vault_asset_ids: proj.vault_asset_ids,
        project_document: proj.project_document
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${proj.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.omni.json"`);
    res.json(exportPackage);
  } catch (error) {
    console.error('Studio Export Project Error:', error);
    res.status(500).json({ error: 'Failed to export project package' });
  }
});

// ---------------------------------------------------------
// 16. POST /api/studio/projects/import (Import .omni.json package)
// ---------------------------------------------------------
studioRouter.post('/projects/import', async (req, res) => {
  try {
    const { organization_id, id: userId } = req.user;
    const { package_data } = req.body;

    if (!package_data || !package_data.project) {
      return res.status(400).json({ error: 'Invalid or missing .omni.json package data' });
    }

    const src = package_data.project;
    const docToSave = projectService.validateDocument(src.project_document);

    const result = await pool.query(
      `INSERT INTO studio_projects (
        organization_id, owner_id, name, description, project_type, status, visibility, project_document
      ) VALUES ($1, $2, $3, $4, $5, 'Draft', $6, $7) RETURNING *`,
      [
        organization_id,
        userId,
        `${src.name || 'Imported Experience'} (Imported)`,
        src.description || 'Imported OmniStudio package',
        src.project_type || 'Application',
        src.visibility || 'Organization',
        JSON.stringify(docToSave)
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Studio Import Project Error:', error);
    res.status(500).json({ error: 'Failed to import project package' });
  }
});

// ---------------------------------------------------------
// 17. POST /api/studio/projects/:id/compile (Compile project runtime)
// ---------------------------------------------------------
studioRouter.post('/projects/:id/compile', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const proj = await projectService.getProject(id, organization_id);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    const runtimeDefinition = compilerService.compileProject(proj);
    res.json({ runtime_definition: runtimeDefinition });
  } catch (error) {
    console.error('Studio Compile Project Error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// 18. GET /api/studio/published/experience/:id (Published experience runtime)
// ---------------------------------------------------------
studioRouter.get('/published/experience/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const proj = await projectService.getProject(id, organization_id);
    if (!proj) return res.status(404).json({ error: 'Published experience not found' });

    const runtimeDefinition = compilerService.compileProject(proj);
    res.json({ runtime_definition: runtimeDefinition, project: proj });
  } catch (error) {
    console.error('Studio Published Experience Error:', error);
    res.status(500).json({ error: 'Failed to load published experience' });
  }
});

// ---------------------------------------------------------
// 19. POST /api/studio/analytics/track (Track runtime analytics event)
// ---------------------------------------------------------
studioRouter.post('/analytics/track', async (req, res) => {
  try {
    const { organization_id, id: userId } = req.user;
    const { project_id, event_type, target_id, target_name, metadata } = req.body;

    const auditLog = await analyticsService.trackEvent({
      project_id,
      organization_id,
      user_id: userId,
      event_type,
      target_id,
      target_name,
      metadata
    });

    res.json({ success: true, event_logged: !!auditLog });
  } catch (error) {
    console.error('Studio Track Analytics Error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// ---------------------------------------------------------
// 20. GET /api/studio/data-sources (List data sources & datasets)
// ---------------------------------------------------------
studioRouter.get('/data-sources', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const dataSources = await dataSourceService.getAvailableDataSources(organization_id);
    res.json(dataSources);
  } catch (error) {
    console.error('Studio GET Data Sources Error:', error);
    res.status(500).json({ error: 'Failed to fetch data sources' });
  }
});

// ---------------------------------------------------------
// 21. GET /api/studio/datasets/:datasetId/schema (Fetch field metadata schema)
// ---------------------------------------------------------
studioRouter.get('/datasets/:datasetId/schema', async (req, res) => {
  try {
    const { datasetId } = req.params;
    const { organization_id } = req.user;
    const schema = await schemaService.getDatasetSchema(datasetId, organization_id);
    res.json(schema);
  } catch (error) {
    console.error('Studio GET Dataset Schema Error:', error);
    res.status(500).json({ error: 'Failed to fetch dataset schema' });
  }
});

// ---------------------------------------------------------
// 22. POST /api/studio/query (Execute structured dataset query)
// ---------------------------------------------------------
studioRouter.post('/query', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const result = await queryService.executeQuery(req.body, organization_id);
    res.json(result);
  } catch (error) {
    console.error('Studio Execute Query Error:', error);
    res.status(500).json({ error: 'Failed to execute dataset query' });
  }
});

// ---------------------------------------------------------
// 23. POST /api/studio/records (Create new dataset record)
// ---------------------------------------------------------
studioRouter.post('/records', async (req, res) => {
  try {
    const { organization_id, id: userId } = req.user;
    const { dataset_key, payload } = req.body;
    if (!dataset_key || !payload) return res.status(400).json({ error: 'dataset_key and payload are required' });

    const newRecord = await recordService.createRecord(dataset_key, payload, organization_id, userId);
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Studio Create Record Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create dataset record' });
  }
});

// ---------------------------------------------------------
// 24. PUT /api/studio/records/:datasetId/:id (Update dataset record)
// ---------------------------------------------------------
studioRouter.put('/records/:datasetId/:id', async (req, res) => {
  try {
    const { datasetId, id } = req.params;
    const { organization_id, id: userId } = req.user;

    const updated = await recordService.updateRecord(datasetId, id, req.body, organization_id, userId);
    res.json(updated);
  } catch (error) {
    console.error('Studio Update Record Error:', error);
    res.status(500).json({ error: error.message || 'Failed to update dataset record' });
  }
});

// ---------------------------------------------------------
// 25. DELETE /api/studio/records/:datasetId/:id (Delete/archive record)
// ---------------------------------------------------------
studioRouter.delete('/records/:datasetId/:id', async (req, res) => {
  try {
    const { datasetId, id } = req.params;
    const { organization_id, id: userId } = req.user;

    const result = await recordService.deleteRecord(datasetId, id, organization_id, userId);
    res.json(result);
  } catch (error) {
    console.error('Studio Delete Record Error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete dataset record' });
  }
});

// ---------------------------------------------------------
// 26. POST /api/studio/forms/generate (Auto-generate form layout config)
// ---------------------------------------------------------
studioRouter.post('/forms/generate', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { dataset_key, title, description, layout } = req.body;
    if (!dataset_key) return res.status(400).json({ error: 'dataset_key is required' });

    const formConfig = await formService.generateFormConfig(dataset_key, organization_id, { title, description, layout });
    res.json(formConfig);
  } catch (error) {
    console.error('Studio Generate Form Error:', error);
    res.status(500).json({ error: 'Failed to generate form configuration' });
  }
});

// ---------------------------------------------------------
// OMNI STUDIO: CATALOG COMPOSER ENDPOINTS (PHASE 4)
// ---------------------------------------------------------

// GET /api/studio/catalogs (List catalogs with product counts)
studioRouter.get('/catalogs', authorize('catalog:read'), async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { status, search } = req.query;
    const catalogs = await catalogService.listCatalogs(organization_id, { status, search });
    res.json(catalogs);
  } catch (error) {
    console.error('Studio GET Catalogs Error:', error);
    res.status(500).json({ error: 'Failed to list catalogs' });
  }
});

// POST /api/studio/catalogs (Create new catalog)
studioRouter.post('/catalogs', authorize('catalog:create'), enforceQuota('catalogs'), async (req, res) => {
  try {
    const { organization_id, id: userId } = req.user;
    const created = await catalogService.createCatalog(organization_id, userId, req.body);
    res.status(201).json(created);
  } catch (error) {
    console.error('Studio Create Catalog Error:', error);
    res.status(400).json({ error: error.message || 'Failed to create catalog' });
  }
});

// GET /api/studio/catalogs/:id (Fetch single catalog detail with pinned products)
studioRouter.get('/catalogs/:id', authorize('catalog:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const catalog = await catalogService.getCatalog(id, organization_id);
    if (!catalog) return res.status(404).json({ error: 'Catalog not found' });
    res.json(catalog);
  } catch (error) {
    console.error('Studio GET Catalog Detail Error:', error);
    res.status(500).json({ error: 'Failed to fetch catalog detail' });
  }
});

// PATCH /api/studio/catalogs/:id (Update catalog metadata, layout, branding)
studioRouter.patch('/catalogs/:id', authorize('catalog:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const updated = await catalogService.updateCatalog(id, organization_id, req.body);
    if (!updated) return res.status(404).json({ error: 'Catalog not found or no changes made' });
    res.json(updated);
  } catch (error) {
    console.error('Studio Update Catalog Error:', error);
    res.status(500).json({ error: 'Failed to update catalog' });
  }
});

// POST /api/studio/catalogs/:id/duplicate (Clone catalog)
studioRouter.post('/catalogs/:id/duplicate', authorize('catalog:create'), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId } = req.user;
    const cloned = await catalogService.duplicateCatalog(id, organization_id, userId);
    res.status(201).json(cloned);
  } catch (error) {
    console.error('Studio Duplicate Catalog Error:', error);
    res.status(500).json({ error: error.message || 'Failed to duplicate catalog' });
  }
});

// DELETE /api/studio/catalogs/:id (Archive catalog)
studioRouter.delete('/catalogs/:id', authorize('catalog:delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    await catalogService.updateCatalog(id, organization_id, { status: 'Archived' });
    res.json({ message: 'Catalog archived successfully' });
  } catch (error) {
    console.error('Studio Delete Catalog Error:', error);
    res.status(500).json({ error: 'Failed to archive catalog' });
  }
});

// POST /api/studio/catalogs/:id/products (Pin product with version)
studioRouter.post('/catalogs/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { productId, pinnedVersionNumber, pinnedAssetId, customSpecOverrides, sortOrder } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const result = await catalogService.pinProduct(id, organization_id, {
      productId,
      pinnedVersionNumber,
      pinnedAssetId,
      customSpecOverrides,
      sortOrder
    });
    res.json(result);
  } catch (error) {
    console.error('Studio Pin Product Error:', error);
    res.status(400).json({ error: error.message || 'Failed to pin product' });
  }
});

// DELETE /api/studio/catalogs/:id/products/:productId (Unpin product)
studioRouter.delete('/catalogs/:id/products/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params;
    const { organization_id } = req.user;
    const result = await catalogService.unpinProduct(id, productId, organization_id);
    res.json(result);
  } catch (error) {
    console.error('Studio Unpin Product Error:', error);
    res.status(500).json({ error: 'Failed to unpin product' });
  }
});

// GET /api/studio/catalogs/:id/sync-status (Detect if Vault has updated asset versions)
studioRouter.get('/catalogs/:id/sync-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const syncStatus = await catalogService.getSyncStatus(id, organization_id);
    res.json(syncStatus);
  } catch (error) {
    console.error('Studio Get Sync Status Error:', error);
    res.status(500).json({ error: error.message || 'Failed to get sync status' });
  }
});

// POST /api/studio/catalogs/:id/sync-assets (Explicitly sync catalog pins to latest Vault versions)
studioRouter.post('/catalogs/:id/sync-assets', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { productIds } = req.body || {};
    const result = await catalogService.syncAssets(id, organization_id, productIds);
    res.json(result);
  } catch (error) {
    console.error('Studio Sync Assets Error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync assets' });
  }
});

// GET /api/studio/catalogs/:id/preview (Responsive live preview payload)
studioRouter.get('/catalogs/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const catalog = await catalogService.getCatalog(id, organization_id);
    if (!catalog) return res.status(404).json({ error: 'Catalog not found' });

    res.json({
      catalogId: catalog.id,
      title: catalog.name,
      slug: catalog.slug,
      description: catalog.description,
      branding: catalog.branding,
      sections: catalog.layout_config?.sections || [],
      products: catalog.products,
      previewTimestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Studio Get Preview Error:', error);
    res.status(500).json({ error: 'Failed to load catalog preview' });
  }
});

// POST /api/studio/catalogs/:id/publish (Universal Publishing Ceremony)
studioRouter.post('/api/studio/catalogs/:id/publish', authorize('catalog:publish'), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId } = req.user;
    const published = await catalogService.publishCatalog(id, organization_id, userId);
    res.json(published);
  } catch (error) {
    console.error('Studio Publish Catalog Error:', error);
    res.status(400).json({ error: error.message || 'Failed to publish catalog' });
  }
});
// Also support route without prefix inside studioRouter
studioRouter.post('/catalogs/:id/publish', authorize('catalog:publish'), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId } = req.user;
    const published = await catalogService.publishCatalog(id, organization_id, userId);
    res.json(published);
  } catch (error) {
    console.error('Studio Publish Catalog Error:', error);
    res.status(400).json({ error: error.message || 'Failed to publish catalog' });
  }
});

// GET /api/studio/catalogs/:id/qr (Generate vector/image QR Code)
studioRouter.get('/catalogs/:id/qr', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { format = 'svg' } = req.query;
    const qrResult = await catalogService.generateQr(id, organization_id, { format });

    res.setHeader('Content-Type', qrResult.contentType);
    res.send(qrResult.content);
  } catch (error) {
    console.error('Studio Generate QR Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate QR code' });
  }
});

// GET /api/studio/catalogs/:id/export/pdf (Branded specification export sheet - Decision D-07)
studioRouter.get('/catalogs/:id/export/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const specSheet = await catalogService.generatePdfSpecSheet(id, organization_id);

    res.setHeader('Content-Type', specSheet.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${specSheet.filename}"`);
    res.send(specSheet.html);
  } catch (error) {
    console.error('Studio Export PDF Error:', error);
    res.status(500).json({ error: error.message || 'Failed to export specification document' });
  }
});




