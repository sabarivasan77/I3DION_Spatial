import { pool } from '../../db/pool.js';

export const dataSourceService = {
  /**
   * List available data sources and datasets for an organization
   */
  getAvailableDataSources: async (organizationId) => {
    // Spatial Vault is the primary first-class connector
    const vaultDatasets = [
      {
        id: 'ds-vault-products',
        name: 'Products & Equipment',
        dataset_key: 'vault_products',
        source_type: 'spatial_vault',
        category: 'Catalog & Engineering',
        table_name: 'products',
        description: 'Industrial products, machinery CAD models, specs, and prices.',
        permissions: { read: true, create: true, update: true, delete: true }
      },
      {
        id: 'ds-vault-assets',
        name: 'Digital Assets & Media',
        dataset_key: 'vault_assets',
        source_type: 'spatial_vault',
        category: 'DAM & Storage',
        table_name: 'vault_assets',
        description: 'GLTF/GLB models, USDZ files, high-res renders, and documents.',
        permissions: { read: true, create: true, update: true, delete: true }
      },
      {
        id: 'ds-vault-documents',
        name: 'Technical Documents',
        dataset_key: 'vault_documents',
        source_type: 'spatial_vault',
        category: 'Documentation',
        table_name: 'vault_assets',
        description: 'PDF manuals, safety compliance docs, and engineering schematics.',
        permissions: { read: true, create: true, update: true, delete: false }
      },
      {
        id: 'ds-vault-enquiries',
        name: 'Leads & Product Enquiries',
        dataset_key: 'vault_enquiries',
        source_type: 'spatial_vault',
        category: 'CRM & Engagement',
        table_name: 'vault_enquiries',
        description: 'Customer inquiries, CAD data requests, and lead submissions.',
        permissions: { read: true, create: true, update: true, delete: true }
      }
    ];

    // Fetch custom user-defined schemas from vault_schemas
    try {
      const customSchemasRes = await pool.query(
        `SELECT id, name, internal_name, description, category, is_system
         FROM vault_schemas
         WHERE organization_id = $1 OR is_system = true
         ORDER BY created_at DESC`,
        [organizationId]
      );

      customSchemasRes.rows.forEach((schema) => {
        vaultDatasets.push({
          id: `ds-vault-schema-${schema.id}`,
          name: schema.name,
          dataset_key: `vault_schema_${schema.internal_name || schema.id}`,
          source_type: 'spatial_vault',
          category: schema.category || 'Custom Datasets',
          table_name: 'vault_assets',
          schema_id: schema.id,
          description: schema.description || 'Custom structured Vault dataset.',
          permissions: { read: true, create: true, update: true, delete: true }
        });
      });
    } catch (err) {
      // Fail gracefully if vault_schemas table is empty or missing optional columns
    }

    return {
      connector: {
        id: 'connector-spatial-vault',
        name: 'Spatial Vault Connector',
        status: 'Connected',
        type: 'spatial_vault',
        version: '2.0',
        last_sync: new Date().toISOString()
      },
      datasets: vaultDatasets
    };
  }
};
