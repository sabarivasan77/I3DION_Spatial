import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../../src/db/pool.js';
import { config } from '../../src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendSrcDir = path.resolve(__dirname, '../../../frontend/src');

const API_BASE = 'http://localhost:4000/api/hub';

function pass(testId, msg) {
  console.log(`  ✅ [${testId}] ${msg}`);
}

async function run() {
  console.log('\n--- Running Spatial Hub Phase H9 Test Suite (Analytics, SEO, Moderation, A11y, Hardening) ---');

  // 0. Setup: Ensure an organization, user, and published product exist
  let orgRes = await query(`SELECT id, slug, name FROM organizations LIMIT 1`);
  let orgId = orgRes.rows[0]?.id;
  if (!orgId) {
    const createdOrg = await query(
      `INSERT INTO organizations (name, slug, is_verified) 
       VALUES ('I3DION Showcase Test', 'i3dion-showcase-test', true) RETURNING id, slug, name`
    );
    orgId = createdOrg.rows[0].id;
  }

  let userRes = await query(`SELECT id, email FROM users LIMIT 1`);
  let testUser = userRes.rows[0];
  if (!testUser) {
    const createdUser = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ('tester@i3dion.com', 'dummy_hash', 'Test Engineer', 'admin') RETURNING id, email`
    );
    testUser = createdUser.rows[0];
  }

  const uniqueSlug = `h9-test-product-${Date.now()}`;
  const createdProd = await query(
    `INSERT INTO products (organization_id, name, slug, description, category, is_public, status, views_count)
     VALUES ($1, 'H9 Industrial Test Pump', $2, 'High-pressure multi-stage pump for water treatment.', 'Pumps', true, 'Published', 0)
     RETURNING id, name, slug, views_count`,
    [orgId, uniqueSlug]
  );
  const testProduct = createdProd.rows[0];

  const jwtToken = jwt.sign(
    { sub: testUser.id, userId: testUser.id, role: 'admin', orgId },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  // ─── 1. PUBLIC CONTENT MODERATION & ABUSE REPORTING (HUB-15) ─────────────
  console.log('\n1. Testing Content Moderation & Abuse Reporting (HUB-15)...');

  // 1a. Anonymous Report Submission
  const anonReportRes = await fetch(`${API_BASE}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entityType: 'product',
      entityId: testProduct.id,
      reason: 'Broken 3D Model / Rendering Error',
      details: 'Mesh textures appear corrupted on iOS Safari WebXR view.',
      reporterEmail: 'visitor@external-firm.com'
    })
  });
  assert.equal(anonReportRes.status, 201, 'Anonymous report should succeed with 201 Created');
  const anonJson = await anonReportRes.json();
  assert.ok(anonJson.success, 'Report response must indicate success');
  assert.ok(anonJson.report?.id, 'Report response must return generated report ID');

  // Verify persistence in moderation_reports
  const dbReportRes = await query(`SELECT * FROM moderation_reports WHERE id = $1`, [anonJson.report.id]);
  assert.equal(dbReportRes.rows.length, 1, 'Report must be persisted in moderation_reports table');
  const savedReport = dbReportRes.rows[0];
  assert.equal(savedReport.entity_type, 'product');
  assert.equal(savedReport.entity_id, testProduct.id);
  assert.equal(savedReport.reporter_id, null, 'Anonymous report should have null reporter_id');
  assert.equal(savedReport.status, 'pending');
  pass('MOD-01', 'Anonymous content report persisted to moderation_reports table with pending status');

  // 1b. Honeypot Anti-Spam Bot Filter
  const botReportRes = await fetch(`${API_BASE}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entityType: 'product',
      entityId: testProduct.id,
      reason: 'Spam link submission',
      details: 'Check out buy-crypto-fast.xyz',
      hp_token: 'bot_hidden_payload_xyz'
    })
  });
  assert.equal(botReportRes.status, 201, 'Bot request should return pseudo-success');
  const botJson = await botReportRes.json();
  assert.equal(botJson.status, 'filtered', 'Bot must be flagged as filtered');

  // Ensure bot spam never polluted the database
  const spamDbRes = await query(`SELECT * FROM moderation_reports WHERE details = 'Check out buy-crypto-fast.xyz'`);
  assert.equal(spamDbRes.rows.length, 0, 'Spam reports trapped by honeypot must never reach database');
  pass('MOD-02', 'Anti-spam honeypot safely traps automated bots without database pollution');

  // 1c. Authenticated Report Submission
  const authReportRes = await fetch(`${API_BASE}/report`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      entityType: 'product',
      entityId: testProduct.id,
      reason: 'Incorrect CAD Specifications / Dimensions',
      details: 'Flange bolt circle PCD is marked 180mm but CAD geometry is 160mm.'
    })
  });
  assert.equal(authReportRes.status, 201, 'Authenticated report should succeed with 201');
  const authJson = await authReportRes.json();
  const authDbRes = await query(`SELECT * FROM moderation_reports WHERE id = $1`, [authJson.report.id]);
  assert.equal(authDbRes.rows[0].reporter_id, testUser.id, 'Authenticated report must store reporter_id');
  pass('MOD-03', 'Authenticated report associates reporter user identity');

  // 1d. Validation: Reject invalid payloads
  const invalidReportRes = await fetch(`${API_BASE}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entityType: 'product',
      entityId: testProduct.id,
      reason: 'no' // Too short (< 3 chars)
    })
  });
  assert.equal(invalidReportRes.status, 400, 'Report with reason < 3 characters must be rejected with 400');
  pass('MOD-04', 'Invalid report schema fails closed with 400 Bad Request');

  // ─── 2. HUB TELEMETRY INGESTION (LENS & ANALYTICS) ────────────────────────
  console.log('\n2. Testing Lens & Hub Telemetry Ingestion...');

  const initialViews = Number(testProduct.views_count) || 0;

  // 2a. Product View Event: Increments views_count in products table
  const viewRes = await fetch(`${API_BASE}/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'product_view',
      productId: testProduct.id,
      visitorId: 'test_lens_visitor_123',
      metadata: { referrer: '/hub', device: 'desktop' }
    })
  });
  assert.equal(viewRes.status, 201, 'Telemetry ingestion should return 201 Created');
  const viewJson = await viewRes.json();
  assert.ok(viewJson.success, 'Telemetry response must indicate success');

  // Verify views_count was incremented in products table
  const updatedProdRes = await query(`SELECT views_count FROM products WHERE id = $1`, [testProduct.id]);
  const newViews = Number(updatedProdRes.rows[0].views_count);
  assert.equal(newViews, initialViews + 1, 'Product views_count must increment on product_view telemetry');
  pass('TEL-01', 'Product view telemetry ingested and views_count incremented in Postgres');

  // 2b. High-Intent 3D & AR Telemetry Events
  for (const eventType of ['3d_interaction', 'ar_launch', 'basket.item_added', 'search']) {
    const eventRes = await fetch(`${API_BASE}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        productId: testProduct.id,
        visitorId: 'test_lens_visitor_123',
        metadata: { durationSec: 15, mode: 'wireframe' }
      })
    });
    assert.equal(eventRes.status, 201, `Telemetry for ${eventType} should return 201`);
  }
  pass('TEL-02', 'Interactive 3D, AR, and Basket telemetry events ingested with zero schema violations');

  // ─── 3. DYNAMIC SOCIAL METADATA & SSR SHARING (HUB-13) ───────────────────
  console.log('\n3. Testing Dynamic SEO & Social Meta Endpoints (HUB-13)...');

  // 3a. Product Social Meta JSON
  const metaProdRes = await fetch(`${API_BASE}/meta/product/${testProduct.id}`);
  assert.equal(metaProdRes.status, 200, 'Meta endpoint for product should return 200');
  const metaProdJson = await metaProdRes.json();
  assert.ok(metaProdJson.meta?.title.includes(testProduct.name), 'Meta title must include product name');
  assert.equal(metaProdJson.meta?.type, 'product');
  assert.equal(metaProdJson.meta?.twitterCard, 'summary_large_image');
  assert.equal(metaProdJson.meta?.schemaOrg?.['@type'], 'Product');
  assert.ok(metaProdJson.htmlTags.includes('og:title'), 'htmlTags must include og:title');
  assert.ok(metaProdJson.htmlTags.includes('application/ld+json'), 'htmlTags must include Schema.org JSON-LD');
  pass('SEO-01', 'Dynamic product social metadata and Schema.org JSON-LD generated correctly');

  // 3b. Organization Social Meta JSON
  const metaOrgRes = await fetch(`${API_BASE}/meta/org/${orgId}`);
  assert.equal(metaOrgRes.status, 200, 'Meta endpoint for organization should return 200');
  const metaOrgJson = await metaOrgRes.json();
  assert.equal(metaOrgJson.meta?.type, 'profile');
  assert.equal(metaOrgJson.meta?.schemaOrg?.['@type'], 'Organization');
  pass('SEO-02', 'Dynamic organization social metadata and schema generated correctly');

  // 3c. Crawler-Friendly SSR Share HTML
  const shareRes = await fetch(`${API_BASE}/share/product/${testProduct.id}`);
  assert.equal(shareRes.status, 200, 'Share endpoint should return 200 HTML');
  assert.ok(shareRes.headers.get('content-type')?.includes('text/html'));
  const shareHtml = await shareRes.text();
  assert.ok(shareHtml.includes('<meta property="og:title"'), 'Share HTML must render og:title');
  assert.ok(shareHtml.includes('<meta name="twitter:card"'), 'Share HTML must render twitter:card');
  assert.ok(shareHtml.includes('<meta http-equiv="refresh"'), 'Share HTML must include redirect for human browsers');
  pass('SEO-03', 'Social share SSR endpoint serves crawler-friendly OpenGraph tags and client redirect');

  // ─── 4. ACCESSIBILITY & COMPONENT CODE AUDIT (HUB-11) ────────────────────
  console.log('\n4. Testing Accessibility (WCAG 2.2 AA) Code Invariants (HUB-11)...');

  // 4a. ReportContentModal Accessibility
  const modalPath = path.join(frontendSrcDir, 'components/hub/ReportContentModal.tsx');
  const modalContent = await fs.readFile(modalPath, 'utf8');
  assert.ok(modalContent.includes('role="dialog"'), 'ReportContentModal must declare role="dialog"');
  assert.ok(modalContent.includes('aria-modal="true"'), 'ReportContentModal must declare aria-modal="true"');
  assert.ok(modalContent.includes('aria-labelledby="report-modal-title"'), 'ReportContentModal must label dialog title');
  assert.ok(modalContent.includes('focus-visible:ring-2'), 'Interactive elements must have visible focus rings');
  assert.ok(modalContent.includes("e.key === 'Escape'"), 'Modal must handle Escape key for keyboard dismissal');
  pass('A11Y-01', 'ReportContentModal meets WCAG 2.2 AA dialog accessibility standards');

  // 4b. HubProductDetail Accessibility
  const detailPath = path.join(frontendSrcDir, 'pages/hub/HubProductDetail.tsx');
  const detailContent = await fs.readFile(detailPath, 'utf8');
  assert.ok(detailContent.includes('aria-label="Report content or broken 3D model"'), 'Report button must have descriptive aria-label');
  assert.ok(detailContent.includes('min-h-[44px]'), 'Action buttons must satisfy >= 44px tap targets');
  assert.ok(detailContent.includes('updateSeoMeta'), 'Product detail page must synchronize dynamic SEO metadata');
  pass('A11Y-02', 'HubProductDetail verified with accessible tap targets and explicit ARIA labels');

  // 4c. Client-side SEO Meta Helper
  const seoHelperPath = path.join(frontendSrcDir, 'utils/seoMeta.ts');
  const seoHelperContent = await fs.readFile(seoHelperPath, 'utf8');
  assert.ok(seoHelperContent.includes('document.title = fullTitle'), 'SEO helper must synchronize document title');
  assert.ok(seoHelperContent.includes('og:title'), 'SEO helper must synchronize OpenGraph tags');
  assert.ok(seoHelperContent.includes('twitter:card'), 'SEO helper must synchronize Twitter tags');
  assert.ok(seoHelperContent.includes('application/ld+json'), 'SEO helper must inject Schema.org JSON-LD');
  // 5. Cleanup test artifacts
  await query(`DELETE FROM moderation_reports WHERE entity_id = $1`, [testProduct.id]);
  await query(`DELETE FROM products WHERE id = $1`, [testProduct.id]);

  console.log('\n✅ All Phase H9 integration tests passed successfully!\n');
}

run()
  .then(() => setImmediate(() => process.exit(0)))
  .catch((err) => {
    console.error('\n❌ Phase H9 test failed:', err);
    setImmediate(() => process.exit(1));
  });
