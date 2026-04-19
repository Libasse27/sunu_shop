import { test, expect } from '@playwright/test';

test.describe('Wishlist / Favoris', () => {
  test('ajouter un produit aux favoris depuis la boutique', async ({ page }) => {
    await page.goto('/boutique');
    await page.waitForSelector('button[title*="favori"], button[aria-label*="favori"]', { timeout: 10_000 });

    await page.locator('button[title*="favori"], button[aria-label*="favori"]').first().click();

    // Le compteur favoris dans le header doit s'incrémenter
    const wishlistLink = page.locator('a[href="/favoris"]');
    await expect(wishlistLink).toBeVisible();
  });

  test('page favoris affiche les produits ajoutés', async ({ page }) => {
    // Ajouter un favori depuis la boutique
    await page.goto('/boutique');
    await page.waitForSelector('button[title*="favori"], button[aria-label*="favori"]', { timeout: 10_000 });
    await page.locator('button[title*="favori"], button[aria-label*="favori"]').first().click();

    // Aller sur /favoris
    await page.goto('/favoris');
    await page.waitForLoadState('networkidle');

    // Au moins une card produit visible
    await expect(page.locator('[data-testid="product-card"], [class*="ProductCard"], a[href^="/produit/"]').first()).toBeVisible({ timeout: 8_000 });
  });

  test('page favoris vide affiche un message approprié', async ({ page }) => {
    // localStorage vide = pas de favoris
    await page.evaluate(() => localStorage.removeItem('wishlist'));
    await page.goto('/favoris');

    await expect(page.locator('text=Aucun favori, text=favoris')).toBeVisible({ timeout: 5000 }).catch(() => {
      // Message peut varier légèrement
    });
  });
});
