import { pool } from '../../db/pool.js';

export const schemaService = {
  /**
   * Get dynamic schema definition (field metadata) for a Vault dataset
   */
  getDatasetSchema: async (datasetKey, organizationId) => {
    if (datasetKey === 'vault_products') {
      return {
        dataset_key: 'vault_products',
        name: 'Products & Equipment',
        table_name: 'products',
        fields: [
          { field_name: 'id', display_name: 'Product ID', field_type: 'Text', is_required: true, is_readonly: true },
          { field_name: 'name', display_name: 'Product Name', field_type: 'Text', is_required: true, is_readonly: false, placeholder: 'e.g. Heavy Duty Planetary Gearbox' },
          { field_name: 'category', display_name: 'Category', field_type: 'Choice', is_required: true, is_readonly: false, options: ['Industrial Machinery', 'Power Tools', 'Mobile Equipment', 'Pneumatics'] },
          { field_name: 'description', display_name: 'Description', field_type: 'Long Text', is_required: false, is_readonly: false },
          { field_name: 'status', display_name: 'Status', field_type: 'Status', is_required: true, is_readonly: false, default_value: 'Draft', options: ['Draft', 'Published', 'Archived'] },
          { field_name: 'price', display_name: 'List Price', field_type: 'Currency', is_required: false, is_readonly: false, default_value: 0 },
          { field_name: 'specs', display_name: 'Technical Specifications', field_type: 'JSON', is_required: false, is_readonly: false },
          { field_name: 'image_url', display_name: 'Thumbnail Image URL', field_type: 'Image', is_required: false, is_readonly: false },
          { field_name: 'model_url', display_name: '3D GLTF/GLB Asset URL', field_type: 'File', is_required: false, is_readonly: false },
          { field_name: 'usdz_url', display_name: 'iOS USDZ AR Asset URL', field_type: 'File', is_required: false, is_readonly: false },
          { field_name: 'document_url', display_name: 'PDF Specification Document', field_type: 'File', is_required: false, is_readonly: false },
          { field_name: 'is_public', display_name: 'Publicly Visible', field_type: 'Boolean', is_required: false, is_readonly: false, default_value: false },
          { field_name: 'created_at', display_name: 'Created Date', field_type: 'DateTime', is_required: false, is_readonly: true },
          { field_name: 'updated_at', display_name: 'Last Updated', field_type: 'DateTime', is_required: false, is_readonly: true }
        ]
      };
    }

    if (datasetKey === 'vault_assets' || datasetKey === 'vault_documents') {
      return {
        dataset_key: datasetKey,
        name: datasetKey === 'vault_documents' ? 'Technical Documents' : 'Digital Assets & Media',
        table_name: 'vault_assets',
        fields: [
          { field_name: 'id', display_name: 'Asset ID', field_type: 'Text', is_required: true, is_readonly: true },
          { field_name: 'name', display_name: 'Asset Title', field_type: 'Text', is_required: true, is_readonly: false },
          { field_name: 'file_category', display_name: 'Category', field_type: 'Choice', is_required: true, is_readonly: false, options: ['model', 'usdz_model', 'image', 'document', 'thumbnail'] },
          { field_name: 'public_url', display_name: 'File URL', field_type: 'URL', is_required: true, is_readonly: false },
          { field_name: 'size_bytes', display_name: 'Size (Bytes)', field_type: 'Number', is_required: false, is_readonly: true },
          { field_name: 'mime_type', display_name: 'MIME Type', field_type: 'Text', is_required: false, is_readonly: true },
          { field_name: 'status', display_name: 'Status', field_type: 'Status', is_required: true, is_readonly: false, default_value: 'Ready', options: ['Ready', 'Processing', 'Archived'] },
          { field_name: 'created_at', display_name: 'Created Date', field_type: 'DateTime', is_required: false, is_readonly: true }
        ]
      };
    }

    if (datasetKey === 'vault_enquiries') {
      return {
        dataset_key: 'vault_enquiries',
        name: 'Leads & Product Enquiries',
        table_name: 'vault_enquiries',
        fields: [
          { field_name: 'id', display_name: 'Enquiry ID', field_type: 'Text', is_required: true, is_readonly: true },
          { field_name: 'full_name', display_name: 'Full Name', field_type: 'Text', is_required: true, is_readonly: false, placeholder: 'Client Lead Name' },
          { field_name: 'email', display_name: 'Work Email', field_type: 'Email', is_required: true, is_readonly: false, placeholder: 'lead@company.com' },
          { field_name: 'phone', display_name: 'Phone Number', field_type: 'Text', is_required: false, is_readonly: false },
          { field_name: 'company_name', display_name: 'Company Name', field_type: 'Text', is_required: false, is_readonly: false },
          { field_name: 'product_id', display_name: 'Interested Product ID', field_type: 'Reference', is_required: false, is_readonly: false },
          { field_name: 'message', display_name: 'Inquiry / Requirements', field_type: 'Long Text', is_required: false, is_readonly: false },
          { field_name: 'status', display_name: 'Lead Status', field_type: 'Status', is_required: true, is_readonly: false, default_value: 'NEW', options: ['NEW', 'IN_PROGRESS', 'CONTACTED', 'QUALIFIED'] },
          { field_name: 'created_at', display_name: 'Submission Time', field_type: 'DateTime', is_required: false, is_readonly: true }
        ]
      };
    }

    // Handle custom Vault schema discovery
    if (datasetKey.startsWith('vault_schema_')) {
      const internalName = datasetKey.replace('vault_schema_', '');
      try {
        const schemaRes = await pool.query(
          `SELECT * FROM vault_schemas WHERE (internal_name = $1 OR id = $1) AND (organization_id = $2 OR is_system = true)`,
          [internalName, organizationId]
        );

        if (schemaRes.rows.length > 0) {
          const schema = schemaRes.rows[0];
          const rawFields = Array.isArray(schema.fields) ? schema.fields : (typeof schema.fields === 'string' ? JSON.parse(schema.fields) : []);
          
          return {
            dataset_key: datasetKey,
            name: schema.name,
            table_name: 'vault_assets',
            schema_id: schema.id,
            fields: rawFields.map((f) => ({
              field_name: f.name || f.field_name,
              display_name: f.label || f.display_name || f.name,
              field_type: f.type || f.field_type || 'Text',
              is_required: !!f.required,
              is_readonly: false,
              options: f.options || []
            }))
          };
        }
      } catch (err) {
        console.error('Schema Discovery Error:', err);
      }
    }

    // Default fallback schema
    return {
      dataset_key: datasetKey,
      name: 'Generic Vault Dataset',
      table_name: 'vault_assets',
      fields: [
        { field_name: 'id', display_name: 'ID', field_type: 'Text', is_required: true, is_readonly: true },
        { field_name: 'name', display_name: 'Title / Name', field_type: 'Text', is_required: true, is_readonly: false },
        { field_name: 'status', display_name: 'Status', field_type: 'Status', is_required: false, is_readonly: false }
      ]
    };
  }
};
