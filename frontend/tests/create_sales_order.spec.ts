import { test, expect } from '@playwright/test';

test.describe('Create Sales Order', () => {
  test('Create SO successfully', async ({ page }) => {
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
    
    // 2. Wait for dashboard
    await page.waitForURL('**/dashboard');
    
    // 3. Open New Entry menu and click New Sales Order
    await page.locator('button:has-text("New Entry")').click();
    await page.locator('a:has-text("New Sales Order")').click();
    await page.waitForURL('**/sales/new');
    
    // 4. Fill Sales Order Form
    // Wait for customers to load
    await page.waitForSelector('select[required]');
    
    // Select first customer
    await page.locator('select').first().selectOption({ index: 1 });
    
    // Set delivery date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(dateStr);
    
    // Add product
    await page.locator('button:has-text("Add Product")').click();
    
    // Change quantity
    await page.locator('input[type="number"]').first().fill('5');
    
    // Submit
    await page.locator('button[type="submit"]').click();
    
    // Wait for redirect
    await page.waitForURL(/\/sales\/\d+/);
    
    // Check that we are on the new order page
    await expect(page.locator('h1:has-text("Sales Order")')).toBeVisible();
  });
});
