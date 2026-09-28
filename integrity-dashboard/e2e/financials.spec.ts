import { test, expect } from '@playwright/test';
import { collectPageErrors } from './test-utils';

// "/financials" redirects to the wallet page ("/treasury", TreasuryControlPage). Its staking,
// credit, markets and stability tabs were removed with the cut contracts and oracle routes
// (integrity-core docs/EXECUTION_PLAN.md A1), so only the wallet remains. No wallet extension
// is available in headless Chromium, so "Connect Wallet" prompts are the real, correct state
// to assert rather than fabricated balances.

test.describe('/financials (redirects to the wallet page)', () => {
  test('loads with no uncaught JS errors, defaults to the Wallet tab', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto('/financials');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('ITK Balance (Testnet)')).toBeVisible();
    expect(errors, `Uncaught errors: ${errors.map(e => e.message).join('; ')}`).toEqual([]);
  });

  test('Wallet tab: real ITK balance card, address, and asset row render; Send/Receive open real modals', async ({ page }) => {
    await page.goto('/financials');
    await expect(page.getByText('ITK Balance (Testnet)')).toBeVisible();
    await expect(page.getByText('Integrity Token')).toBeVisible();
    await expect(page.getByText('ITK // ERC-20')).toBeVisible();

    // Send now routes through the agent's own SovereignAgent.execute (a real fix — sending
    // used to silently move ITK out of the connected EOA's own, almost always empty,
    // balance instead of the SovereignAgent balance actually shown on screen). That means
    // Send requires a connected controller wallet; no extension is available in headless
    // Chromium, so the real, correct state here is the "Connect a wallet first" gate, not
    // the transfer form.
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('heading', { name: 'Connect a wallet first' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Connect Wallet' })).toBeVisible();
    // The modal has no Escape-key handler — only clicking its backdrop (the fixed
    // full-screen overlay behind the card, which stops propagation on the card itself)
    // or its X button closes it. Click the corner of the viewport, safely outside the
    // centered card, to hit the backdrop.
    await page.mouse.click(10, 10);
    await expect(page.getByRole('heading', { name: 'Connect a wallet first' })).not.toBeVisible();

    await page.getByRole('button', { name: 'Receive' }).click();
    await expect(page.getByRole('heading', { name: 'Receive Assets' })).toBeVisible();
  });

  test('Wallet tab: Assets/Activity sub-tabs switch cleanly', async ({ page }) => {
    await page.goto('/financials');
    await page.getByRole('button', { name: 'activity', exact: true }).click();
    // Real transaction rows link out to the real Base Sepolia explorer — scoped to
    // that specific href rather than a broad text filter, which previously matched
    // #root itself (the whole app's text content trivially contains "Loan" from the
    // wallet's own action button label).
    const noHistory = page.getByText('No transaction history found.');
    const historyRows = page.locator('a[href*="sepolia.basescan.org"]');
    await expect(noHistory.or(historyRows.first())).toBeVisible();
  });

  test('screenshot confirms final rendered state of the Wallet tab', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto('/financials');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
    await page.screenshot({ path: 'e2e/screenshots/financials.png', fullPage: true });
  });
});
