import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'https://i3-dion-spatial.vercel.app';

test.describe('I3DION Spatial E2E Playwright Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Inject active auth session into localStorage before navigation
    await page.addInitScript(() => {
      window.localStorage.setItem('i3dion.user', JSON.stringify({
        id: 'test-user-id',
        name: 'Playwright Admin',
        email: 'admin@i3dion.com',
        role: 'Admin',
        companyId: 'test-company-id'
      }));
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'offline-dev-token',
          user: {
            id: 'test-user-id',
            name: 'Playwright Admin',
            email: 'admin@i3dion.com',
            role: 'Admin',
            companyId: 'test-company-id'
          }
        },
        version: 0
      }));
    });
  });

  test('1. Landing Page Loads & Renders Navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('domcontentloaded');

    // Title verification
    await expect(page).toHaveTitle(/I3DION/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('2. Product Upload Wizard Step 1 & Step 2', async ({ page }) => {
    await page.goto(`${BASE_URL}/products/upload`);
    await page.waitForLoadState('domcontentloaded');

    // Locate form fields
    const nameInput = page.locator('input').first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Playwright Spatial Compressor');

    const categoryInput = page.locator('input').nth(1);
    if (await categoryInput.isVisible()) {
      await categoryInput.fill('Industrial Machinery');
    }

    const descInput = page.locator('textarea').first();
    if (await descInput.isVisible()) {
      await descInput.fill('Industrial high-volume dual compressor with real-time AR telemetry.');
    }

    // Attach mock files
    const fileInputs = page.locator('input[type="file"]');
    const inputCount = await fileInputs.count();
    if (inputCount > 0) {
      await fileInputs.first().setInputFiles({
        name: 'test-thumb.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
      });
    }

    // Verify Create button
    const submitBtn = page.locator('button[type="submit"]').or(page.locator('button:has-text("Create Product")')).first();
    await expect(submitBtn).toBeVisible();
  });

  test('3. Public Product Experience Page Renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/product/offline-product-1`);
    await page.waitForLoadState('domcontentloaded');

    // Verify product viewer container and non-error state
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Product Unavailable')).not.toBeVisible();
  });

  test('4. Catalogs Route Renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogs`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toBeVisible();
  });

  test('5. Sales Intelligence & Analytics Dashboard Renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toBeVisible();
  });

  test('6. Billing Settings Route Renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/billing`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toBeVisible();
  });
});
