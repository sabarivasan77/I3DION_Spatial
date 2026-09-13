import { test, expect } from '@playwright/test';

test('auth flow tests', async ({ page }) => {
  await page.goto('/login');
  
  // Login form check
  await expect(page.locator('h2').first()).toBeVisible();
  
  // Attempt simple form manipulation
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForLoadState('domcontentloaded');
});
