import { pool, query } from '../src/db/pool.js';

async function test() {
  console.log('Testing role creation and RLS setup...');
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'i3dion_app') THEN
        CREATE ROLE i3dion_app WITH LOGIN PASSWORD 'i3dion_app_secret' NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
      END IF;
    END $$;
    GRANT i3dion_app TO postgres;
    GRANT USAGE ON SCHEMA public TO i3dion_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO i3dion_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO i3dion_app;
  `);

  console.log('Role i3dion_app verified.');

  // Test with products table: enable RLS and force RLS
  await query(`
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE products FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_policy ON products;
    CREATE POLICY tenant_isolation_policy ON products
      FOR ALL
      USING (organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid)
      WITH CHECK (organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid);
  `);
  console.log('RLS applied to products table.');

  // Now test querying as i3dion_app with org1 vs org2
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL ROLE i3dion_app');
    await client.query("SELECT set_config('app.org_id', '00000000-0000-0000-0000-000000000001', true)");
    const res1 = await client.query('SELECT count(*) FROM products');
    console.log('Count for Org 1 (should be 0 or org1 count):', res1.rows[0].count);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }

  // Count without setting app.org_id (should be 0)
  const client2 = await pool.connect();
  try {
    await client2.query('BEGIN');
    await client2.query('SET LOCAL ROLE i3dion_app');
    const resNoOrg = await client2.query('SELECT count(*) FROM products');
    console.log('Count without Org ID (should be 0):', resNoOrg.rows[0].count);
    await client2.query('ROLLBACK');
  } finally {
    client2.release();
  }

  await pool.end();
}

test().catch(e => {
  console.error('Error during test:', e);
  process.exit(1);
});
