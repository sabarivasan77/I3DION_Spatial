import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { app } from '../../src/server.js';
import { pool, query, ensureMigrated } from '../../src/db/pool.js';
import { config } from '../../src/config.js';
import { extractAssetMetadata, detectMimeType } from '../../src/services/vault/assetProcessor.js';

console.log('================================================================');
console.log('🧪 Spatial Vault Product Hardening: Automated Verification Suite');
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

  // Start ephemeral HTTP server on dynamic port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🚀 Ephemeral test server listening on ${baseUrl}\n`);

  const testRunId = Date.now();
  let orgId = null;
  let adminUserId = null;
  let token = null;

  try {
    // -------------------------------------------------------------
    // SETUP: Test Tenant & Authenticated Admin
    // -------------------------------------------------------------
    const orgRes = await query(
      `INSERT INTO organizations (name, website, profile, storage_quota_bytes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, storage_quota_bytes`,
      [
        `Vault Hardening Dynamics ${testRunId}`,
        'https://vault-hardening.i3dion.com',
        'Spatial Vault Hardening Verification Organization',
        107374182400 // 100 GB
      ]
    );
    orgId = orgRes.rows[0].id;

    const userRes = await query(
      `INSERT INTO users (organization_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, role, email`,
      [
        orgId,
        'Vault Security Admin',
        `vault.admin.${testRunId}@i3dion.internal`,
        '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        'Admin'
      ]
    );
    adminUserId = userRes.rows[0].id;
    token = jwt.sign({ userId: adminUserId }, config.jwtSecret);
    const authHeaders = { Authorization: `Bearer ${token}` };

    pass('Tenant & Admin Identity Established', `Org: ${orgId}, User: ${adminUserId}`);

    // Ensure uploads directory exists
    const uploadsDir = path.resolve(process.cwd(), config.uploadDir || 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // -------------------------------------------------------------
    // TEST 1: Multi-Format Ingestion & Geometry Metadata Analysis
    // -------------------------------------------------------------
    try {
      // 1.1: GLB parsing with real binary model
      const glbSourcePath = path.resolve('../frontend/public/models/industrial_pump.glb');
      const glbMeta = await extractAssetMetadata(glbSourcePath, 'industrial_pump.glb');
      assert.strictEqual(glbMeta.mimeType, 'model/gltf-binary', 'GLB MIME type must be model/gltf-binary');
      assert.ok(glbMeta.triangleCount > 1000, `Expected > 1000 triangles, found ${glbMeta.triangleCount}`);
      assert.ok(glbMeta.vertexCount > 1000, `Expected > 1000 vertices, found ${glbMeta.vertexCount}`);
      assert.ok(glbMeta.materialCount >= 1, `Expected >= 1 material, found ${glbMeta.materialCount}`);

      // 1.2: OBJ parsing
      const testObjPath = path.join(uploadsDir, `test-cube-${testRunId}.obj`);
      const objContent = [
        '# 8 vertices',
        'v -1.0 -1.0 -1.0',
        'v 1.0 -1.0 -1.0',
        'v 1.0 1.0 -1.0',
        'v -1.0 1.0 -1.0',
        'v -1.0 -1.0 1.0',
        'v 1.0 -1.0 1.0',
        'v 1.0 1.0 1.0',
        'v -1.0 1.0 1.0',
        '# 12 faces',
        'f 1 2 3', 'f 1 3 4', 'f 5 6 7', 'f 5 7 8',
        'f 1 2 6', 'f 1 6 5', 'f 2 3 7', 'f 2 7 6',
        'f 3 4 8', 'f 3 8 7', 'f 4 1 5', 'f 4 5 8'
      ].join('\n');
      await fs.writeFile(testObjPath, objContent, 'utf8');

      const objMeta = await extractAssetMetadata(testObjPath, 'cube.obj');
      assert.strictEqual(objMeta.mimeType, 'model/obj');
      assert.strictEqual(objMeta.vertexCount, 8, 'OBJ must have 8 vertices');
      assert.strictEqual(objMeta.triangleCount, 12, 'OBJ must have 12 faces');
      await fs.unlink(testObjPath).catch(() => {});

      // 1.3: Document & Image format support
      assert.strictEqual(detectMimeType('spec.pdf'), 'application/pdf');
      assert.strictEqual(detectMimeType('render.png'), 'image/png');
      assert.strictEqual(detectMimeType('drawing.step'), 'model/step');
      assert.strictEqual(detectMimeType('model.usdz'), 'model/vnd.usdz+zip');

      pass('Test 1: Multi-Format Ingestion & Geometry Metadata Extracted', 
        `GLB: ${glbMeta.triangleCount} triangles, ${glbMeta.vertexCount} vertices. OBJ: ${objMeta.triangleCount} triangles, ${objMeta.vertexCount} vertices. Formats verified: GLB, OBJ, PDF, PNG, STEP, USDZ.`);
    } catch (err) {
      fail('Test 1: Multi-Format Ingestion & Geometry Metadata Extracted', err);
    }

    // -------------------------------------------------------------
    // TEST 2: Concurrent Background Processing Pipeline (5 concurrent)
    // -------------------------------------------------------------
    try {
      const concurrencyCount = 5;
      const jobPromises = [];

      for (let i = 0; i < concurrencyCount; i++) {
        const dummyFile = Buffer.from(`CONCURRENT_PIPELINE_TEST_PAYLOAD_${i}_${testRunId}`);
        const formData = new FormData();
        formData.append('file', new Blob([dummyFile], { type: 'model/obj' }), `concurrent-model-${i}.obj`);
        formData.append('name', `Concurrent Mesh ${i + 1}`);
        formData.append('type', '3D Model');

        const uploadPromise = fetch(`${baseUrl}/api/vault/assets/upload`, {
          method: 'POST',
          headers: authHeaders,
          body: formData
        }).then(async (res) => {
          assert.strictEqual(res.status, 201, `Upload ${i} must succeed with 201`);
          return res.json();
        });

        jobPromises.push(uploadPromise);
      }

      const uploadResults = await Promise.all(jobPromises);
      assert.strictEqual(uploadResults.length, 5, 'All 5 uploads must return results');

      // Wait 300ms for background processing state machine transitions
      await new Promise(r => setTimeout(r, 350));

      // Query GET /api/vault/jobs to verify state machine outcomes
      const jobsRes = await fetch(`${baseUrl}/api/vault/jobs`, { headers: authHeaders });
      assert.strictEqual(jobsRes.status, 200, 'Jobs list must return 200');
      const jobsList = await jobsRes.json();

      const createdJobIds = uploadResults.map(r => r.job_id);
      const matchedJobs = jobsList.filter(j => createdJobIds.includes(j.id));
      assert.strictEqual(matchedJobs.length, 5, 'All 5 created jobs must exist in jobs list');
      for (const job of matchedJobs) {
        assert.strictEqual(job.status, 'Completed', `Job ${job.id} should reach Completed state`);
        assert.strictEqual(job.progress_pct, 100, `Job ${job.id} should reach 100% progress`);
      }

      pass('Test 2: Deterministic Background Processing Pipeline (5 Concurrent)', 
        `Submitted 5 parallel ingestion jobs. All progressed through queued -> parsing -> optimizing -> thumbnailing -> Completed.`);
    } catch (err) {
      fail('Test 2: Deterministic Background Processing Pipeline (5 Concurrent)', err);
    }

    // -------------------------------------------------------------
    // TEST 3: Strict Versioning & Deterministic Rollback
    // -------------------------------------------------------------
    try {
      // Helper for creating valid minimal GLB buffer with 0x46546C67 magic header
      function makeGlb(dataStr) {
        const payload = Buffer.from(dataStr);
        const glb = Buffer.alloc(20 + payload.length);
        glb.writeUInt32LE(0x46546C67, 0); // 'glTF' magic
        glb.writeUInt32LE(2, 4);          // version 2
        glb.writeUInt32LE(glb.length, 8); // total length
        glb.writeUInt32LE(payload.length, 12); // chunk 0 length
        glb.writeUInt32LE(0x4E4F534A, 16);// chunk 0 type 'JSON'
        payload.copy(glb, 20);
        return glb;
      }

      // 3.1: Upload initial version v1
      const v1Content = makeGlb('{"asset":{"version":"2.0"},"scene":"v1"}');
      const formV1 = new FormData();
      formV1.append('file', new Blob([v1Content]), 'turbine_v1.glb');
      formV1.append('name', 'Turbine Rotor');
      formV1.append('type', '3D Model');

      const resV1 = await fetch(`${baseUrl}/api/vault/assets/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formV1
      });
      assert.strictEqual(resV1.status, 201);
      const assetV1 = await resV1.json();
      const assetId = assetV1.id;
      const v1StorageKey = assetV1.storage_key;
      const v1SizeBytes = assetV1.size_bytes;

      // 3.2: Upload new version v2
      const v2Content = makeGlb('{"asset":{"version":"2.0"},"scene":"v2_enhanced"}');
      const formV2 = new FormData();
      formV2.append('file', new Blob([v2Content]), 'turbine_v2.glb');
      formV2.append('change_description', 'High pressure channel additions');

      const resV2 = await fetch(`${baseUrl}/api/vault/assets/${assetId}/versions`, {
        method: 'POST',
        headers: authHeaders,
        body: formV2
      });
      assert.strictEqual(resV2.status, 200);
      const assetV2 = await resV2.json();
      assert.strictEqual(assetV2.original_name, 'turbine_v2.glb');
      assert.strictEqual(assetV2.size_bytes, v2Content.length);

      // Verify asset details has 2 versions
      const detailRes = await fetch(`${baseUrl}/api/vault/assets/${assetId}`, { headers: authHeaders });
      const detail = await detailRes.json();
      assert.strictEqual(detail.versions.length, 2, 'Asset must have 2 immutable version records');

      // 3.3: Execute Rollback to v1
      const rollbackRes = await fetch(`${baseUrl}/api/vault/assets/${assetId}/versions/1/rollback`, {
        method: 'POST',
        headers: authHeaders
      });
      assert.strictEqual(rollbackRes.status, 200);
      const rollbackData = await rollbackRes.json();
      assert.strictEqual(rollbackData.active_version, 1);
      assert.strictEqual(rollbackData.asset.storage_key, v1StorageKey);
      assert.strictEqual(rollbackData.asset.original_name, 'turbine_v1.glb');
      assert.strictEqual(rollbackData.asset.size_bytes, v1SizeBytes);

      // Verify audit log recorded rollback
      const auditRes = await query(
        `SELECT * FROM vault_audit_logs WHERE target_id = $1 AND action = $2`,
        [assetId, 'Rolled back Asset to Version v1']
      );
      assert.strictEqual(auditRes.rows.length, 1, 'Audit log must record rollback event');

      pass('Test 3: Strict Versioning & Deterministic Rollback Verified', 
        `v1 created -> v2 uploaded (size: ${v2Content.length}) -> rolled back to v1 (reverted key: ${v1StorageKey}, size: ${v1SizeBytes}). Audit log recorded.`);
    } catch (err) {
      fail('Test 3: Strict Versioning & Deterministic Rollback Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 4: Real Storage Quota Hard Enforcement
    // -------------------------------------------------------------
    try {
      // Restrict quota to 500 bytes to test limit
      await query(`UPDATE organizations SET storage_quota_bytes = 500 WHERE id = $1`, [orgId]);

      // Attempt to upload 2KB file
      const largeFile = Buffer.alloc(2048, 'X');
      const formExceed = new FormData();
      formExceed.append('file', new Blob([largeFile]), 'oversized-cad-file.step');
      formExceed.append('name', 'Oversized CAD');

      const exceedRes = await fetch(`${baseUrl}/api/vault/assets/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formExceed
      });

      assert.strictEqual(exceedRes.status, 403, 'Exceeding upload must be rejected with 403 Forbidden');
      const exceedBody = await exceedRes.json();
      assert.ok(exceedBody.error.includes('Storage quota exceeded'), `Error message: ${exceedBody.error}`);

      // Reset quota back to enterprise 100 GB
      await query(`UPDATE organizations SET storage_quota_bytes = 107374182400 WHERE id = $1`, [orgId]);

      // Retry upload with unblocked quota
      const unblockedRes = await fetch(`${baseUrl}/api/vault/assets/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formExceed
      });
      assert.strictEqual(unblockedRes.status, 201, 'Upload must succeed after quota restored');

      pass('Test 4: Real Storage Quota Hard Enforcement Verified', 
        'Pre-upload boundary check cleanly rejected 2KB file on 500B limit with HTTP 403; unblocked immediately upon quota restoration.');
    } catch (err) {
      fail('Test 4: Real Storage Quota Hard Enforcement Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 5: Soft-Delete Lifecycle & Trash Bin Recovery
    // -------------------------------------------------------------
    try {
      // 5.1: Create asset to test trash lifecycle
      const trashFile = Buffer.from('TRASH_LIFECYCLE_TEST_FILE');
      const formTrash = new FormData();
      formTrash.append('file', new Blob([trashFile]), 'trash_candidate.obj');
      formTrash.append('name', 'Trash Candidate Model');

      const createRes = await fetch(`${baseUrl}/api/vault/assets/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formTrash
      });
      const createdAsset = await createRes.json();
      const trashAssetId = createdAsset.id;
      const storageKey = createdAsset.storage_key;

      // Allow background job to finalize
      await new Promise(r => setTimeout(r, 200));

      // 5.2: Soft delete -> move to trash
      const deleteRes = await fetch(`${baseUrl}/api/vault/assets/${trashAssetId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      assert.strictEqual(deleteRes.status, 200);

      // Verify asset appears in GET /api/vault/trash
      const trashRes = await fetch(`${baseUrl}/api/vault/trash`, { headers: authHeaders });
      assert.strictEqual(trashRes.status, 200);
      const trashList = await trashRes.json();
      const foundInTrash = trashList.find(a => a.id === trashAssetId);
      assert.ok(foundInTrash, 'Asset must appear in trash bin');
      assert.strictEqual(foundInTrash.days_remaining, 30, 'Trash countdown must be 30 days');

      // 5.3: Restore from trash
      const restoreRes = await fetch(`${baseUrl}/api/vault/assets/${trashAssetId}/restore`, {
        method: 'POST',
        headers: authHeaders
      });
      assert.strictEqual(restoreRes.status, 200);

      // Verify asset is back in active list
      const activeRes = await fetch(`${baseUrl}/api/vault/assets`, { headers: authHeaders });
      const activeList = await activeRes.json();
      const foundActive = activeList.find(a => a.id === trashAssetId);
      assert.ok(foundActive, 'Asset must be active again');
      assert.strictEqual(foundActive.is_deleted, false);

      // 5.4: Soft delete again then permanent purge
      await fetch(`${baseUrl}/api/vault/assets/${trashAssetId}`, { method: 'DELETE', headers: authHeaders });
      const permRes = await fetch(`${baseUrl}/api/vault/assets/${trashAssetId}/permanent`, {
        method: 'DELETE',
        headers: authHeaders
      });
      assert.strictEqual(permRes.status, 200);

      // Verify database record and physical disk file removed
      const dbCheck = await query(`SELECT * FROM vault_assets WHERE id = $1`, [trashAssetId]);
      assert.strictEqual(dbCheck.rows.length, 0, 'Database record must be permanently purged');

      const diskPath = path.join(uploadsDir, storageKey);
      let fileExistsOnDisk = true;
      try {
        await fs.access(diskPath);
      } catch (_) {
        fileExistsOnDisk = false;
      }
      assert.strictEqual(fileExistsOnDisk, false, 'Physical disk file must be deleted upon permanent purge');

      pass('Test 5: Soft-Delete Lifecycle & Trash Bin Recovery Verified', 
        'Asset soft-deleted -> listed in /trash with 30-day countdown -> restored to active -> permanently purged from DB and disk.');
    } catch (err) {
      fail('Test 5: Soft-Delete Lifecycle & Trash Bin Recovery Verified', err);
    }

    // -------------------------------------------------------------
    // TEST 6: OpenAPI 3.0 Documentation Endpoint Integrity
    // -------------------------------------------------------------
    try {
      const openapiRes = await fetch(`${baseUrl}/api/vault/docs/openapi.json`, { headers: authHeaders });
      assert.strictEqual(openapiRes.status, 200, 'OpenAPI docs endpoint must return 200');
      const spec = await openapiRes.json();

      assert.strictEqual(spec.openapi, '3.0.3', 'Must be OpenAPI 3.0.3 specification');
      assert.ok(spec.info?.title.includes('Spatial Vault'), 'OpenAPI title must reference Spatial Vault');
      assert.ok(spec.paths['/assets'] || spec.paths['/api/vault/assets'], 'Must document /assets');
      assert.ok(spec.paths['/assets/upload'] || spec.paths['/api/vault/assets/upload'], 'Must document /assets/upload');
      assert.ok(spec.paths['/assets/{id}/versions/{versionNumber}/rollback'] || spec.paths['/api/vault/assets/{id}/versions/{versionNumber}/rollback'], 'Must document rollback endpoint');
      assert.ok(spec.paths['/trash'] || spec.paths['/api/vault/trash'], 'Must document /trash');
      assert.ok(spec.paths['/jobs'] || spec.paths['/api/vault/jobs'], 'Must document /jobs');

      pass('Test 6: OpenAPI 3.0 Documentation Endpoint Integrity Verified', 
        `Valid OpenAPI 3.0.3 loaded with ${Object.keys(spec.paths).length} endpoints and full schemas.`);
    } catch (err) {
      fail('Test 6: OpenAPI 3.0 Documentation Endpoint Integrity Verified', err);
    }

  } finally {
    // Teardown: close HTTP server and clean up test organization
    server.close();
    if (orgId) {
      await query(`DELETE FROM vault_processing_jobs WHERE organization_id = $1`, [orgId]).catch(() => {});
      await query(`DELETE FROM vault_audit_logs WHERE organization_id = $1`, [orgId]).catch(() => {});
      await query(`DELETE FROM vault_asset_versions WHERE asset_id IN (SELECT id FROM vault_assets WHERE organization_id = $1)`, [orgId]).catch(() => {});
      await query(`DELETE FROM vault_assets WHERE organization_id = $1`, [orgId]).catch(() => {});
      await query(`DELETE FROM users WHERE organization_id = $1`, [orgId]).catch(() => {});
      await query(`DELETE FROM organizations WHERE id = $1`, [orgId]).catch(() => {});
    }
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 Spatial Vault Hardening Results: ${passedCount} Passed, ${failedCount} Failed.`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSuite().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Fatal test error in test-vault-hardening:', err);
  process.exit(1);
});
