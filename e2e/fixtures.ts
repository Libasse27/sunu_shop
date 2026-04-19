import { test as base, expect, type Page } from '@playwright/test';

// ─── Utilisateurs de test ────────────────────────────────────────────────────
export const TEST_USER = {
  firstName: 'Mamadou',
  lastName: 'Sarr',
  email: `e2e-user-${Date.now()}@test.com`,
  password: 'MotDePasse123!',
  phone: '+221770000099',
};

export const ADMIN_USER = {
  email: process.env['E2E_ADMIN_EMAIL'] ?? 'admin@sunushop.sn',
  password: process.env['E2E_ADMIN_PASSWORD'] ?? 'AdminPassword123!',
};

// ─── Fixture : utilisateur connecté ─────────────────────────────────────────
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use: (p: Page) => Promise<void>) => {
    // Inscription
    await page.goto('/inscription');
    await page.fill('[name="firstName"]', TEST_USER.firstName);
    await page.fill('[name="lastName"]', TEST_USER.lastName);
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await use(page);
  },
});

export { expect };
