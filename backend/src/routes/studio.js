import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth as authenticateToken } from '../middleware/auth.js';
import { projectService, defaultProjectDocument } from '../services/studio/projectService.js';
import { formulaService } from '../services/studio/formulaService.js';
import { bindingService } from '../services/studio/bindingService.js';
import { actionService } from '../services/studio/actionService.js';
import { versionService } from '../services/studio/versionService.js';
import { compilerService } from '../services/studio/compilerService.js';
import { analyticsService } from '../services/studio/analyticsService.js';

export const studioRouter = Router();

studioRouter.use(authenticateToken);

// ---------------------------------------------------------
// 1. GET /api/studio/projects (List projects for organization)
// ---------------------------------------------------------
studioRouter.get('/projects', async (req, res) => {
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
studioRouter.post('/projects', async (req, res) => {
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
studioRouter.get('/projects/:id', async (req, res) => {
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
studioRouter.patch('/projects/:id', async (req, res) => {
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
studioRouter.delete('/projects/:id', async (req, res) => {
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
studioRouter.post('/projects/:id/publish', async (req, res) => {
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


