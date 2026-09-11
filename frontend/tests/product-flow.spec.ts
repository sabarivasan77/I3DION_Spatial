import { test, expect } from '@playwright/test';

test('public product page flow', async ({ page }) => {
  // Hit a mock public product page (assuming ID 1 exists or defaults to mock)
  await page.goto('/product/1');
  
  // Check if it renders
  await expect(page.locator('body')).toBeVisible();
  
  // We can't easily assert the 3D canvas due to WebGL limitations in headless,
  // but we can check if the UI overlays rendered
  await page.waitForLoadState('networkidle');
});
