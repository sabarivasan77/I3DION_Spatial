import { pool } from '../../db/pool.js';

export const bindingService = {
  resolveBinding: async (bindingConfig, organizationId) => {
    if (!bindingConfig || !bindingConfig.source) return null;

    const { source, dataset_id, field_key, record_id } = bindingConfig;

    try {
      if (source === 'vault_products') {
        let query = `SELECT * FROM products WHERE organization_id = $1`;
        const params = [organizationId];
        if (record_id) {
          query += ` AND id = $2`;
          params.push(record_id);
        }
        query += ` ORDER BY created_at DESC LIMIT 50`;
        const res = await pool.query(query, params);
        
        if (record_id && res.rows.length > 0) {
          return field_key ? res.rows[0][field_key] : res.rows[0];
        }
        return res.rows;
      }

      if (source === 'vault_assets') {
        let query = `SELECT * FROM vault_assets WHERE organization_id = $1`;
        const params = [organizationId];
        if (record_id) {
          query += ` AND id = $2`;
          params.push(record_id);
        }
        query += ` ORDER BY created_at DESC LIMIT 50`;
        const res = await pool.query(query, params);
        
        if (record_id && res.rows.length > 0) {
          return field_key ? res.rows[0][field_key] : res.rows[0];
        }
        return res.rows;
      }

      if (source === 'vault_records' && dataset_id) {
        const schemaRes = await pool.query(
          `SELECT * FROM vault_schemas WHERE (id = $1 OR internal_name = $1) AND organization_id = $2`,
          [dataset_id, organizationId]
        );
        if (schemaRes.rows.length === 0) return [];
        const schema = schemaRes.rows[0];

        const recordsRes = await pool.query(
          `SELECT * FROM vault_assets WHERE collection_id = $1 AND organization_id = $2 LIMIT 50`,
          [schema.id, organizationId]
        );
        return recordsRes.rows;
      }

      return null;
    } catch (err) {
      console.error('Binding Resolution Error:', err);
      return null;
    }
  }
};
