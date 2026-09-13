import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';

test.describe('I3DION Omni Studio E2E Playwright Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Inject active auth session into localStorage using the keys expected by authStore.ts
    await page.addInitScript(() => {
      const mockUser = {
        id: 'test-user-id',
        name: 'Playwright Studio Admin',
        email: 'admin@i3dion.com',
        role: 'Admin',
        companyId: 'test-company-id'
      };
      window.localStorage.setItem('i3dion_token', 'mock-offline-token');
      window.localStorage.setItem('i3dion_user', JSON.stringify(mockUser));
    });
  });

  test('1. Omni Studio Overview Renders & Displays Hero Action Buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/omni-studio`);
    await page.waitForLoadState('domcontentloaded');

    // Title / App Shell check
    await expect(page.locator('text=I3DION Omni Studio').first()).toBeVisible();
    await expect(page.locator('main button:has-text("New Catalog")').first()).toBeVisible();
    await expect(page.locator('text=Recent Projects').first()).toBeVisible();
  });

  test('2. Creating New Project Navigates to Builder without Redirecting to Homepage', async ({ page }) => {
    await page.goto(`${BASE_URL}/omni-studio`);
    await page.waitForLoadState('domcontentloaded');

    // Click main New Catalog button
    const createBtn = page.locator('main button:has-text("New Catalog")').first();
    await createBtn.click();

    // Verify URL transitions to /omni-studio/builder/
    await page.waitForURL(/\/omni-studio\/builder\//, { timeout: 10000 });
    expect(page.url()).toContain('/omni-studio/builder/');
    expect(page.url()).not.toContain('/login');
    expect(page.url()).not.toBe(`${BASE_URL}/`);

    // Verify Omni Studio Builder elements load for newly created catalog
    await expect(page.locator('text=Industrial Pump Catalog').first()).toBeVisible();
  });

  test('3. Omni Studio Builder Top Controls & Panels Render Properly', async ({ page }) => {
    await page.goto(`${BASE_URL}/omni-studio/builder/proj-default`);
    await page.waitForLoadState('domcontentloaded');

    // View selector buttons
    await expect(page.locator('button:has-text("Desktop")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Tablet")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Mobile")').first()).toBeVisible();

    // Widget Library Left Panel
    await expect(page.locator('button:has-text("Widgets")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Hierarchy")').first()).toBeVisible();

    // Properties Inspector Right Panel
    await expect(page.locator('text=Component Title').first()).toBeVisible();
    await expect(page.locator('text=Subtitle / Description').first()).toBeVisible();
  });

  test('4. Omni Studio Projects List Navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/omni-studio/projects`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Projects').first()).toBeVisible();
  });
});
