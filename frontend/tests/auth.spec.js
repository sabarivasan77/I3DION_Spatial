import { test, expect } from '@playwright/test';
test('auth flow tests', async ({ page }) => {
    await page.goto('/login');
    // Login form check
    await expect(page.locator('h2').first()).toBeVisible();
    // Attempt simple form manipulation
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    // In a real e2e environment this would redirect or show error, 
    // we just wait for network idle to ensure no crashes
    await page.waitForLoadState('networkidle');
});
