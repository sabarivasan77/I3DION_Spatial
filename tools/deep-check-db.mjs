import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.ytjqaasskfwtrnyxttso:Kdsv1986%40123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    // Check subscriptions table columns
    const r1 = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='subscriptions' ORDER BY ordinal_position`);
    console.log('subscriptions columns:', r1.rows);
    
    // Check plans table columns
    const r2 = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='plans' ORDER BY ordinal_position`);
    console.log('plans columns:', r2.rows);
    
    // Check sessions table columns
    const r3 = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='sessions' ORDER BY ordinal_position`);
    console.log('sessions columns:', r3.rows);
    
    // Check users columns
    const r4 = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position`);
    console.log('users columns:', r4.rows.map(r=>r.column_name));
    
    // Test actual login to confirm DB is working
    const r5 = await pool.query(`SELECT id, email, role, token_version FROM users LIMIT 3`);
    console.log('Sample users:', r5.rows);
    
    // Check organization_members
    const r6 = await pool.query(`SELECT om.user_id, om.organization_id, om.role, u.email FROM organization_members om JOIN users u ON u.id = om.user_id LIMIT 5`);
    console.log('Sample members:', r6.rows);
    
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    await pool.end();
  }
}

main();
