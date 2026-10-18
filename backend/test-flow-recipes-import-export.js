import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool } from './src/db/pool.js';
import { config } from './src/config.js';

const BASE_URL = 'http://localhost:4000/api';

async function runPhase6Tests() {
  console.log('================================================================');
  console.log('⚡ I3DION Flow: Phase 6 Recipes, Import & Export Test Suite');
  console.log('================================================================\n');

  const orgAId = crypto.randomUUID();
  const userAId = crypto.randomUUID();
  const orgBId = crypto.randomUUID();
  const userBId = crypto.randomUUID();

  // Setup Org A and User A
  await pool.query(
    `INSERT INTO organizations (id, name, slug) VALUES ($1, 'Recipe Org A', $2) ON CONFLICT DO NOTHING`,
    [orgAId, `recipe-org-a-${Date.now()}`]
  );
  await pool.query(
    `INSERT INTO users (id, organization_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'Recipe Engineer A', 'Admin', 'hash_test') ON CONFLICT DO NOTHING`,
    [userAId, orgAId, `eng-a-${Date.now()}@domain.com`]
  );

  // Setup Org B and User B for tenant isolation testing
  await pool.query(
    `INSERT INTO organizations (id, name, slug) VALUES ($1, 'Recipe Org B', $2) ON CONFLICT DO NOTHING`,
    [orgBId, `recipe-org-b-${Date.now()}`]
  );
  await pool.query(
    `INSERT INTO users (id, organization_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'Recipe Engineer B', 'Admin', 'hash_test') ON CONFLICT DO NOTHING`,
    [userBId, orgBId, `eng-b-${Date.now()}@domain.com`]
  );

  const tokenA = jwt.sign(
    { sub: userAId, userId: userAId, organization_id: orgAId, role: 'Admin', email: `eng-a@domain.com` },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const tokenB = jwt.sign(
    { sub: userBId, userId: userBId, organization_id: orgBId, role: 'Admin', email: `eng-b@domain.com` },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  async function request(path, options = {}, token = tokenA) {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data, headers: res.headers };
  }

  let passed = 0;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: GET /api/flows/recipes — List Industrial Template Catalog
    // -------------------------------------------------------------------------
    console.log('Test 1: GET /api/flows/recipes — Listing industrial recipe catalog...');
    const recipesRes = await request('/flows/recipes');
    assert.equal(recipesRes.status, 200);
    assert(Array.isArray(recipesRes.data.recipes), 'Should return recipes array');
    assert(recipesRes.data.recipes.length >= 4, `Expected at least 4 recipes (got ${recipesRes.data.recipes.length})`);

    const recipeKeys = recipesRes.data.recipes.map((r) => r.key);
    assert(recipeKeys.includes('rfq_lead_qualification'), 'Must include 3D RFQ recipe');
    assert(recipeKeys.includes('hotspot_dwell_alert'), 'Must include Hotspot alert recipe');
    assert(recipeKeys.includes('cad_proposal_dispatcher'), 'Must include CAD proposal recipe');
    assert(recipeKeys.includes('inventory_webhook_sync'), 'Must include Outbox sync recipe');

    console.log(`  ✓ Successfully retrieved ${recipesRes.data.recipes.length} standard industrial recipes`);
    passed++;

    // -------------------------------------------------------------------------
    // TEST 2: POST /api/flows/recipes/:key/instantiate — 1-Click Instantiation
    // -------------------------------------------------------------------------
    console.log('\nTest 2: POST /api/flows/recipes/:key/instantiate — Instantiating RFQ recipe...');
    const instantiateRes = await request('/flows/recipes/rfq_lead_qualification/instantiate', {
      method: 'POST',
      body: JSON.stringify({
        nameOverride: 'Custom Enterprise RFQ Flow',
      }),
    });

    assert.equal(instantiateRes.status, 201);
    const flowA = instantiateRes.data.flow;
    assert.equal(flowA.name, 'Custom Enterprise RFQ Flow');
    assert.equal(flowA.organization_id, orgAId);
    assert.equal(flowA.status, 'draft');

    const defA = flowA.flow_definition;
    assert.equal(defA.nodes.length, 5, 'Should have exactly 5 nodes');
    assert.equal(defA.edges.length, 4, 'Should have exactly 4 edges');

    // Test live execution of instantiated recipe
    const triggerRes = await request(`/flows/${flowA.id}/trigger`, {
      method: 'POST',
      body: JSON.stringify({
        eventName: 'spatial.rfq.submitted',
        dwellTimeSec: 65,
        company: 'Apex Precision Engineering',
        contactName: 'David Sterling',
        email: 'david@apex-precision.com',
        productName: 'High-Pressure Subsea Manifold',
      }),
    });

    assert.equal(triggerRes.status, 200);
    assert.equal(triggerRes.data.run.status, 'completed');
    console.log(`  ✓ Instantiated flow ${flowA.id} from recipe and executed run ${triggerRes.data.run.id} with 100% success`);
    passed++;

    // -------------------------------------------------------------------------
    // TEST 3: GET /api/flows/:id/export — Sanitized Export Package
    // -------------------------------------------------------------------------
    console.log('\nTest 3: GET /api/flows/:id/export — Exporting sanitized flow package...');
    const exportRes = await request(`/flows/${flowA.id}/export`);
    assert.equal(exportRes.status, 200);
    const pkg = exportRes.data;

    assert.equal(pkg.product, 'I3DION Flow');
    assert.equal(pkg.schemaVersion, '1.0');
    assert(pkg.flow, 'Must contain flow container');
    assert.equal(pkg.flow.name, 'Custom Enterprise RFQ Flow');
    assert(pkg.flow.flowDefinition.nodes.length === 5, 'Exported nodes count must match');
    assert(pkg.flow.flowDefinition.edges.length === 4, 'Exported edges count must match');

    // Check attachment header
    const disposition = exportRes.headers.get('content-disposition');
    assert(disposition && disposition.includes('attachment'), 'Must set attachment header');

    console.log(`  ✓ Exported sanitized package "${pkg.flow.name}" (schema v${pkg.schemaVersion})`);
    passed++;

    // -------------------------------------------------------------------------
    // TEST 4: POST /api/flows/import — Cross-Tenant Import & ID Regeneration
    // -------------------------------------------------------------------------
    console.log('\nTest 4: POST /api/flows/import — Importing package into Tenant B...');
    const importRes = await request('/flows/import', {
      method: 'POST',
      body: JSON.stringify(pkg),
    }, tokenB);

    assert.equal(importRes.status, 201);
    const flowB = importRes.data.flow;
    assert.equal(flowB.organization_id, orgBId, 'Flow must belong to Org B');
    assert(flowB.name.includes('(Imported)'), 'Imported flow name must be annotated');
    assert.notEqual(flowB.id, flowA.id, 'Imported flow must have unique new ID');

    // Verify node IDs were regenerated to avoid collisions
    const importedNodeIds = flowB.flow_definition.nodes.map((n) => n.id);
    const originalNodeIds = flowA.flow_definition.nodes.map((n) => n.id);
    for (const nid of importedNodeIds) {
      assert(!originalNodeIds.includes(nid), `Imported node ID "${nid}" must not collide with original`);
    }

    // Tenant isolation verification: Tenant A must not access Tenant B's flow
    const crossTenantGet = await request(`/flows/${flowB.id}`, {}, tokenA);
    assert.equal(crossTenantGet.status, 404, 'Tenant A must receive 404 trying to read Tenant B flow');

    console.log(`  ✓ Imported flow ${flowB.id} for Org B with freshly generated node/edge UUIDs`);
    console.log(`  ✓ Multi-tenant boundary verified: Tenant A blocked from accessing Tenant B imported flow`);
    passed++;

    // -------------------------------------------------------------------------
    // TEST 5: Reject Invalid & Cyclic Imports (Kahn DAG Algorithm)
    // -------------------------------------------------------------------------
    console.log('\nTest 5: Validating error handling & cycle rejection during import...');

    // Attempt 1: Cyclic Graph (A -> B -> A)
    const cyclicPackage = {
      flow: {
        name: 'Forbidden Cyclic Flow',
        flowDefinition: {
          nodes: [
            { id: 'node_a', type: 'action', data: { label: 'A' } },
            { id: 'node_b', type: 'action', data: { label: 'B' } },
          ],
          edges: [
            { id: 'e1', source: 'node_a', target: 'node_b' },
            { id: 'e2', source: 'node_b', target: 'node_a' }, // Cycle!
          ],
        },
      },
    };

    const cyclicRes = await request('/flows/import', {
      method: 'POST',
      body: JSON.stringify(cyclicPackage),
    });
    assert.equal(cyclicRes.status, 400, 'Cyclic workflow import must be rejected with HTTP 400');
    assert(cyclicRes.data.error.includes('Cyclic dependency'), 'Error message must specify cycle');

    // Attempt 2: Missing source node reference
    const missingNodePackage = {
      flow: {
        name: 'Broken Graph Flow',
        flowDefinition: {
          nodes: [{ id: 'node_1', type: 'action', data: { label: '1' } }],
          edges: [{ id: 'e1', source: 'node_1', target: 'ghost_node' }],
        },
      },
    };

    const missingNodeRes = await request('/flows/import', {
      method: 'POST',
      body: JSON.stringify(missingNodePackage),
    });
    assert.equal(missingNodeRes.status, 400);
    assert(missingNodeRes.data.error.includes('missing target node'));

    console.log('  ✓ Cyclic graph correctly blocked by Kahn DAG validator');
    console.log('  ✓ Broken node reference correctly blocked with HTTP 400');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 6: Execution of Imported Workflow in Tenant B
    // -------------------------------------------------------------------------
    console.log('\nTest 6: Executing imported workflow in Tenant B runtime...');
    const execImportedRes = await request(`/flows/${flowB.id}/trigger`, {
      method: 'POST',
      body: JSON.stringify({
        eventName: 'spatial.rfq.submitted',
        dwellTimeSec: 15, // Under 45 -> routes to standard lead
        company: 'Nordic Robotics AS',
        contactName: 'Astrid Lind',
        email: 'astrid@nordic-robotics.no',
        productName: '6-Axis Articulated Arm Digital Twin',
      }),
    }, tokenB);

    assert.equal(execImportedRes.status, 200);
    assert.equal(execImportedRes.data.run.status, 'completed');
    assert.equal(execImportedRes.data.run.organization_id, orgBId);

    console.log(`  ✓ Imported flow run ${execImportedRes.data.run.id} completed with status "completed"`);
    passed++;

    console.log('\n================================================================');
    console.log(`🎉 ALL PHASE 6 RECIPE & IMPORT/EXPORT TESTS PASSED (${passed}/${passed})`);
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ Phase 6 Test Failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runPhase6Tests();
