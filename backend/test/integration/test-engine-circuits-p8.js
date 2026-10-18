/**
 * Phase P8 Integration Test Suite: Omni Engine 3D Scenes & Circuits
 * 
 * Tests:
 *  - ENG-01: Non-destructive Scene Document: move/rotate/scale/recolor/hide/keyframe with undo/redo ×10; source GLB hash remains 100% untouched.
 *  - ENG-02: Optimistic concurrency control: stale save with outdated revision rejected with HTTP 409 Conflict.
 *  - ENG-03: Circuits compiler: compiles 70-chip catalog graph to deterministic IR.
 *  - ENG-04: Circuit security guards: rejects circular loop / cycle and oversize circuits (>500 nodes).
 *  - ENG-05: Same IR gives identical deterministic results in Editor and Player runtimes.
 *  - ENG-06: Flagship interaction journey: "Click part -> animation -> variant -> spec card -> quote request".
 *  - ENG-07: Ecosystem event wiring: Circuit execution dispatches Submit Lead, Track Event (Lens), and Emit Flow Event (Flow Outbox).
 *  - ENG-08: Studio widget integration: viewer_3d widget successfully resolves published scene, hotspots, and AR capability matrix.
 */

import assert from 'node:assert';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { app } from '../../src/server.js';
import { pool, ensureMigrated } from '../../src/db/pool.js';
import { config } from '../../src/config.js';
import { SceneCommandBus, assertGlbIntegrityUnchanged } from '../../src/services/engine/sceneDocumentService.js';
import { compileCircuitGraph, CHIP_CATALOG, TOTAL_REGISTERED_CHIPS } from '../../src/services/engine/circuitsCompiler.js';
import { interpretCircuitIR } from '../../src/services/engine/circuitsInterpreter.js';

console.log('================================================================');
console.log('⚙️  I3DION Phase P8: Omni Engine 3D Scenes & Circuits Test Suite');
console.log('================================================================\n');

let passedCount = 0;
let failedCount = 0;

function pass(name, details = '') {
  console.log(`✅ [PASS] ${name}`);
  if (details) console.log(`   ${details}`);
  passedCount++;
}

function fail(name, error) {
  console.error(`❌ [FAIL] ${name}`);
  console.error(`   Error: ${error.message || error}`);
  failedCount++;
}

