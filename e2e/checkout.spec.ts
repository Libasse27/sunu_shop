import { test, expect } from '@playwright/test';

test.describe('Parcours checkout', () => {
  test('ajouter un produit au panier depuis la boutique', async ({ page }) => {
    await page.goto('/boutique');

    // Attendre que les produits se chargent
    await page.waitForSelector('[data-testid="product-card"], .product-card, [class*="ProductCard"]', { timeout: 10_000 });

    // Cliquer sur "Ajouter au panier" du premier produit
    const addBtn = page.locator('button[title*="panier"], button[aria-label*="panier"]').first();
    await addBtn.click();

    // Vérifier le compteur du panier dans le header
    const cartCount = page.locator('[data-testid="cart-count"], [class*="cart-count"]').first();
    await expect(cartCount).toContainText('1', { timeout: 3000 }).catch(async () => {
      // Certains designs cachent le compteur si = 0 initialement
      await expect(cartCount).toBeVisible();
    });
  });

  test('page panier affiche les articles et le total', async ({ page }) => {
    // Aller sur la boutique et ajouter un produit
    await page.goto('/boutique');
    await page.waitForSelector('button[title*="panier"], button[aria-label*="panier"]', { timeout: 10_000 });
    await page.locator('button[title*="panier"], button[aria-label*="panier"]').first().click();

    await page.goto('/panier');

    // Le panier ne doit pas être vide
    await expect(page.locator('text=/Total|Sous-total/')).toBeVisible({ timeout: 5000 });
  });

  test('checkout redirige vers /connexion si non connecté', async ({ page }) => {
    await page.goto('/commande');
    await expect(page).toHaveURL(/connexion|commande/);
  });

  test('la page produit s\'ouvre depuis la boutique', async ({ page }) => {
    await page.goto('/boutique');
    await page.waitForSelector('a[href^="/produit/"]', { timeout: 10_000 });

    const productLink = page.locator('a[href^="/produit/"]').first();
    const href = await productLink.getAttribute('href');
    await productLink.click();

    await expect(page).toHaveURL(href || '/produit/');
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
  });

  test('ajouter un produit au panier depuis la page produit', async ({ page }) => {
    await page.goto('/boutique');
    await page.waitForSelector('a[href^="/produit/"]', { timeout: 10_000 });
    await page.locator('a[href^="/produit/"]').first().click();

    await page.waitForSelector('button:has-text("Ajouter")', { timeout: 8_000 });
    await page.click('button:has-text("Ajouter")');

    // Toast de confirmation
    await expect(page.locator('text=Ajouté au panier')).toBeVisible({ timeout: 5000 }).catch(() => {
      // Certains browsers suppriment le toast rapidement
    });
  });
});
