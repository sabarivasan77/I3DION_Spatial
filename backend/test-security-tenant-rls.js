import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { pool, ensureMigrated, withTenant } from './src/db/pool.js';

async function runTenantSecurityTests() {
  console.log('--- STARTING PHASE S2: TENANT ISOLATION & RLS VERIFICATION ---');
  await ensureMigrated();

  const orgA = crypto.randomUUID();
  const orgB = crypto.randomUUID();

  console.log(`Setting up test organizations: Org A=${orgA}, Org B=${orgB}`);

  // Create test orgs using admin pool query (superuser bypass for fixture creation)
  await pool.query(
    'INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3), ($4, $5, $6) ON CONFLICT DO NOTHING',
    [orgA, 'Tenant Org A', `org-a-${Date.now()}`, orgB, 'Tenant Org B', `org-b-${Date.now()}`]
  );

  const prodAId = crypto.randomUUID();
  const prodBId = crypto.randomUUID();

  // Insert product for Org A and Org B
  await pool.query(
    'INSERT INTO products (id, organization_id, name, slug, category) VALUES ($1, $2, $3, $4, $5)',
    [prodAId, orgA, 'Product of Org A', `prod-a-${Date.now()}`, 'General']
  );
  await pool.query(
    'INSERT INTO products (id, organization_id, name, slug, category) VALUES ($1, $2, $3, $4, $5)',
    [prodBId, orgB, 'Product of Org B', `prod-b-${Date.now()}`, 'General']
  );

  try {
    // -------------------------------------------------------------
    // TEST TENANT-01: Cross-tenant read returns 0 rows
    // -------------------------------------------------------------
    console.log('[RUNNING] TENANT-01: Cross-tenant read isolation...');
    await withTenant(orgA, async (client) => {
      // Query specifically for Org B's product
      const res = await client.query('SELECT * FROM products WHERE id = $1', [prodBId]);
      assert.equal(res.rows.length, 0, 'TENANT-01 FAILED: Org A was able to read Org B product!');

      // Org A should see its own product
      const ownRes = await client.query('SELECT * FROM products WHERE id = $1', [prodAId]);
      assert.equal(ownRes.rows.length, 1, 'TENANT-01 FAILED: Org A could not read its own product!');
      assert.equal(ownRes.rows[0].organization_id, orgA);
    });
    console.log('  -> TENANT-01 PASSED (Cross-tenant read isolation verified)');

    // -------------------------------------------------------------
    // TEST TENANT-02: Cross-tenant update/delete affects 0 rows
    // -------------------------------------------------------------
    console.log('[RUNNING] TENANT-02: Cross-tenant mutation isolation...');
    await withTenant(orgA, async (client) => {
      // Org A attempts to UPDATE Org B's product
      const updateRes = await client.query(
        'UPDATE products SET name = $1 WHERE id = $2',
        ['Hacked by Org A', prodBId]
      );
      assert.equal(updateRes.rowCount, 0, 'TENANT-02 FAILED: Org A updated Org B product!');

      // Org A attempts to DELETE Org B's product
      const deleteRes = await client.query(
        'DELETE FROM products WHERE id = $1',
        [prodBId]
      );
      assert.equal(deleteRes.rowCount, 0, 'TENANT-02 FAILED: Org A deleted Org B product!');
    });

    // Verify Org B's product was not mutated
    const verifyRes = await pool.query('SELECT name FROM products WHERE id = $1', [prodBId]);
    assert.equal(verifyRes.rows[0].name, 'Product of Org B', 'Org B product was unexpectedly modified!');
    console.log('  -> TENANT-02 PASSED (Cross-tenant write/mutation isolation verified)');

    // -------------------------------------------------------------
    // TEST TENANT-03: Context switching isolates query results
    // -------------------------------------------------------------
    console.log('[RUNNING] TENANT-03: Context switching between tenants...');
    await withTenant(orgA, async (client) => {
      const res = await client.query('SELECT id, organization_id FROM products WHERE id IN ($1, $2)', [prodAId, prodBId]);
      assert.equal(res.rows.length, 1);
      assert.equal(res.rows[0].id, prodAId);
    });

    await withTenant(orgB, async (client) => {
      const res = await client.query('SELECT id, organization_id FROM products WHERE id IN ($1, $2)', [prodAId, prodBId]);
      assert.equal(res.rows.length, 1);
      assert.equal(res.rows[0].id, prodBId);
    });
    console.log('  -> TENANT-03 PASSED (Context switching cleanly shifts tenant scope)');

    // -------------------------------------------------------------
    // TEST TENANT-04: Fail-closed on null/unset app.org_id
    // -------------------------------------------------------------
    console.log('[RUNNING] TENANT-04: Fail-closed behavior on unset tenant...');
    await withTenant(null, async (client) => {
      const res = await client.query('SELECT * FROM products WHERE id IN ($1, $2)', [prodAId, prodBId]);
      assert.equal(res.rows.length, 0, 'TENANT-04 FAILED: Unset tenant returned rows (should fail closed)!');
    });
    console.log('  -> TENANT-04 PASSED (Unset tenant is fail-closed, returns 0 rows)');

    console.log('\n======================================================');
    console.log('ALL PHASE S2 TENANT RLS TESTS PASSED (4/4)!');
    console.log('======================================================\n');
  } finally {
    // Cleanup test fixtures
    await pool.query('DELETE FROM products WHERE id IN ($1, $2)', [prodAId, prodBId]);
    await pool.query('DELETE FROM organizations WHERE id IN ($1, $2)', [orgA, orgB]);
    await pool.end();
  }
}

runTenantSecurityTests().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
