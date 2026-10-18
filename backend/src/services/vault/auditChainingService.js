/**
 * Cryptographic Hash-Chained Audit Service for Spatial Vault (Phase P3)
 * Implements immutable, tamper-evident audit logging with SHA-256 chain of custody.
 */

import crypto from 'node:crypto';
import { pool } from '../../db/pool.js';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Compute SHA-256 block hash for an audit log entry
 */
export function computeEntryHash(previousHash, orgId, action, targetType, targetId, detailsStr, timestampStr) {
  const payload = [
    previousHash,
    orgId,
    action,
    targetType,
    targetId || '',
    detailsStr || '{}',
    timestampStr
  ].join(':');

  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Append an entry to the hash-chained audit log
 */
export async function logChainedAudit({
  organizationId,
  userId = null,
  userName = 'System',
  action,
  targetType,
  targetId = null,
  targetName = null,
  details = {}
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the latest hash for this organization
    const lastEntryRes = await client.query(
      `SELECT current_hash 
       FROM vault_audit_logs 
       WHERE organization_id = $1 AND current_hash IS NOT NULL
       ORDER BY created_at DESC, id DESC
       LIMIT 1
       FOR UPDATE`,
      [organizationId]
    );

    const previousHash = lastEntryRes.rows.length > 0
      ? lastEntryRes.rows[0].current_hash
      : GENESIS_HASH;

    const now = new Date().toISOString();
    const detailsStr = JSON.stringify(details || {});
    const currentHash = computeEntryHash(
      previousHash,
      organizationId,
      action,
      targetType,
      targetId,
      detailsStr,
      now
    );

    const insertRes = await client.query(
      `INSERT INTO vault_audit_logs (
         organization_id, user_id, user_name, action, target_type, target_id, target_name,
         details, previous_hash, current_hash, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        organizationId,
        userId,
        userName,
        action,
        targetType,
        targetId,
        targetName,
        detailsStr,
        previousHash,
        currentHash,
        now
      ]
    );

    await client.query('COMMIT');
    return insertRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Verify cryptographic integrity of the entire audit chain for an organization
 */
export async function verifyAuditChain(organizationId) {
  const entriesRes = await pool.query(
    `SELECT id, organization_id, action, target_type, target_id, details,
            previous_hash, current_hash, created_at
     FROM vault_audit_logs
     WHERE organization_id = $1 AND current_hash IS NOT NULL
     ORDER BY created_at ASC, id ASC`,
    [organizationId]
  );

  const entries = entriesRes.rows;
  if (entries.length === 0) {
    return { valid: true, totalEntries: 0, message: 'No chained audit records found' };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Check link to previous entry
    if (entry.previous_hash !== expectedPrevHash) {
      return {
        valid: false,
        brokenAt: i,
        entryId: entry.id,
        reason: `Previous hash mismatch at index ${i}: expected ${expectedPrevHash}, found ${entry.previous_hash}`
      };
    }

    // Verify self hash computation
    const detailsStr = typeof entry.details === 'string' 
      ? entry.details 
      : JSON.stringify(entry.details || {});
    const timestampStr = new Date(entry.created_at).toISOString();

    const recalculatedHash = computeEntryHash(
      entry.previous_hash,
      entry.organization_id,
      entry.action,
      entry.target_type,
      entry.target_id,
      detailsStr,
      timestampStr
    );

    if (recalculatedHash !== entry.current_hash) {
      return {
        valid: false,
        brokenAt: i,
        entryId: entry.id,
        reason: `Cryptographic payload tampering at index ${i}: expected ${recalculatedHash}, found ${entry.current_hash}`
      };
    }

    expectedPrevHash = entry.current_hash;
  }

  return {
    valid: true,
    totalEntries: entries.length,
    headHash: expectedPrevHash
  };
}
