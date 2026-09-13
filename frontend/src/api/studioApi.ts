import { apiRequest } from '../services/api';
import { vaultApi, VaultAsset } from './vaultApi';

export interface StudioSection {
  id: string;
  type: 'cover' | 'intro' | 'product_grid' | 'product_detail' | 'tech_specs' | 'interactive_3d' | 'contact_cta';
  title: string;
  subtitle?: string;
  layout_style?: 'grid' | 'spotlight' | 'comparison' | 'carousel';
  background_color?: string;
  items?: any[];
  hidden?: boolean;
}

export interface StudioCatalogData {
  title: string;
  subtitle?: string;
  theme: 'violet-industrial' | 'dark-spatial' | 'clean-minimal';
  typography?: string;
  background_color?: string;
  global_cta?: { text: string; url: string };
  sections: StudioSection[];
}

export interface StudioProject {
  id: string;
  name: string;
  description: string;
  owner: string;
  organization_id?: string;
  status: 'Draft' | 'In Review' | 'Ready to Publish' | 'Published' | 'Archived';
  created_at: string;
  updated_at: string;
  version: number;
  last_published_version?: number;
  visibility: 'Public' | 'Organization' | 'Restricted';
  product_ids: string[];
  vault_asset_ids?: string[];
  catalog_data: StudioCatalogData;
}

export interface StudioTemplate {
  id: string;
  name: string;
  description: string;
  theme: 'violet-industrial' | 'dark-spatial' | 'clean-minimal';
  sections: StudioSection[];
  created_at: string;
  updated_at: string;
}

export interface StudioVersion {
  id: string;
  project_id: string;
  project_name: string;
  version_number: number;
  author: string;
  change_summary: string;
  published_at: string;
  catalog_data: StudioCatalogData;
}

