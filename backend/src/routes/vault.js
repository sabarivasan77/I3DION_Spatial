import express from 'express';
import multer from 'multer';
import path from 'path';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config.js';

const vaultRouter = express.Router();

// Multer storage configuration for local filesystem uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'vault-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } }); // 2GB

// Apply auth middleware to all vault routes
vaultRouter.use(requireAuth);

// Helper for RBAC checks
function requireMinRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role || 'Viewer';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Permission denied: insufficient role privileges' });
    }
    next();
  };
}

// Helper for audit logging
async function logActivity(orgId, userId, userName, action, targetType, targetId, targetName, details = {}) {
  try {
    await pool.query(
      `INSERT INTO vault_audit_logs (organization_id, user_id, user_name, action, target_type, target_id, target_name, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [orgId, userId, userName || 'User', action, targetType, targetId || null, targetName || '', JSON.stringify(details)]
    );
  } catch (err) {
    console.warn('Vault audit log error:', err.message);
  }
}

// ---------------------------------------------------------
// DATASETS SUMMARY & MULTI-TABLE AGGREGATION
// ---------------------------------------------------------

// GET /api/vault/datasets/summary (Live statistics across real tables)
vaultRouter.get('/datasets/summary', async (req, res) => {
  try {
    const { organization_id } = req.user;

    const [assetsCount, modelsCount, productsCount, catalogsCount, templatesCount, collectionsCount, storageSum] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM vault_assets WHERE organization_id = $1 AND is_deleted = false`, [organization_id]),
      pool.query(`SELECT COUNT(*) FROM vault_assets WHERE organization_id = $1 AND type = '3D Model' AND is_deleted = false`, [organization_id]),
      pool.query(`SELECT COUNT(*) FROM products WHERE organization_id = $1`, [organization_id]),
      pool.query(`SELECT COUNT(*) FROM catalogs WHERE organization_id = $1`, [organization_id]),
      pool.query(`SELECT COUNT(*) FROM vault_templates WHERE organization_id = $1`, [organization_id]),
      pool.query(`SELECT COUNT(*) FROM vault_collections WHERE organization_id = $1 AND is_deleted = false`, [organization_id]),
      pool.query(`SELECT SUM(size_bytes) as total_size FROM vault_assets WHERE organization_id = $1 AND is_deleted = false`, [organization_id])
    ]);

    const totalAssets = parseInt(assetsCount.rows[0].count, 10) || 0;
    const total3DModels = (parseInt(modelsCount.rows[0].count, 10) || 0) + (parseInt(productsCount.rows[0].count, 10) || 0);
    const totalProducts = parseInt(productsCount.rows[0].count, 10) || 0;
    const totalCatalogs = parseInt(catalogsCount.rows[0].count, 10) || 0;
    const totalTemplates = parseInt(templatesCount.rows[0].count, 10) || 0;
    const totalCollections = parseInt(collectionsCount.rows[0].count, 10) || 0;
    const totalStorageBytes = parseInt(storageSum.rows[0].total_size, 10) || 0;

    res.json({
      total_assets: totalAssets,
      total_3d_models: total3DModels,
      total_products: totalProducts,
      total_catalogs: totalCatalogs,
      total_templates: totalTemplates,
      total_collections: totalCollections,
      total_storage_bytes: totalStorageBytes,
      storage_quota_bytes: 107374182400 // 100 GB default enterprise quota
    });
  } catch (error) {
    console.error('Vault Datasets Summary Error:', error);
    res.status(500).json({ error: 'Failed to fetch datasets summary' });
  }
});

// GET /api/vault/datasets/products (Products as a structured Vault dataset)
vaultRouter.get('/datasets/products', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const result = await pool.query(
      `SELECT id, name, category, description, status, is_public, specs, dimensions, created_at, updated_at
       FROM products
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [organization_id]
    );

    res.json({
      dataset_name: 'Product Master Dataset',
      description: 'Centralized product and 3D model specification records',
      schema_fields: [
        { key: 'category', name: 'Category', type: 'Text', required: true },
        { key: 'description', name: 'Description', type: 'Text', required: false },
        { key: 'status', name: 'Publish Status', type: 'Status', required: true },
        { key: 'is_public', name: 'Public Availability', type: 'Boolean', required: false }
      ],
      records: result.rows.map(p => ({
        id: p.id,
        collection_id: 'system_products',
        name: p.name,
        status: p.status,
        data: {
          category: p.category,
          description: p.description || '',
          is_public: p.is_public ? 'True' : 'False',
          specs: p.specs,
          dimensions: p.dimensions
        },
        created_at: p.created_at,
        updated_at: p.updated_at
      }))
    });
  } catch (error) {
    console.error('Vault GET Product Dataset Error:', error);
    res.status(500).json({ error: 'Failed to fetch product dataset' });
  }
});

// GET /api/vault/datasets/catalogs (Catalogs as a structured Vault dataset)
vaultRouter.get('/datasets/catalogs', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const result = await pool.query(
      `SELECT id, name, description, status, slug, created_at, updated_at
       FROM catalogs
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [organization_id]
    );

    res.json({
      dataset_name: 'Catalog Master Dataset',
      description: 'Published product catalog experience collections',
      schema_fields: [
        { key: 'description', name: 'Description', type: 'Text', required: false },
        { key: 'status', name: 'Status', type: 'Status', required: true },
        { key: 'slug', name: 'Access Slug', type: 'Text', required: false }
      ],
      records: result.rows.map(c => ({
        id: c.id,
        collection_id: 'system_catalogs',
        name: c.name,
        status: c.status,
        data: {
          description: c.description || '',
          slug: c.slug || ''
        },
        created_at: c.created_at,
        updated_at: c.updated_at
      }))
    });
  } catch (error) {
    console.error('Vault GET Catalog Dataset Error:', error);
    res.status(500).json({ error: 'Failed to fetch catalog dataset' });
  }
});

// ---------------------------------------------------------
// ASSETS CRUD & VERSIONING
// ---------------------------------------------------------

// GET /api/vault/assets
vaultRouter.get('/assets', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { search, type, status, collection_id, is_deleted = 'false', sort = 'newest' } = req.query;

    let queryStr = `SELECT * FROM vault_assets WHERE organization_id = $1 AND is_deleted = $2`;
    const params = [organization_id, is_deleted === 'true'];

    if (search) {
      params.push(`%${search}%`);
      queryStr += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length} OR category ILIKE $${params.length})`;
    }

    if (type && type !== 'All') {
      params.push(type);
      queryStr += ` AND type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      queryStr += ` AND status = $${params.length}`;
    }

    if (collection_id) {
      params.push(collection_id);
      queryStr += ` AND collection_id = $${params.length}`;
    }

    if (sort === 'oldest') {
      queryStr += ` ORDER BY created_at ASC`;
    } else if (sort === 'name') {
      queryStr += ` ORDER BY name ASC`;
    } else if (sort === 'size') {
      queryStr += ` ORDER BY size_bytes DESC`;
    } else {
      queryStr += ` ORDER BY created_at DESC`;
    }

    const result = await pool.query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Vault GET Assets Error:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// GET /api/vault/assets/:id
