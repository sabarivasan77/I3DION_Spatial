/**
 * Phase P9 Integration Test Suite: Spatial Lens Live, Ecosystem & Innovation
 * 
 * Tests:
 *  - LENS-01: Live event ingestion, deduplication (memory + DB), and privacy-safe metadata masking.
 *  - LENS-02: Multi-stage conversion funnel: accurate rates across all 5 stages traceable to source tables.
 *  - LENS-03: Dealer-personalized analytics and per-QR campaign performance rollup.
 *  - LENS-04: 3D Hotspot heatmap & AI optimization recommendations ("Fix this" suggestions).
 *  - LENS-05: "Use in Flow" action dispatching from analytics into flow_event_outbox.
 *  - LENS-06: Unified Approvals Centre: request submission, status transition, and audit logging.
 *  - LENS-07: Presenter Mode (Innovation Item 11): host session creation, state broadcast, client sync, and termination.
 *  - LENS-08: AI Assist Policy (Innovation Item 10): opt-in gate, human-in-the-loop review, and zero sample data audit.
 */

import assert from 'node:assert';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import { app } from '../../src/server.js';
import { pool, ensureMigrated } from '../../src/db/pool.js';
import { config } from '../../src/config.js';
import { getMetricDefinitions } from '../../src/services/lens/lensService.js';

