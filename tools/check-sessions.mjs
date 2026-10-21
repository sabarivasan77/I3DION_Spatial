import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.ytjqaasskfwtrnyxttso:Kdsv1986%40123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    // Check what schema sessions belongs to
    const r1 = await pool.query(`
      SELECT table_schema, table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='sessions' 
      ORDER BY table_schema, ordinal_position
    `);
    console.log('sessions in all schemas:', JSON.stringify(r1.rows, null, 2));
    
    // Check public.sessions specifically
    const r2 = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name='sessions' 
      ORDER BY table_schema
    `);
    console.log('sessions tables by schema:', r2.rows);
    
    // Try inserting into public.sessions
    try {
      const r3 = await pool.query(`SELECT COUNT(*) FROM public.sessions`);
      console.log('public.sessions count:', r3.rows[0]);
    } catch(e) {
      console.log('public.sessions error:', e.message);
    }
    
    // Check the search_path
    const r4 = await pool.query(`SHOW search_path`);
    console.log('search_path:', r4.rows[0]);
    
    // Test a simple insert into our sessions table
    try {
      const testUserId = '7663fc5d-c4b7-40ae-beb6-431e2ce0d464'; // sabarnievasansv07@outlsook.com
      const r5 = await pool.query(`
        INSERT INTO public.sessions (user_id, family_id, token_hash, organization_id, ua_hash, ip_prefix, expires_at)
        VALUES ($1, gen_random_uuid(), 'test_token_hash_123', NULL, 'test_ua', '127.0.0.1', now() + interval '14 days')
        RETURNING id, user_id, token_hash
      `, [testUserId]);
      console.log('Test session insert SUCCESS:', r5.rows[0]);
      
      // Clean up
      await pool.query(`DELETE FROM public.sessions WHERE token_hash = 'test_token_hash_123'`);
      console.log('Cleanup done');
    } catch(e) {
      console.log('Test session insert FAILED:', e.message);
    }
    
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    await pool.end();
  }
}

main();
