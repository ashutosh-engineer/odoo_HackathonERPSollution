import { test, expect } from '@playwright/test';

test.describe('ERP System End-to-End Journey', () => {
  test('Login, navigate pages, verify backend data, and logout', async ({ page }) => {
    // 1. Visit Landing Page / Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login credentials
    await page.locator('#email').click();
    await page.locator('#email').fill('admin');
    await page.locator('#password').click();
    await page.locator('#password').fill('admin');
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // 2. Dashboard Verification
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Check main logo/brand presence
    await expect(page.locator('nav').locator('text=SHIVERP').first()).toBeVisible();
    
    // Verify Dashboard KPIs/elements load (e.g. Sales, Inventory, or Manufacturing metrics)
    await expect(page.locator('h1:has-text("Operational Dashboard")')).toBeVisible();
    await page.waitForTimeout(2000); // Wait for API calls to populate metrics
    
    // 3. Products Master Page
    await page.locator('a[href="/products"]').click();
    await page.waitForURL('**/products');
    await expect(page.locator('text=Demo Product').first()).toBeVisible();
    
    // 4. Sales Orders
    await page.locator('a[href="/sales"]').click();
    await page.waitForURL('**/sales');
    await expect(page.locator('h1:has-text("Sales Orders")')).toBeVisible();
    
    // 5. Purchase Orders
    await page.locator('a[href="/purchase"]').click();
    await page.waitForURL('**/purchase');
    await expect(page.locator('h1:has-text("Purchase Orders")')).toBeVisible();
    
    // 6. Manufacturing Orders
    await page.locator('a[href="/manufacturing"]').click();
    await page.waitForURL('**/manufacturing');
    await expect(page.locator('h1:has-text("Manufacturing Orders")')).toBeVisible();
    
    // 7. Inventory / Stock
    await page.locator('a[href="/inventory"]').click();
    await page.waitForURL('**/inventory');
    await expect(page.locator('h2:has-text("Inventory Stock Ledger")')).toBeVisible();
    
    // 8. Live Factory Floor Work Center Status Console
    await page.locator('a[href="/floor-console"]').click();
    await page.waitForURL('**/floor-console');
    await expect(page.locator('h1:has-text("Floor Console")')).toBeVisible();
    
    // 9. Audit Logs
    await page.locator('a[href="/audit-log"]').click();
    await page.waitForURL('**/audit-log');
    await expect(page.locator('h1:has-text("Audit Logs")')).toBeVisible();
    
    // 10. Check logs presence
    await expect(page.locator('table')).toBeVisible();
  });
});
