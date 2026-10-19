import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';
import { BUNDLED_MIGRATIONS } from './migrationsBundle.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Compute SHA-256 hash of migration file content for immutable integrity verification.
 */
function computeChecksum(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Ensure schema_migrations ledger table exists.
 */
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      checksum VARCHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

/**
 * Execute all pending forward migrations in strict sequential order.
 * Follows expand-and-contract strangler pattern per Master Prompt v5.0 BUG-04.
 */
export async function runMigrations() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);

    let migrationItems = [];

    // 1. Attempt reading from filesystem (local dev / container)
    try {
      const entries = await fs.readdir(MIGRATIONS_DIR);
      const sqlFiles = entries.filter((f) => f.endsWith('.sql')).sort();
      for (const file of sqlFiles) {
        const version = file.split('_')[0];
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sqlContent = await fs.readFile(filePath, 'utf8');
        migrationItems.push({ version, name: file, sql: sqlContent });
      }
    } catch {
      // In serverless environments, migrations directory might not be copied
    }

    // 2. Fall back to bundled migrations if filesystem directory was missing or empty
    if (migrationItems.length === 0 && Array.isArray(BUNDLED_MIGRATIONS)) {
      migrationItems = BUNDLED_MIGRATIONS;
    }

    // Query applied migrations
    const appliedRes = await client.query('SELECT version, checksum FROM schema_migrations');
    const appliedMap = new Map(appliedRes.rows.map((r) => [r.version, r.checksum]));

    let appliedCount = 0;

    for (const item of migrationItems) {
      const { version, name: file, sql: sqlContent } = item;
      const checksum = computeChecksum(sqlContent);

      if (appliedMap.has(version)) {
        // Verification: Checksum match check
        const existingChecksum = appliedMap.get(version);
        if (existingChecksum !== checksum) {
          console.warn(`[Migration Warning] Checksum mismatch for migration ${file}. File was edited after execution.`);
        }
        continue;
      }

      console.log(`[Migration] Applying ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
          [version, file, checksum]
        );
        await client.query('COMMIT');
        console.log(`[Migration] ✅ Successfully applied ${file} (${checksum.slice(0, 8)})`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(`[Migration Error] Failed applying ${file}:`, err.message);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log('[Migration] Database schema is up to date.');
    } else {
      console.log(`[Migration] Finished applying ${appliedCount} migration(s).`);
    }

    return { success: true, appliedCount };
  } finally {
    client.release();
  }
}

/**
 * Return current migration status and ledger records.
 */
export async function getMigrationStatus() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const res = await client.query('SELECT version, name, checksum, applied_at FROM schema_migrations ORDER BY version ASC');
    return res.rows;
  } finally {
    client.release();
  }
}
