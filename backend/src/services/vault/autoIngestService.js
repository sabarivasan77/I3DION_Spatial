/**
 * Auto-Ingest & Usage Tracking Service for Spatial Vault (Phase P3 / §4.8)
 * "Every asset goes into the Vault"
 * Implements automated folder placement, SHA-256 deduplication, and multi-consumer asset usage tracking.
 */

import { pool } from '../../db/pool.js';
import { computeSha256, findDuplicateAsset, ensureFolderPath } from './documentLibraryService.js';

/**
 * Auto-ingest an asset from Omni Studio or external consumer
 * 
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} params.userId
 * @param {string} params.name
 * @param {string} params.originalName
 * @param {Buffer|string} params.content
 * @param {string} params.mimeType
 * @param {string} [params.catalogId] - If provided, files under /Catalogs/<catalogId>/
 * @param {string} [params.consumerType='catalog'] - 'catalog', 'scene', 'page', 'flow'
 * @param {string} [params.consumerId]
 * @param {string} [params.consumerName]
 * @param {Object} [params.context={}]
 * @returns {Promise<Object>} Asset reference and usage record
 */
export async function autoIngestAsset({
  organizationId,
  userId,
  name,
  originalName,
  content,
  mimeType,
  catalogId = null,
  consumerType = 'catalog',
  consumerId = null,
  consumerName = null,
  context = {}
}) {
  const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const checksum = computeSha256(contentBuffer);
  const sizeBytes = contentBuffer.length;

  // 1. Check for duplicate asset in the organization
  const existingAsset = await findDuplicateAsset(checksum, organizationId);
  if (existingAsset) {
    // Record usage for the existing asset
    const activeConsumerId = consumerId || catalogId || 'unknown';
    const usage = await recordAssetUsage({
      organizationId,
      assetId: existingAsset.id,
      consumerType,
      consumerId: activeConsumerId,
      consumerName: consumerName || catalogId,
      context
    });

    return {
      duplicate: true,
      asset: existingAsset,
      assetRef: {
        assetId: existingAsset.id,
        name: existingAsset.name,
        checksumSha256: checksum,
        isExisting: true
      },
      usage
    };
  }

  // 2. Ensure folder hierarchy under /Catalogs/<catalogId>/ or /General/
  const folderPath = catalogId ? `/Catalogs/${catalogId}` : '/General';
  const folderId = await ensureFolderPath(folderPath, organizationId, userId);

  // 3. Create the new asset in Vault
  const storageKey = `org/${organizationId}/assets/vault-${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
  const publicUrl = `/api/storage/files/${name}?org=${organizationId}`;

  const assetRes = await pool.query(
    `INSERT INTO vault_assets (
       organization_id, name, description, category, tags, type, original_name,
       storage_key, public_url, mime_type, size_bytes, checksum_sha256,
       status, visibility, folder_id, created_by
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Ready', 'Organization', $13, $14
     ) RETURNING *`,
    [
      organizationId,
      name,
      `Auto-ingested asset for ${consumerType}`,
      catalogId ? 'Catalog Assets' : 'General',
      JSON.stringify(['source:studio', ...(catalogId ? [`catalog:${catalogId}`] : [])]),
      mimeType.startsWith('image/') ? 'Image' : mimeType.includes('gltf') ? '3D Model' : 'Document',
      originalName || name,
      storageKey,
      publicUrl,
      mimeType,
      sizeBytes,
      checksum,
      folderId,
      userId
    ]
  );

  const newAsset = assetRes.rows[0];

  // 4. Create initial major version (v1.0)
  const versionRes = await pool.query(
    `INSERT INTO vault_asset_versions (
       asset_id, version_number, original_name, storage_key, public_url,
       mime_type, size_bytes, checksum_sha256, change_description, created_by
     ) VALUES (
       $1, 1, $2, $3, $4, $5, $6, $7, 'Initial auto-ingestion', $8
     ) RETURNING *`,
    [
      newAsset.id,
      originalName || name,
      storageKey,
      publicUrl,
      mimeType,
      sizeBytes,
      checksum,
      userId
    ]
  );

  // 5. Record usage link in asset_usage table
  const activeConsumerId = consumerId || catalogId || 'unknown';
  const usage = await recordAssetUsage({
    organizationId,
    assetId: newAsset.id,
    versionId: versionRes.rows[0].id,
    consumerType,
    consumerId: activeConsumerId,
    consumerName: consumerName || catalogId,
    context
  });

  return {
    duplicate: false,
    asset: newAsset,
    version: versionRes.rows[0],
    assetRef: {
      assetId: newAsset.id,
      versionId: versionRes.rows[0].id,
      name: newAsset.name,
      checksumSha256: checksum,
      isExisting: false
    },
    usage
  };
}

/**
 * Record an asset usage link
 */
export async function recordAssetUsage({
  organizationId,
  assetId,
  versionId = null,
  consumerType,
  consumerId,
  consumerName = null,
  context = {}
}) {
  const result = await pool.query(
    `INSERT INTO asset_usage (
       organization_id, asset_id, version_id, consumer_type, consumer_id, consumer_name, context
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      organizationId,
      assetId,
      versionId,
      consumerType,
      consumerId,
      consumerName,
      JSON.stringify(context || {})
    ]
  );

  return result.rows[0];
}

/**
 * Retrieve all consumers currently using an asset ("Used in")
 */
export async function getAssetUsage(assetId, organizationId) {
  const result = await pool.query(
    `SELECT u.*, a.name as asset_name
     FROM asset_usage u
     JOIN vault_assets a ON a.id = u.asset_id
     WHERE u.asset_id = $1 AND u.organization_id = $2
     ORDER BY u.created_at DESC`,
    [assetId, organizationId]
  );

  return result.rows;
}
