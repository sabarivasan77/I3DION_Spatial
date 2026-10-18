/**
 * Import & Export Engine for Spatial Vault (Phase P3)
 * Implements high-throughput bulk ingestion with column mapping, upsert,
 * and formula-injection protected CSV/JSON export.
 */

import { pool } from '../../db/pool.js';

// Dangerous leading characters in spreadsheets that cause remote code execution / formula injection
const FORMULA_INJECTION_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Sanitize a cell string against CSV formula injection.
 * If a string begins with =, +, -, @, \t, or \r, prefix with a single quote (').
 */
export function sanitizeCellForExport(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);

  if (FORMULA_INJECTION_PREFIXES.some(prefix => str.startsWith(prefix))) {
    return `'${str}`;
  }
  return str;
}

/**
 * Format records into a sanitized CSV string with formula-injection guard
 */
export function exportToCsv(records = [], columns = []) {
  if (records.length === 0) return '';

  const headerKeys = columns.length > 0 
    ? columns 
    : Object.keys(records[0]?.data || records[0] || {});

  const rows = [];
  // Header row
  rows.push(headerKeys.map(k => `"${k.replace(/"/g, '""')}"`).join(','));

  // Data rows
  for (const rec of records) {
    const dataObj = rec.data || rec;
    const line = headerKeys.map(k => {
      const rawVal = dataObj[k];
      const safeVal = sanitizeCellForExport(rawVal);
      return `"${String(safeVal).replace(/"/g, '""')}"`;
    });
    rows.push(line.join(','));
  }

  return rows.join('\r\n');
}

/**
 * Bulk import records with column mapping, schema validation, and upsert
 * 
 * @param {Object} options
 * @param {string} options.collectionId
 * @param {string} options.organizationId
 * @param {string} options.userId
 * @param {Array<Object>} options.rawRecords - Ingest payload (rows)
 * @param {Object} [options.mapping={}] - { input_column: target_field }
 * @param {string} [options.upsertKey=null] - Unique field name to upsert against
 * @param {Array<Object>} [options.schemaFields=[]] - Field definitions for validation
 * @param {number} [options.batchSize=1000] - Processing chunk size
 * @returns {Promise<Object>} Ingestion report with performance metrics
 */
export async function bulkImportRecords({
  collectionId,
  organizationId,
  userId,
  rawRecords = [],
  mapping = {},
  upsertKey = null,
  schemaFields = [],
  batchSize = 2000
}) {
  const startTime = Date.now();
  const initialMemory = process.memoryUsage().heapUsed;

  let totalCount = rawRecords.length;
  let importedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  const validationErrors = [];

  const fieldTypeMap = new Map(schemaFields.map(f => [f.internal_name || f.name, f.field_type || 'text']));
  const requiredFields = new Set(schemaFields.filter(f => f.required).map(f => f.internal_name || f.name));

  // Process in chunks
  for (let i = 0; i < totalCount; i += batchSize) {
    const chunk = rawRecords.slice(i, i + batchSize);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const validRows = [];
      const keysToLookup = [];

      for (let j = 0; j < chunk.length; j++) {
        const row = chunk[j];
        const rowIndex = i + j + 1;
        const mappedData = {};

        // Apply column mapping
        for (const [inputKey, val] of Object.entries(row)) {
          const targetKey = mapping[inputKey] || inputKey;
          mappedData[targetKey] = val;
        }

        // Validate required fields
        let hasValidationError = false;
        for (const reqField of requiredFields) {
          if (mappedData[reqField] === undefined || mappedData[reqField] === null || mappedData[reqField] === '') {
            validationErrors.push({ row: rowIndex, field: reqField, error: 'Required field missing' });
            errorCount++;
            hasValidationError = true;
            break;
          }
        }
        if (hasValidationError) continue;

        const recordName = mappedData.name || mappedData.title || (upsertKey ? mappedData[upsertKey] : null) || `Record #${rowIndex}`;
        const keyVal = upsertKey && mappedData[upsertKey] !== undefined ? String(mappedData[upsertKey]) : null;
        if (keyVal) keysToLookup.push(keyVal);

        validRows.push({ name: recordName, keyVal, data: mappedData });
      }

      // Batch query existing records for upsert
      const existingMap = new Map();
      if (upsertKey && keysToLookup.length > 0) {
        const existingRes = await client.query(
          `SELECT id, data->>$3 as key_val FROM vault_records 
           WHERE collection_id = $1 
             AND organization_id = $2 
             AND data->>$3 = ANY($4::text[])`,
          [collectionId, organizationId, upsertKey, keysToLookup]
        );
        for (const row of existingRes.rows) {
          existingMap.set(row.key_val, row.id);
        }
      }

      const toInsert = [];

      for (const item of validRows) {
        if (item.keyVal && existingMap.has(item.keyVal)) {
          const existingId = existingMap.get(item.keyVal);
          await client.query(
            `UPDATE vault_records 
             SET data = data || $1::jsonb, updated_at = now()
             WHERE id = $2`,
            [JSON.stringify(item.data), existingId]
          );
          updatedCount++;
        } else {
          toInsert.push(item);
        }
      }

      // High-speed multi-row insert in batches of 250
      if (toInsert.length > 0) {
        const insertBatchSize = 250;
        for (let b = 0; b < toInsert.length; b += insertBatchSize) {
          const batch = toInsert.slice(b, b + insertBatchSize);
          const valueClauses = [];
          const params = [collectionId, organizationId, userId];
          let paramIndex = 4;

          for (const item of batch) {
            valueClauses.push(`($1, $2, $${paramIndex++}, $${paramIndex++}, $3)`);
            params.push(item.name, JSON.stringify(item.data));
          }

          await client.query(
            `INSERT INTO vault_records (collection_id, organization_id, name, data, created_by)
             VALUES ${valueClauses.join(', ')}`,
            params
          );
          importedCount += batch.length;
        }
      }

      await client.query('COMMIT');
    } catch (chunkErr) {
      await client.query('ROLLBACK');
      throw chunkErr;
    } finally {
      client.release();
    }
  }

  const durationMs = Date.now() - startTime;
  const memoryUsedBytes = Math.max(0, process.memoryUsage().heapUsed - initialMemory);

  return {
    total: totalCount,
    imported: importedCount,
    updated: updatedCount,
    failed: errorCount,
    errors: validationErrors.slice(0, 50),
    metrics: {
      durationMs,
      rowsPerSecond: Math.round((totalCount / Math.max(1, durationMs / 1000))),
      memoryUsedMb: Math.round(memoryUsedBytes / 1024 / 1024 * 100) / 100
    }
  };
}
