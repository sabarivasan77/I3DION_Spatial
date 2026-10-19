import assert from 'node:assert';
import { evaluatePermission, ROLE_PERMISSIONS_TABLE } from '../../src/services/core/permissionService.js';

console.log('🧪 Running I3DION Platform Core & Cross-Tenant RBAC Automated Tests...\n');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ Passed: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ Failed: ${name}\n   Error: ${err.message}`);
    failed++;
  }
}

async function runAll() {
  // Test 1: Unauthenticated request must be denied
  await (async () => {
    const res = await evaluatePermission({
      user: null,
      action: 'vault.asset.read',
      targetOrganizationId: 'org_acme'
    });
    assert.strictEqual(res.allowed, false, 'Unauthenticated user must not be allowed');
    assert.strictEqual(res.denialReason, 'Authentication required');
    console.log('✅ Passed: Unauthenticated request rejected with Authentication required');
    passed++;
  })();

  // Test 2: Cross-Tenant Isolation (Tenant A blocked from Tenant B)
  await (async () => {
    const userTenantA = {
      id: 'usr_alpha_1',
      organizationId: 'org_alpha',
      role: 'Admin'
    };
    const res = await evaluatePermission({
      user: userTenantA,
      action: 'vault.asset.read',
      targetOrganizationId: 'org_beta'
    });
    assert.strictEqual(res.allowed, false, 'Tenant A user must not access Tenant B');
    assert.ok(res.denialReason.includes('Cross-tenant access forbidden'), 'Expected cross-tenant denial reason');
    console.log('✅ Passed: Cross-Tenant Isolation strictly forbids Tenant A accessing Tenant B');
    passed++;
  })();

  // Test 3: Same-Tenant Authorized Action
  await (async () => {
    const userTenantA = {
      id: 'usr_alpha_1',
      organizationId: 'org_alpha',
      role: 'Admin'
    };
    const res = await evaluatePermission({
      user: userTenantA,
      action: 'vault.asset.create',
      targetOrganizationId: 'org_alpha'
    });
    assert.strictEqual(res.allowed, true, 'Tenant A Admin must be permitted vault.asset.create');
    assert.strictEqual(res.denialReason, null);
    console.log('✅ Passed: Same-tenant authorized action succeeds');
    passed++;
  })();

  // Test 4: Role Hierarchy / Least Privilege (Viewer denied deletion)
  await (async () => {
    const viewer = {
      id: 'usr_alpha_2',
      organizationId: 'org_alpha',
      role: 'Viewer'
    };
    const res = await evaluatePermission({
      user: viewer,
      action: 'vault.asset.delete',
      targetOrganizationId: 'org_alpha'
    });
    assert.strictEqual(res.allowed, false, 'Viewer must not be permitted vault.asset.delete');
    assert.ok(res.denialReason.includes("lacks permission for 'vault.asset.delete'"));
    console.log('✅ Passed: Least privilege enforced - Viewer denied asset deletion');
    passed++;
  })();

  // Test 5: Super Admin Tenant Bypass
  await (async () => {
    const superAdmin = {
      id: 'usr_root',
      organizationId: 'org_platform',
      role: 'Super Admin'
    };
    const res = await evaluatePermission({
      user: superAdmin,
      action: 'vault.asset.delete',
      targetOrganizationId: 'org_customer_xyz'
    });
    assert.strictEqual(res.allowed, true, 'Super Admin must bypass organization check');
    console.log('✅ Passed: Super Admin can manage across tenant boundaries');
    passed++;
  })();

  // Test 6: Public Visitor allowed Hub public views but denied proprietary asset modification
  await (async () => {
    const visitor = {
      id: 'usr_visitor',
      organizationId: null,
      role: 'Public Visitor'
    };
    const allowedRes = await evaluatePermission({
      user: visitor,
      action: 'hub.public.view',
      targetOrganizationId: null
    });
    assert.strictEqual(allowedRes.allowed, true, 'Public Visitor allowed hub.public.view');

    const deniedRes = await evaluatePermission({
      user: visitor,
      action: 'vault.asset.create',
      targetOrganizationId: 'org_acme'
    });
    assert.strictEqual(deniedRes.allowed, false, 'Public Visitor denied vault.asset.create');
    console.log('✅ Passed: Public Visitor permissions scoped strictly to Hub public interactions');
    passed++;
  })();

  // Summary
  console.log(`\n📊 Platform Core RBAC Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    setImmediate(() => process.exit(1));
  }
  setImmediate(() => process.exit(0));
}

runAll().catch((err) => {
  console.error('Fatal test error:', err);
  setImmediate(() => process.exit(1));
});