vaultRouter.get('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const result = await pool.query(
      `SELECT * FROM vault_assets WHERE id = $1 AND organization_id = $2`,
      [id, organization_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const asset = result.rows[0];

    // Versions
    const versions = await pool.query(
      `SELECT * FROM vault_asset_versions WHERE asset_id = $1 ORDER BY version_number DESC`,
      [id]
    );
    asset.versions = versions.rows;

    if (!asset.connected_apps || asset.connected_apps.length === 0) {
      asset.connected_apps = ['Spatial Hub', 'Omni Studio'];
    }

    res.json(asset);
  } catch (error) {
    console.error('Vault GET Asset Error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// POST /api/vault/assets/upload
vaultRouter.post('/assets/upload', requireMinRole(['Admin', 'Manager', 'Sales User']), upload.single('file'), async (req, res) => {
  try {
    const { organization_id, id: userId, name: userName } = req.user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      name,
      description,
      category,
      type = 'Document',
      visibility = 'Organization',
      collection_id,
      tags
    } = req.body;

    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);
    const publicUrl = `/${config.uploadDir}/${file.filename}`;

    const result = await pool.query(
      `INSERT INTO vault_assets (
         organization_id, name, description, category, type, 
         original_name, storage_key, public_url, mime_type, 
         size_bytes, visibility, status, tags, collection_id, created_by
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
       RETURNING *`,
      [
        organization_id,
        name || file.originalname,
        description || '',
        category || '',
        type,
        file.originalname,
        file.filename,
        publicUrl,
        file.mimetype,
        file.size,
        visibility,
        'Ready',
        JSON.stringify(parsedTags),
        collection_id || null,
        userId
      ]
    );

    const newAsset = result.rows[0];

    // Create v1 in vault_asset_versions
    await pool.query(
      `INSERT INTO vault_asset_versions (
         asset_id, version_number, original_name, storage_key, 
         public_url, mime_type, size_bytes, change_description, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        newAsset.id, 1, file.originalname, file.filename,
        publicUrl, file.mimetype, file.size, 'Initial upload', userId
      ]
    );

    // Track completed processing job
    await pool.query(
      `INSERT INTO vault_processing_jobs (organization_id, job_type, asset_name, status, progress_pct)
       VALUES ($1, $2, $3, $4, $5)`,
      [organization_id, 'Asset Upload & Validation', newAsset.name, 'Completed', 100]
    );

    await logActivity(organization_id, userId, userName, 'Uploaded Asset', 'Asset', newAsset.id, newAsset.name);

    res.status(201).json(newAsset);
  } catch (error) {
    console.error('Vault Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload asset' });
  }
});

// POST /api/vault/assets/:id/versions (Upload New Version)
vaultRouter.post('/assets/:id/versions', requireMinRole(['Admin', 'Manager', 'Sales User']), upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file provided' });

    const check = await pool.query(`SELECT * FROM vault_assets WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });

    const currentAsset = check.rows[0];
    const versions = await pool.query(`SELECT MAX(version_number) as max_v FROM vault_asset_versions WHERE asset_id = $1`, [id]);
    const nextVersion = (versions.rows[0].max_v || 1) + 1;

    const publicUrl = `/${config.uploadDir}/${file.filename}`;
    const changeDescription = req.body.change_description || `Updated to version ${nextVersion}`;

    // Add version record
    await pool.query(
      `INSERT INTO vault_asset_versions (
         asset_id, version_number, original_name, storage_key, 
         public_url, mime_type, size_bytes, change_description, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, nextVersion, file.originalname, file.filename, publicUrl, file.mimetype, file.size, changeDescription, userId]
    );

    // Update current asset references
    const updated = await pool.query(
      `UPDATE vault_assets 
       SET storage_key = $1, public_url = $2, mime_type = $3, size_bytes = $4, original_name = $5, updated_at = now()
       WHERE id = $6 AND organization_id = $7 RETURNING *`,
      [file.filename, publicUrl, file.mimetype, file.size, file.originalname, id, organization_id]
    );

    await logActivity(organization_id, userId, userName, `Uploaded Version v${nextVersion}`, 'Asset', id, currentAsset.name);

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Vault New Version Error:', error);
    res.status(500).json({ error: 'Failed to upload new version' });
  }
});

// PATCH /api/vault/assets/:id
vaultRouter.patch('/assets/:id', requireMinRole(['Admin', 'Manager', 'Sales User']), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;
    const { name, description, category, tags, metadata, custom_fields, visibility, status, connected_apps } = req.body;

    const check = await pool.query(`SELECT * FROM vault_assets WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });

    const updates = [];
    const values = [];
    let count = 1;

    if (name !== undefined) { updates.push(`name = $${count++}`); values.push(name); }
    if (description !== undefined) { updates.push(`description = $${count++}`); values.push(description); }
    if (category !== undefined) { updates.push(`category = $${count++}`); values.push(category); }
    if (tags !== undefined) { updates.push(`tags = $${count++}`); values.push(JSON.stringify(tags)); }
    if (metadata !== undefined) { updates.push(`metadata = $${count++}`); values.push(JSON.stringify(metadata)); }
    if (custom_fields !== undefined) { updates.push(`custom_fields = $${count++}`); values.push(JSON.stringify(custom_fields)); }
    if (connected_apps !== undefined) { updates.push(`connected_apps = $${count++}`); values.push(JSON.stringify(connected_apps)); }
    if (visibility !== undefined) { updates.push(`visibility = $${count++}`); values.push(visibility); }
    if (status !== undefined) { updates.push(`status = $${count++}`); values.push(status); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = $${count++}`);
    values.push(new Date());
    values.push(id);
    values.push(organization_id);

    const result = await pool.query(
      `UPDATE vault_assets SET ${updates.join(', ')} 
       WHERE id = $${count - 2} AND organization_id = $${count - 1} 
       RETURNING *`,
      values
    );

    await logActivity(organization_id, userId, userName, 'Updated Asset Metadata', 'Asset', id, result.rows[0].name);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Vault Update Asset Error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE /api/vault/assets/:id (Soft Delete -> Trash)
vaultRouter.delete('/assets/:id', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;

    const check = await pool.query(`SELECT name FROM vault_assets WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });

    await pool.query(
      `UPDATE vault_assets SET is_deleted = true, deleted_at = now() WHERE id = $1 AND organization_id = $2`,
      [id, organization_id]
    );

    await logActivity(organization_id, userId, userName, 'Moved Asset to Trash', 'Asset', id, check.rows[0].name);

    res.json({ message: 'Asset moved to trash' });
  } catch (error) {
    console.error('Vault Delete Asset Error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// POST /api/vault/assets/:id/restore (Restore from Trash)
vaultRouter.post('/assets/:id/restore', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;

    const check = await pool.query(`SELECT name FROM vault_assets WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });

    await pool.query(
      `UPDATE vault_assets SET is_deleted = false, deleted_at = NULL WHERE id = $1 AND organization_id = $2`,
      [id, organization_id]
    );

    await logActivity(organization_id, userId, userName, 'Restored Asset from Trash', 'Asset', id, check.rows[0].name);

    res.json({ message: 'Asset restored successfully' });
  } catch (error) {
    console.error('Vault Restore Asset Error:', error);
    res.status(500).json({ error: 'Failed to restore asset' });
  }
});

// DELETE /api/vault/assets/:id/permanent (Permanent Purge)
vaultRouter.delete('/assets/:id/permanent', requireMinRole(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;

    const check = await pool.query(`SELECT name FROM vault_assets WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });

    await pool.query(`DELETE FROM vault_assets WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    await logActivity(organization_id, userId, userName, 'Permanently Deleted Asset', 'Asset', id, check.rows[0].name);

    res.json({ message: 'Asset permanently deleted' });
  } catch (error) {
    console.error('Vault Permanent Delete Error:', error);
    res.status(500).json({ error: 'Failed to permanently delete asset' });
  }
});

// POST /api/vault/assets/bulk-delete
vaultRouter.post('/assets/bulk-delete', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { ids } = req.body;
    const { organization_id, id: userId, name: userName } = req.user;

    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'No asset IDs provided' });

    await pool.query(
      `UPDATE vault_assets SET is_deleted = true, deleted_at = now() WHERE id = ANY($1::uuid[]) AND organization_id = $2`,
      [ids, organization_id]
    );

    await logActivity(organization_id, userId, userName, `Bulk Moved ${ids.length} Assets to Trash`, 'Asset', null, '');

    res.json({ message: `${ids.length} assets moved to trash` });
  } catch (error) {
    console.error('Vault Bulk Delete Error:', error);
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});

// ---------------------------------------------------------
// DATA SOURCES / COLLECTIONS CRUD & SCHEMA
// ---------------------------------------------------------

// GET /api/vault/collections
vaultRouter.get('/collections', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const result = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM vault_records r WHERE r.collection_id = c.id) as record_count,
        (SELECT COUNT(*) FROM vault_assets a WHERE a.collection_id = c.id AND a.is_deleted = false) as asset_count
       FROM vault_collections c
       WHERE c.organization_id = $1 AND c.is_deleted = false
       ORDER BY c.created_at DESC`,
      [organization_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Vault GET Collections Error:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// POST /api/vault/collections (Create Data Source)
vaultRouter.post('/collections', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { organization_id, id: userId, name: userName } = req.user;
    const { name, description, schema_fields } = req.body;

    if (!name) return res.status(400).json({ error: 'Data Source Name is required' });

    const defaultFields = schema_fields || [
      { key: 'name', name: 'Name', type: 'Text', required: true },
      { key: 'category', name: 'Category', type: 'Text', required: false },
      { key: 'status', name: 'Status', type: 'Status', required: false },
      { key: 'notes', name: 'Notes', type: 'Text', required: false }
    ];

    const result = await pool.query(
      `INSERT INTO vault_collections (organization_id, name, description, schema_fields, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [organization_id, name, description || '', JSON.stringify(defaultFields), userId]
    );

    await logActivity(organization_id, userId, userName, 'Created Data Source', 'Collection', result.rows[0].id, name);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Vault POST Collection Error:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// PATCH /api/vault/collections/:id (Rename & Update Properties)
vaultRouter.patch('/collections/:id', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;
    const { name, description, schema_fields } = req.body;

    const check = await pool.query(`SELECT name FROM vault_collections WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Collection not found' });

    const updates = [];
    const values = [];
    let count = 1;

    if (name !== undefined) { updates.push(`name = $${count++}`); values.push(name); }
    if (description !== undefined) { updates.push(`description = $${count++}`); values.push(description); }
    if (schema_fields !== undefined) { updates.push(`schema_fields = $${count++}`); values.push(JSON.stringify(schema_fields)); }

    updates.push(`updated_at = $${count++}`);
    values.push(new Date());
    values.push(id);
    values.push(organization_id);

    const result = await pool.query(
      `UPDATE vault_collections SET ${updates.join(', ')} 
       WHERE id = $${count - 2} AND organization_id = $${count - 1} RETURNING *`,
      values
    );

    await logActivity(organization_id, userId, userName, 'Updated Data Source', 'Collection', id, result.rows[0].name);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Vault PATCH Collection Error:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// DELETE /api/vault/collections/:id
vaultRouter.delete('/collections/:id', requireMinRole(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;

    const check = await pool.query(`SELECT name FROM vault_collections WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Collection not found' });

    await pool.query(`DELETE FROM vault_collections WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    await logActivity(organization_id, userId, userName, 'Deleted Data Source', 'Collection', id, check.rows[0].name);

    res.json({ message: 'Collection deleted' });
  } catch (error) {
    console.error('Vault DELETE Collection Error:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// ---------------------------------------------------------
// DATA WORKSPACE RECORDS CRUD
// ---------------------------------------------------------

// GET /api/vault/collections/:id/records
vaultRouter.get('/collections/:id/records', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    // Support built-in system datasets
    if (id === 'system_products') {
      const prods = await pool.query(
        `SELECT id, name, category, description, status, is_public, specs, dimensions, created_at, updated_at
         FROM products WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organization_id]
      );
      return res.json({
        collection: {
          id: 'system_products',
          name: 'Product Master Dataset',
          description: 'Live product specifications and 3D models',
          schema_fields: [
            { key: 'category', name: 'Category', type: 'Text', required: true },
            { key: 'description', name: 'Description', type: 'Text', required: false },
            { key: 'status', name: 'Status', type: 'Status', required: true },
            { key: 'is_public', name: 'Is Public', type: 'Boolean', required: false }
          ]
        },
        records: prods.rows.map(p => ({
          id: p.id,
          collection_id: 'system_products',
          name: p.name,
          status: p.status,
          data: {
            category: p.category,
            description: p.description || '',
            is_public: p.is_public ? 'True' : 'False'
          },
          created_at: p.created_at,
          updated_at: p.updated_at
        }))
      });
    }

    const collectionCheck = await pool.query(
      `SELECT * FROM vault_collections WHERE id = $1 AND organization_id = $2`,
      [id, organization_id]
    );

    if (collectionCheck.rows.length === 0) return res.status(404).json({ error: 'Collection not found' });

    const collection = collectionCheck.rows[0];

    const records = await pool.query(
      `SELECT r.*, a.name as asset_name, a.public_url as asset_url, a.type as asset_type 
       FROM vault_records r
       LEFT JOIN vault_assets a ON r.asset_id = a.id
       WHERE r.collection_id = $1 AND r.organization_id = $2
       ORDER BY r.created_at DESC`,
      [id, organization_id]
    );

    res.json({
      collection,
      records: records.rows
    });
  } catch (error) {
    console.error('Vault GET Records Error:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// POST /api/vault/collections/:id/records
vaultRouter.post('/collections/:id/records', requireMinRole(['Admin', 'Manager', 'Sales User']), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;
    const { name, data = {}, asset_id, status = 'Active' } = req.body;

    if (!name) return res.status(400).json({ error: 'Record Name is required' });

    const result = await pool.query(
      `INSERT INTO vault_records (collection_id, organization_id, name, data, asset_id, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, organization_id, name, JSON.stringify(data), asset_id || null, status, userId]
    );

    await logActivity(organization_id, userId, userName, 'Created Record', 'Record', result.rows[0].id, name);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Vault POST Record Error:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// PATCH /api/vault/collections/:id/records/:recordId
vaultRouter.patch('/collections/:id/records/:recordId', requireMinRole(['Admin', 'Manager', 'Sales User']), async (req, res) => {
  try {
    const { id, recordId } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;
    const { name, data, asset_id, status } = req.body;

    const updates = [];
    const values = [];
    let count = 1;

    if (name !== undefined) { updates.push(`name = $${count++}`); values.push(name); }
    if (data !== undefined) { updates.push(`data = $${count++}`); values.push(JSON.stringify(data)); }
    if (asset_id !== undefined) { updates.push(`asset_id = $${count++}`); values.push(asset_id || null); }
    if (status !== undefined) { updates.push(`status = $${count++}`); values.push(status); }

    updates.push(`updated_at = $${count++}`);
    values.push(new Date());
    values.push(recordId);
    values.push(id);
    values.push(organization_id);

    const result = await pool.query(
      `UPDATE vault_records SET ${updates.join(', ')}
       WHERE id = $${count - 3} AND collection_id = $${count - 2} AND organization_id = $${count - 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    await logActivity(organization_id, userId, userName, 'Updated Record', 'Record', recordId, result.rows[0].name);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Vault PATCH Record Error:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE /api/vault/collections/:id/records/:recordId
vaultRouter.delete('/collections/:id/records/:recordId', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { id, recordId } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;

    const check = await pool.query(
      `SELECT name FROM vault_records WHERE id = $1 AND collection_id = $2 AND organization_id = $3`,
      [recordId, id, organization_id]
    );

    if (check.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

    await pool.query(
      `DELETE FROM vault_records WHERE id = $1 AND collection_id = $2 AND organization_id = $3`,
      [recordId, id, organization_id]
    );

    await logActivity(organization_id, userId, userName, 'Deleted Record', 'Record', recordId, check.rows[0].name);

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Vault DELETE Record Error:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// ---------------------------------------------------------
// TEMPLATES CRUD
// ---------------------------------------------------------

// GET /api/vault/templates
vaultRouter.get('/templates', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const result = await pool.query(
      `SELECT * FROM vault_templates WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organization_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Vault GET Templates Error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST /api/vault/templates
vaultRouter.post('/templates', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { organization_id, id: userId, name: userName } = req.user;
    const { name, description, schema } = req.body;

    if (!name) return res.status(400).json({ error: 'Template name is required' });

    const result = await pool.query(
      `INSERT INTO vault_templates (organization_id, name, description, schema, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [organization_id, name, description || '', JSON.stringify(schema || {}), userId]
    );

    await logActivity(organization_id, userId, userName, 'Created Template', 'Template', result.rows[0].id, name);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Vault POST Template Error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PATCH /api/vault/templates/:id
vaultRouter.patch('/templates/:id', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;
    const { name, description, schema } = req.body;

    const result = await pool.query(
      `UPDATE vault_templates 
       SET name = COALESCE($1, name), description = COALESCE($2, description), schema = COALESCE($3, schema), updated_at = now()
       WHERE id = $4 AND organization_id = $5 RETURNING *`,
      [name, description, schema ? JSON.stringify(schema) : null, id, organization_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });

    await logActivity(organization_id, userId, userName, 'Updated Template', 'Template', id, result.rows[0].name);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Vault PATCH Template Error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /api/vault/templates/:id
vaultRouter.delete('/templates/:id', requireMinRole(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;

    const check = await pool.query(`SELECT name FROM vault_templates WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Template not found' });

    await pool.query(`DELETE FROM vault_templates WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    await logActivity(organization_id, userId, userName, 'Deleted Template', 'Template', id, check.rows[0].name);

    res.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Vault DELETE Template Error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ---------------------------------------------------------
// TRASH & RECOVERY
// ---------------------------------------------------------

// GET /api/vault/trash
vaultRouter.get('/trash', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const result = await pool.query(
      `SELECT id, name, type, size_bytes, deleted_at, 'Asset' as item_type FROM vault_assets 
       WHERE organization_id = $1 AND is_deleted = true
       ORDER BY deleted_at DESC`,
      [organization_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Vault GET Trash Error:', error);
    res.status(500).json({ error: 'Failed to fetch trash' });
  }
});

// POST /api/vault/trash/empty
vaultRouter.post('/trash/empty', requireMinRole(['Admin']), async (req, res) => {
  try {
    const { organization_id, id: userId, name: userName } = req.user;
    const result = await pool.query(
      `DELETE FROM vault_assets WHERE organization_id = $1 AND is_deleted = true RETURNING id`,
      [organization_id]
    );

    await logActivity(organization_id, userId, userName, 'Emptied Trash', 'Trash', null, `${result.rowCount} items purged`);

    res.json({ message: `Purged ${result.rowCount} trashed items` });
  } catch (error) {
    console.error('Vault Empty Trash Error:', error);
    res.status(500).json({ error: 'Failed to empty trash' });
  }
});

// ---------------------------------------------------------
// PROCESSING CENTER & AUDIT LOGS
// ---------------------------------------------------------

// GET /api/vault/processing/jobs
vaultRouter.get('/processing/jobs', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const result = await pool.query(
      `SELECT * FROM vault_processing_jobs WHERE organization_id = $1 ORDER BY started_at DESC LIMIT 50`,
      [organization_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Vault Processing Jobs Error:', error);
    res.status(500).json({ error: 'Failed to fetch processing jobs' });
  }
});

// GET /api/vault/activity
vaultRouter.get('/activity', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { search, action, target_type } = req.query;

    let queryStr = `SELECT * FROM vault_audit_logs WHERE organization_id = $1`;
    const params = [organization_id];

    if (search) {
      params.push(`%${search}%`);
      queryStr += ` AND (user_name ILIKE $${params.length} OR target_name ILIKE $${params.length} OR action ILIKE $${params.length})`;
    }

    if (action) {
      params.push(action);
      queryStr += ` AND action ILIKE $${params.length}`;
    }

    if (target_type) {
      params.push(target_type);
      queryStr += ` AND target_type = $${params.length}`;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await pool.query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Vault Activity Audit Error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// ---------------------------------------------------------
// SAVED VIEWS API
// ---------------------------------------------------------

// GET /api/vault/views
vaultRouter.get('/views', async (req, res) => {
  try {
    const { organization_id, id: userId } = req.user;
    const { collection_id } = req.query;

    let queryStr = `SELECT * FROM vault_saved_views WHERE organization_id = $1 AND (user_id = $2 OR is_shared = true)`;
    const params = [organization_id, userId];

    if (collection_id) {
      params.push(collection_id);
      queryStr += ` AND collection_id = $${params.length}`;
    }

    queryStr += ` ORDER BY created_at DESC`;

    const result = await pool.query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Vault GET Views Error:', error);
    res.status(500).json({ error: 'Failed to fetch saved views' });
  }
});

// POST /api/vault/views
vaultRouter.post('/views', async (req, res) => {
  try {
    const { organization_id, id: userId, name: userName } = req.user;
    const { collection_id = 'default', name, columns_config = [], filters_config = [], sort_config = {}, is_shared = false } = req.body;

    if (!name) return res.status(400).json({ error: 'View name is required' });

    const result = await pool.query(
      `INSERT INTO vault_saved_views (organization_id, user_id, collection_id, name, columns_config, filters_config, sort_config, is_shared)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [organization_id, userId, collection_id, name, JSON.stringify(columns_config), JSON.stringify(filters_config), JSON.stringify(sort_config), is_shared]
    );

    await logActivity(organization_id, userId, userName, 'Saved Custom View', 'View', result.rows[0].id, name);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Vault POST View Error:', error);
    res.status(500).json({ error: 'Failed to create saved view' });
  }
});

// DELETE /api/vault/views/:id
vaultRouter.delete('/views/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId } = req.user;

    await pool.query(
      `DELETE FROM vault_saved_views WHERE id = $1 AND organization_id = $2 AND (user_id = $3 OR $4 = 'Admin')`,
      [id, organization_id, userId, req.user.role]
    );

    res.json({ message: 'Saved view deleted' });
  } catch (error) {
    console.error('Vault DELETE View Error:', error);
    res.status(500).json({ error: 'Failed to delete saved view' });
  }
});

// ---------------------------------------------------------
// RESOURCE SHARING API
// ---------------------------------------------------------

// GET /api/vault/shares
vaultRouter.get('/shares', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { resource_type, resource_id } = req.query;

    let queryStr = `SELECT s.*, u.name as shared_with_name, u.email as shared_with_email 
                    FROM vault_shares s
                    LEFT JOIN users u ON s.shared_with_user_id = u.id
                    WHERE s.organization_id = $1`;
    const params = [organization_id];

    if (resource_type && resource_id) {
      params.push(resource_type, resource_id);
      queryStr += ` AND s.resource_type = $2 AND s.resource_id = $3`;
    }

    const result = await pool.query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Vault GET Shares Error:', error);
    res.status(500).json({ error: 'Failed to fetch shares' });
  }
});

// POST /api/vault/shares
vaultRouter.post('/shares', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { organization_id, id: userId, name: userName } = req.user;
    const { resource_type, resource_id, shared_with_user_id, permission_level = 'view' } = req.body;

    if (!resource_type || !resource_id || !shared_with_user_id) {
      return res.status(400).json({ error: 'Resource type, resource ID, and user ID are required' });
    }

    const result = await pool.query(
      `INSERT INTO vault_shares (organization_id, resource_type, resource_id, shared_with_user_id, permission_level, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [organization_id, resource_type, resource_id, shared_with_user_id, permission_level, userId]
    );

    await logActivity(organization_id, userId, userName, `Shared ${resource_type} (${permission_level})`, 'Share', result.rows[0].id, resource_id);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Vault POST Share Error:', error);
    res.status(500).json({ error: 'Failed to share resource' });
  }
});

// DELETE /api/vault/shares/:id
vaultRouter.delete('/shares/:id', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    await pool.query(`DELETE FROM vault_shares WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    res.json({ message: 'Resource share revoked' });
  } catch (error) {
    console.error('Vault DELETE Share Error:', error);
    res.status(500).json({ error: 'Failed to revoke share' });
  }
});

// ---------------------------------------------------------
// APPROVAL WORKFLOWS & VERSION RESTORE
// ---------------------------------------------------------

// POST /api/vault/assets/:id/approval
vaultRouter.post('/assets/:id/approval', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;
    const { approval_status = 'Approved', review_notes = '' } = req.body;

    const check = await pool.query(`SELECT name FROM vault_assets WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });

    const updated = await pool.query(
      `UPDATE vault_assets SET approval_status = $1, updated_at = now() WHERE id = $2 AND organization_id = $3 RETURNING *`,
      [approval_status, id, organization_id]
    );

    await pool.query(
      `INSERT INTO vault_approval_workflows (organization_id, resource_type, resource_id, approval_status, requested_by, reviewed_by, review_notes, reviewed_at)
       VALUES ($1, 'asset', $2, $3, $4, $4, $5, now())`,
      [organization_id, id, approval_status, userId, review_notes]
    );

    await logActivity(organization_id, userId, userName, `Updated Approval Status to ${approval_status}`, 'Asset', id, check.rows[0].name);

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Vault Approval Error:', error);
    res.status(500).json({ error: 'Failed to update approval status' });
  }
});

// POST /api/vault/assets/:id/versions/:versionId/restore
vaultRouter.post('/assets/:id/versions/:versionId/restore', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;

    const versionCheck = await pool.query(`SELECT * FROM vault_asset_versions WHERE id = $1 AND asset_id = $2`, [versionId, id]);
    if (versionCheck.rows.length === 0) return res.status(404).json({ error: 'Asset version not found' });

    const targetVer = versionCheck.rows[0];

    const currentVersions = await pool.query(`SELECT MAX(version_number) as max_v FROM vault_asset_versions WHERE asset_id = $1`, [id]);
    const nextVersionNum = (currentVersions.rows[0].max_v || 1) + 1;

    // Create a new version representing the restored state
    await pool.query(
      `INSERT INTO vault_asset_versions (
         asset_id, version_number, original_name, storage_key, 
         public_url, mime_type, size_bytes, change_description, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id, nextVersionNum, targetVer.original_name, targetVer.storage_key,
        targetVer.public_url, targetVer.mime_type, targetVer.size_bytes,
        `Restored from version v${targetVer.version_number}`, userId
      ]
    );

    const updated = await pool.query(
      `UPDATE vault_assets 
       SET storage_key = $1, public_url = $2, mime_type = $3, size_bytes = $4, original_name = $5, updated_at = now()
       WHERE id = $6 AND organization_id = $7 RETURNING *`,
      [targetVer.storage_key, targetVer.public_url, targetVer.mime_type, targetVer.size_bytes, targetVer.original_name, id, organization_id]
    );

    await logActivity(organization_id, userId, userName, `Restored Version v${targetVer.version_number} to v${nextVersionNum}`, 'Asset', id, updated.rows[0].name);

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Vault Version Restore Error:', error);
    res.status(500).json({ error: 'Failed to restore asset version' });
  }
});

// GET /api/vault/search (Global multi-target search across permitted organization resources)
vaultRouter.get('/search', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { q = '' } = req.query;

    if (!q || !q.trim()) {
      return res.json({ assets: [], products: [], catalogs: [], collections: [], templates: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    const [assets, products, catalogs, collections, templates] = await Promise.all([
      pool.query(
        `SELECT id, name, description, type, category, status, public_url, created_at
         FROM vault_assets
         WHERE organization_id = $1 AND is_deleted = false AND (name ILIKE $2 OR description ILIKE $2 OR category ILIKE $2)
         LIMIT 10`,
        [organization_id, searchTerm]
      ),
      pool.query(
        `SELECT id, name, category, description, status, created_at
         FROM products
         WHERE organization_id = $1 AND (name ILIKE $2 OR description ILIKE $2 OR category ILIKE $2)
         LIMIT 10`,
        [organization_id, searchTerm]
      ),
      pool.query(
        `SELECT id, name, description, status, slug, created_at
         FROM catalogs
         WHERE organization_id = $1 AND (name ILIKE $2 OR description ILIKE $2)
         LIMIT 10`,
        [organization_id, searchTerm]
      ),
      pool.query(
        `SELECT id, name, description, created_at
         FROM vault_collections
         WHERE organization_id = $1 AND is_deleted = false AND (name ILIKE $2 OR description ILIKE $2)
         LIMIT 10`,
        [organization_id, searchTerm]
      ),
      pool.query(
        `SELECT id, name, description, created_at
         FROM vault_templates
         WHERE organization_id = $1 AND (name ILIKE $2 OR description ILIKE $2)
         LIMIT 10`,
        [organization_id, searchTerm]
      )
    ]);

    res.json({
      query: q,
      assets: assets.rows,
      products: products.rows,
      catalogs: catalogs.rows,
      collections: collections.rows,
      templates: templates.rows
    });
  } catch (error) {
    console.error('Vault Global Search Error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// ---------------------------------------------------------
// ECOSYSTEM ENQUIRIES / LEAD INGESTION & MANAGEMENT APIs
// ---------------------------------------------------------

// GET /api/vault/enquiries
vaultRouter.get('/enquiries', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { search, source_application, status, priority } = req.query;

    let queryStr = `SELECT e.*, p.name as product_name, c.name as catalog_name
                    FROM vault_enquiries e
                    LEFT JOIN products p ON e.product_id = p.id
                    LEFT JOIN catalogs c ON e.catalog_id = c.id
                    WHERE e.organization_id = $1`;
    const params = [organization_id];

    if (search) {
      params.push(`%${search}%`);
      queryStr += ` AND (e.customer_name ILIKE $${params.length} OR e.email ILIKE $${params.length} OR e.company ILIKE $${params.length} OR e.message ILIKE $${params.length})`;
    }

    if (source_application && source_application !== 'All') {
      params.push(source_application);
      queryStr += ` AND e.source_application = $${params.length}`;
    }

    if (status && status !== 'All') {
      params.push(status);
      queryStr += ` AND e.status = $${params.length}`;
    }

    if (priority && priority !== 'All') {
      params.push(priority);
      queryStr += ` AND e.priority = $${params.length}`;
    }

    queryStr += ` ORDER BY e.created_at DESC`;

    const result = await pool.query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Vault GET Enquiries Error:', error);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// POST /api/vault/enquiries (Create/Ingest Enquiry in Vault)
vaultRouter.post('/enquiries', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const {
      source_application = 'Spatial Hub',
      product_id,
      catalog_id,
      customer_name,
      company = '',
      email,
      phone = '',
      message = '',
      priority = 'Medium',
      metadata = {}
    } = req.body;

    if (!customer_name || !email) {
      return res.status(400).json({ error: 'customer_name and email are required' });
    }

    const result = await pool.query(
      `INSERT INTO vault_enquiries (
         organization_id, source_application, product_id, catalog_id,
         customer_name, company, email, phone, message, priority, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        organization_id, source_application, product_id || null, catalog_id || null,
        customer_name, company, email, phone, message, priority, JSON.stringify(metadata)
      ]
    );

    await logActivity(organization_id, req.user.id, req.user.name, 'INGEST_ENQUIRY', 'Enquiry', result.rows[0].id, customer_name, { source_application, email });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Vault Create Enquiry Error:', error);
    res.status(500).json({ error: 'Failed to create enquiry' });
  }
});

// PATCH /api/vault/enquiries/:id
vaultRouter.patch('/enquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { status, priority, assigned_to, notes } = req.body;

    const updates = [];
    const params = [id, organization_id];

    if (status) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }
    if (priority) {
      params.push(priority);
      updates.push(`priority = $${params.length}`);
    }
    if (assigned_to !== undefined) {
      params.push(assigned_to || null);
      updates.push(`assigned_to = $${params.length}`);
    }
    updates.push(`updated_at = NOW()`);

    const result = await pool.query(
      `UPDATE vault_enquiries SET ${updates.join(', ')} WHERE id = $1 AND organization_id = $2 RETURNING *`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Enquiry not found' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Vault Update Enquiry Error:', error);
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

// ---------------------------------------------------------
// PRODUCT DETAIL & EXPANDED MANAGEMENT APIs
// ---------------------------------------------------------

// GET /api/vault/products/:id
vaultRouter.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const prodRes = await pool.query(
      `SELECT p.*, c.name as catalog_name
       FROM products p
       LEFT JOIN catalogs c ON p.catalog_id = c.id
       WHERE p.id = $1 AND p.organization_id = $2`,
      [id, organization_id]
    );

    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = prodRes.rows[0];

    // Fetch related assets (3D models, images, documents)
    const assetsRes = await pool.query(
      `SELECT id, name, type, category, status, public_url, size_bytes, created_at
       FROM vault_assets
       WHERE organization_id = $1 AND is_deleted = false AND (
         category ILIKE $2 OR name ILIKE $2 OR description ILIKE $2
       )`,
      [organization_id, `%${product.name}%`]
    );

    product.associated_assets = assetsRes.rows;

    res.json(product);
  } catch (error) {
    console.error('Vault GET Product Detail Error:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// PATCH /api/vault/products/:id
vaultRouter.patch('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { name, category, description, status, is_public, specs, dimensions } = req.body;

    const updates = [];
    const params = [id, organization_id];

    if (name) {
      params.push(name);
      updates.push(`name = $${params.length}`);
    }
    if (category) {
      params.push(category);
      updates.push(`category = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      updates.push(`description = $${params.length}`);
    }
    if (status) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }
    if (is_public !== undefined) {
      params.push(is_public);
      updates.push(`is_public = $${params.length}`);
    }
    if (specs) {
      params.push(JSON.stringify(specs));
      updates.push(`specs = $${params.length}`);
    }
    if (dimensions) {
      params.push(JSON.stringify(dimensions));
      updates.push(`dimensions = $${params.length}`);
    }
    updates.push(`updated_at = NOW()`);

    const result = await pool.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $1 AND organization_id = $2 RETURNING *`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    await logActivity(organization_id, req.user.id, req.user.name, 'UPDATE_PRODUCT', 'Product', id, result.rows[0].name);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Vault PATCH Product Error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ---------------------------------------------------------
// CATALOG PRODUCT REORDERING APIs
// ---------------------------------------------------------

// GET /api/vault/catalogs/:id/products
vaultRouter.get('/catalogs/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const result = await pool.query(
      `SELECT p.*, COALESCE(o.display_order, 0) as display_order
       FROM products p
       LEFT JOIN catalog_products_ordering o ON p.id = o.product_id AND o.catalog_id = $1
       WHERE p.organization_id = $2 AND p.catalog_id = $1
       ORDER BY display_order ASC, p.created_at DESC`,
      [id, organization_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Vault GET Catalog Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch catalog products' });
  }
});

// POST /api/vault/catalogs/:id/reorder
vaultRouter.post('/catalogs/:id/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { product_ids } = req.body; // Array of product UUIDs in desired order

    if (!Array.isArray(product_ids)) {
      return res.status(400).json({ error: 'product_ids must be an array' });
    }

    for (let index = 0; index < product_ids.length; index++) {
      const prodId = product_ids[index];
      await pool.query(
        `INSERT INTO catalog_products_ordering (catalog_id, product_id, display_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (catalog_id, product_id)
         DO UPDATE SET display_order = EXCLUDED.display_order`,
        [id, prodId, index]
      );
    }

    res.json({ message: 'Product order saved successfully', count: product_ids.length });
  } catch (error) {
    console.error('Vault Reorder Catalog Error:', error);
    res.status(500).json({ error: 'Failed to reorder catalog products' });
  }
});

// ---------------------------------------------------------
// PHASE 2: PRODUCT RELATIONSHIP ENGINE APIs
// ---------------------------------------------------------

// GET /api/vault/products/:id/relationships
vaultRouter.get('/products/:id/relationships', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    // 1. Attached assets by role
    const assetsRes = await pool.query(
      `SELECT m.id as map_id, m.asset_role, m.display_order, m.created_at as attached_at,
              a.id as asset_id, a.name, a.type, a.mime_type, a.size_bytes, a.public_url, a.thumbnail_url, a.status
       FROM product_assets_map m
       JOIN vault_assets a ON m.asset_id = a.id
       WHERE m.product_id = $1 AND m.organization_id = $2 AND a.is_deleted = false
       ORDER BY m.display_order ASC, m.created_at DESC`,
      [id, organization_id]
    );

    // 2. Inter-product relationships
    const relatedRes = await pool.query(
      `SELECT r.id as rel_id, r.relationship_type, r.notes, r.created_at,
              p.id as target_product_id, p.name as target_product_name, p.category, p.status, p.image_url
       FROM product_relationships r
       JOIN products p ON r.target_product_id = p.id
       WHERE r.source_product_id = $1 AND r.organization_id = $2
       UNION ALL
       SELECT r.id as rel_id, r.relationship_type, r.notes, r.created_at,
              p.id as target_product_id, p.name as target_product_name, p.category, p.status, p.image_url
       FROM product_relationships r
       JOIN products p ON r.source_product_id = p.id
       WHERE r.target_product_id = $1 AND r.organization_id = $2`,
      [id, organization_id]
    );

    // 3. Catalog memberships
    const catalogsRes = await pool.query(
      `SELECT c.id, c.name, c.status, c.slug, COALESCE(o.display_order, 0) as display_order
       FROM catalogs c
       LEFT JOIN catalog_products_ordering o ON c.id = o.catalog_id AND o.product_id = $1
       WHERE c.organization_id = $2 AND (c.id IN (SELECT catalog_id FROM catalog_products_ordering WHERE product_id = $1) OR c.id = (SELECT catalog_id FROM products WHERE id = $1))`,
      [id, organization_id]
    );

    // 4. Linked customer enquiries
    const enquiriesRes = await pool.query(
      `SELECT id, customer_name, company, email, phone, message, status, priority, created_at
       FROM vault_enquiries
       WHERE product_id = $1 AND organization_id = $2
       ORDER BY created_at DESC`,
      [id, organization_id]
    );

    res.json({
      attached_assets: assetsRes.rows,
      related_products: relatedRes.rows,
      catalogs: catalogsRes.rows,
      enquiries: enquiriesRes.rows
    });
  } catch (error) {
    console.error('Vault GET Product Relationships Error:', error);
    res.status(500).json({ error: 'Failed to fetch product relationships' });
  }
});

// POST /api/vault/products/:id/assets (Attach asset to product)
vaultRouter.post('/products/:id/assets', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { asset_id, asset_role, display_order } = req.body;

    if (!asset_id) return res.status(400).json({ error: 'asset_id is required' });

    const role = asset_role || 'GALLERY_IMAGE';

    const result = await pool.query(
      `INSERT INTO product_assets_map (organization_id, product_id, asset_id, asset_role, display_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (product_id, asset_id, asset_role)
       DO UPDATE SET display_order = EXCLUDED.display_order
       RETURNING *`,
      [organization_id, id, asset_id, role, display_order || 0]
    );

    // Synchronize primary model/thumbnail on product table if requested
    if (role === 'PRIMARY_MODEL') {
      const assetInfo = await pool.query(`SELECT public_url FROM vault_assets WHERE id = $1`, [asset_id]);
      if (assetInfo.rows.length > 0) {
        await pool.query(`UPDATE products SET model_url = $1, model_asset_id = $2 WHERE id = $3 AND organization_id = $4`, [assetInfo.rows[0].public_url, asset_id, id, organization_id]);
      }
    } else if (role === 'THUMBNAIL') {
      const assetInfo = await pool.query(`SELECT public_url FROM vault_assets WHERE id = $1`, [asset_id]);
      if (assetInfo.rows.length > 0) {
        await pool.query(`UPDATE products SET image_url = $1, thumbnail_asset_id = $2 WHERE id = $3 AND organization_id = $4`, [assetInfo.rows[0].public_url, asset_id, id, organization_id]);
      }
    }

    await logActivity(organization_id, req.user.id, req.user.name, 'ATTACH_PRODUCT_ASSET', 'Product', id, `Attached asset ${asset_id} as ${role}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Vault Attach Product Asset Error:', error);
    res.status(500).json({ error: 'Failed to attach asset to product' });
  }
});

// DELETE /api/vault/products/:id/assets/:mapId (Detach asset from product)
vaultRouter.delete('/products/:id/assets/:mapId', async (req, res) => {
  try {
    const { id, mapId } = req.params;
    const { organization_id } = req.user;

    await pool.query(
      `DELETE FROM product_assets_map WHERE id = $1 AND product_id = $2 AND organization_id = $3`,
      [mapId, id, organization_id]
    );

    await logActivity(organization_id, req.user.id, req.user.name, 'DETACH_PRODUCT_ASSET', 'Product', id, `Detached asset mapping ${mapId}`);

    res.json({ message: 'Asset detached successfully' });
  } catch (error) {
    console.error('Vault Detach Product Asset Error:', error);
    res.status(500).json({ error: 'Failed to detach asset' });
  }
});

// POST /api/vault/products/:id/related (Add inter-product relationship)
vaultRouter.post('/products/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { target_product_id, relationship_type, notes } = req.body;

    if (!target_product_id) return res.status(400).json({ error: 'target_product_id is required' });

    const relType = relationship_type || 'compatible';

    const result = await pool.query(
      `INSERT INTO product_relationships (organization_id, source_product_id, target_product_id, relationship_type, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (source_product_id, target_product_id, relationship_type)
       DO UPDATE SET notes = EXCLUDED.notes
       RETURNING *`,
      [organization_id, id, target_product_id, relType, notes || '']
    );

    await logActivity(organization_id, req.user.id, req.user.name, 'ADD_PRODUCT_RELATIONSHIP', 'Product', id, `Linked to product ${target_product_id} (${relType})`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Vault Add Product Relationship Error:', error);
    res.status(500).json({ error: 'Failed to add product relationship' });
  }
});

// DELETE /api/vault/products/:id/related/:relId (Remove inter-product relationship)
vaultRouter.delete('/products/:id/related/:relId', async (req, res) => {
  try {
    const { id, relId } = req.params;
    const { organization_id } = req.user;

    await pool.query(
      `DELETE FROM product_relationships WHERE id = $1 AND (source_product_id = $2 OR target_product_id = $2) AND organization_id = $3`,
      [relId, id, organization_id]
    );

    await logActivity(organization_id, req.user.id, req.user.name, 'REMOVE_PRODUCT_RELATIONSHIP', 'Product', id, `Removed product relationship ${relId}`);

    res.json({ message: 'Relationship removed successfully' });
  } catch (error) {
    console.error('Vault Remove Product Relationship Error:', error);
    res.status(500).json({ error: 'Failed to remove product relationship' });
  }
});

// ---------------------------------------------------------
// PHASE 2: DYNAMIC SCHEMA & FIELD GOVERNANCE APIs
// ---------------------------------------------------------

// GET /api/vault/schemas
vaultRouter.get('/schemas', async (req, res) => {
  try {
    const { organization_id } = req.user;
    const result = await pool.query(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM vault_schema_fields f WHERE f.schema_id = s.id) as field_count
       FROM vault_schemas s
       WHERE s.organization_id = $1 AND s.is_active = true
       ORDER BY s.name ASC`,
      [organization_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Vault GET Schemas Error:', error);
    res.status(500).json({ error: 'Failed to fetch schemas' });
  }
});

// POST /api/vault/schemas
vaultRouter.post('/schemas', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { organization_id, id: userId } = req.user;
    const { name, description, version } = req.body;

    if (!name) return res.status(400).json({ error: 'Schema name is required' });

    const result = await pool.query(
      `INSERT INTO vault_schemas (organization_id, name, description, version, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [organization_id, name, description || '', version || '1.0', userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Vault POST Schema Error:', error);
    res.status(500).json({ error: 'Failed to create schema' });
  }
});

// GET /api/vault/schemas/:schemaId/fields
vaultRouter.get('/schemas/:schemaId/fields', async (req, res) => {
  try {
    const { schemaId } = req.params;
    const { organization_id, role } = req.user;

    const fieldsRes = await pool.query(
      `SELECT * FROM vault_schema_fields
       WHERE schema_id = $1 AND organization_id = $2
       ORDER BY display_order ASC, name ASC`,
      [schemaId, organization_id]
    );

    // Apply Field-Level Visibility Governance
    const filteredFields = fieldsRes.rows.filter(f => {
      if (f.visibility === 'SYSTEM_ONLY' && role !== 'Admin' && role !== 'Super Admin') return false;
      if (f.visibility === 'ADMIN_ONLY' && role !== 'Admin' && role !== 'Super Admin' && role !== 'Company Admin') return false;
      return true;
    });

    res.json(filteredFields);
  } catch (error) {
    console.error('Vault GET Schema Fields Error:', error);
    res.status(500).json({ error: 'Failed to fetch schema fields' });
  }
});

// POST /api/vault/schemas/:schemaId/fields
vaultRouter.post('/schemas/:schemaId/fields', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { schemaId } = req.params;
    const { organization_id } = req.user;
    const { name, internal_name, field_type, description, required, unique_constraint, default_value, visibility, editable, system_field } = req.body;

    if (!name || !internal_name) return res.status(400).json({ error: 'Field name and internal_name are required' });

    // Protect system field flags
    const isSystem = system_field === true && req.user.role === 'Admin';

    const result = await pool.query(
      `INSERT INTO vault_schema_fields (schema_id, organization_id, name, internal_name, field_type, description, required, unique_constraint, default_value, visibility, editable, system_field)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        schemaId,
        organization_id,
        name,
        internal_name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        field_type || 'text',
        description || '',
        required || false,
        unique_constraint || false,
        default_value || null,
        visibility || 'INTERNAL',
        editable !== undefined ? editable : true,
        isSystem
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Vault POST Schema Field Error:', error);
    res.status(500).json({ error: 'Failed to create schema field' });
  }
});

// ---------------------------------------------------------
// PHASE 2: BULK DATA & IMPORT/EXPORT APIs
// ---------------------------------------------------------

// POST /api/vault/datasets/:collectionId/bulk
vaultRouter.post('/datasets/:collectionId/bulk', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  const client = await pool.connect();
  try {
    const { collectionId } = req.params;
    const { organization_id, id: userId, name: userName } = req.user;
    const { action, record_ids, data_payload } = req.body;

    if (!Array.isArray(record_ids) || record_ids.length === 0) {
      return res.status(400).json({ error: 'record_ids must be a non-empty array' });
    }

    await client.query('BEGIN');

    if (action === 'delete') {
      await client.query(
        `DELETE FROM vault_records WHERE id = ANY($1::uuid[]) AND collection_id = $2 AND organization_id = $3`,
        [record_ids, collectionId, organization_id]
      );
    } else if (action === 'update_status') {
      await client.query(
        `UPDATE vault_records SET status = $1, updated_at = now() WHERE id = ANY($2::uuid[]) AND collection_id = $3 AND organization_id = $4`,
        [data_payload?.status || 'Active', record_ids, collectionId, organization_id]
      );
    } else if (action === 'bulk_edit') {
      for (const recId of record_ids) {
        await client.query(
          `UPDATE vault_records SET data = data || $1::jsonb, updated_at = now() WHERE id = $2 AND collection_id = $3 AND organization_id = $4`,
          [JSON.stringify(data_payload || {}), recId, collectionId, organization_id]
        );
      }
    }

    await client.query('COMMIT');

    await logActivity(organization_id, userId, userName, `BULK_${action.toUpperCase()}`, 'DatasetRecord', collectionId, `Processed ${record_ids.length} records`);

    res.json({ message: `Bulk ${action} executed successfully`, count: record_ids.length });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Vault Bulk Operation Error:', error);
    res.status(500).json({ error: 'Bulk dataset operation failed' });
  } finally {
    client.release();
  }
});

// POST /api/vault/datasets/:collectionId/import
vaultRouter.post('/datasets/:collectionId/import', requireMinRole(['Admin', 'Manager']), async (req, res) => {
  const client = await pool.connect();
  try {
    const { collectionId } = req.params;
    const { organization_id, id: userId } = req.user;
    const { records } = req.body; // Array of json objects matching fields

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'records array is required for import' });
    }

    await client.query('BEGIN');

    let importedCount = 0;
    for (const rec of records) {
      const name = rec.name || rec.title || `Imported Record ${importedCount + 1}`;
      await client.query(
        `INSERT INTO vault_records (collection_id, organization_id, name, data, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [collectionId, organization_id, name, JSON.stringify(rec), userId]
      );
      importedCount++;
    }

    await client.query('COMMIT');

    res.json({ message: 'Dataset import completed successfully', count: importedCount });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Vault Import Dataset Error:', error);
    res.status(500).json({ error: 'Dataset import failed' });
  } finally {
    client.release();
  }
});

// GET /api/vault/datasets/:collectionId/export
vaultRouter.get('/datasets/:collectionId/export', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { organization_id } = req.user;

    const result = await pool.query(
      `SELECT r.id, r.name, r.data, r.status, r.created_at, r.updated_at
       FROM vault_records r
       WHERE r.collection_id = $1 AND r.organization_id = $2
       ORDER BY r.created_at DESC`,
      [collectionId, organization_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Vault Export Dataset Error:', error);
    res.status(500).json({ error: 'Failed to export dataset' });
  }
});

export { vaultRouter };


