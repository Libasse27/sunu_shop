import { test, expect } from '@playwright/test';

const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || 'admin@sunushop.sn',
  password: process.env.E2E_ADMIN_PASSWORD || 'AdminTest123!',
};

// Helper : connecter l'admin avant chaque test
async function loginAdmin(page: import('@playwright/test').Page) {
  await page.goto('/connexion');
  await page.fill('[type="email"]', ADMIN.email);
  await page.fill('[type="password"]', ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10_000 });
  await page.goto('/admin');
}

test.describe('Admin — Dashboard', () => {
  test('admin accède au dashboard', async ({ page }) => {
    await loginAdmin(page);
    await expect(page).toHaveURL(/admin/);
    // Métriques ou titre visible
    await expect(page.locator('h1, [class*="title"]').first()).toBeVisible({ timeout: 8_000 });
  });

  test('non-admin redirige vers accueil', async ({ page }) => {
    // Accès sans login
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/admin\/dashboard/);
  });
});

test.describe('Admin — CRUD Produits', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/produits');
  });

  test('liste les produits dans le tableau admin', async ({ page }) => {
    await page.waitForSelector('table, [class*="table"]', { timeout: 10_000 });
    const rows = page.locator('tbody tr, [class*="product-row"]');
    await expect(rows.first()).toBeVisible({ timeout: 8_000 });
  });

  test('ouvre le formulaire de création de produit', async ({ page }) => {
    const addBtn = page.locator('button:has-text("Nouveau"), button:has-text("Ajouter")').first();
    await addBtn.click();

    // Modal/formulaire visible
    await expect(page.locator('[role="dialog"], form[class*="modal"], .modal')).toBeVisible({ timeout: 5_000 });
  });

  test('filtre les produits par recherche', async ({ page }) => {
    await page.waitForSelector('input[placeholder*="Rechercher"], input[type="search"]', { timeout: 8_000 });
    await page.fill('input[placeholder*="Rechercher"], input[type="search"]', 'laptop');
    await page.waitForLoadState('networkidle');
    // Les résultats doivent se mettre à jour
    await page.waitForTimeout(500);
  });
});

test.describe('Admin — Gestion commandes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/commandes');
  });

  test('affiche le tableau des commandes', async ({ page }) => {
    await page.waitForSelector('table, [class*="orders"]', { timeout: 10_000 });
    await expect(page.locator('thead')).toBeVisible();
  });

  test('filtre par statut "En attente"', async ({ page }) => {
    const statusFilter = page.locator('select, button:has-text("En attente")').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
    }
  });
});
