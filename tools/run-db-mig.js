import pg from 'pg';
import { runMigrations } from '../backend/src/db/migrator.js';

// Set DATABASE_URL to Supabase with the new password
process.env.DATABASE_URL = 'postgresql://postgres.ytjqaasskfwtrnyxttso:Kdsv1986Spatial2026@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';

async function test() {
  console.log('Running runMigrations against Supabase...');
  try {
    const { pool } = await import('../backend/src/db/pool.js');
    await runMigrations();
    console.log('SUCCESS MIGRATIONS!');
  } catch (err) {
    console.error('FAILED MIGRATIONS:', err.message);
    if (err.position) console.error('Position:', err.position);
    console.error(err.stack);
  }
}

test();
