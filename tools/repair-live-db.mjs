import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '../backend/src/db/migrations');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.ytjqaasskfwtrnyxttso:Kdsv1986%40123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

function computeChecksum(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

async function main() {
  try {
    // Read all migration files
    const entries = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
    
    console.log('Found migration files:', entries);
    
    // Check current schema_migrations state
    const existing = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
    console.log('Currently recorded in schema_migrations:', existing.rows.map(r => r.version));
    
    // Insert all migrations as "already applied"
    let inserted = 0;
    for (const file of entries) {
      const version = file.split('_')[0];
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      const checksum = computeChecksum(sql);
      
      // Check if already recorded
      const check = await pool.query('SELECT version FROM schema_migrations WHERE version=$1', [version]);
      if (check.rows.length > 0) {
        console.log(`Migration ${version} already recorded, skipping.`);
        continue;
      }
      
      // Insert as applied
      await pool.query(
        'INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES ($1, $2, $3, now())',
        [version, file, checksum]
      );
      console.log(`✅ Marked migration ${version} (${file}) as applied.`);
      inserted++;
    }
    
    console.log(`\nDone! Marked ${inserted} migration(s) as applied.`);
    
    // Now verify the state
    const final = await pool.query('SELECT version, name FROM schema_migrations ORDER BY version');
    console.log('\nFinal schema_migrations state:', JSON.stringify(final.rows, null, 2));
    
    // Now add the missing columns from migration 0011
    console.log('\nApplying missing columns from migration 0011...');
    try {
      await pool.query(`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL`);
      console.log('✅ Added user_id column to analytics_events');
    } catch(e) {
      console.log('user_id column note:', e.message);
    }
    
    try {
      await pool.query(`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS session_id text`);
      console.log('✅ Added session_id column to analytics_events');
    } catch(e) {
      console.log('session_id column note:', e.message);
    }
    
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_intel_events_user ON analytics_events(user_id) WHERE user_id IS NOT NULL`);
      console.log('✅ Created idx_intel_events_user index');
    } catch(e) {
      console.log('idx_intel_events_user note:', e.message);
    }
    
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_intel_events_session ON analytics_events(session_id) WHERE session_id IS NOT NULL`);
      console.log('✅ Created idx_intel_events_session index');
    } catch(e) {
      console.log('idx_intel_events_session note:', e.message);
    }
    
    // Check sessions table (needed for auth)
    const r = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='sessions'`);
    if (r.rows.length === 0) {
      console.log('\nCreating sessions table (missing from DB)...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          family_id uuid NOT NULL DEFAULT uuid_generate_v4(),
          token_hash text NOT NULL UNIQUE,
          organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
          ua_hash text,
          ip_prefix text,
          expires_at timestamptz NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          revoked_at timestamptz,
          replaced_by uuid REFERENCES sessions(id) ON DELETE SET NULL
        );
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_family_id ON sessions(family_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
      console.log('✅ Created sessions table');
    } else {
      console.log('✅ sessions table already exists');
    }
    
    // Check user_mfa table
    const r2 = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='user_mfa'`);
    if (r2.rows.length === 0) {
      console.log('Creating user_mfa table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_mfa (
          user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          secret_encrypted text NOT NULL,
          is_enabled boolean NOT NULL DEFAULT false,
          scratch_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `);
      console.log('✅ Created user_mfa table');
    }
    
    // Check password_reset_tokens table
    const r3 = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='password_reset_tokens'`);
    if (r3.rows.length === 0) {
      console.log('Creating password_reset_tokens table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash text NOT NULL UNIQUE,
          expires_at timestamptz NOT NULL,
          used_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        );
      `);
      console.log('✅ Created password_reset_tokens table');
    }

    // Check token_version column on users
    const r4 = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='token_version'`);
    if (r4.rows.length === 0) {
      console.log('Adding token_version to users...');
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 1`);
      console.log('✅ Added token_version to users');
    }
    
    console.log('\n🎉 Database schema repair complete!');
    
  } catch(e) {
    console.error('Fatal error:', e.message);
    console.error(e.stack);
  } finally {
    await pool.end();
  }
}

main();