// Initial Default Seed Data for Offline / Vercel SPA mode
const DEFAULT_STUDIO_PROJECTS: StudioProject[] = [
  {
    id: 'proj-cat-01',
    name: 'Industrial Heavy Machinery Showcase 2026',
    description: 'Master enterprise product catalog featuring rotary screw compressors, planetary gearboxes, and power tools.',
    owner: 'I3DION Admin',
    status: 'Published',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    version: 3,
    last_published_version: 3,
    visibility: 'Organization',
    product_ids: ['asset-3d-01', 'asset-3d-02', 'asset-3d-03'],
    vault_asset_ids: ['asset-3d-01', 'asset-3d-02', 'asset-3d-03', 'asset-doc-01'],
    catalog_data: {
      title: 'Industrial Heavy Machinery Showcase 2026',
      subtitle: 'Next-Generation Spatial Equipment & Mechanical Assemblies',
      theme: 'violet-industrial',
      typography: 'Inter Professional',
      global_cta: { text: 'Request Enterprise Quote', url: '/support' },
      sections: [
        {
          id: 'sec-01',
          type: 'cover',
          title: 'Industrial Heavy Machinery Showcase',
          subtitle: 'High-Torque Drive Systems, Power Actuators & Compressed Air Equipment',
          background_color: '#0F172A'
        },
        {
          id: 'sec-02',
          type: 'intro',
          title: 'Engineering Excellence & Spatial Precision',
          subtitle: 'Explore 3D GLTF CAD models, technical specifications, and interactive AR visual representations.'
        },
        {
          id: 'sec-03',
          type: 'product_grid',
          title: 'Flagship Equipment Catalog',
          layout_style: 'grid',
          items: [
            {
              id: 'asset-3d-01',
              name: 'Heavy Duty Planetary Speed Reducer',
              category: 'Industrial Machinery',
              description: 'High-torque planetary speed reducer with sun gear, planetary carrier, and enclosed housing.',
              type: '3D Model',
              public_url: '/models/model_1.gltf',
              size_bytes: 44564480,
              status: 'Ready',
              specs: { 'Power Rating': '45 kW', 'Torque': '1,200 Nm', 'Ratio': '15:1' }
            },
            {
              id: 'asset-3d-02',
              name: 'Reciprocating Saw Power Actuator',
              category: 'Power Tools & Actuators',
              description: 'Industrial motor-driven reciprocating saw assembly displaying internal drive linkage.',
              type: '3D Model',
              public_url: '/models/model_2.gltf',
              size_bytes: 19084000,
              status: 'Ready',
              specs: { 'Stroke Length': '28 mm', 'Strokes/min': '3,000 SPM', 'Motor': '1.5 HP' }
            },
            {
              id: 'asset-3d-03',
              name: 'Off-Road Industrial Transport Chassis',
              category: 'Mobile Equipment',
              description: 'Heavy-duty tubular chassis vehicle featuring independent suspension and roll-cage frame.',
              type: '3D Model',
              public_url: '/models/model_3.gltf',
              size_bytes: 67200000,
              status: 'Ready',
              specs: { 'Payload Capacity': '1.2 Tons', 'Suspension': 'Double Wishbone', 'Engine': 'Electric Drive' }
            }
          ]
        },
        {
          id: 'sec-04',
          type: 'interactive_3d',
          title: 'Interactive 3D Assembly Inspection',
          subtitle: 'Rotate, zoom, and inspect internal component hierarchy in real-time.'
        },
        {
          id: 'sec-05',
          type: 'contact_cta',
          title: 'Connect With Industrial Solutions Engineering',
          subtitle: 'Schedule a custom spatial AR demonstration or request technical CAD data packs.'
        }
      ]
    }
  },
  {
    id: 'proj-cat-02',
    name: 'Pneumatic Control Valves & Actuators Digital Catalog',
    description: 'High-pressure solenoid valves, butterfly valves, and electrical linear actuators presentation.',
    owner: 'I3DION Admin',
    status: 'Draft',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    version: 1,
    visibility: 'Organization',
    product_ids: ['asset-doc-01', 'asset-img-01'],
    catalog_data: {
      title: 'Pneumatic Control Valves & Actuators Digital Catalog',
      subtitle: 'Precision Flow Control Systems',
      theme: 'clean-minimal',
      sections: [
        {
          id: 'sec-v01',
          type: 'cover',
          title: 'Pneumatic Control Valves & Actuators',
          subtitle: 'High-Pressure Systems for Automated Process Control'
        },
        {
          id: 'sec-v02',
          type: 'product_grid',
          title: 'Control Valve Series',
          layout_style: 'spotlight',
          items: [
            {
              id: 'asset-doc-01',
              name: 'Industrial Valve System 3000 Blueprint',
              category: 'Engineering Specifications',
              description: 'Complete mechanical CAD engineering drawings and hydraulic pressure tolerance documentation.',
              type: 'Document',
              public_url: '/docs/sample_spec.pdf',
              size_bytes: 4718592,
              status: 'Ready'
            }
          ]
        }
      ]
    }
  }
];

