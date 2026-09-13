import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
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

// ---------------------------------------------------------
// ASSETS
// ---------------------------------------------------------

// GET /api/vault/assets
vaultRouter.get('/assets', async (req, res) => {
  try {
    const { organization_id } = req.user;
    
    // Simplistic fetching without advanced pagination for MVP
    const result = await pool.query(
      `SELECT * FROM vault_assets 
       WHERE organization_id = $1 
       ORDER BY created_at DESC`,
      [organization_id]
    );
    
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
      `SELECT * FROM vault_assets 
       WHERE id = $1 AND organization_id = $2`,
      [id, organization_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Also fetch versions
    const versions = await pool.query(
      `SELECT * FROM vault_asset_versions 
       WHERE asset_id = $1 
       ORDER BY version_number DESC`,
      [id]
    );
    
    const asset = result.rows[0];
    asset.versions = versions.rows;
    
    res.json(asset);
  } catch (error) {
    console.error('Vault GET Asset Error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// POST /api/vault/assets/upload
vaultRouter.post('/assets/upload', upload.single('file'), async (req, res) => {
  try {
    const { organization_id, id: userId } = req.user;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const {
      name,
      description,
      category,
      type, // '3D Model', 'Image', 'Video', 'Document'
      visibility = 'Organization'
    } = req.body;
    
    // Determine public URL based on host/config
    const publicUrl = `/${config.uploadDir}/${file.filename}`;
    
    const result = await pool.query(
      `INSERT INTO vault_assets (
         organization_id, name, description, category, type, 
         original_name, storage_key, public_url, mime_type, 
         size_bytes, visibility, created_by
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [
        organization_id, 
        name || file.originalname, 
        description || '', 
        category || '', 
        type || 'Document',
        file.originalname,
        file.filename,
        publicUrl,
        file.mimetype,
        file.size,
        visibility,
        userId
      ]
    );
    
    const newAsset = result.rows[0];
    
    // Also create initial version
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
    
    res.status(201).json(newAsset);
  } catch (error) {
    console.error('Vault Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload asset' });
  }
});

// PATCH /api/vault/assets/:id
vaultRouter.patch('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    const { name, description, category, tags, metadata, visibility } = req.body;
    
    // Basic verification of ownership
    const check = await pool.query(`SELECT id FROM vault_assets WHERE id = $1 AND organization_id = $2`, [id, organization_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    
    // Dynamic update building
    const updates = [];
    const values = [];
    let count = 1;
    
    if (name !== undefined) { updates.push(`name = $${count++}`); values.push(name); }
    if (description !== undefined) { updates.push(`description = $${count++}`); values.push(description); }
    if (category !== undefined) { updates.push(`category = $${count++}`); values.push(category); }
    if (tags !== undefined) { updates.push(`tags = $${count++}`); values.push(tags); }
    if (metadata !== undefined) { updates.push(`metadata = $${count++}`); values.push(metadata); }
    if (visibility !== undefined) { updates.push(`visibility = $${count++}`); values.push(visibility); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = $${count++}`);
    values.push(new Date());
    values.push(id);
    values.push(organization_id);
    
    const result = await pool.query(
      `UPDATE vault_assets SET ${updates.join(', ')} 
       WHERE id = $${count-2} AND organization_id = $${count-1} 
       RETURNING *`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Vault Update Asset Error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

export { vaultRouter };
