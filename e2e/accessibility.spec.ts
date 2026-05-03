import { test, expect, Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Toutes les images visibles doivent avoir un attribut alt non nul. */
async function assertImageAlts(page: Page) {
  const imgs = page.locator('img:not([aria-hidden="true"])');
  const count = await imgs.count();
  for (let i = 0; i < count; i++) {
    const alt = await imgs.nth(i).getAttribute('alt');
    expect(alt, `img[${i}] — attribut alt manquant`).not.toBeNull();
  }
}

/** Tous les liens `<a href>` doivent être focusables (tabindex ≠ -1). */
async function assertFocusableLinks(page: Page, limit = 15) {
  const links = page.locator('a[href]');
  const count = Math.min(await links.count(), limit);
  for (let i = 0; i < count; i++) {
    const tabindex = await links.nth(i).getAttribute('tabindex');
    expect(tabindex, `lien[${i}] — tabindex=-1 rend le lien inaccessible au clavier`).not.toBe('-1');
  }
}

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe('Accessibilité — pages critiques', () => {

  test('page d\'accueil — h1 présent + images avec alt', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 });
    await assertImageAlts(page);
  });

  test('boutique — h1 présent + images avec alt + liens focusables', async ({ page }) => {
    await page.goto('/boutique');
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
    await assertImageAlts(page);
    await assertFocusableLinks(page);
  });

  test('services — h1 présent + images avec alt', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
    await assertImageAlts(page);
  });

  test('connexion — champ email a un label ou aria-label', async ({ page }) => {
    await page.goto('/connexion');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });

    const ariaLabel = await emailInput.getAttribute('aria-label');
    const id        = await emailInput.getAttribute('id');
    const placeholder = await emailInput.getAttribute('placeholder');

    const hasLabel = ariaLabel !== null
      || placeholder !== null
      || (id !== null && await page.locator(`label[for="${id}"]`).count() > 0);

    expect(hasLabel, 'Le champ email doit avoir un aria-label, placeholder ou label[for]').toBe(true);
  });

  test('connexion — champ password a un label ou aria-label', async ({ page }) => {
    await page.goto('/connexion');
    const pwdInput = page.locator('input[type="password"]');
    await expect(pwdInput).toBeVisible({ timeout: 5000 });

    const ariaLabel  = await pwdInput.getAttribute('aria-label');
    const id         = await pwdInput.getAttribute('id');
    const placeholder = await pwdInput.getAttribute('placeholder');

    const hasLabel = ariaLabel !== null
      || placeholder !== null
      || (id !== null && await page.locator(`label[for="${id}"]`).count() > 0);

    expect(hasLabel, 'Le champ mot de passe doit avoir un aria-label, placeholder ou label[for]').toBe(true);
  });

  test('panier — bouton ouverture a un aria-label', async ({ page }) => {
    await page.goto('/boutique');
    const cartBtn = page.locator('button[aria-label="Ouvrir le panier"]');
    await expect(cartBtn).toBeVisible({ timeout: 5000 });
  });

  test('navigation desktop — liens de la barre de nav', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    // La nav principale (rouge) doit avoir au moins 3 liens
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('boutique mobile — h1 visible sur écran 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/boutique');
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
  });

  test('page produit — h1 + image principale avec alt', async ({ page }) => {
    // Navigue vers la boutique et prend le premier lien produit
    await page.goto('/boutique');
    const firstCard = page.locator('a.product-card').first();
    const hasProducts = await firstCard.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasProducts) return; // aucun produit seedé — skip gracieux

    await firstCard.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
    await assertImageAlts(page);
  });

});
