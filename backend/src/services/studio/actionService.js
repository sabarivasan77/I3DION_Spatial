import { pool } from '../../db/pool.js';

export const actionService = {
  executeAction: async (actionPayload, organizationId, userId) => {
    if (!actionPayload || !actionPayload.type) {
      throw new Error('Action payload must specify a valid action type');
    }

    const { type, payload } = actionPayload;

    switch (type) {
      case 'submit_enquiry': {
        const { product_id, full_name, email, phone, message, company_name } = payload || {};
        const res = await pool.query(
          `INSERT INTO vault_enquiries (
            organization_id, product_id, full_name, email, phone, message, company_name, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'NEW') RETURNING *`,
          [organizationId, product_id || null, full_name || 'Anonymous User', email || 'unspecified@client.com', phone || '', message || 'Low-Code App Enquiry Submission', company_name || '']
        );
        return { success: true, enquiry: res.rows[0], message: 'Enquiry submitted successfully' };
      }

      case 'create_record': {
        const { collection_id, name, type: assetType, metadata } = payload || {};
        const res = await pool.query(
          `INSERT INTO vault_assets (
            organization_id, collection_id, name, original_filename, mime_type, file_size, storage_path, asset_type, metadata
          ) VALUES ($1, $2, $3, $4, 'application/json', 0, '', $5, $6) RETURNING *`,
          [organizationId, collection_id || null, name || 'New Low-Code Record', name || 'record.json', assetType || 'Document', JSON.stringify(metadata || {})]
        );
        return { success: true, record: res.rows[0] };
      }

      case 'update_record': {
        const { record_id, metadata, name } = payload || {};
        const res = await pool.query(
          `UPDATE vault_assets SET name = COALESCE($1, name), metadata = metadata || $2::jsonb, updated_at = NOW()
           WHERE id = $3 AND organization_id = $4 RETURNING *`,
          [name || null, JSON.stringify(metadata || {}), record_id, organizationId]
        );
        if (res.rows.length === 0) throw new Error('Record not found or access denied');
        return { success: true, record: res.rows[0] };
      }

      case 'delete_record': {
        const { record_id } = payload || {};
        await pool.query(
          `DELETE FROM vault_assets WHERE id = $1 AND organization_id = $2`,
          [record_id, organizationId]
        );
        return { success: true, message: 'Record deleted' };
      }

      default:
        return { success: true, action: type, payload };
    }
  }
};
