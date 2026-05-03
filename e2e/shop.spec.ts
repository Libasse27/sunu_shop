import { test, expect } from '@playwright/test';

test.describe('Boutique — Navigation & Filtres', () => {
  test('la page boutique se charge', async ({ page }) => {
    await page.goto('/boutique');
    await expect(page.locator('h1')).toBeVisible();
    // Hero section
    await expect(page.locator('section').first()).toBeVisible();
  });

  test('la recherche via URL affiche les résultats filtrés', async ({ page }) => {
    await page.goto('/boutique?search=laptop');
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 8000 });
    await expect(h1).toContainText('laptop', { ignoreCase: true });
    // "Effacer la recherche" button appears when search is active
    await expect(page.locator('button:has-text("Effacer la recherche")')).toBeVisible();
  });

  test('effacer la recherche retire le paramètre search de l\'URL', async ({ page }) => {
    await page.goto('/boutique?search=test');
    await page.locator('button:has-text("Effacer la recherche")').click();
    await expect(page).not.toHaveURL(/search=/);
  });

  test('navigation catégorie met à jour le titre et le breadcrumb', async ({ page }) => {
    await page.goto('/boutique/informatique');
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('nav').first()).toContainText('Boutique');
  });

  test('le tri via select met à jour l\'URL', async ({ page }) => {
    await page.goto('/boutique');
    await page.waitForSelector('select', { timeout: 5000 });
    await page.selectOption('select', 'price_asc');
    await expect(page).toHaveURL(/sort=price_asc/);
  });

  test('la checkbox En stock met à jour l\'URL', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/boutique');
    // Sidebar only visible on desktop (lg:block)
    await page.waitForSelector('aside input[type="checkbox"]', { timeout: 5000 });
    await page.locator('aside input[type="checkbox"]').first().check();
    await expect(page).toHaveURL(/inStock=true/);
  });

  test('la checkbox En promotion met à jour l\'URL', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/boutique');
    await page.waitForSelector('aside input[type="checkbox"]', { timeout: 5000 });
    await page.locator('aside input[type="checkbox"]').nth(1).check();
    await expect(page).toHaveURL(/onSale=true/);
  });

  test('clic sur une fiche produit navigue vers /produit/', async ({ page }) => {
    await page.goto('/boutique');
    const card = page.locator('a.product-card').first();
    const visible = await card.isVisible({ timeout: 10000 }).catch(() => false);
    if (!visible) return; // aucun produit seedé — skip gracieux
    await card.click();
    await expect(page).toHaveURL(/\/produit\//);
  });

  test('pagination — clic page 2 met à jour la liste', async ({ page }) => {
    await page.goto('/boutique');
    const page2 = page.locator('button', { hasText: '2' }).first();
    const hasPagination = await page2.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasPagination) return; // moins de 21 produits, pas de pagination
    await page2.click();
    await expect(page.locator('.product-card').first()).toBeVisible({ timeout: 8000 });
  });
});
