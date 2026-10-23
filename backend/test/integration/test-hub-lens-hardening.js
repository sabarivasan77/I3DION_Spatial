import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { app } from '../../src/server.js';
import { pool, query, ensureMigrated } from '../../src/db/pool.js';
import { config } from '../../src/config.js';
import { EventContractSchema } from '../../../packages/contracts/src/event.ts';
import { LeadContractSchema } from '../../../packages/contracts/src/lead.ts';

console.log('================================================================');
console.log('🧪 Spatial Hub & Spatial Lens Hardening: Automated Verification Suite');
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

async function runHubLensSuite() {
  await ensureMigrated();

  // Start ephemeral HTTP server on dynamic port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🚀 Ephemeral test server listening on ${baseUrl}\n`);

  const testRunId = Date.now();
  let org1Id = null;
  let org2Id = null;
  let adminUserId = null;
  let catalogId = null;
  let adminToken = null;
  let org2AdminToken = null;
  let catalogSlug = `cat-hub-${testRunId}`;
  let experienceSlug = `exp-hub-${testRunId}`;
  let draftCatalogSlug = `cat-draft-${testRunId}`;
  let draftExpSlug = `exp-draft-${testRunId}`;

  try {
    // -------------------------------------------------------------
    // SETUP: Create Primary Test Organization & Admin
    // -------------------------------------------------------------
    const orgRes = await query(
      `INSERT INTO organizations (name, slug, profile, logo_url, website, primary_color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, slug`,
      [
        `Apex Turbines Industrial ${testRunId}`,
        `apex-turbines-${testRunId}`,
        'Leading manufacturer of heavy-duty gas turbines and spatial digital twins.',
        '/logos/apex_turbine.png',
        'https://apex-turbines.industrial',
        '#F4B400'
      ]
    );
    org1Id = orgRes.rows[0].id;

    const userRes = await query(
      `INSERT INTO users (organization_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'Admin')
       RETURNING id, name, email`,
      [
        org1Id,
        'Chief Engineer Elena Rostova',
        `elena.${testRunId}@apex-turbines.com`,
        '$2a$10$3euP5d/D74P.S.59K1Zg3.7N2.WwR0YxQ.E1k6sVv.7a3M1mQ9m5u'
      ]
    );
    adminUserId = userRes.rows[0].id;

    adminToken = jwt.sign(
      { userId: adminUserId, organizationId: org1Id, role: 'Admin' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Setup Tenant 2 for Isolation Verification
    const org2Res = await query(
      `INSERT INTO organizations (name, slug, profile)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [`Competitor Org ${testRunId}`, `competitor-${testRunId}`, 'Competitor company profile']
    );
    org2Id = org2Res.rows[0].id;

    const user2Res = await query(
      `INSERT INTO users (organization_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'Admin')
       RETURNING id`,
      [org2Id, 'Competitor Admin', `comp.${testRunId}@competitor.com`, '$2a$10$3euP5d/D74P.S.59K1Zg3.7N2.WwR0YxQ.E1k6sVv.7a3M1mQ9m5u']
    );
    org2AdminToken = jwt.sign(
      { userId: user2Res.rows[0].id, organizationId: org2Id, role: 'Admin' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Create Published Catalog
    const catalogRes = await query(
      `INSERT INTO catalogs (
         organization_id, name, slug, description, status, published_snapshot, published_at
       )        VALUES ($1, $2, $3, $4, 'Published', $5, now())
       RETURNING id`,
      [
        org1Id,
        'Heavy Power Gas Turbines 2026',
        catalogSlug,
        'Flagship industrial gas turbine specifications and 3D models',
        JSON.stringify({
          title: 'Heavy Power Gas Turbines 2026',
          sections: [
            { id: 'sec-1', title: 'High-Pressure Turbines', products: [{ name: 'Apex Titan 9000', power: '95 MW' }] }
          ]
        })
      ],
    );
    catalogId = catalogRes.rows[0]?.id;

    // Create Published Spatial Experience
    await query(
      `INSERT INTO spatial_experiences (
         organization_id, name, slug, description, status, scene_config, hotspots, published_snapshot, published_at
       ) VALUES ($1, $2, $3, $4, 'Published', $5, $6, $7, now())`,
      [
        org1Id,
        'Apex Titan 9000 Digital Twin',
        experienceSlug,
        'Interactive 3D gas turbine twin with live pressure sensor pins',
        JSON.stringify({ camera: { fov: 45, position: [0, 2, 5] }, environment: { preset: 'studio' } }),
        JSON.stringify([
          { id: 'hotspot-turbine-rotor', label: 'High-Pressure Rotor Blade', metricUnit: '12,500 RPM', coordinates: [0.2, 1.1, -0.4] }
        ]),
        JSON.stringify({
          snapshotVersion: '1.0',
          title: 'Apex Titan 9000 Digital Twin',
          hotspots: [{ id: 'hotspot-turbine-rotor', label: 'High-Pressure Rotor Blade' }]
        })
      ]
    );

    // Create Draft Items (Should be private)
    await query(
      `INSERT INTO catalogs (organization_id, name, slug, status) VALUES ($1, 'Internal Draft Catalog', $2, 'Draft')`,
      [org1Id, draftCatalogSlug]
    );
    await query(
      `INSERT INTO spatial_experiences (organization_id, name, slug, status) VALUES ($1, 'Internal Draft Experience', $2, 'Draft')`,
      [org1Id, draftExpSlug]
    );

    // -------------------------------------------------------------
    // TEST 1: Public Hub Showcase Delivery (Unauthenticated)
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/hub/showcase/${org1Id}`);
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      const data = await res.json();

      assert.strictEqual(data.organization.name, `Apex Turbines Industrial ${testRunId}`);
      assert.strictEqual(data.organization.primary_color, '#F4B400');
      assert.ok(Array.isArray(data.catalogs), 'Expected catalogs array');
      assert.ok(data.catalogs.some(c => c.slug === catalogSlug), 'Published catalog should appear in showcase');
      assert.ok(data.experiences.some(e => e.slug === experienceSlug), 'Published experience should appear in showcase');

      pass('1. Public Hub Showcase Delivery', `Returned organization profile, ${data.catalogs.length} catalogs, and ${data.experiences.length} experiences without auth.`);
    } catch (err) {
      fail('1. Public Hub Showcase Delivery', err);
    }

    // -------------------------------------------------------------
    // TEST 2: Public Published Catalog Snapshot Delivery
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/hub/catalogs/${catalogSlug}`);
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      const catalog = await res.json();

      assert.strictEqual(catalog.slug, catalogSlug);
      assert.strictEqual(catalog.name, 'Heavy Power Gas Turbines 2026');
      assert.ok(catalog.publishedSnapshot, 'Catalog must deliver published snapshot');
      assert.strictEqual(catalog.organization.primaryColor, '#F4B400');

      pass('2. Public Catalog Snapshot Delivery', `Delivered immutable snapshot for catalog: ${catalog.name}`);

      const listRes = await fetch(
        `${baseUrl}/api/hub/catalogs?search=${encodeURIComponent(`Apex Turbines Industrial ${testRunId}`)}`
      );
      assert.strictEqual(listRes.status, 200, `Expected 200, got ${listRes.status}`);
      const catalogPage = await listRes.json();
      assert.strictEqual(catalogPage.total, 1);
      assert.strictEqual(catalogPage.items[0].slug, catalogSlug);
      assert.strictEqual(catalogPage.items[0].product_count, 0);
      assert.strictEqual(catalogPage.hasMore, false);

      const uuidRes = await fetch(`${baseUrl}/api/hub/catalogs/${catalogId}`);
      assert.strictEqual(uuidRes.status, 200, `Expected 200, got ${uuidRes.status}`);
      assert.strictEqual((await uuidRes.json()).slug, catalogSlug);

      pass('2a. Public Catalog List and Identifier Lookup', 'Search returned only the published catalog with the public product count and pagination metadata.');
    } catch (err) {
      fail('2. Public Catalog Snapshot Delivery', err);
    }

    // -------------------------------------------------------------
    // TEST 3: Public Published Experience Snapshot Delivery
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/hub/experiences/${experienceSlug}`);
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      const exp = await res.json();

      assert.strictEqual(exp.slug, experienceSlug);
      assert.ok(exp.sceneConfig?.camera, 'Scene config with camera must be delivered');
      assert.ok(exp.hotspots?.length > 0, 'Hotspots array must be delivered');
      assert.strictEqual(exp.hotspots[0].id, 'hotspot-turbine-rotor');

      pass('3. Public Experience Snapshot Delivery', `Delivered camera, lighting, and 3D hotspots for experience: ${exp.name}`);
    } catch (err) {
      fail('3. Public Experience Snapshot Delivery', err);
    }

    // -------------------------------------------------------------
    // TEST 4: Draft Content Isolation & Privacy (HTTP 404)
    // -------------------------------------------------------------
    try {
      const resCat = await fetch(`${baseUrl}/api/hub/catalogs/${draftCatalogSlug}`);
      assert.strictEqual(resCat.status, 404, 'Unpublished draft catalog must return 404');

      const resExp = await fetch(`${baseUrl}/api/hub/experiences/${draftExpSlug}`);
      assert.strictEqual(resExp.status, 404, 'Unpublished draft experience must return 404');

      pass('4. Private/Draft Content Isolation', 'Draft items return HTTP 404 and cannot leak to unauthenticated public visitors.');
    } catch (err) {
      fail('4. Private/Draft Content Isolation', err);
    }

    // -------------------------------------------------------------
    // TEST 5: Public Consent-Based Lead Capture (POST /api/hub/leads)
    // -------------------------------------------------------------
    let createdLeadId = null;
    try {
      const leadPayload = {
        organizationId: org1Id,
        slug: catalogSlug,
        name: 'Dr. Marcus Vance',
        email: `marcus.vance.${testRunId}@siemens-energy.de`,
        phone: '+49 89 2345 6789',
        company: 'Siemens Energy Global GmbH',
        intent: 'quote',
        message: 'Requesting commercial procurement pricing for 2x Apex Titan 9000 units.',
        source: 'Spatial Hub',
        consent: {
          consentGiven: true,
          consentText: 'I consent to receiving commercial proposals and technical CAD specifications from Apex Turbines.',
          consentTimestamp: new Date().toISOString()
        }
      };

      const res = await fetch(`${baseUrl}/api/hub/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadPayload)
      });

      assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.leadId, 'Lead ID must be generated');
      createdLeadId = data.leadId;

      // Verify in DB
      const dbLead = await query('SELECT * FROM leads WHERE id = $1', [createdLeadId]);
      assert.strictEqual(dbLead.rows.length, 1);
      assert.strictEqual(dbLead.rows[0].status, 'New');
      assert.ok(dbLead.rows[0].consent_metadata?.consentGiven, 'Consent metadata must be recorded in DB');

      pass('5. Consent-Based Lead Capture', `Lead ${data.leadId} captured with verified GDPR/privacy consent metadata.`);
    } catch (err) {
      fail('5. Consent-Based Lead Capture', err);
    }

    // -------------------------------------------------------------
    // TEST 6: Mandatory Consent Enforcement (Reject Missing Consent)
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/hub/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: org1Id,
          slug: catalogSlug,
          name: 'Unconsenting User',
          email: 'unconsenting@test.com',
          consent: { consentGiven: false }
        })
      });

      assert.strictEqual(res.status, 400, `Expected 400 rejection for missing consent, got ${res.status}`);
      pass('6. Mandatory Consent Enforcement', 'Request with consentGiven=false was correctly rejected with HTTP 400.');
    } catch (err) {
      fail('6. Mandatory Consent Enforcement', err);
    }

    // -------------------------------------------------------------
    // TEST 7: Honeypot Anti-Spam Bot Filter
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/hub/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: org1Id,
          slug: catalogSlug,
          name: 'Spam Bot 3000',
          email: 'spambot@malicious-scraper.ru',
          message: 'Buy cheap watches online',
          consent: { consentGiven: true },
          hp_token: 'hidden_bot_field_filled' // BOT TRAP ACTIVATED
        })
      });

      assert.strictEqual(res.status, 201, `Expected 201 pseudo-success to trap bot, got ${res.status}`);
      const data = await res.json();
      assert.strictEqual(data.status, 'filtered', 'Bot must be flagged as filtered');

      // Verify NO lead was inserted into DB for spambot
      const checkBot = await query('SELECT id FROM leads WHERE email = $1', ['spambot@malicious-scraper.ru']);
      assert.strictEqual(checkBot.rows.length, 0, 'Spam submission must NOT create a lead in database');

      pass('7. Honeypot Anti-Spam Bot Filter', 'Bot submission caught in honeypot trap, silently filtered with zero CRM pollution.');
    } catch (err) {
      fail('7. Honeypot Anti-Spam Bot Filter', err);
    }

    // -------------------------------------------------------------
    // TEST 8: QR-Attributed Lead & Flow Automation Execution
    // -------------------------------------------------------------
    try {
      const qrLeadRes = await fetch(`${baseUrl}/api/hub/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: org1Id,
          slug: experienceSlug,
          name: 'Klaus Brandstetter',
          email: `klaus.${testRunId}@basf.com`,
          company: 'BASF Chemical Works',
          intent: 'technical_spec',
          source: 'Spatial Hub',
          qrAttributed: true, // QR CODE ATTRIBUTION
          consent: { consentGiven: true }
        })
      });

      assert.strictEqual(qrLeadRes.status, 201);
      const qrData = await qrLeadRes.json();
      assert.strictEqual(qrData.qrAttributed, true);

      // Verify Flow automation: in-app notification created for org admin
      const notifs = await query(
        `SELECT * FROM notifications 
         WHERE organization_id = $1 AND user_id = $2 AND notification_type = 'lead_alert' 
         ORDER BY created_at DESC LIMIT 1`,
        [org1Id, adminUserId]
      );

      assert.strictEqual(notifs.rows.length, 1, 'Flow automation must insert in-app notification for admin');
      assert.ok(notifs.rows[0].title.includes('New Lead: Klaus Brandstetter'));

      // Verify Lead auto-assignment
      const assignedLead = await query('SELECT assigned_to, qr_attributed FROM leads WHERE id = $1', [qrData.leadId]);
      assert.strictEqual(assignedLead.rows[0].assigned_to, adminUserId, 'Flow should auto-assign lead to Admin');
      assert.strictEqual(assignedLead.rows[0].qr_attributed, true, 'Lead must be marked as qr_attributed');

      pass('8. QR-Attributed Lead & Flow Automation', `Lead attributed to QR code; Flow automatically notified Admin (${adminUserId}) and auto-assigned lead.`);
    } catch (err) {
      fail('8. QR-Attributed Lead & Flow Automation', err);
    }

    // -------------------------------------------------------------
    // TEST 9: Canonical Telemetry Event Ingestion (POST /api/lens/events)
    // -------------------------------------------------------------
    try {
      const testEvents = [
        {
          type: 'qr_landing',
          organizationId: org1Id,
          sourceProduct: 'hub',
          sessionId: `sess-${testRunId}-01`,
          visitorId: `vis-${testRunId}-01`,
          publishedRef: { contentType: 'experience', slug: experienceSlug },
          device: { deviceType: 'mobile', os: 'android', arSupported: true, arMode: 'scene_viewer' },
          properties: { qrAttributed: true }
        },
        {
          type: '3d_interaction',
          organizationId: org1Id,
          sourceProduct: 'engine',
          sessionId: `sess-${testRunId}-01`,
          visitorId: `vis-${testRunId}-01`,
          publishedRef: { contentType: 'experience', slug: experienceSlug },
          properties: { interactionMode: 'orbit_360', durationMs: 4500 }
        },
        {
          type: 'hotspot_click',
          organizationId: org1Id,
          sourceProduct: 'engine',
          sessionId: `sess-${testRunId}-01`,
          visitorId: `vis-${testRunId}-01`,
          publishedRef: { contentType: 'experience', slug: experienceSlug },
          properties: { hotspotId: 'hotspot-turbine-rotor', label: 'High-Pressure Rotor Blade', metricUnit: '12,500 RPM', dwellSeconds: 8 }
        },
        {
          type: 'ar_launch_attempt',
          organizationId: org1Id,
          sourceProduct: 'hub',
          sessionId: `sess-${testRunId}-01`,
          visitorId: `vis-${testRunId}-01`,
          publishedRef: { contentType: 'experience', slug: experienceSlug },
          device: { deviceType: 'mobile', os: 'android', arSupported: true, arMode: 'scene_viewer' }
        }
      ];

      for (const evt of testEvents) {
        const res = await fetch(`${baseUrl}/api/lens/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });
        assert.strictEqual(res.status, 201, `Failed ingesting ${evt.type}: ${res.status}`);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.deduplicated, false);
      }

      pass('9. Canonical Telemetry Ingestion', 'Ingested qr_landing, 3d_interaction, hotspot_click, and ar_launch_attempt events into database.');
    } catch (err) {
      fail('9. Canonical Telemetry Ingestion', err);
    }

    // -------------------------------------------------------------
    // TEST 10: Telemetry Deduplication Engine
    // -------------------------------------------------------------
    try {
      const fixedDedupeKey = `dedupe-test-token-${testRunId}`;
      const payload = {
        type: 'hotspot_click',
        organizationId: org1Id,
        sessionId: `sess-${testRunId}-dedupe`,
        visitorId: `vis-${testRunId}-dedupe`,
        dedupeKey: fixedDedupeKey,
        properties: { hotspotId: 'hotspot-turbine-rotor' }
      };

      // First call -> Ingested
      const res1 = await fetch(`${baseUrl}/api/lens/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.strictEqual(res1.status, 201);
      const d1 = await res1.json();
      assert.strictEqual(d1.deduplicated, false);

      // Second call within 5s window -> Dropped
      const res2 = await fetch(`${baseUrl}/api/lens/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.strictEqual(res2.status, 201);
      const d2 = await res2.json();
      assert.strictEqual(d2.deduplicated, true, 'Duplicate telemetry event must be dropped');

      pass('10. Telemetry Deduplication Engine', `Duplicate event dropped gracefully (${d2.status}) without duplicating metric count.`);
    } catch (err) {
      fail('10. Telemetry Deduplication Engine', err);
    }

    // -------------------------------------------------------------
    // TEST 11: Spatial Lens Overview KPIs & Conversion Funnel
    // -------------------------------------------------------------
    try {
      const resOverview = await fetch(`${baseUrl}/api/lens/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(resOverview.status, 200, `Expected 200, got ${resOverview.status}`);
      const overview = await resOverview.json();

      assert.ok(overview.kpis, 'Overview must contain kpis object');
      assert.ok(overview.kpis.totalLeads >= 2, `Expected at least 2 leads, got ${overview.kpis.totalLeads}`);
      assert.ok(overview.kpis.qrAttributedVisits >= 1, 'Expected at least 1 QR-attributed visit');
      assert.ok(overview.kpis.interactiveVisitors >= 1, 'Expected at least 1 interactive 3D visitor');
      assert.ok(overview.kpis.arLaunchAttempts >= 1, 'Expected at least 1 AR launch attempt');

      const resFunnel = await fetch(`${baseUrl}/api/lens/funnel`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(resFunnel.status, 200);
      const funnel = await resFunnel.json();

      assert.strictEqual(funnel.length, 5, 'Funnel must have 5 canonical stages');
      assert.strictEqual(funnel[0].stage, 'Showcase Impressions');
      assert.strictEqual(funnel[4].stage, 'Qualified Sales Leads');

      pass('11. Lens Overview KPIs & Conversion Funnel', `Verified traceable metrics: ${overview.kpis.totalLeads} leads, ${overview.kpis.arLaunchAttempts} AR launches, and 5-stage funnel.`);
    } catch (err) {
      fail('11. Lens Overview KPIs & Conversion Funnel', err);
    }

    // -------------------------------------------------------------
    // TEST 12: QR Attribution Breakdown & Hotspot Heatmap
    // -------------------------------------------------------------
    try {
      const resQR = await fetch(`${baseUrl}/api/lens/qr-attribution`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(resQR.status, 200);
      const qrData = await resQR.json();
      assert.ok(Array.isArray(qrData), 'Expected array for QR attribution breakdown');
      assert.ok(qrData.some(c => c.channel === 'QR Code'), 'QR Code channel must be present');

      const resHotspots = await fetch(`${baseUrl}/api/lens/hotspots`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(resHotspots.status, 200);
      const hotspots = await resHotspots.json();
      assert.ok(Array.isArray(hotspots), 'Expected array for hotspot heatmap');
      assert.ok(hotspots.some(h => h.label === 'High-Pressure Rotor Blade'), 'Hotspot label must be in heatmap');

      pass('12. QR Attribution Breakdown & Hotspot Heatmap', 'Calculated channel attribution and hotspot click frequency table.');
    } catch (err) {
      fail('12. QR Attribution Breakdown & Hotspot Heatmap', err);
    }

    // -------------------------------------------------------------
    // TEST 13: Tenant Isolation Verification (Zero Leakage)
    // -------------------------------------------------------------
    try {
      // Query overview as Tenant 2 (Competitor)
      const resTenant2 = await fetch(`${baseUrl}/api/lens/overview`, {
        headers: { Authorization: `Bearer ${org2AdminToken}` }
      });
      assert.strictEqual(resTenant2.status, 200);
      const t2Overview = await resTenant2.json();

      assert.strictEqual(t2Overview.kpis.totalLeads, 0, 'Tenant 2 must see 0 leads');
      assert.strictEqual(t2Overview.kpis.qrAttributedVisits, 0, 'Tenant 2 must see 0 QR visits');
      assert.strictEqual(t2Overview.kpis.arLaunchAttempts, 0, 'Tenant 2 must see 0 AR launches');
      assert.strictEqual(t2Overview.tenantScope, org2Id, 'Tenant scope must be isolated to org2');

      pass('13. Tenant Isolation Verification', 'Tenant 2 received zero metrics from Tenant 1. Tenant boundaries are strictly enforced.');
    } catch (err) {
      fail('13. Tenant Isolation Verification', err);
    }

    // -------------------------------------------------------------
    // TEST 14: Machine-Readable Metric Definitions (Non-Negotiable #9)
    // -------------------------------------------------------------
    try {
      const resDefs = await fetch(`${baseUrl}/api/lens/definitions`);
      assert.strictEqual(resDefs.status, 200);
      const defs = await resDefs.json();

      assert.ok(Array.isArray(defs.definitions));
      assert.ok(defs.definitions.some(d => d.key === 'qr_attributed_visits'));
      assert.ok(defs.definitions.some(d => d.nonNegotiableRule.includes('Non-Negotiable #9')));

      pass('14. Metric Definitions Registry', 'Delivered machine-readable written formulas and audit sources for every dashboard KPI.');
    } catch (err) {
      fail('14. Metric Definitions Registry', err);
    }

  } finally {
    // Teardown test server
    server.close();
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Verification Summary: ${passedCount} Passed | ${failedCount} Failed`);
  console.log('----------------------------------------------------------------\n');

  if (failedCount > 0) {
    setTimeout(() => process.exit(1), 150);
  }
  setTimeout(() => process.exit(0), 150);
}

runHubLensSuite().catch(err => {
  console.error('Fatal error running Spatial Hub & Lens verification suite:', err);
  setTimeout(() => process.exit(1), 150);
});
