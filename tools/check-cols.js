import pg from 'pg';

async function checkCols() {
  const p = new pg.Pool({
    connectionString: 'postgresql://postgres.ytjqaasskfwtrnyxttso:Kdsv1986Spatial2026@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  const tables = ['users', 'organizations', 'organization_members', 'subscriptions', 'sessions', 'user_sessions', 'analytics_events'];
  for (const t of tables) {
    const res = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1", [t]);
    console.log(`\nTable: ${t}`);
    console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }
  await p.end();
}

checkCols().catch(console.error);