async function runSuite() {
  await ensureMigrated();

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const testRunId = Date.now();
  let orgId = null;
  let adminUserId = null;
  let adminToken = null;
  let testVaultAssetId = null;
  const originalGlbPayload = 'GLB_BINARY_CONTENT_DETERMINISTIC_HASH_' + testRunId;
  const originalSha256 = crypto.createHash('sha256').update(originalGlbPayload).digest('hex');
  let experienceId = null;

  try {
    // -------------------------------------------------------------
    // SETUP: Tenant, Admin User, Vault Asset & Experience
    // -------------------------------------------------------------
    const orgRes = await pool.query(
      `INSERT INTO organizations (name, website, profile, storage_quota_bytes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name`,
      [
        `Engine Circuits Org ${testRunId}`,
        'https://engine.i3dion.com',
        'Omni Engine Scenes & Circuits Verification Tenant',
        107374182400
      ]
    );
    orgId = orgRes.rows[0].id;

    const userRes = await pool.query(
      `INSERT INTO users (organization_id, email, password_hash, role, name, token_version)
       VALUES ($1, $2, $3, 'Admin', 'Engine Engineer', 0)
       RETURNING id, email, role, organization_id`,
      [orgId, `engine-admin-${testRunId}@i3dion.com`, 'test_pw_hash']
    );
    adminUserId = userRes.rows[0].id;

    await pool.query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       VALUES ($1, $2, 'Admin') ON CONFLICT DO NOTHING`,
      [orgId, adminUserId]
    );

    adminToken = jwt.sign(
      { sub: adminUserId, userId: adminUserId, email: userRes.rows[0].email, role: 'Admin', organization_id: orgId, organizationId: orgId, org: orgId, ver: 0 },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Create a real Vault Asset with immutable checksum
    const assetRes = await pool.query(
      `INSERT INTO vault_assets (
        organization_id, name, original_name, type, mime_type,
        storage_key, checksum_sha256, size_bytes, public_url, created_by
      ) VALUES ($1, $2, $3, '3D Model', 'model/gltf-binary', $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        orgId,
        'Industrial Pump CAD',
        'industrial_pump.glb',
        `vault/${orgId}/pump-${testRunId}.glb`,
        originalSha256,
        1048576,
        `https://storage.i3dion.com/vault/${orgId}/pump-${testRunId}.glb`,
        adminUserId
      ]
    );
    testVaultAssetId = assetRes.rows[0].id;

    // Create an initial spatial experience
    const expRes = await pool.query(
      `INSERT INTO spatial_experiences (
        organization_id, name, slug, description, status, vault_asset_id,
        pinned_version_number, revision, scene_config, hotspots, animation_config,
        blueprint_config, ar_config, created_by
      ) VALUES ($1, $2, $3, $4, 'Draft', $5, 1, 1, '{}', '[]', '{}', '{}', '{}', $6)
      RETURNING id, slug, revision`,
      [
        orgId,
        'Heavy Industrial Pump Twin',
        `pump-twin-${testRunId}`,
        'High pressure centrifugal pump digital twin',
        testVaultAssetId,
        adminUserId
      ]
    );
    experienceId = expRes.rows[0].id;

    // -------------------------------------------------------------
    // TEST 1: ENG-01 Non-destructive Scene Document & Command Bus
    // -------------------------------------------------------------
    try {
      const initialSceneDoc = {
        id: experienceId,
        name: 'Pump Main Scene',
        sourceAssetId: testVaultAssetId,
        sourceAssetSha256: originalSha256,
        objects: {},
        timeline: { duration: 5.0, currentTime: 0, tracks: [] },
        revision: 1
      };

      const bus = new SceneCommandBus(initialSceneDoc);

      // 10 distinct commands
      bus.execute({ type: 'MOVE_OBJECT', targetId: 'impeller', payload: { position: [0.5, 1.2, -0.4] } });
      bus.execute({ type: 'ROTATE_OBJECT', targetId: 'impeller', payload: { rotation: [0, 90, 0] } });
      bus.execute({ type: 'SCALE_OBJECT', targetId: 'impeller', payload: { scale: [1.2, 1.2, 1.2] } });
      bus.execute({ type: 'RECOLOR_OBJECT', targetId: 'impeller', payload: { materialOverride: { color: '#00E5FF', metalness: 0.9 } } });
      bus.execute({ type: 'SET_VISIBILITY', targetId: 'casing', payload: { visible: false } });
      bus.execute({ type: 'ADD_KEYFRAME', targetId: 'impeller', payload: { property: 'position', keyframe: { time: 0.0, value: [0, 0, 0], easing: 'linear' } } });
      bus.execute({ type: 'ADD_KEYFRAME', targetId: 'impeller', payload: { property: 'position', keyframe: { time: 3.0, value: [0.5, 1.2, -0.4], easing: 'easeInOut' } } });
      bus.execute({ type: 'MOVE_OBJECT', targetId: 'bearing_seal', payload: { position: [0, 2.0, 0] } });
      bus.execute({ type: 'RECOLOR_OBJECT', targetId: 'bearing_seal', payload: { materialOverride: { color: '#FF9100' } } });
      bus.execute({ type: 'SET_VISIBILITY', targetId: 'bearing_seal', payload: { visible: true } });

      const docAfter10 = bus.getDoc();
      assert.strictEqual(docAfter10.objects.impeller.materialOverride.color, '#00E5FF');
      assert.strictEqual(docAfter10.objects.casing.visible, false);
      assert.strictEqual(docAfter10.timeline.tracks.length, 1);
      assert.strictEqual(docAfter10.timeline.tracks[0].keyframes.length, 2);

      // Undo 10 times -> returns back to clean state
      for (let i = 0; i < 10; i++) {
        bus.undo();
      }
      const docAfterUndo = bus.getDoc();
      assert.deepStrictEqual(docAfterUndo.objects, {});
      assert.deepStrictEqual(docAfterUndo.timeline.tracks, []);

      // Redo 10 times -> fully restored
      for (let i = 0; i < 10; i++) {
        bus.redo();
      }
      const docAfterRedo = bus.getDoc();
      assert.strictEqual(docAfterRedo.objects.impeller.materialOverride.color, '#00E5FF');
      assert.strictEqual(docAfterRedo.objects.casing.visible, false);

      // Save scene document via API
      const saveRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/scene-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sceneDocument: docAfterRedo,
          expectedRevision: 1,
          originalSha256
        })
      });

      assert.strictEqual(saveRes.status, 200, 'Saving scene document returned 200 OK');
      const saveBody = await saveRes.json();
      assert.strictEqual(saveBody.revision, 2, 'Revision incremented to 2');

      // Verify underlying GLB file checksum in Vault was NOT modified
      await assertGlbIntegrityUnchanged(testVaultAssetId, originalSha256);

      pass('ENG-01: Non-destructive Scene Document & Command Bus', '10x Undo/Redo verified, revision bumped to 2, GLB SHA-256 completely untouched.');
    } catch (err) {
      fail('ENG-01: Non-destructive Scene Document & Command Bus', err);
    }

    // -------------------------------------------------------------
    // TEST 2: ENG-02 Optimistic Concurrency Control (OCC)
    // -------------------------------------------------------------
    try {
      // Current DB revision is 2. Stale client sends expectedRevision: 1
      const staleSaveRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/scene-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sceneDocument: { objects: { fake: {} } },
          expectedRevision: 1 // Stale revision!
        })
      });

      assert.strictEqual(staleSaveRes.status, 409, 'Stale save rejected with HTTP 409 Conflict');
      const staleBody = await staleSaveRes.json();
      assert.strictEqual(staleBody.currentRevision, 2, 'Response includes active current revision');

      // Correct save with expectedRevision: 2 succeeds
      const validSaveRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/scene-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sceneDocument: { objects: { impeller: { position: [1, 1, 1] } } },
          expectedRevision: 2
        })
      });

      assert.strictEqual(validSaveRes.status, 200, 'Save with matching revision succeeded');
      const validBody = await validSaveRes.json();
      assert.strictEqual(validBody.revision, 3, 'Revision bumped to 3');

      pass('ENG-02: Optimistic Concurrency Control (OCC)', 'HTTP 409 returned on revision mismatch, valid save bumped revision to 3.');
    } catch (err) {
      fail('ENG-02: Optimistic Concurrency Control (OCC)', err);
    }

    // -------------------------------------------------------------
    // TEST 3: ENG-03 Circuits Compiler & 70-Chip Catalog
    // -------------------------------------------------------------
    try {
      // Verify Chip Catalog completeness
      assert.strictEqual(TOTAL_REGISTERED_CHIPS, 70, 'Catalog exactly matches 70 chips');

      // API chip catalog check
      const chipRes = await fetch(`${baseUrl}/api/engine/chips`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const chipData = await chipRes.json();
      assert.strictEqual(chipData.total, 70);
      assert.ok(chipData.chips['on_object_click'], 'on_object_click event chip present');
      assert.ok(chipData.chips['play_animation'], 'play_animation action chip present');
      assert.ok(chipData.chips['submit_lead'], 'submit_lead ecosystem chip present');
      assert.ok(chipData.chips['branch'], 'branch logic chip present');
      assert.ok(chipData.chips['set_variable'], 'set_variable variable chip present');

      // Build valid DAG graph
      const graph = {
        nodes: [
          { id: 'n1', chipId: 'on_object_click', params: { targetId: 'pump_impeller' } },
          { id: 'n2', chipId: 'play_animation', params: { clipName: 'impeller_spin', speed: 1.5 } },
          { id: 'n3', chipId: 'set_variant', params: { variantId: 'anodized_bronze' } },
          { id: 'n4', chipId: 'show_spec_card', params: { title: 'High Flow Impeller', specs: { gpm: 1200 } } },
          { id: 'n5', chipId: 'add_to_quote', params: { productId: 'part_bronze_impeller', quantity: 1 } }
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2' },
          { id: 'e2', source: 'n2', target: 'n3' },
          { id: 'e3', source: 'n3', target: 'n4' },
          { id: 'e4', source: 'n4', target: 'n5' }
        ]
      };

      const compileRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/circuits/compile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ graph, save: true })
      });

      assert.strictEqual(compileRes.status, 200, 'Circuit compiled successfully');
      const compiled = await compileRes.json();
      assert.strictEqual(compiled.valid, true);
      assert.strictEqual(compiled.totalChips, 5);
      assert.ok(compiled.ir.entrypoints['on_object_click:pump_impeller']);
      assert.strictEqual(compiled.ir.instructions['n1'].nextSteps[0], 'n2');

      pass('ENG-03: Circuits Compiler & 70-Chip Catalog', '70-chip catalog verified, Kahn DAG compiled to deterministic Circuit IR.');
    } catch (err) {
      fail('ENG-03: Circuits Compiler & 70-Chip Catalog', err);
    }

    // -------------------------------------------------------------
    // TEST 4: ENG-04 Circuit Security Guards: Loop/Cycle & Oversize
    // -------------------------------------------------------------
    try {
      // 1. Cycle detection (A -> B -> C -> A)
      const cyclicGraph = {
        nodes: [
          { id: 'node_a', chipId: 'on_scene_loaded' },
          { id: 'node_b', chipId: 'play_animation' },
          { id: 'node_c', chipId: 'set_variant' }
        ],
        edges: [
          { id: 'c1', source: 'node_a', target: 'node_b' },
          { id: 'c2', source: 'node_b', target: 'node_c' },
          { id: 'c3', source: 'node_c', target: 'node_a' } // Circular loop!
        ]
      };

      let cycleErrorCaught = false;
      try {
        compileCircuitGraph(cyclicGraph);
      } catch (e) {
        cycleErrorCaught = true;
        assert.ok(e.message.includes('cycle detected'), 'Cycle error message matches');
      }
      assert.strictEqual(cycleErrorCaught, true, 'Kahn topological sort caught cycle');

      // 2. Complexity limit cap (>500 nodes)
      const hugeNodes = [];
      for (let i = 0; i <= 501; i++) {
        hugeNodes.push({ id: `huge_${i}`, chipId: 'constant_value', params: { value: i } });
      }

      let oversizeErrorCaught = false;
      try {
        compileCircuitGraph({ nodes: hugeNodes, edges: [] });
      } catch (e) {
        oversizeErrorCaught = true;
        assert.ok(e.message.includes('500 limit'), 'Complexity limit error matches');
      }
      assert.strictEqual(oversizeErrorCaught, true, 'Oversize circuit rejected (>500 nodes)');

      pass('ENG-04: Circuit Security Guards', 'Circular loops detected via Kahn DAG and 500-chip complexity limit enforced.');
    } catch (err) {
      fail('ENG-04: Circuit Security Guards', err);
    }

    // -------------------------------------------------------------
    // TEST 5: ENG-05 Same IR Gives Identical Deterministic Results
    // -------------------------------------------------------------
    try {
      const mathGraph = {
        nodes: [
          { id: 'start', chipId: 'on_scene_loaded' },
          { id: 'v1', chipId: 'set_variable', params: { varName: 'torque_nm', value: 450 } },
          { id: 'v2', chipId: 'set_variable', params: { varName: 'efficiency_pct', value: 92.5 } }
        ],
        edges: [
          { id: 'me1', source: 'start', target: 'v1' },
          { id: 'me2', source: 'v1', target: 'v2' }
        ]
      };

      const mathIR = compileCircuitGraph(mathGraph);

      // 1. Editor runtime execution
      const editorResult = await interpretCircuitIR(mathIR, 'on_scene_loaded', {}, { organizationId: orgId });

      // 2. Publish experience to test Player runtime execution
      await pool.query(
        `UPDATE spatial_experiences
         SET status = 'Published', circuits_ir = $1, published_snapshot = $2
         WHERE id = $3`,
        [
          JSON.stringify(mathIR),
          JSON.stringify({ circuitsIR: mathIR }),
          experienceId
        ]
      );

      const expSlug = (await pool.query('SELECT slug FROM spatial_experiences WHERE id = $1', [experienceId])).rows[0].slug;

      const playerRes = await fetch(`${baseUrl}/api/engine/published/${expSlug}/circuits/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTrigger: 'on_scene_loaded',
          eventPayload: {}
        })
      });

      assert.strictEqual(playerRes.status, 200, 'Public Player circuit execution 200 OK');
      const playerResult = await playerRes.json();

      // Assert bit-for-bit equivalence in execution traces and variables
      assert.deepStrictEqual(editorResult.variables, playerResult.variables);
      assert.strictEqual(editorResult.stepsExecuted, playerResult.stepsExecuted);
      assert.deepStrictEqual(
        editorResult.trace.map(t => t.chipId),
        playerResult.trace.map(t => t.chipId)
      );

      pass('ENG-05: Deterministic IR in Editor & Player Runtimes', 'Circuit IR executed with identical traces and state across runtimes.');
    } catch (err) {
      fail('ENG-05: Deterministic IR in Editor & Player Runtimes', err);
    }

    // -------------------------------------------------------------
    // TEST 6: ENG-06 Flagship Demo Interaction Journey
    // -------------------------------------------------------------
    try {
      const flagshipGraph = {
        nodes: [
          { id: 'fs1', chipId: 'on_object_click', params: { targetId: 'rotor_casing' } },
          { id: 'fs2', chipId: 'play_animation', params: { clipName: 'explode_casing_view' } },
          { id: 'fs3', chipId: 'set_variant', params: { variantId: 'duplex_stainless' } },
          { id: 'fs4', chipId: 'show_spec_card', params: { title: 'Duplex Stainless Steel Casing', specs: { yieldStrength: '450 MPa', corrosionClass: 'PREN 35+' } } },
          { id: 'fs5', chipId: 'add_to_quote', params: { productId: 'duplex_casing_8in', quantity: 2 } }
        ],
        edges: [
          { id: 'fe1', source: 'fs1', target: 'fs2' },
          { id: 'fe2', source: 'fs2', target: 'fs3' },
          { id: 'fe3', source: 'fs3', target: 'fs4' },
          { id: 'fe4', source: 'fs4', target: 'fs5' }
        ]
      };

      const flagshipIR = compileCircuitGraph(flagshipGraph);

      const execRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/circuits/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ir: flagshipIR,
          eventTrigger: 'on_object_click',
          eventPayload: { targetId: 'rotor_casing' }
        })
      });

      assert.strictEqual(execRes.status, 200, 'Flagship execution returned 200 OK');
      const execBody = await execRes.json();
      assert.strictEqual(execBody.executed, true);
      assert.strictEqual(execBody.finalState.activeAnimation, 'explode_casing_view');
      assert.strictEqual(execBody.finalState.activeVariant, 'duplex_stainless');
      assert.strictEqual(execBody.finalState.visibleCards.length, 1);
      assert.strictEqual(execBody.finalState.visibleCards[0].title, 'Duplex Stainless Steel Casing');
      assert.strictEqual(execBody.finalState.quoteBasket.length, 1);
      assert.strictEqual(execBody.finalState.quoteBasket[0].productId, 'duplex_casing_8in');
      assert.strictEqual(execBody.finalState.quoteBasket[0].quantity, 2);

      pass('ENG-06: Flagship Demo Interaction Journey', 'Click part -> animation -> variant -> spec card -> quote basket verified end-to-end.');
    } catch (err) {
      fail('ENG-06: Flagship Demo Interaction Journey', err);
    }

    // -------------------------------------------------------------
    // TEST 7: ENG-07 Ecosystem Event Wiring (Core, Lens, Flow Outbox)
    // -------------------------------------------------------------
    try {
      const ecosystemGraph = {
        nodes: [
          { id: 'eco1', chipId: 'on_hotspot_click', params: { targetId: 'hs_quote_btn' } },
          { id: 'eco2', chipId: 'submit_lead', params: { name: 'Elena Rostova', email: 'elena@apextech.com', phone: '+1 555-0199' } },
          { id: 'eco3', chipId: 'track_event', params: { eventName: 'viewer.rfq_action', payload: { source: 'circuits_hotspot' } } },
          { id: 'eco4', chipId: 'emit_flow_event', params: { eventType: 'rfq.high_priority_requested', data: { tier: 'tier_1_industrial' } } }
        ],
        edges: [
          { id: 'ee1', source: 'eco1', target: 'eco2' },
          { id: 'ee2', source: 'eco2', target: 'eco3' },
          { id: 'ee3', source: 'eco3', target: 'eco4' }
        ]
      };

      const ecoIR = compileCircuitGraph(ecosystemGraph);

      const ecoResult = await interpretCircuitIR(ecoIR, 'on_hotspot_click', { targetId: 'hs_quote_btn' }, { organizationId: orgId });

      assert.strictEqual(ecoResult.executed, true);
      assert.strictEqual(ecoResult.sideEffects.leads.length, 1);
      assert.strictEqual(ecoResult.sideEffects.leads[0].email, 'elena@apextech.com');
      assert.strictEqual(ecoResult.sideEffects.analyticsEvents.length, 1);
      assert.strictEqual(ecoResult.sideEffects.analyticsEvents[0].eventName, 'viewer.rfq_action');
      assert.strictEqual(ecoResult.sideEffects.flowEvents.length, 1);
      assert.strictEqual(ecoResult.sideEffects.flowEvents[0].eventType, 'rfq.high_priority_requested');

      // Check PostgreSQL flow_event_outbox to verify durable persistence
      const outboxRes = await pool.query(
        `SELECT * FROM flow_event_outbox
         WHERE organization_id = $1 AND event_type = 'rfq.high_priority_requested'`,
        [orgId]
      );

      assert.ok(outboxRes.rows.length >= 1, 'Flow event outbox record persisted in PostgreSQL');
      assert.strictEqual(outboxRes.rows[0].status, 'pending');

      pass('ENG-07: Ecosystem Event Wiring', 'Lead captured, Lens event tracked, and Flow event stored in PostgreSQL outbox.');
    } catch (err) {
      fail('ENG-07: Ecosystem Event Wiring', err);
    }

    // -------------------------------------------------------------
    // TEST 8: ENG-08 Studio Widget Integration (Viewer 3D, Hotspots & AR)
    // -------------------------------------------------------------
    try {
      // 1. Add hotspots to experience
      const hsRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/hotspots`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Lubrication Port',
          description: 'High-temp synthetic oil port',
          position: { x: 0.2, y: 1.1, z: 0.4 },
          ctaText: 'View Spec Sheet',
          ctaAction: 'show_spec_card'
        })
      });
      assert.strictEqual(hsRes.status, 200, 'Hotspot created');

      // 2. Query AR capability matrix with different User Agents
      const iosArRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/ar-config`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15'
        }
      });
      const iosAr = await iosArRes.json();
      assert.strictEqual(iosAr.resolvedTier, 'quick_look', 'iOS resolved to Quick Look tier');

      const androidArRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/ar-config`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'
        }
      });
      const androidAr = await androidArRes.json();
      assert.strictEqual(androidAr.resolvedTier, 'webxr', 'Android resolved to WebXR tier');

      const desktopArRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/ar-config`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const desktopAr = await desktopArRes.json();
      assert.strictEqual(desktopAr.resolvedTier, 'orbit_qr_fallback', 'Desktop resolved to Orbit QR fallback tier');

      // 3. Publish experience & verify immutable snapshot contains scene document, hotspots & AR config
      const pubRes = await fetch(`${baseUrl}/api/engine/experiences/${experienceId}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assert.strictEqual(pubRes.status, 200, 'Publish ceremony completed');
      const pubData = await pubRes.json();
      assert.strictEqual(pubData.status, 'Published');
      assert.ok(pubData.qrDataUrl, 'Vector QR code generated for mobile handoff');

      // 4. Fetch published experience snapshot (consumed by viewer_3d widget)
      const pubSlug = (await pool.query('SELECT slug FROM spatial_experiences WHERE id = $1', [experienceId])).rows[0].slug;
      const widgetDataRes = await fetch(`${baseUrl}/api/engine/published/${pubSlug}`);
      assert.strictEqual(widgetDataRes.status, 200);
      const snapshot = await widgetDataRes.json();

      assert.strictEqual(snapshot.hotspots.length, 1, 'Hotspots delivered in snapshot');
      assert.ok(snapshot.sceneDocument, 'Non-destructive scene document included in snapshot');
      assert.ok(snapshot.circuitsIR, 'Compiled Circuit IR included in snapshot');
      assert.strictEqual(snapshot.experience.vaultAssetId, testVaultAssetId);

      pass('ENG-08: Studio Widget Integration', 'viewer_3d widget resolved hotspots, 3-tier AR matrix, and immutable published snapshot.');
    } catch (err) {
      fail('ENG-08: Studio Widget Integration', err);
    }

  } finally {
    server.close();
    await pool.end();
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('----------------------------------------------------------------');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite().catch(err => {
  console.error('Unhandled suite error:', err);
  process.exit(1);
});