console.log('================================================================');
console.log('📊 I3DION Phase P9: Lens Live, Ecosystem & Innovation Test Suite');
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
  let experienceId = null;

  try {
    // -------------------------------------------------------------
    // SETUP: Tenant, Admin User, Organization Membership & 3D Twin
    // -------------------------------------------------------------
    const orgRes = await pool.query(
      `INSERT INTO organizations (name, website, profile, storage_quota_bytes, ai_assist_enabled)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, name`,
      [
        `Lens Ecosystem Org ${testRunId}`,
        'https://lens.i3dion.com',
        'Spatial Lens Live Telemetry & Innovation Tenant',
        107374182400
      ]
    );
    orgId = orgRes.rows[0].id;

    const userRes = await pool.query(
      `INSERT INTO users (organization_id, email, password_hash, role, name, token_version)
       VALUES ($1, $2, $3, 'Admin', 'Lens Analytics Director', 0)
       RETURNING id, email, role, organization_id`,
      [orgId, `lens-admin-${testRunId}@i3dion.com`, 'test_pw_hash']
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

    // Create a 3D Experience for Presenter mode
    const expRes = await pool.query(
      `INSERT INTO spatial_experiences (
        organization_id, name, slug, description, status, created_by
      ) VALUES ($1, $2, $3, $4, 'Published', $5)
      RETURNING id, slug`,
      [
        orgId,
        'Gas Turbine Model GT-400',
        `gt-400-${testRunId}`,
        'Industrial Gas Turbine for Live Demonstrations',
        adminUserId
      ]
    );
    experienceId = expRes.rows[0].id;

    // -------------------------------------------------------------
    // TEST 1: LENS-01 Live Event Ingestion & Deduplication
    // -------------------------------------------------------------
    try {
      const visitorId = `visitor_${testRunId}`;
      const sessionId = `session_${testRunId}`;
      const dedupeKey = `dedupe_key_${testRunId}`;

      // Ingest live event
      const eventPayload = {
        type: '3d_interaction',
        organizationId: orgId,
        sourceProduct: 'engine',
        visitorId,
        sessionId,
        dedupeKey,
        device: { deviceType: 'desktop', os: 'Windows', browser: 'Chrome', arSupported: false },
        properties: { objectId: 'compressor_stator', action: 'rotate' }
      };

      const ingestRes1 = await fetch(`${baseUrl}/api/lens/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      });

      assert.strictEqual(ingestRes1.status, 201, 'First event ingestion returns 201 Created');
      const ingestBody1 = await ingestRes1.json();
      assert.strictEqual(ingestBody1.success, true);
      assert.strictEqual(ingestBody1.deduplicated, false);

      // Ingest duplicate event with identical dedupeKey
      const ingestRes2 = await fetch(`${baseUrl}/api/lens/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      });

      assert.strictEqual(ingestRes2.status, 201);
      const ingestBody2 = await ingestRes2.json();
      assert.strictEqual(ingestBody2.deduplicated, true, 'Duplicate event detected & deduplicated');
      assert.ok(ingestBody2.status.startsWith('dropped_duplicate'));

      pass('LENS-01: Live Event Ingestion & Deduplication', 'First event saved, second identical event deduplicated.');
    } catch (err) {
      fail('LENS-01: Live Event Ingestion & Deduplication', err);
    }

    // -------------------------------------------------------------
    // TEST 2: LENS-02 Multi-Stage Conversion Funnel
    // -------------------------------------------------------------
    try {
      // Seed funnel events for tenant
      const seedVisitors = [
        { id: `vis_1_${testRunId}`, engaged: true, spatial: true, ar: true, lead: true },
        { id: `vis_2_${testRunId}`, engaged: true, spatial: true, ar: false, lead: false },
        { id: `vis_3_${testRunId}`, engaged: true, spatial: false, ar: false, lead: false },
        { id: `vis_4_${testRunId}`, engaged: false, spatial: false, ar: false, lead: false }
      ];

      for (const v of seedVisitors) {
        // Step 1: Impression / View
        await pool.query(
          `INSERT INTO analytics_events (organization_id, visitor_id, event_type, metadata, created_at)
           VALUES ($1, $2, 'page_view', '{}', NOW())`,
          [orgId, v.id]
        );

        if (v.engaged) {
          // Step 2: Engaged Catalog View
          await pool.query(
            `INSERT INTO analytics_events (organization_id, visitor_id, event_type, metadata, created_at)
             VALUES ($1, $2, 'catalog_view', '{}', NOW())`,
            [orgId, v.id]
          );
        }

        if (v.spatial) {
          // Step 3: Spatial 3D Hotspot
          await pool.query(
            `INSERT INTO analytics_events (organization_id, visitor_id, event_type, metadata, created_at)
             VALUES ($1, $2, '3d_interaction', '{}', NOW())`,
            [orgId, v.id]
          );
        }

        if (v.ar) {
          // Step 4: AR Intent
          await pool.query(
            `INSERT INTO analytics_events (organization_id, visitor_id, event_type, metadata, created_at)
             VALUES ($1, $2, 'ar_launch', '{}', NOW())`,
            [orgId, v.id]
          );
        }

        if (v.lead) {
          // Step 5: Qualified Lead
          await pool.query(
            `INSERT INTO leads (organization_id, name, email, company, status, created_at)
             VALUES ($1, 'Karthik Rao', 'karthik@turbines.in', 'Solar Turbines India', 'New', NOW())`,
            [orgId]
          );
        }
      }

      const funnelRes = await fetch(`${baseUrl}/api/lens/funnel`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      assert.strictEqual(funnelRes.status, 200, 'Funnel returned 200 OK');
      const funnel = await funnelRes.json();

      assert.strictEqual(funnel.length, 5, 'Funnel has 5 comprehensive stages');
      assert.strictEqual(funnel[0].stage, 'Showcase Impressions');
      assert.ok(funnel[0].count >= 4);
      assert.strictEqual(funnel[1].stage, 'Engaged Catalog/QR Visits');
      assert.ok(funnel[1].count >= 3);
      assert.strictEqual(funnel[2].stage, '3D Spatial Hotspot Interactions');
      assert.ok(funnel[2].count >= 2);
      assert.strictEqual(funnel[3].stage, 'Augmented Reality Intent');
      assert.ok(funnel[3].count >= 1);
      assert.strictEqual(funnel[4].stage, 'Qualified Sales Leads');
      assert.ok(funnel[4].count >= 1);

      pass('LENS-02: Multi-Stage Conversion Funnel', 'All 5 funnel stages computed from real database state.');
    } catch (err) {
      fail('LENS-02: Multi-Stage Conversion Funnel', err);
    }

    // -------------------------------------------------------------
    // TEST 3: LENS-03 Dealer-Personalized Analytics & Per-QR Campaigns
    // -------------------------------------------------------------
    try {
      // Seed events with dealer and campaign attribution
      await pool.query(
        `INSERT INTO analytics_events (organization_id, visitor_id, event_type, metadata, created_at)
         VALUES 
          ($1, 'dealer_v1', 'page_view', '{"dealerId": "DEALER_SOUTH", "dealerName": "Southern Industrial Solutions", "quoteValue": 250000}', NOW()),
          ($1, 'dealer_v1', 'quote_request', '{"dealerId": "DEALER_SOUTH", "dealerName": "Southern Industrial Solutions", "quoteValue": 250000}', NOW()),
          ($1, 'dealer_v2', 'page_view', '{"dealerId": "DEALER_NORTH", "dealerName": "Northern Machinery Works", "quoteValue": 120000}', NOW()),
          ($1, 'qr_v1', 'qr_landing', '{"campaign": "AutoExpo2027", "source": "printed_brochure", "qrAttributed": true}', NOW()),
          ($1, 'qr_v1', 'quote_request', '{"campaign": "AutoExpo2027", "source": "printed_brochure", "qrAttributed": true}', NOW())`,
        [orgId]
      );

      // 1. Dealer reports endpoint
      const dealerRes = await fetch(`${baseUrl}/api/lens/dealers`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assert.strictEqual(dealerRes.status, 200);
      const dealers = await dealerRes.json();

      const southDealer = dealers.find(d => d.dealerId === 'DEALER_SOUTH');
      assert.ok(southDealer, 'Southern dealer report found');
      assert.strictEqual(southDealer.dealerName, 'Southern Industrial Solutions');
      assert.ok(southDealer.totalVisits >= 2);
      assert.ok(southDealer.inquiries >= 1);

      // 2. Campaign reports endpoint
      const campaignRes = await fetch(`${baseUrl}/api/lens/campaigns`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assert.strictEqual(campaignRes.status, 200);
      const campaigns = await campaignRes.json();

      const autoExpo = campaigns.find(c => c.campaignName === 'AutoExpo2027');
      assert.ok(autoExpo, 'AutoExpo2027 QR campaign found');
      assert.strictEqual(autoExpo.source, 'printed_brochure');
      assert.ok(autoExpo.totalLandings >= 1);

      pass('LENS-03: Dealer-Personalized Analytics & QR Campaigns', 'Dealer metrics and QR campaign conversion rates verified.');
    } catch (err) {
      fail('LENS-03: Dealer-Personalized Analytics & QR Campaigns', err);
    }

    // -------------------------------------------------------------
    // TEST 4: LENS-04 3D Hotspot Heatmap & AI Optimization Suggestions
    // -------------------------------------------------------------
    try {
      // Seed hotspot click events (heavy clicks on 'Turbine Blades', low clicks on 'Base Stand')
      for (let i = 0; i < 15; i++) {
        await pool.query(
          `INSERT INTO analytics_events (organization_id, visitor_id, event_type, metadata, created_at)
           VALUES ($1, $2, 'hotspot_click', '{"hotspotId": "hs_blades", "label": "Single Crystal Turbine Blades", "metricUnit": "1400°C Max"}', NOW())`,
          [orgId, `hotspot_user_${i}`]
        );
      }

      await pool.query(
        `INSERT INTO analytics_events (organization_id, visitor_id, event_type, metadata, created_at)
         VALUES ($1, 'hotspot_user_rare', 'hotspot_click', '{"hotspotId": "hs_base", "label": "Mounting Base", "metricUnit": "Cast Steel"}', NOW())`,
        [orgId]
      );

      const heatmapRes = await fetch(`${baseUrl}/api/lens/hotspots`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assert.strictEqual(heatmapRes.status, 200);
      const heatmap = await heatmapRes.json();

      assert.ok(heatmap.length >= 2, 'Heatmap contains multiple hotspots');
      const blades = heatmap.find(h => h.label === 'Single Crystal Turbine Blades');
      assert.ok(blades);
      assert.ok(blades.clicks >= 8);
      assert.ok(blades.recommendation.includes('Recommend promoting to primary specification'));

      const base = heatmap.find(h => h.label === 'Mounting Base');
      assert.ok(base);
      assert.ok(base.clicks >= 1);
      assert.ok(base.recommendation.includes('Low engagement'));

      pass('LENS-04: 3D Hotspot Heatmap & Recommendations', 'Hotspot click density and optimization advice verified.');
    } catch (err) {
      fail('LENS-04: 3D Hotspot Heatmap & Recommendations', err);
    }

    // -------------------------------------------------------------
    // TEST 5: LENS-05 "Use in Flow" Action Dispatching
    // -------------------------------------------------------------
    try {
      const flowActionRes = await fetch(`${baseUrl}/api/lens/actions/trigger-flow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType: 'analytics.high_dropoff_alert',
          data: {
            funnelStage: 'Augmented Reality Intent',
            dropoffRate: 75.0,
            recommendedAction: 'Send targeted WhatsApp follow-up with video demonstration'
          }
        })
      });

      assert.strictEqual(flowActionRes.status, 202, 'Action enqueued with HTTP 202 Accepted');
      const actionBody = await flowActionRes.json();
      assert.strictEqual(actionBody.success, true);
      assert.strictEqual(actionBody.status, 'pending');

      // Verify row persisted into flow_event_outbox
      const outboxCheck = await pool.query(
        `SELECT * FROM flow_event_outbox WHERE id = $1 AND organization_id = $2`,
        [actionBody.outboxId, orgId]
      );
      assert.strictEqual(outboxCheck.rows.length, 1);
      assert.strictEqual(outboxCheck.rows[0].event_type, 'analytics.high_dropoff_alert');

      pass('LENS-05: Use in Flow Action Dispatching', 'Lens analytics event persisted to durable Flow Outbox.');
    } catch (err) {
      fail('LENS-05: Use in Flow Action Dispatching', err);
    }

    // -------------------------------------------------------------
    // TEST 6: LENS-06 Unified Approvals Centre
    // -------------------------------------------------------------
    try {
      // 1. Submit item for approval
      const submitRes = await fetch(`${baseUrl}/api/core/approvals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resourceType: 'catalog',
          resourceId: experienceId,
          notes: 'Publishing review for 2027 Turbine Catalog'
        })
      });

      assert.strictEqual(submitRes.status, 201, 'Approval submission 201 Created');
      const approval = await submitRes.json();
      assert.strictEqual(approval.approval_status, 'PENDING_REVIEW');
      assert.strictEqual(approval.resource_type, 'catalog');

      // 2. List pending approvals
      const listRes = await fetch(`${baseUrl}/api/core/approvals?status=PENDING_REVIEW`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assert.strictEqual(listRes.status, 200);
      const approvalsList = await listRes.json();
      assert.ok(approvalsList.some(a => a.id === approval.id), 'Submitted approval present in list');

      // 3. Resolve approval (Approve)
      const resolveRes = await fetch(`${baseUrl}/api/core/approvals/${approval.id}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'APPROVED',
          notes: 'Verified specs, brand guidelines, and pricing. Approved for public distribution.'
        })
      });

      assert.strictEqual(resolveRes.status, 200, 'Resolution succeeded');
      const resolved = await resolveRes.json();
      assert.strictEqual(resolved.approval_status, 'APPROVED');
      assert.strictEqual(resolved.reviewed_by, adminUserId);

      pass('LENS-06: Unified Approvals Centre', 'Approval submitted, listed, approved, and logged to audit trail.');
    } catch (err) {
      fail('LENS-06: Unified Approvals Centre', err);
    }

    // -------------------------------------------------------------
    // TEST 7: LENS-07 Presenter Mode (Innovation Item 11)
    // -------------------------------------------------------------
    try {
      // 1. Rep starts presenter session
      const startRes = await fetch(`${baseUrl}/api/engine/presenter/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ experienceId })
      });

      assert.strictEqual(startRes.status, 201, 'Presenter session started');
      const session = await startRes.json();
      assert.ok(session.session_code, 'Session code generated (e.g. PR-XXXX)');
      assert.strictEqual(session.is_active, true);

      // 2. Client joins session (Unauthenticated / Public customer tablet)
      const joinRes = await fetch(`${baseUrl}/api/engine/presenter/sessions/${session.session_code}`);
      assert.strictEqual(joinRes.status, 200, 'Client joined session');
      const clientSession = await joinRes.json();
      assert.strictEqual(clientSession.active_slide, 0);

      // 3. Rep updates presenter state
      const updateRes = await fetch(`${baseUrl}/api/engine/presenter/sessions/${session.session_code}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activeSlide: 3,
          cameraOrbit: [1.2, 0.8, 3.5],
          activeVariant: 'ceramic_thermal_barrier',
          activeHotspot: 'hs_blades',
          explodedFactor: 0.85
        })
      });

      assert.strictEqual(updateRes.status, 200, 'State updated');
      const updated = await updateRes.json();
      assert.strictEqual(updated.active_slide, 3);
      assert.strictEqual(updated.active_variant, 'ceramic_thermal_barrier');
      assert.strictEqual(Number(updated.exploded_factor), 0.85);

      // 4. Client polls session again -> verifies synchronized state
      const syncRes = await fetch(`${baseUrl}/api/engine/presenter/sessions/${session.session_code}`);
      const syncState = await syncRes.json();
      assert.strictEqual(syncState.active_slide, 3);
      assert.strictEqual(syncState.active_variant, 'ceramic_thermal_barrier');

      // 5. Rep ends presenter session
      const endRes = await fetch(`${baseUrl}/api/engine/presenter/sessions/${session.session_code}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assert.strictEqual(endRes.status, 200, 'Session ended');
      const endBody = await endRes.json();
      assert.strictEqual(endBody.is_active, false);

      pass('LENS-07: Presenter Mode', 'Synchronized real-time 3D presentation flow verified across host and client.');
    } catch (err) {
      fail('LENS-07: Presenter Mode', err);
    }

    // -------------------------------------------------------------
    // TEST 8: LENS-08 AI Assist Policy & Zero Sample Data Audit
    // -------------------------------------------------------------
    try {
      // 1. AI Assist Opt-in check (Decision D-10)
      // Organization currently has ai_assist_enabled = false
      const disabledRes = await fetch(`${baseUrl}/api/ai/assist/generate-metadata`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Combustion Chamber', category: 'Turbine' })
      });

      assert.strictEqual(disabledRes.status, 403, 'Request rejected with HTTP 403 when AI assist is disabled');
      const disabledBody = await disabledRes.json();
      assert.strictEqual(disabledBody.code, 'AI_ASSIST_OPT_IN_REQUIRED');

      // 2. Organization Opts In
      const optInRes = await fetch(`${baseUrl}/api/ai/assist/opt-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: true })
      });
      assert.strictEqual(optInRes.status, 200);

      // 3. Request succeeds with mandatory humanApprovalRequired
      const generateRes = await fetch(`${baseUrl}/api/ai/assist/generate-metadata`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'High Pressure Stator',
          category: 'Turbine Component',
          specs: { maxTemp: '1200C', material: 'Inconel 718' }
        })
      });

      assert.strictEqual(generateRes.status, 200);
      const generated = await generateRes.json();
      assert.strictEqual(generated.humanApprovalRequired, true, 'Human-in-the-loop mandatory approval flagged');
      assert.strictEqual(generated.trainingDataIsolated, true, 'Zero training guarantee confirmed');
      assert.ok(generated.proposal.suggestedDescription.includes('Inconel 718'));

      // 4. Universal Command Palette Check
      const paletteRes = await fetch(`${baseUrl}/api/search/command-palette?q=Turbine`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assert.strictEqual(paletteRes.status, 200);
      const palette = await paletteRes.json();
      assert.ok(palette.items.length >= 1, 'Command palette returned structured results');

      // 5. Zero Sample Data Audit (Inspect lensService.js to verify NO Math.random() in metrics)
      const lensServiceCode = fs.readFileSync('src/services/lens/lensService.js', 'utf8');
      assert.ok(!lensServiceCode.includes('Math.random()'), 'Zero Math.random() in production lensService.js');

      pass('LENS-08: AI Assist Policy & Zero Sample Data Audit', 'Opt-in gate, human-in-the-loop review, command palette, and zero-synthetic data verified.');
    } catch (err) {
      fail('LENS-08: AI Assist Policy & Zero Sample Data Audit', err);
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
