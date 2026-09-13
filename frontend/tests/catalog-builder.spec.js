import { test, expect } from '@playwright/test';

test('catalog builder flow', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('i3dion_token', 'mock-offline-token');
    window.localStorage.setItem('i3dion_user', JSON.stringify({
      id: 'test-user-id',
      name: 'Playwright Studio Admin',
      email: 'admin@i3dion.com',
      role: 'Admin',
      companyId: 'test-company-id'
    }));
  });

  await page.goto('/omni-studio/builder/proj-default');
  await page.waitForLoadState('domcontentloaded');
  
  await expect(page.locator('button:has-text("Desktop")').first()).toBeVisible();
});
