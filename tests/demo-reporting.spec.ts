import { test, expect } from '@playwright/test';

test.describe('Demo Reporting Tests', () => {
  test('should pass successfully', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page.locator('h1')).toContainText('Example Domain');
  });

  test('should fail for demo', async ({ page }) => {
    await page.goto('https://example.com');
    // This will fail to demonstrate error reporting
    await expect(page).toHaveTitle(/This Title Does Not Exist/);
  });

  test.skip('should be skipped', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);
  });
});