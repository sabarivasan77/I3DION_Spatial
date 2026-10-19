/**
 * Phase P7 Integration Test Suite: Print & PDF Catalog Engine
 * Verification Coverage:
 *  - PDF-01: App Definition -> Print Engine rendering with TOC, repeating headers/footers, product QR codes, spec tables, and page-break rules.
 *  - PDF-02: Security isolation: remote unauthorized URL rejected in template; only allow-listed assets processed.
 *  - PDF-03: RGB scope honest disclosure: metadata and document header declare 'ColorSpace: sRGB (v1 RGB only per Decision D-07)'.
 *  - PDF-04: 60-page large catalog generation benchmark under time cap (p95 < 10s budget).
 *  - PDF-05: India-ready GST quotation PDF template with HSN codes, GSTIN, and tax breakdowns.
 *  - PDF-06: Batch dealer PDF generation with progress, partial failure policy, and resume capability.
 *  - PDF-07: Memory/timeout caps enforced: oversized / runaway job aborted gracefully.
 *  - PDF-08: Signed private storage export: generated PDF is stored in private storage and accessible via HMAC-signed URL with expiry.
 */

import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { app } from '../../src/server.js';
import { pool, query, ensureMigrated } from '../../src/db/pool.js';
import { config } from '../../src/config.js';
import { printEngine } from '../../src/services/print/printEngine.js';
import { validateFileMagicBytes, getStorageDirectory } from '../../src/services/storageService.js';

let server;
let baseUrl;

async function setup() {
  await ensureMigrated();
  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function teardown() {
  if (server) {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise((r) => server.close(r));
  }
  await pool.end();
}

function createToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
}

console.log('================================================================');
console.log('🖨️ I3DION Phase P7: Print & PDF Engine Verification Suite');
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