const DEFAULT_STUDIO_TEMPLATES: StudioTemplate[] = [
  {
    id: 'tmpl-01',
    name: 'Industrial Equipment Presentation Showcase',
    description: 'Professional layout tailored for heavy machinery, power tools, and high-detail CAD 3D models.',
    theme: 'violet-industrial',
    sections: [
      { id: 't1-s1', type: 'cover', title: 'Catalog Title', subtitle: 'Subtitle and tagline' },
      { id: 't1-s2', type: 'intro', title: 'Executive Overview', subtitle: 'Brief introduction to product collection' },
      { id: 't1-s3', type: 'product_grid', title: 'Featured Products', layout_style: 'grid' },
      { id: 't1-s4', type: 'interactive_3d', title: 'Interactive 3D Viewport', subtitle: '3D Model inspection' },
      { id: 't1-s5', type: 'contact_cta', title: 'Contact Sales', subtitle: 'Inquire for enterprise pricing' }
    ],
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'tmpl-02',
    name: 'Clean Minimal Product Lookbook',
    description: 'Sleek, minimal visual catalog structure focused on high-resolution renders and key specs.',
    theme: 'clean-minimal',
    sections: [
      { id: 't2-s1', type: 'cover', title: 'Product Lookbook', subtitle: 'Minimalist product collection' },
      { id: 't2-s2', type: 'product_grid', title: 'Product Lineup', layout_style: 'spotlight' },
      { id: 't2-s3', type: 'contact_cta', title: 'Get In Touch', subtitle: 'Request catalog PDF' }
    ],
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

export const studioApi = {
  // --- Projects CRUD ---
  getProjects: async (): Promise<StudioProject[]> => {
    try {
      const res = await apiRequest<StudioProject[]>('/api/studio/projects', { method: 'GET' });
      if (Array.isArray(res)) return res;
    } catch (err) {}
    const stored = localStorage.getItem('i3dion.studio_projects');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (err) {}
    }
    localStorage.setItem('i3dion.studio_projects', JSON.stringify(DEFAULT_STUDIO_PROJECTS));
    return DEFAULT_STUDIO_PROJECTS;
  },

  getProject: async (id: string): Promise<StudioProject | null> => {
    try {
      const res = await apiRequest<StudioProject>(`/api/studio/projects/${id}`, { method: 'GET' });
      if (res && res.id) return res;
    } catch (err) {}
    const projects = await studioApi.getProjects();
    return projects.find((p) => p.id === id) || projects[0] || null;
  },

  createProject: async (data: { name: string; description?: string; templateId?: string }): Promise<StudioProject> => {
    const projects = await studioApi.getProjects();
    const id = `proj-${Date.now()}`;

    let templateSections: StudioSection[] = [
      { id: `sec-${Date.now()}-1`, type: 'cover', title: data.name, subtitle: data.description || 'Enterprise Catalog Presentation' },
      { id: `sec-${Date.now()}-2`, type: 'intro', title: 'Product Collection Overview', subtitle: 'Curated products and spatial 3D models.' },
      { id: `sec-${Date.now()}-3`, type: 'product_grid', title: 'Product Catalog', layout_style: 'grid', items: [] },
      { id: `sec-${Date.now()}-4`, type: 'contact_cta', title: 'Request Quote & CAD Data', subtitle: 'Connect with our team for enterprise support.' }
    ];

    if (data.templateId) {
      const templates = await studioApi.getTemplates();
      const matchedTmpl = templates.find((t) => t.id === data.templateId);
      if (matchedTmpl) {
        templateSections = JSON.parse(JSON.stringify(matchedTmpl.sections));
      }
    }

    const newProject: StudioProject = {
      id,
      name: data.name,
      description: data.description || '',
      owner: 'I3DION Admin',
      status: 'Draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      visibility: 'Organization',
      product_ids: [],
      vault_asset_ids: [],
      catalog_data: {
        title: data.name,
        subtitle: data.description || 'Enterprise Catalog Presentation',
        theme: 'violet-industrial',
        typography: 'Inter Professional',
        sections: templateSections
      }
    };

    const updated = [newProject, ...projects];
    localStorage.setItem('i3dion.studio_projects', JSON.stringify(updated));

    try {
      await apiRequest('/api/studio/projects', {
        method: 'POST',
        body: JSON.stringify(newProject)
      }).catch(() => null);
    } catch (err) {}

    return newProject;
  },

  updateProject: async (id: string, updates: Partial<StudioProject>): Promise<StudioProject> => {
    const projects = await studioApi.getProjects();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Project not found');

    const updatedProject: StudioProject = {
      ...projects[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };

    projects[idx] = updatedProject;
    localStorage.setItem('i3dion.studio_projects', JSON.stringify(projects));

    try {
      await apiRequest(`/api/studio/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }).catch(() => null);
    } catch (err) {}

    return updatedProject;
  },

  deleteProject: async (id: string): Promise<void> => {
    const projects = await studioApi.getProjects();
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem('i3dion.studio_projects', JSON.stringify(filtered));

    try {
      await apiRequest(`/api/studio/projects/${id}`, { method: 'DELETE' }).catch(() => null);
    } catch (err) {}
  },

  duplicateProject: async (id: string): Promise<StudioProject> => {
    const source = await studioApi.getProject(id);
    if (!source) throw new Error('Source project not found');

    const dupName = `${source.name} (Copy)`;
    const newProj = await studioApi.createProject({ name: dupName, description: source.description });
    
    return studioApi.updateProject(newProj.id, {
      catalog_data: JSON.parse(JSON.stringify(source.catalog_data)),
      product_ids: [...source.product_ids],
      vault_asset_ids: [...(source.vault_asset_ids || [])]
    });
  },

  // --- Templates CRUD ---
  getTemplates: async (): Promise<StudioTemplate[]> => {
    const stored = localStorage.getItem('i3dion.studio_templates');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (err) {}
    }
    localStorage.setItem('i3dion.studio_templates', JSON.stringify(DEFAULT_STUDIO_TEMPLATES));
    return DEFAULT_STUDIO_TEMPLATES;
  },

  createTemplate: async (data: { name: string; description?: string; theme?: 'violet-industrial' | 'dark-spatial' | 'clean-minimal'; sections: StudioSection[] }): Promise<StudioTemplate> => {
    const templates = await studioApi.getTemplates();
    const newTemplate: StudioTemplate = {
      id: `tmpl-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      theme: data.theme || 'violet-industrial',
      sections: data.sections,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const updated = [newTemplate, ...templates];
    localStorage.setItem('i3dion.studio_templates', JSON.stringify(updated));
    return newTemplate;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    const templates = await studioApi.getTemplates();
    const filtered = templates.filter((t) => t.id !== id);
    localStorage.setItem('i3dion.studio_templates', JSON.stringify(filtered));
  },

  // --- Publishing & Versioning ---
  publishProject: async (id: string, options: { changeSummary?: string; visibility?: 'Public' | 'Organization' | 'Restricted' }): Promise<{ project: StudioProject; version: StudioVersion }> => {
    const project = await studioApi.getProject(id);
    if (!project) throw new Error('Project not found');

    const newVersionNumber = (project.last_published_version || 0) + 1;
    const version: StudioVersion = {
      id: `ver-${id}-${newVersionNumber}`,
      project_id: project.id,
      project_name: project.name,
      version_number: newVersionNumber,
      author: 'I3DION Admin',
      change_summary: options.changeSummary || `Published version ${newVersionNumber}`,
      published_at: new Date().toISOString(),
      catalog_data: JSON.parse(JSON.stringify(project.catalog_data))
    };

    // Save Version log
    const versions = studioApi.getVersions(project.id);
    versions.unshift(version);
    localStorage.setItem(`i3dion.studio_versions_${project.id}`, JSON.stringify(versions));

    // Update Project Status
    const updatedProject = await studioApi.updateProject(project.id, {
      status: 'Published',
      version: newVersionNumber,
      last_published_version: newVersionNumber,
      visibility: options.visibility || project.visibility
    });

    return { project: updatedProject, version };
  },

  getVersions: (projectId: string): StudioVersion[] => {
    const stored = localStorage.getItem(`i3dion.studio_versions_${projectId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (err) {}
    }
    return [
      {
        id: `ver-${projectId}-1`,
        project_id: projectId,
        project_name: 'Industrial Heavy Machinery Showcase 2026',
        version_number: 1,
        author: 'I3DION Admin',
        change_summary: 'Initial project release',
        published_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        catalog_data: { title: 'Initial Version', theme: 'violet-industrial', sections: [] }
      }
    ];
  },

  // --- Spatial Vault Assets Selector Helper ---
  fetchVaultAssets: async (): Promise<VaultAsset[]> => {
    return vaultApi.getAssets();
  }
};
