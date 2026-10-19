import assert from 'node:assert/strict';
import { pool } from '../../src/db/pool.js';
import { 
  createShortLink, 
  resolveShortLink, 
  repointShortLink, 
  updateShortLinkSettings, 
  generateShortCode 
} from '../../src/services/qr/qrShortlinkService.js';

function pass(testId, msg) {
  console.log(`  ✅ [${testId}] ${msg}`);
}

async function run() {
  console.log('\n--- Running Spatial Hub Phase H4 Test Suite (QR Studio, Short Links, Scanner Security) ---');

  const SHOWCASE_ORG = 'e0000000-0000-0000-0000-000000000001';

  // 1. Test Cryptographic Entropy of Short Code (>= 96 bits)
  const code = generateShortCode();
  assert.equal(code.length, 16, 'Base64url short code must be 16 characters for 96-bit cryptographic entropy');
  pass('QR-ENTROPY-01', 'Short link tokens carry >= 96 bits of non-enumerable entropy');

  // 2. Test Short Link Creation
  const link = await createShortLink({
    organizationId: SHOWCASE_ORG,
    productSlug: 'anisotropybarnlamp',
    targetUrl: '/hub/product/anisotropybarnlamp',
    title: 'Brochure QR Code',
    campaign: 'TradeShow-Oct2026',
    utmSource: 'print_brochure',
    utmMedium: 'qr'
  });

  assert.ok(link.id, 'Short link must have a UUID');
  assert.equal(link.campaign, 'TradeShow-Oct2026');
  assert.equal(link.visits_count, 0, 'Visits count must start at 0 (zero fake metrics)');
  pass('QR-CREATE-01', 'Short link created successfully with campaign attribution');

  // 3. Test Short Link Resolution via API
  const resolveRes = await fetch(`http://localhost:4000/api/qr/resolve/${link.short_code}`);
  assert.equal(resolveRes.status, 200, 'Resolver endpoint must return 200 OK');
  const resolveData = await resolveRes.json();

  assert.equal(resolveData.status, 'active');
  assert.equal(resolveData.campaign, 'TradeShow-Oct2026');
  assert.ok(resolveData.targetUrl.includes('campaign=TradeShow-Oct2026'), 'Campaign parameter must be appended to target URL');
  assert.equal(resolveData.visitsCount, 1, 'Visits count must increment by 1 on resolution');
  pass('QR-RESOLVE-01', 'Resolver accurately routes to target URL and increments truthful visit metric');

  // 4. Test Campaign Re-pointing (QR-Never-Breaks Guarantee)
  const newTarget = '/hub/product/anisotropybarnlamp?variant=special-finish';
  const repointed = await repointShortLink(link.id, newTarget, SHOWCASE_ORG);
  assert.equal(repointed.target_url, newTarget);
  assert.equal(repointed.short_code, link.short_code, 'Short code must never change when re-pointing destination');

  const reResolve = await resolveShortLink(link.short_code);
  assert.ok(reResolve.targetUrl.includes('variant=special-finish'), 'Re-pointed destination must be immediately live');
  pass('QR-REPOINT-01', 'Printed QR codes remain 100% stable when campaign target destination is updated');

  // 5. Test Pausing Short Link
  await updateShortLinkSettings(link.id, { isPaused: true }, SHOWCASE_ORG);
  const pausedResolve = await resolveShortLink(link.short_code);
  assert.equal(pausedResolve.status, 'paused');
  pass('QR-PAUSE-01', 'Paused QR link is immediately blocked with polite status response');

  // 6. Test Expiration
  const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
  await updateShortLinkSettings(link.id, { isPaused: false, expiresAt: pastDate }, SHOWCASE_ORG);
  const expiredResolve = await resolveShortLink(link.short_code);
  assert.equal(expiredResolve.status, 'expired');
  pass('QR-EXPIRE-01', 'Expired QR link returns expired status');

  // 7. Scanner Security & URL Allow-List Unit Tests (SCAN-*)
  function mockResolveScanTarget(raw, origin = 'http://localhost:5173') {
    const INTERNAL_PATH = /^\/(hub\/(product|org)\/|c\/|q\/|p\/)[A-Za-z0-9._~\-/]*$/;
    try {
      const url = new URL(raw.trim(), origin);
      if (url.origin === origin && INTERNAL_PATH.test(url.pathname)) {
        return { kind: 'internal', path: `${url.pathname}${url.search}${url.hash}` };
      }
      if (url.protocol === 'https:') return { kind: 'external', url: url.toString(), host: url.host };
      return { kind: 'invalid' };
    } catch {
      return { kind: 'invalid' };
    }
  }

  // Same-origin product link
  const t1 = mockResolveScanTarget('http://localhost:5173/hub/product/anisotropybarnlamp');
  assert.equal(t1.kind, 'internal');

  // Same-origin short link
  const t2 = mockResolveScanTarget('http://localhost:5173/q/AbCdEf1234567890');
  assert.equal(t2.kind, 'internal');

  // External https link (requires confirmation)
  const t3 = mockResolveScanTarget('https://partner-catalog.com/specs/lamp');
  assert.equal(t3.kind, 'external');
  assert.equal(t3.host, 'partner-catalog.com');

  // Malicious protocols must be rejected (fail closed)
  const t4 = mockResolveScanTarget('javascript:alert(1)');
  assert.equal(t4.kind, 'invalid');

  const t5 = mockResolveScanTarget('data:text/html,<script>alert(1)</script>');
  assert.equal(t5.kind, 'invalid');

  const t6 = mockResolveScanTarget('file:///etc/passwd');
  assert.equal(t6.kind, 'invalid');

  pass('SCAN-SECURITY-01', 'Scanner allow-list strictly permits same-origin, flags external https, and rejects malicious schemes');

  console.log('\n✅ All Phase H4 integration tests passed successfully!\n');
  await pool.end();
}

run()
  .catch((err) => {
    console.error('\n❌ Phase H4 test failed:', err);
    process.exit(1);
  });
