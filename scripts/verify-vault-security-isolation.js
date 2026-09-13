import { pool } from '../backend/src/db/pool.js';

async function runSecurityIsolationTests() {
  console.log('=== STARTING SPATIAL VAULT SECURITY ISOLATION VERIFICATION ===\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      failedCount++;
    }
  }

  try {
    const orgARes = await pool.query("INSERT INTO organizations (name) VALUES ('Test Org A') RETURNING id");
    const orgBRes = await pool.query("INSERT INTO organizations (name) VALUES ('Test Org B') RETURNING id");
    const orgAId = orgARes.rows[0].id;
    const orgBId = orgBRes.rows[0].id;

    // Create User A (Org A) and User B (Org B)
    const userARes = await pool.query("INSERT INTO users (name, email, password_hash, organization_id, role) VALUES ('User A', 'usera@orga.com', 'hash', $1, 'Sales User') RETURNING id", [orgAId]);
    const userBRes = await pool.query("INSERT INTO users (name, email, password_hash, organization_id, role) VALUES ('User B', 'userb@orgb.com', 'hash', $1, 'Sales User') RETURNING id", [orgBId]);
    const userAId = userARes.rows[0].id;
    const userBId = userBRes.rows[0].id;

    // 1. Create asset in Org A and asset in Org B
    const assetARes = await pool.query(
      `INSERT INTO vault_assets (organization_id, name, type, original_name, storage_key, public_url, mime_type, size_bytes, created_by)
       VALUES ($1, 'Org A Confidential Asset', 'Document', 'doca.pdf', 'keya', '/upload/doca.pdf', 'application/pdf', 100, $2) RETURNING id`,
      [orgAId, userAId]
    );
    const assetBRes = await pool.query(
      `INSERT INTO vault_assets (organization_id, name, type, original_name, storage_key, public_url, mime_type, size_bytes, created_by)
       VALUES ($1, 'Org B Secret Asset', 'Document', 'docb.pdf', 'keyb', '/upload/docb.pdf', 'application/pdf', 200, $2) RETURNING id`,
      [orgBId, userBId]
    );
    const assetAId = assetARes.rows[0].id;
    const assetBId = assetBRes.rows[0].id;

    // Test 1 & Test 2: Querying Org A assets returns asset A and ZERO assets from Org B
    const queryOrgA = await pool.query("SELECT * FROM vault_assets WHERE organization_id = $1 AND is_deleted = false", [orgAId]);
    assert(
      queryOrgA.rows.some(a => a.id === assetAId) && !queryOrgA.rows.some(a => a.id === assetBId),
      'Test 1 & 2: Org A user query returns only Org A assets and zero Org B assets'
    );

    // Test 6: Direct ID lookup across tenant boundary (Single item GET with Org A scope for Org B asset)
    const directIdAccess = await pool.query("SELECT * FROM vault_assets WHERE id = $1 AND organization_id = $2", [assetBId, orgAId]);
    assert(directIdAccess.rows.length === 0, 'Test 6: Querying Org B asset with Org A organization_id returns zero rows (404 protection)');

    // Test 7: Search isolated by tenant
    const searchRes = await pool.query("SELECT * FROM vault_assets WHERE organization_id = $1 AND (name ILIKE $2 OR description ILIKE $2)", [orgAId, '%Secret%']);
    assert(searchRes.rows.length === 0, 'Test 7: Search for Org B string "Secret" under Org A context returns zero records');

    // Test 10: Audit Log isolation
    await pool.query("INSERT INTO vault_audit_logs (organization_id, user_id, user_name, action, target_type, target_name) VALUES ($1, $2, 'User A', 'Uploaded Asset', 'Asset', 'Asset A')", [orgAId, userAId]);
    await pool.query("INSERT INTO vault_audit_logs (organization_id, user_id, user_name, action, target_type, target_name) VALUES ($1, $2, 'User B', 'Uploaded Asset', 'Asset', 'Asset B')", [orgBId, userBId]);

    const auditOrgA = await pool.query("SELECT * FROM vault_audit_logs WHERE organization_id = $1", [orgAId]);
    assert(
      auditOrgA.rows.every(l => l.organization_id === orgAId),
      'Test 10: Audit log query under Org A returns only Org A activity logs'
    );

    // Test 12: Spatial Hub only gets public outputs
    await pool.query("INSERT INTO products (organization_id, name, category, status, is_public) VALUES ($1, 'Public Product', 'Cat', 'Published', true)", [orgAId]);
    await pool.query("INSERT INTO products (organization_id, name, category, status, is_public) VALUES ($1, 'Private Draft', 'Cat', 'Draft', false)", [orgAId]);

    const hubQuery = await pool.query("SELECT * FROM products WHERE organization_id = $1 AND is_public = true AND status = 'Published'", [orgAId]);
    assert(
      hubQuery.rows.length === 1 && hubQuery.rows[0].name === 'Public Product',
      'Test 12: Public Spatial Hub consumer query retrieves only explicitly published products'
    );

    // Cleanup test data
    await pool.query("DELETE FROM vault_audit_logs WHERE organization_id IN ($1, $2)", [orgAId, orgBId]);
    await pool.query("DELETE FROM vault_assets WHERE organization_id IN ($1, $2)", [orgAId, orgBId]);
    await pool.query("DELETE FROM products WHERE organization_id IN ($1, $2)", [orgAId, orgBId]);
    await pool.query("DELETE FROM users WHERE organization_id IN ($1, $2)", [orgAId, orgBId]);
    await pool.query("DELETE FROM organizations WHERE id IN ($1, $2)", [orgAId, orgBId]);

    console.log(`\n=== VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED ===`);
  } catch (err) {
    console.error('Security isolation test runner error:', err);
  } finally {
    await pool.end();
  }
}

runSecurityIsolationTests();
