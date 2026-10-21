import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.ytjqaasskfwtrnyxttso:Kdsv1986%40123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    // Check what schema users belongs to
    const r1 = await pool.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables 
      WHERE table_name='users' 
      ORDER BY table_schema
    `);
    console.log('users tables by schema:', r1.rows);
    
    // Check public.users columns
    const r2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='users' 
      ORDER BY ordinal_position
    `);
    console.log('public.users columns:', r2.rows.map(r=>r.column_name));
    
    // Check auth.users vs public.users
    const r3 = await pool.query(`SELECT COUNT(*) FROM public.users`);
    console.log('public.users count:', r3.rows[0].count);
    
    // Try login test - find user with email
    const testEmail = 'sabarnievasansv07@outlsook.com';
    const r4 = await pool.query(`SELECT id, name, email, password_hash, organization_id, role, token_version FROM public.users WHERE email = $1`, [testEmail]);
    if (r4.rows.length > 0) {
      const u = r4.rows[0];
      console.log('Found user:', {id: u.id, email: u.email, role: u.role, has_password: !!u.password_hash, org: u.organization_id, token_version: u.token_version});
    } else {
      console.log('User not found in public.users');
    }
    
    // Check JWT_SECRET env var hint - what's needed for Vercel
    console.log('\n--- Vercel ENV check ---');
    console.log('This app needs the following env vars in Vercel:');
    console.log('DATABASE_URL = postgresql://postgres.ytjqaasskfwtrnyxttso:Kdsv1986%40123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres');
    console.log('JWT_SECRET = (must be set)');
    
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    await pool.end();
  }
}

main();
