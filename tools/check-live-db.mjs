import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.ytjqaasskfwtrnyxttso:Kdsv1986%40123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    // Check schema_migrations
    try {
      const r1 = await pool.query('SELECT version, name FROM schema_migrations ORDER BY version');
      console.log('Applied migrations:', JSON.stringify(r1.rows));
    } catch(e) {
      console.log('schema_migrations table missing or error:', e.message);
    }

    // Check if analytics_events has user_id
    try {
      const r2 = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='analytics_events' ORDER BY ordinal_position`);
      console.log('analytics_events columns:', r2.rows.map(r => r.column_name));
    } catch(e) {
      console.log('analytics_events check error:', e.message);
    }

    // Check key tables
    try {
      const r3 = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
      console.log('All public tables:', r3.rows.map(r => r.table_name));
    } catch(e) {
      console.log('Table check error:', e.message);
    }

    // Check users table
    try {
      const r4 = await pool.query(`SELECT COUNT(*) as cnt FROM users`);
      console.log('Users count:', r4.rows[0].cnt);
    } catch(e) {
      console.log('users table error:', e.message);
    }

  } catch(e) {
    console.error('Fatal error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
