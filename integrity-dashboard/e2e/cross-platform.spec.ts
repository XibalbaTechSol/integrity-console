import { test, expect } from '@playwright/test';
import { collectPageErrors } from './test-utils';

test.describe('cross-platform identity dashboard', () => {
  for (const route of ['/fleet', '/memory']) {
    test(`${route} redirects cleanly to agent registry with zero uncaught browser errors`, async ({ page }) => {
      const errors = collectPageErrors(page);
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/agents$/);
      await expect(page.locator('.protocol-sidebar nav[aria-label="Protocol navigation"]')).toBeVisible();
      await expect(page.locator('body')).not.toContainText('No route matches');
      expect(errors, `Uncaught errors: ${errors.map((e) => e.message).join('; ')}`).toEqual([]);
    });
  }

  test('primary navigation exposes the canonical agent registry entry point', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.protocol-sidebar nav a[href="/agents"]')).toBeVisible();
    await expect(page.locator('.protocol-sidebar nav a[href="/agents"]')).toContainText('Agent registry');
  });
});
