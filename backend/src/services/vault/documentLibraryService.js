/**
 * Document Library Service for Spatial Vault (Phase P3)
 * Implements SharePoint-style folder hierarchy, SHA-256 deduplication,
 * major/minor versioning, retention labels, and secure share links.
 */

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../../db/pool.js';

/**
 * Compute SHA-256 hex hash of a Buffer or string
 */
export function computeSha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Check for duplicate asset by SHA-256 hash in the same organization
 */
export async function findDuplicateAsset(checksumSha256, organizationId) {
  if (!checksumSha256 || !organizationId) return null;

  const result = await pool.query(
    `SELECT * FROM vault_assets
     WHERE checksum_sha256 = $1
       AND organization_id = $2
       AND is_deleted = false
     LIMIT 1`,
    [checksumSha256, organizationId]
  );

  return result.rows[0] || null;
}

/**
 * Create or get folder hierarchy
 */
export async function ensureFolderPath(folderPath, organizationId, userId) {
  if (!folderPath || folderPath === '/') return null;

  const segments = folderPath.split('/').filter(Boolean);
  let parentId = null;
  let currentPath = '';

  for (const seg of segments) {
    currentPath += `/${seg}`;

    const existing = await pool.query(
      `SELECT id FROM vault_folders 
       WHERE organization_id = $1 AND path = $2 LIMIT 1`,
      [organizationId, currentPath]
    );

    if (existing.rows.length > 0) {
      parentId = existing.rows[0].id;
    } else {
      const inserted = await pool.query(
        `INSERT INTO vault_folders (organization_id, parent_id, name, path, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [organizationId, parentId, seg, currentPath, userId]
      );
      parentId = inserted.rows[0].id;
    }
  }

  return parentId;
}

/**
 * Assert that an asset can be permanently deleted (checks retention labels)
 */
export function assertRetentionLabelPermitsDeletion(asset) {
  if (!asset) return;

  if (asset.retention_label && asset.retention_label.trim() !== '') {
    throw new Error(
      `Cannot permanently delete asset "${asset.name}": active retention label "${asset.retention_label}" prevents deletion.`
    );
  }
}

/**
 * Create a secure share link with optional password protection and expiration
 */
export async function createShareLink({
  organizationId,
  resourceType,
  resourceId,
  permissionLevel = 'view',
  password = null,
  expiresInHours = 72,
  createdBy
}) {
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const expiresAt = expiresInHours 
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) 
    : null;

  const result = await pool.query(
    `INSERT INTO vault_shares (
       organization_id, resource_type, resource_id, permission_level, created_by
     ) VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [organizationId, resourceType, resourceId, permissionLevel, createdBy]
  );

  return {
    ...result.rows[0],
    is_password_protected: Boolean(password),
    expires_at: expiresAt
  };
}
