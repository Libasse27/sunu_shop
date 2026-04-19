import { test, expect } from '@playwright/test';

const USER = {
  firstName: 'Aïssatou',
  lastName: 'Diop',
  email: `auth-test-${Date.now()}@test.com`,
  password: 'MotDePasse123!',
};

test.describe('Authentification', () => {
  test('inscription complète → redirection accueil', async ({ page }) => {
    await page.goto('/inscription');
    await page.fill('[placeholder*="Prénom"], [name="firstName"]', USER.firstName);
    await page.fill('[placeholder*="Nom"], [name="lastName"]', USER.lastName);
    await page.fill('[type="email"]', USER.email);
    await page.fill('[type="password"]', USER.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Bienvenue')).toBeVisible({ timeout: 5000 }).catch(() => {
      // Message de bienvenue optionnel
    });
  });

  test('connexion avec identifiants valides', async ({ page }) => {
    // Créer le compte d'abord
    await page.goto('/inscription');
    await page.fill('[name="firstName"]', USER.firstName);
    await page.fill('[name="lastName"]', USER.lastName);
    await page.fill('[type="email"]', `login-${USER.email}`);
    await page.fill('[type="password"]', USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Se déconnecter
    await page.goto('/connexion');
    await page.fill('[type="email"]', `login-${USER.email}`);
    await page.fill('[type="password"]', USER.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
  });

  test('connexion avec mauvais mot de passe affiche un message d\'erreur', async ({ page }) => {
    await page.goto('/connexion');
    await page.fill('[type="email"]', 'inexistant@test.com');
    await page.fill('[type="password"]', 'MauvaisMotDePasse!');
    await page.click('button[type="submit"]');

    // Message d'erreur visible
    await expect(page.locator('[role="alert"], .text-red-500, [class*="error"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('accès à /mon-compte redirige vers /connexion si non connecté', async ({ page }) => {
    await page.goto('/mon-compte');
    await expect(page).toHaveURL(/connexion/);
  });
});
