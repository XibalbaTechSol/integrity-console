import { test, expect } from '@playwright/test';
import { NAVIGATION_ITEMS } from '../src/navigation';

const APP_ROUTES = ['/dashboard', '/treasury', '/settings'];
const NAV_HREFS = NAVIGATION_ITEMS.map((item) => item.to);

test.describe('authenticated navigation consistency', () => {
  for (const route of APP_ROUTES) {
    test(`${route} renders the canonical protocol navigation`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const links = page.locator('.protocol-sidebar nav[aria-label="Protocol navigation"] a');
      await expect(links).toHaveCount(NAV_HREFS.length);
      const hrefs = await links.evaluateAll((items) => items.map((item) => item.getAttribute('href')));
      expect(hrefs).toEqual(NAV_HREFS);
    });
  }

  test('protocol surface exposes every canonical page in order', async ({ page }) => {
    await page.goto('/dashboard');
    const links = page.locator('.protocol-sidebar nav[aria-label="Protocol navigation"] a');
    await expect(links).toHaveCount(NAV_HREFS.length);
    for (let i = 0; i < NAVIGATION_ITEMS.length; i++) {
      const item = NAVIGATION_ITEMS[i];
      await expect(links.nth(i)).toHaveAttribute('href', item.to);
      await expect(links.nth(i)).toContainText(item.label);
    }
  });

  test('legacy route /financials redirects cleanly to /treasury with active nav', async ({ page }) => {
    await page.goto('/financials');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/treasury$/);
    const activeLink = page.locator('.protocol-sidebar nav[aria-label="Protocol navigation"] a.active');
    await expect(activeLink).toHaveAttribute('href', '/treasury');
  });

  test('sidebar profile dropdown opens and provides Settings and Disconnect', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const profile = page.locator('.sidebar-profile');
    await expect(profile).toBeVisible();
    await profile.click();
    await expect(page.locator('.profile-dropdown')).toBeVisible();
    await expect(page.locator('.profile-dropdown a[href="/settings"]')).toBeVisible();
    await expect(page.locator('.profile-dropdown button')).toContainText('Disconnect');
  });
});
