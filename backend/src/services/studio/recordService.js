import { pool } from '../../db/pool.js';

export const recordService = {
  /**
   * Create a new record in a Vault dataset
   */
  createRecord: async (datasetKey, payload, organizationId, userId) => {
    if (datasetKey === 'vault_products') {
      const { name, category, description, status, price, specs, image_url, model_url, usdz_url, document_url, is_public } = payload;
      if (!name) throw new Error('Product name is required');

      const res = await pool.query(
        `INSERT INTO products (
          organization_id, name, category, description, status, specs, image_url, model_url, usdz_url, document_url, is_public, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
        [
          organizationId,
          name,
          category || 'Industrial Equipment',
          description || '',
          status || 'Draft',
          JSON.stringify(specs || {}),
          image_url || null,
          model_url || null,
          usdz_url || null,
          document_url || null,
          !!is_public
        ]
      );

      // Audit Log
      await recordService.logAudit({
        organizationId,
        userId,
        action: 'CREATE_PRODUCT',
        entityType: 'product',
        entityId: res.rows[0].id,
        details: { name, category }
      });

      return res.rows[0];
    }

    if (datasetKey === 'vault_enquiries') {
      const { full_name, email, phone, company_name, product_id, message } = payload;
      if (!full_name || !email) throw new Error('Name and email are required for enquiries');

      const res = await pool.query(
        `INSERT INTO vault_enquiries (
          organization_id, user_id, full_name, email, phone, company_name, product_id, message, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'NEW', NOW()) RETURNING *`,
        [
          organizationId,
          userId,
          full_name,
          email,
          phone || '',
          company_name || '',
          product_id || null,
          message || ''
        ]
      );

      await recordService.logAudit({
        organizationId,
        userId,
        action: 'CREATE_ENQUIRY',
        entityType: 'enquiry',
        entityId: res.rows[0].id,
        details: { full_name, email }
      });

      return res.rows[0];
    }

    if (datasetKey === 'vault_assets') {
      const { name, file_category, public_url, size_bytes, mime_type } = payload;
      const res = await pool.query(
        `INSERT INTO vault_assets (
          organization_id, owner_id, name, file_category, public_url, size_bytes, mime_type, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Ready', NOW()) RETURNING *`,
        [
          organizationId,
          userId,
          name || 'Uploaded Asset',
          file_category || 'model',
          public_url,
          size_bytes || 0,
          mime_type || 'application/octet-stream'
        ]
      );
      return res.rows[0];
    }

    throw new Error(`Unsupported dataset for record creation: ${datasetKey}`);
  },

  /**
   * Update an existing record in a Vault dataset
   */
  updateRecord: async (datasetKey, recordId, updates, organizationId, userId) => {
    if (datasetKey === 'vault_products') {
      const fields = [];
      const params = [recordId, organizationId];

      const allowedKeys = ['name', 'category', 'description', 'status', 'image_url', 'model_url', 'usdz_url', 'document_url', 'is_public'];
      allowedKeys.forEach((key) => {
        if (updates[key] !== undefined) {
          params.push(updates[key]);
          fields.push(`${key} = $${params.length}`);
        }
      });

      if (updates.specs !== undefined) {
        params.push(JSON.stringify(updates.specs));
        fields.push(`specs = $${params.length}`);
      }

      fields.push(`updated_at = NOW()`);

      const res = await pool.query(
        `UPDATE products SET ${fields.join(', ')} WHERE id = $1 AND organization_id = $2 RETURNING *`,
        params
      );

      if (res.rows.length === 0) throw new Error('Product record not found');

      await recordService.logAudit({
        organizationId,
        userId,
        action: 'UPDATE_PRODUCT',
        entityType: 'product',
        entityId: recordId,
        details: updates
      });

      return res.rows[0];
    }

    if (datasetKey === 'vault_enquiries') {
      const fields = [];
      const params = [recordId, organizationId];

      ['status', 'message', 'phone', 'company_name'].forEach((key) => {
        if (updates[key] !== undefined) {
          params.push(updates[key]);
          fields.push(`${key} = $${params.length}`);
        }
      });

      const res = await pool.query(
        `UPDATE vault_enquiries SET ${fields.join(', ')} WHERE id = $1 AND organization_id = $2 RETURNING *`,
        params
      );

      return res.rows[0];
    }

    throw new Error(`Unsupported dataset for record update: ${datasetKey}`);
  },

  /**
   * Delete a record from a Vault dataset
   */
  deleteRecord: async (datasetKey, recordId, organizationId, userId) => {
    if (datasetKey === 'vault_products') {
      await pool.query(
        `UPDATE products SET status = 'Archived', updated_at = NOW() WHERE id = $1 AND organization_id = $2`,
        [recordId, organizationId]
      );
      await recordService.logAudit({
        organizationId,
        userId,
        action: 'ARCHIVE_PRODUCT',
        entityType: 'product',
        entityId: recordId,
        details: {}
      });
      return { success: true, message: 'Product archived successfully' };
    }

    if (datasetKey === 'vault_assets') {
      await pool.query(
        `DELETE FROM vault_assets WHERE id = $1 AND organization_id = $2`,
        [recordId, organizationId]
      );
      return { success: true, message: 'Asset deleted successfully' };
    }

    throw new Error(`Unsupported dataset for record deletion: ${datasetKey}`);
  },

  /**
   * Audit Logger Helper
   */
  logAudit: async ({ organizationId, userId, action, entityType, entityId, details }) => {
    try {
      await pool.query(
        `INSERT INTO vault_audit_logs (
          organization_id, user_id, action, entity_type, entity_id, details, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [organizationId, userId, action, entityType, entityId, JSON.stringify(details || {})]
      );
    } catch (err) {
      // Fail silently if audit log table is missing optional columns
    }
  }
};
