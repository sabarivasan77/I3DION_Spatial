import { pool } from '../../db/pool.js';

export const defaultProjectDocument = {
  metadata: {
    schemaVersion: '2.0',
    title: 'Untitled OmniStudio App',
    description: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  screens: [
    {
      id: 'screen-main',
      name: 'Main Screen',
      background_color: '#FFFFFF',
      padding: 24,
      is_initial: true,
      variables: [],
      events: {}
    }
  ],
  components: [],
  component_tree: [],
  variables: [],
  collections: [],
  formulas: [],
  data_sources: [
    {
      id: 'ds-vault-products',
      name: 'Spatial Vault Products',
      type: 'vault_products',
      endpoint: '/api/vault/products'
    },
    {
      id: 'ds-vault-assets',
      name: 'Spatial Vault Assets',
      type: 'vault_assets',
      endpoint: '/api/vault/assets'
    }
  ],
  bindings: [],
  events: [],
  actions: [],
  workflows: [],
  navigation: {
    initial_screen_id: 'screen-main',
    transitions: []
  },
  permissions: {
    visibility: 'Organization',
    allowed_roles: ['Admin', 'Editor', 'Viewer']
  },
  assets: [],
  reusable_components: [],
  theme: {
    primary_color: '#4F46E5',
    accent_color: '#6366F1',
    font_family: 'Inter',
    background: '#F8FAFC',
    border_radius: '12px'
  },
  settings: {
    enable_ar: true,
    enable_3d: true,
    auto_save_interval_sec: 10,
    responsive_breakpoints: {
      desktop: 1280,
      tablet: 768,
      mobile: 375
    }
  },
  runtime_config: {
    environment: 'production',
    debug_mode: false
  },
  version_metadata: {
    current_draft_version: 1,
    published_version: null
  }
};

export const projectService = {
  validateDocument: (doc) => {
    if (!doc || typeof doc !== 'object') return defaultProjectDocument;
    return {
      metadata: { ...defaultProjectDocument.metadata, ...(doc.metadata || {}) },
      screens: Array.isArray(doc.screens) && doc.screens.length > 0 ? doc.screens : defaultProjectDocument.screens,
      components: Array.isArray(doc.components) ? doc.components : [],
      component_tree: Array.isArray(doc.component_tree) ? doc.component_tree : [],
      variables: Array.isArray(doc.variables) ? doc.variables : [],
      collections: Array.isArray(doc.collections) ? doc.collections : [],
      formulas: Array.isArray(doc.formulas) ? doc.formulas : [],
      data_sources: Array.isArray(doc.data_sources) ? doc.data_sources : defaultProjectDocument.data_sources,
      bindings: Array.isArray(doc.bindings) ? doc.bindings : [],
      events: Array.isArray(doc.events) ? doc.events : [],
      actions: Array.isArray(doc.actions) ? doc.actions : [],
      workflows: Array.isArray(doc.workflows) ? doc.workflows : [],
      navigation: doc.navigation || defaultProjectDocument.navigation,
      permissions: doc.permissions || defaultProjectDocument.permissions,
      assets: Array.isArray(doc.assets) ? doc.assets : [],
      reusable_components: Array.isArray(doc.reusable_components) ? doc.reusable_components : [],
      theme: { ...defaultProjectDocument.theme, ...(doc.theme || {}) },
      settings: { ...defaultProjectDocument.settings, ...(doc.settings || {}) },
      runtime_config: doc.runtime_config || defaultProjectDocument.runtime_config,
      version_metadata: doc.version_metadata || defaultProjectDocument.version_metadata
    };
  },

  getProject: async (projectId, organizationId) => {
    const result = await pool.query(
      `SELECT p.*, u.name as owner_name, u.email as owner_email
       FROM studio_projects p
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1 AND p.organization_id = $2`,
      [projectId, organizationId]
    );

    if (result.rows.length === 0) return null;
    const proj = result.rows[0];
    proj.project_document = projectService.validateDocument(proj.project_document);
    return proj;
  },

  updateProjectDocument: async (projectId, organizationId, updates) => {
    const { name, description, status, project_type, visibility, project_document, thumbnail } = updates;

    const currentRes = await pool.query(
      `SELECT project_document FROM studio_projects WHERE id = $1 AND organization_id = $2`,
      [projectId, organizationId]
    );

    if (currentRes.rows.length === 0) throw new Error('Project not found');

    let newDoc = currentRes.rows[0].project_document;
    if (project_document) {
      newDoc = projectService.validateDocument(project_document);
    }

    const fieldUpdates = [];
    const params = [projectId, organizationId];

    if (name !== undefined) { params.push(name); fieldUpdates.push(`name = $${params.length}`); }
    if (description !== undefined) { params.push(description); fieldUpdates.push(`description = $${params.length}`); }
    if (status !== undefined) { params.push(status); fieldUpdates.push(`status = $${params.length}`); }
    if (project_type !== undefined) { params.push(project_type); fieldUpdates.push(`project_type = $${params.length}`); }
    if (visibility !== undefined) { params.push(visibility); fieldUpdates.push(`visibility = $${params.length}`); }
    if (thumbnail !== undefined) { params.push(thumbnail); fieldUpdates.push(`thumbnail = $${params.length}`); }
    
    params.push(JSON.stringify(newDoc));
    fieldUpdates.push(`project_document = $${params.length}`);
    fieldUpdates.push(`version = version + 1`);
    fieldUpdates.push(`updated_at = NOW()`);

    const result = await pool.query(
      `UPDATE studio_projects SET ${fieldUpdates.join(', ')} WHERE id = $1 AND organization_id = $2 RETURNING *`,
      params
    );

    return result.rows[0];
  }
};
