import { test, expect } from '@playwright/test';

/**
 * Wishlist Page E2E Tests
 * 
 * Tests the wishlist landing page functionality:
 * - Page loads correctly
 * - All vendor cards are displayed
 * - Links have correct attributes for external navigation
 * - No embedding or iframes (link-out only)
 */
test.describe('Wishlist Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onskeliste');
  });

  test('loads wishlist page with correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ønskeliste', exact: true })).toBeVisible();
  });

  test('displays all vendor wishlist cards', async ({ page }) => {
    await expect(page.getByText('Tilbords')).toBeVisible();
    await expect(page.getByText('Illums Bolighus')).toBeVisible();
    await expect(page.getByText('Kitchn')).toBeVisible();
  });

  test('displays how-it-works section', async ({ page }) => {
    await expect(page.getByText('Slik fungerer det')).toBeVisible();
    await expect(page.getByText(/kjøp og reservasjon skjer direkte hos leverandøren/i)).toBeVisible();
  });

  test('Tilbords link has correct attributes', async ({ page }) => {
    const tilbordsCard = page.locator('a[href*="tilbords.no"]');
    await expect(tilbordsCard).toHaveAttribute('target', '_blank');
    await expect(tilbordsCard).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(tilbordsCard).toHaveAttribute('href', 'https://www.tilbords.no/min-side/onskelister/172091/');
  });

  test('Illums Bolighus link has correct attributes', async ({ page }) => {
    const illumsCard = page.locator('a[href*="illumsbolighus.no"]');
    await expect(illumsCard).toHaveAttribute('target', '_blank');
    await expect(illumsCard).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(illumsCard).toHaveAttribute('href', 'https://www.illumsbolighus.no/onskeliste/andre?id=761fabb33f00e34b46fe2624ab');
  });

  test('Kitchn link has correct attributes', async ({ page }) => {
    const kitchnCard = page.locator('a[href*="kitchn.no"]');
    await expect(kitchnCard).toHaveAttribute('target', '_blank');
    await expect(kitchnCard).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(kitchnCard).toHaveAttribute('href', 'https://www.kitchn.no/onskeliste/245134/');
  });

  test('no iframes are present on page', async ({ page }) => {
    // Verify we're using link-out strategy, not embedding
    const iframes = await page.locator('iframe').count();
    expect(iframes).toBe(0);
  });

  test('navigation includes wishlist link', async ({ page }) => {
    // Go to home page first
    await page.goto('/');
    
    // Find and verify wishlist nav link
    const wishlistNavLink = page.locator('nav a[href="/onskeliste"]');
    await expect(wishlistNavLink).toBeVisible();
    await expect(wishlistNavLink).toContainText('Ønskeliste');
    
    // Click and verify navigation works
    await wishlistNavLink.click();
    await expect(page).toHaveURL(/\/onskeliste/);
    await expect(page.getByRole('heading', { name: 'Ønskeliste', exact: true })).toBeVisible();
  });
});
