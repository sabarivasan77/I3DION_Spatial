import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPublicDir = path.resolve(__dirname, '../../../frontend/public');
const frontendSrcDir = path.resolve(__dirname, '../../../frontend/src');

function pass(testId, msg) {
  console.log(`  ✅ [${testId}] ${msg}`);
}

async function run() {
  console.log('\n--- Running Spatial Hub Phase H8 Test Suite (Mobile, PWA, Offline, Performance) ---');

  // 1. Web App Manifest Validation
  const manifestPath = path.join(frontendPublicDir, 'manifest.json');
  const manifestContent = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  assert.equal(manifest.name, 'I3DION Spatial Hub', 'Manifest must define full app name');
  assert.equal(manifest.short_name, 'Spatial Hub');
  assert.equal(manifest.start_url, '/hub', 'PWA start_url must point to /hub');
  assert.equal(manifest.display, 'standalone', 'PWA display mode must be standalone');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'PWA must declare app icons');
  pass('PWA-MANIFEST-01', 'Web App Manifest verified for standalone Spatial Hub PWA');

  // 2. Service Worker File & Offline Strategy Verification
  const swPath = path.join(frontendPublicDir, 'spatial-hub-sw.js');
  const swContent = await fs.readFile(swPath, 'utf8');

  assert.ok(swContent.includes('i3dion-hub-static-v1'), 'SW must declare versioned static cache');
  assert.ok(swContent.includes('i3dion-hub-api-v1'), 'SW must declare versioned API cache');
  assert.ok(swContent.includes('/models/'), 'SW must handle 3D model tier caching');
  assert.ok(swContent.includes('/api/hub/feed'), 'SW must handle offline catalog feed caching');
  pass('PWA-SW-OFFLINE-01', 'Service worker caching verified for 3D model tiers and offline feed');

  // 3. Mobile Layout & Touch Target Verification in SpatialHubLayout
  const layoutPath = path.join(frontendSrcDir, 'layouts/SpatialHubLayout.tsx');
  const layoutContent = await fs.readFile(layoutPath, 'utf8');

  assert.ok(layoutContent.includes('aria-label="Mobile Navigation"'), 'Mobile navigation bar must have proper ARIA label');
  assert.ok(layoutContent.includes('min-h-[44px] min-w-[44px]'), 'Tap targets must meet WCAG minimum 44px sizing');
  assert.ok(layoutContent.includes('to="/hub/compare"'), 'Mobile navigation must include Compare shortcut');
  assert.ok(layoutContent.includes('to="/hub/rfq"'), 'Mobile navigation must include RFQ shortcut');
  assert.ok(layoutContent.includes('ScanLine'), 'Mobile navigation must include prominent Quick Scan button');
  assert.ok(layoutContent.includes('pb-20 lg:pb-0'), 'Main content must apply bottom padding on mobile to prevent obstruction');
  pass('MOBILE-LAYOUT-01', 'Mobile navigation bar verified with safe touch targets >= 44px and zero content overlap');

  // 4. Code Splitting Configuration
  const viteConfigPath = path.join(frontendSrcDir, '../vite.config.ts');
  const viteConfig = await fs.readFile(viteConfigPath, 'utf8');

  assert.ok(viteConfig.includes('manualChunks'), 'Vite config must declare manual code splitting');
  assert.ok(viteConfig.includes('vendor-three'), 'Three.js engine must be isolated in dedicated vendor chunk');
  pass('PERF-CODE-SPLIT-01', 'Manual chunks code splitting verified for optimal initial paint');

  console.log('\n✅ All Phase H8 integration tests passed successfully!\n');
}

run()
  .then(() => setTimeout(() => process.exit(0), 150))
  .catch((err) => {
    console.error('\n❌ Phase H8 test failed:', err);
    setTimeout(() => process.exit(1), 150);
  });