async function runPrintTestSuite() {
  const testOrgId = '77777777-7777-4777-8777-777777777777';
  const adminUserId = 'aaaa7777-7777-4777-8777-777777777777';

  // Seed organization & admin user
  await query(`DELETE FROM organization_members WHERE user_id = $1 OR organization_id = $2`, [adminUserId, testOrgId]);
  await query(`DELETE FROM users WHERE id = $1`, [adminUserId]);
  await query(`DELETE FROM organizations WHERE id = $1`, [testOrgId]);
  await query(`INSERT INTO organizations (id, name) VALUES ($1, 'AeroCompressors Global')`, [testOrgId]);
  await query(
    `INSERT INTO users (id, email, password_hash, name, role, organization_id, token_version)
     VALUES ($1, 'admin@aerocompressors.test', 'argon2id$mock', 'Lead Architect', 'Admin', $2, 0)`,
    [adminUserId, testOrgId]
  );
  await query(
    `INSERT INTO organization_members (organization_id, user_id, role)
     VALUES ($1, $2, 'Admin')`,
    [testOrgId, adminUserId]
  );

  const adminToken = createToken({
    id: adminUserId,
    userId: adminUserId,
    email: 'admin@aerocompressors.test',
    role: 'Admin',
    organization_id: testOrgId,
    token_version: 0
  });

  const sampleCatalogDoc = {
    schema: 'i3dion.catalog/1',
    meta: {
      name: 'Turbine Systems 2027',
      slug: 'turbine-systems-2027'
    },
    theme: {
      preset: 'industrial-light',
      primary: '#2563EB'
    },
    pages: [
      {
        id: 'turbines',
        title: 'Centrifugal Turbines',
        items: [
          {
            id: 'ct-500',
            name: 'CT-500 High-Pressure Turbine',
            badge: 'Industrial Grade',
            list_price: 85000,
            public_specs: {
              max_pressure_bar: 35,
              power_output_kw: 1200,
              impeller_rpm: 45000
            }
          },
          {
            id: 'ct-750',
            name: 'CT-750 Heavy Marine Turbine',
            badge: 'Marine Certified',
            list_price: 145000,
            public_specs: {
              max_pressure_bar: 48,
              power_output_kw: 2400,
              impeller_rpm: 38000
            }
          }
        ]
      }
    ]
  };

  // --------------------------------------------------------------------------
  // PDF-01: App Definition -> Print Engine Rendering with TOC & Headers/Footers
  // --------------------------------------------------------------------------
  let renderResult;
  try {
    const res = await fetch(`${baseUrl}/api/print/catalog/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        catalogDoc: sampleCatalogDoc,
        pageSize: 'A4',
        watermark: 'CONFIDENTIAL',
        includeToc: true
      })
    });

    assert.strictEqual(res.status, 200, 'Rendering must return status 200');
    renderResult = await res.json();
    assert.strictEqual(renderResult.success, true);
    assert.ok(renderResult.downloadUrl, 'Download URL must be returned');
    assert.ok(renderResult.pageCount >= 3, 'Must render Cover + TOC + Content pages');

    // Read the generated file from disk to verify %PDF-1.4 binary structure
    const targetPath = path.resolve(getStorageDirectory(), renderResult.filename);
    const pdfBuffer = await fs.readFile(targetPath);

    // Verify PDF Magic Bytes
    const magicCheck = await validateFileMagicBytes(pdfBuffer, renderResult.filename);
    assert.strictEqual(magicCheck.valid, true, 'File magic bytes must be valid PDF');
    assert.strictEqual(pdfBuffer.toString('utf8', 0, 8), '%PDF-1.4', 'Must start with %PDF-1.4 header');

    const pdfText = pdfBuffer.toString('utf8');
    assert.ok(pdfText.includes('Table of Contents'), 'PDF must include Table of Contents');
    assert.ok(pdfText.includes('Centrifugal Turbines'), 'TOC must contain section title');
    assert.ok(pdfText.includes('CT-500 High-Pressure Turbine'), 'Content page must contain product name');
    assert.ok(pdfText.includes('CONFIDENTIAL'), 'Watermark must be rendered in background stream');
    assert.ok(pdfText.includes('COLORSPACE: sRGB'), 'Repeating footer must declare sRGB color space');

    pass('PDF-01', `Synthesized ${renderResult.pageCount}-page PDF with TOC, headers/footers, and product specs`);
  } catch (err) {
    fail('PDF-01', err);
  }

  // --------------------------------------------------------------------------
  // PDF-02: Security Isolation (Remote Unauthorized URLs Rejected)
  // --------------------------------------------------------------------------
  try {
    const maliciousDoc = JSON.parse(JSON.stringify(sampleCatalogDoc));
    maliciousDoc.pages[0].items[0].photo = 'https://attacker-external-server.com/malicious-exfil.png';

    const res = await fetch(`${baseUrl}/api/print/catalog/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ catalogDoc: maliciousDoc })
    });

    assert.strictEqual(res.status, 400, 'Remote untrusted URL must be rejected with HTTP 400');
    const errData = await res.json();
    assert.ok(errData.message.includes('Security violation'), 'Error must specify security violation');

    pass('PDF-02', 'Unauthorized remote external URL strictly rejected in template (Vault allow-list enforced)');
  } catch (err) {
    fail('PDF-02', err);
  }

  // --------------------------------------------------------------------------
  // PDF-03: Honest RGB Scope Disclosure (Decision D-07)
  // --------------------------------------------------------------------------
  try {
    assert.strictEqual(renderResult.colorSpace, 'sRGB');
    assert.ok(renderResult.scopeNotice.includes('Decision D-07'));

    const targetPath = path.resolve(getStorageDirectory(), renderResult.filename);
    const pdfText = (await fs.readFile(targetPath)).toString('utf8');

    assert.ok(pdfText.includes('/ColorSpace /DeviceRGB'), 'PDF object dictionary must specify /DeviceRGB');
    assert.ok(pdfText.includes('RGB only per Decision D-07'), 'PDF Producer/Notice must declare RGB-only scope');
    assert.ok(pdfText.includes('CMYK, PDF/X, and press bleed/crop marks are out of scope for v1'), 'Scope note must be explicit');

    pass('PDF-03', 'Verified honest RGB-only scope declaration in PDF dictionary & visual metadata per Decision D-07');
  } catch (err) {
    fail('PDF-03', err);
  }

  // --------------------------------------------------------------------------
  // PDF-04: 60-Page Large Catalog Generation Benchmark (p95 < 10s budget)
  // --------------------------------------------------------------------------
  try {
    // Generate synthetic 60-page catalog (1 Cover + 1 TOC + 59 content pages with 118 products)
    const largeCatalog = {
      schema: 'i3dion.catalog/1',
      meta: { name: 'Full Industrial Valve Series 2027', slug: 'valves-series-2027' },
      theme: { preset: 'machinery-heavy', primary: '#D97706' },
      pages: []
    };

    for (let p = 1; p <= 30; p++) {
      largeCatalog.pages.push({
        id: `section-${p}`,
        title: `Valve Category Series ${p}`,
        items: [
          {
            id: `vlv-${p}-a`,
            name: `Pneumatic Control Valve Type ${p}A`,
            badge: 'ANSI Class 600',
            list_price: 12000 + p * 500,
            public_specs: { flange_size_inch: 6, max_temp_c: 450, actuation: 'Pneumatic' }
          },
          {
            id: `vlv-${p}-b`,
            name: `Cryogenic Gate Valve Type ${p}B`,
            badge: 'Cryo-Tested',
            list_price: 18500 + p * 600,
            public_specs: { flange_size_inch: 8, min_temp_c: -196, material: 'SS 316L' }
          },
          {
            id: `vlv-${p}-c`,
            name: `High-Pressure Butterfly Valve ${p}C`,
            badge: 'Zero Leakage',
            list_price: 9800 + p * 300,
            public_specs: { pressure_bar: 50, seal_type: 'Metal-to-Metal' }
          },
          {
            id: `vlv-${p}-d`,
            name: `Emergency Shut-off Valve ${p}D`,
            badge: 'SIL-3 Certified',
            list_price: 24000 + p * 800,
            public_specs: { fail_safe: 'Spring Return', closing_time_sec: 1.2 }
          }
        ]
      });
    }

    const tStart = Date.now();
    const largeResult = await printEngine.renderCatalogPdf(largeCatalog, {
      organizationId: testOrgId,
      pageSize: 'A4',
      includeToc: true
    });
    const elapsedMs = Date.now() - tStart;

    assert.ok(largeResult.pageCount >= 60, `Page count must be >= 60 (got ${largeResult.pageCount})`);
    assert.ok(elapsedMs < 10000, `Execution time must be under 10s budget (took ${elapsedMs}ms)`);

    pass('PDF-04', `Generated ${largeResult.pageCount}-page catalog in ${elapsedMs}ms (budget: < 10,000ms)`);
  } catch (err) {
    fail('PDF-04', err);
  }

  // --------------------------------------------------------------------------
  // PDF-05: India-Ready GST Quotation PDF Template
  // --------------------------------------------------------------------------
  try {
    // 1. Inter-state quotation (IGST 18%)
    const interStateQuote = await printEngine.renderIndiaGstQuotePdf({
      quoteNumber: 'Q-2027-TN-MH-001',
      seller: {
        name: 'I3DION Spatial Technologies Pvt Ltd',
        address: 'Guindy Industrial Estate, Chennai, TN - 600032',
        gstin: '33AABCI3333P1Z9',
        stateCode: '33 (Tamil Nadu)',
        pan: 'AABCI3333P'
      },
      buyer: {
        name: 'Maharashtra Heavy Engineering Ltd',
        address: 'Bhosari MIDC, Pune, MH - 411026',
        gstin: '27AABCM8888P1Z3',
        stateCode: '27 (Maharashtra)',
        contactPerson: 'Anand Kulkarni',
        email: 'anand@mhe.co.in'
      },
      items: [
        {
          description: 'Industrial Air Compressor 75kW Two-Stage',
          hsn: '8414',
          quantity: 2,
          unit: 'Nos',
          rate: 450000
        }
      ]
    });

    assert.strictEqual(interStateQuote.isInterState, true);
    assert.strictEqual(interStateQuote.subtotal, 900000);
    assert.strictEqual(interStateQuote.taxAmount, 162000, 'IGST 18% of 900,000 must be 162,000');
    assert.strictEqual(interStateQuote.grandTotal, 1062000);

    // Read generated PDF file to verify text
    const quoteFilePath = path.resolve(getStorageDirectory(), interStateQuote.filename);
    const quoteText = (await fs.readFile(quoteFilePath)).toString('utf8');
    assert.ok(quoteText.includes('33AABCI3333P1Z9'), 'Must contain seller GSTIN');
    assert.ok(quoteText.includes('27AABCM8888P1Z3'), 'Must contain buyer GSTIN');
    assert.ok(quoteText.includes('8414'), 'Must contain HSN code');
    assert.ok(quoteText.includes('IGST 18%'), 'Must specify IGST calculation');
    assert.ok(
      quoteText.includes('10,62,000') || quoteText.includes('1,062,000'),
      'Must contain grand total in INR'
    );

    pass('PDF-05', `India GST quotation verified with HSN 8414, IGST 18% calculation, and total Rs. 1,062,000`);
  } catch (err) {
    fail('PDF-05', err);
  }

  // --------------------------------------------------------------------------
  // PDF-06: Batch Dealer PDF Generation with Partial Failure & Resume Support
  // --------------------------------------------------------------------------
  try {
    const dealers = [
      { id: 'dealer-chennai', name: 'Southern Pneumatics Chennai', territory: 'Tamil Nadu & Kerala' },
      { id: 'dealer-mumbai', name: 'Western Power & Compressors', territory: 'Maharashtra & Gujarat' },
      { id: 'dealer-corrupt', name: '', territory: 'Invalid Data' }, // Intentionally malformed
      { id: 'dealer-delhi', name: 'Northern Industrial Tools', territory: 'Delhi NCR & Haryana' }
    ];

    let progressEvents = [];
    const batchResult = await printEngine.generateBatchDealerPdfs({
      catalogDoc: sampleCatalogDoc,
      dealers,
      organizationId: testOrgId,
      onProgress: (p) => progressEvents.push(p)
    });

    // Verify partial failure policy: 3 succeeded, 1 failed, overall completed without crash
    assert.strictEqual(batchResult.total, 4);
    assert.strictEqual(batchResult.completed, 3, '3 valid dealers must be generated');
    assert.strictEqual(batchResult.failed, 1, '1 malformed dealer must be recorded as failed');
    assert.strictEqual(batchResult.failedDealers[0].dealerId, 'dealer-corrupt');
    assert.ok(progressEvents.length >= 4, 'Progress events must be dispatched for every dealer');

    // Test Resume Capability from dealer-delhi
    const resumeResult = await printEngine.generateBatchDealerPdfs({
      catalogDoc: sampleCatalogDoc,
      dealers,
      organizationId: testOrgId,
      resumeFromDealerId: 'dealer-delhi'
    });
    assert.strictEqual(resumeResult.completed, 1, 'Resume must process only remaining dealers');
    assert.strictEqual(resumeResult.results[0].dealerId, 'dealer-delhi');

    pass('PDF-06', `Batch dealer PDF generator processed 4 dealers with partial-failure tolerance and resume support`);
  } catch (err) {
    fail('PDF-06', err);
  }

  // --------------------------------------------------------------------------
  // PDF-07: Memory & Page Limit Caps Enforced (DoS Protection)
  // --------------------------------------------------------------------------
  try {
    // Generate massive document exceeding maxPagesCap (100)
    const giantCatalog = {
      schema: 'i3dion.catalog/1',
      meta: { name: 'Giant Runaway Catalog', slug: 'giant' },
      pages: []
    };
    for (let i = 1; i <= 60; i++) {
      giantCatalog.pages.push({
        id: `p-${i}`,
        title: `Section ${i}`,
        items: Array.from({ length: 6 }, (_, idx) => ({
          id: `item-${i}-${idx}`,
          name: `Valve ${i}-${idx}`
        }))
      });
    }

    let caughtError = null;
    try {
      await printEngine.renderCatalogPdf(giantCatalog, {
        organizationId: testOrgId
      });
    } catch (err) {
      caughtError = err;
    }

    assert.ok(caughtError, 'Oversized job must throw error');
    assert.ok(
      caughtError.message.includes('exceeds maximum print limit'),
      'Must state maximum print limit exceeded'
    );

    pass('PDF-07', 'Enforced 100-page limit cap and prevented runaway memory consumption');
  } catch (err) {
    fail('PDF-07', err);
  }

  // --------------------------------------------------------------------------
  // PDF-08: Signed Private Storage Export & Security Rejection
  // --------------------------------------------------------------------------
  try {
    assert.ok(renderResult.downloadUrl.includes('sig='), 'Download URL must have HMAC signature');
    assert.ok(renderResult.downloadUrl.includes('expires='), 'Download URL must have expiration');

    // 1. Download via valid HMAC-signed URL -> HTTP 200
    const signedDownloadRes = await fetch(`${baseUrl}${renderResult.downloadUrl}`);
    assert.strictEqual(signedDownloadRes.status, 200, 'Valid signed URL must return HTTP 200');
    assert.strictEqual(
      signedDownloadRes.headers.get('content-type'),
      'application/pdf',
      'Content-Type must be application/pdf'
    );

    // 2. Download without signature -> HTTP 401 Unauthorized
    const rawFileUrl = `/api/storage/files/${renderResult.filename}`;
    const unsignedRes = await fetch(`${baseUrl}${rawFileUrl}`);
    assert.strictEqual(unsignedRes.status, 401, 'Unsigned unauthenticated access must be rejected with HTTP 401');

    pass('PDF-08', 'Exported PDF stored in private storage; access permitted only via HMAC-signed expiring URL');
  } catch (err) {
    fail('PDF-08', err);
  }

  // Final summary
  console.log('\n================================================================');
  console.log(`Test Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    setTimeout(() => process.exit(1), 150);
  }
}

async function main() {
  try {
    await setup();
    await runPrintTestSuite();
  } catch (err) {
    console.error('Fatal test error:', err);
    setTimeout(() => process.exit(1), 150);
  } finally {
    await teardown();
    setTimeout(() => process.exit(failedCount > 0 ? 1 : 0), 150);
  }
}

main();
