import { test, expect } from '@playwright/test';

test.describe('Visual Audit - Screenshot All Pages', () => {
  test('Capture all pages for audit', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/01-login.png', fullPage: true });

    await page.locator('#email').fill('admin');
    await page.locator('#password').fill('admin');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/02-dashboard.png', fullPage: true });

    await page.goto('/products');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/03-products.png', fullPage: true });

    await page.goto('/sales');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/04-sales.png', fullPage: true });

    await page.goto('/purchase');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/05-purchase.png', fullPage: true });

    await page.goto('/manufacturing');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/06-manufacturing.png', fullPage: true });

    await page.goto('/inventory');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/07-inventory.png', fullPage: true });

    await page.goto('/floor-console');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/08-floor-console.png', fullPage: true });

    await page.goto('/audit-log');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/09-audit-log.png', fullPage: true });

    await page.goto('/settings');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/10-settings.png', fullPage: true });

    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/11-landing.png', fullPage: true });
  });
});
