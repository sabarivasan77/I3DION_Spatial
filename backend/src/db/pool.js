import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ...( (config.nodeEnv === 'production' || config.databaseUrl?.includes('sslmode=') || config.databaseUrl?.includes('supabase') || config.databaseUrl?.includes('neon') || config.databaseUrl?.includes('render')) && {
    ssl: { rejectUnauthorized: false }
  })
});

export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}

/**
 * Execute a callback within an isolated PostgreSQL transaction on a dedicated client.
 * Automatically handles BEGIN, COMMIT, ROLLBACK, and releases the client. (Annex A6)
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Execute a callback within a tenant-scoped PostgreSQL transaction with transaction-local app.org_id. (Annex A6)
 */
export async function withTenant(orgId, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (orgId) {
      await client.query("SELECT set_config('app.org_id', $1, true)", [orgId]);
      await client.query("SET LOCAL ROLE i3dion_app").catch(() => {});
    }
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

let migrationRun = false;

export async function ensureMigrated() {
  if (migrationRun) return;
  try {
    const { runMigrations } = await import('./migrator.js');
    await runMigrations();

    try {
      const { seedSpatialHubDatabase } = await import('./seed-spatial-hub.js');
      await seedSpatialHubDatabase();
    } catch (seedErr) {
      console.warn('Non-blocking Spatial Hub seeding note:', seedErr.message);
    }

    migrationRun = true;
  } catch (err) {
    console.error('Database migration check failed:', err.message);
  }
}

export async function migrate() {
  await ensureMigrated();
}

