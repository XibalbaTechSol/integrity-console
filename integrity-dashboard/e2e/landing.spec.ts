import { test, expect } from '@playwright/test';
import { collectPageErrors } from './test-utils';

// LandingPage (src/LandingPage.tsx, route "/") is fully static marketing content — no
// oracle/userapi/chain calls, only `useSettings()` for theme. That makes it the cheapest
// page in the app to lock down with a strict spec: every assertion here should be about
// real rendered DOM, not a fallback/empty state, since there is no "no data yet" case.
//
// The page was rebuilt around a closed-loop-control narrative, and the MVP was renamed to
// the Console. Two classes of assertion below are doing real work rather than restating the
// copy, and should not be loosened:
//
//   1. The status figures are transcribed from integrity-core into
//      src/landing/protocolStatus.ts. This spec pins them as *literals* rather than
//      importing them for both sides of the assertion. That distinction was found by
//      mutation testing: an earlier version imported PLAN_PROGRESS and asserted the
//      rendered text against it, which passed happily when the module was mutated from
//      134 to 199 — the page and the expectation moved together, so the check measured
//      nothing. Pinned literals mean changing the figures *requires* editing this file,
//      which makes a status change a deliberate, reviewed act instead of a silent one.
//   2. The previous page shipped claims with no source in the normative spec — ZK proving
//      via Noir/Barretenberg marked "Implemented", the VC Data Model, EIP-712, sub-50ms
//      interception, a "9-second" blast radius — plus "prototype" links to /shield and
//      /financials that are now bare redirects. Those are asserted *absent*, so a future
//      copy edit cannot quietly reintroduce them.

import { AS_OF, PLAN_PROGRESS, MISSION_PHASES, MANDATED_SELF_DESCRIPTION } from '../src/landing/protocolStatus';

// Pinned, independent expectations. Re-run `python3 scripts/plan_progress.py` in
// integrity-core before changing these, and update protocolStatus.ts in the same commit.
const EXPECTED_PROGRESS = '134/232 (57%)';
const EXPECTED_AS_OF = '2026-11-04';
const EXPECTED_STAGES = [
  'Integrated and static-fired',
  'First flight, synthetic propellant',
  'Crewed flight: real PHI, real funds',
  'Orbit',
];

test.describe('/ (LandingPage)', () => {
  test('loads with no uncaught JS errors', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors, `Uncaught errors: ${errors.map(e => e.message).join('; ')}`).toEqual([]);
  });

  test('header nav renders brand, section anchors, and top-level links', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByText('Integrity Protocol', { exact: true })).toBeVisible();

    // In-page section anchors
    await expect(header.getByRole('link', { name: 'The Problem' })).toHaveAttribute('href', '#open-loop');
    await expect(header.getByRole('link', { name: 'The Loop' })).toHaveAttribute('href', '#loop');
    await expect(header.getByRole('link', { name: 'Feedback' })).toHaveAttribute('href', '#ais');
    await expect(header.getByRole('link', { name: 'Status' })).toHaveAttribute('href', '#status');
    await expect(header.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '#faq');

    // Router links
    await expect(header.getByRole('link', { name: 'Wiki' })).toHaveAttribute('href', '/wiki');
    await expect(header.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/xibalbatechsol');
    await expect(header.getByRole('link', { name: /Launch Console/ })).toHaveAttribute('href', '/auth');
  });

  test('hero leads with the closed-loop proposition and links to /auth', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Nothing reaches orbit open-loop');
    const heroCta = page.getByRole('link', { name: /Launch Console/ }).nth(1);
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toHaveAttribute('href', '/auth');
  });

  test('hero carries the self-description SPEC.md requires until M1-M5 are demonstrated', async ({ page }) => {
    await page.goto('/');
    // Not decoration: SPEC.md §1 makes this wording mandatory for an implementation
    // describing itself, and the hero is where a reader forms the impression.
    await expect(page.getByText(MANDATED_SELF_DESCRIPTION)).toBeVisible();
  });

  test('control loop diagram renders inline SVG with an accessible text equivalent', async ({ page }) => {
    await page.goto('/');
    await page.locator('#loop').scrollIntoViewIfNeeded();
    const svg = page.locator('#loop svg[role="img"]');
    await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute('aria-label', /closed loop|control loop/i);

    // The ordered list is the text equivalent for assistive tech. It is visually hidden
    // via clip, so assert presence/content rather than visibility.
    const steps = page.locator('#loop figure ol li');
    await expect(steps).toHaveCount(8);
    await expect(steps.first()).toContainText('Setpoint');
    // The bounded-authority rule is the load-bearing claim of the whole diagram.
    await expect(page.locator('#loop figure ol')).toContainText('never turn a deny into an allow');
  });

  test('AIS formula renders as real KaTeX markup, not raw LaTeX text', async ({ page }) => {
    await page.goto('/');
    await page.locator('#ais').scrollIntoViewIfNeeded();
    const formulaBlock = page.locator('#ais .katex');
    await expect(formulaBlock).toBeVisible();
    // KaTeX always emits an accessibility-only MathML annotation containing the raw
    // TeX source (`.katex-mathml`, visually hidden via CSS clip) alongside the visible
    // HTML rendering — that's normal, not a rendering failure. What must never happen
    // is a katex-error span (react-katex's failure mode) or the raw \text{} source
    // being visible to the naked eye. Assert both.
    await expect(page.locator('#ais .katex-error')).toHaveCount(0);
    await expect(page.locator('#ais .katex-html')).not.toContainText('\\text{AIS}');
  });

  test('AIS section publishes the four prohibitions, not just the formula', async ({ page }) => {
    await page.goto('/');
    const ais = page.locator('#ais');
    await ais.scrollIntoViewIfNeeded();
    for (const rule of [
      'Change a policy deny into an allow.',
      'Set a constraint bound to infinity.',
      'Be computed from unsigned telemetry.',
      'Be the reason a hook passed.',
    ]) {
      await expect(ais.getByText(rule, { exact: true })).toBeVisible();
    }
    // The partial-implementation disclosure must survive copy edits.
    await expect(ais).toContainText('shadow and observational output only');
  });

  test('status section renders every gate with its state, and the figures match the source module', async ({ page }) => {
    await page.goto('/');
    const status = page.locator('#status');
    await status.scrollIntoViewIfNeeded();

    // Rendered page vs. pinned literals — the assertion that actually catches drift.
    await expect(status).toContainText(EXPECTED_PROGRESS);
    await expect(status).toContainText(EXPECTED_AS_OF);

    // And the source module must agree with those literals, so the module and this spec
    // cannot diverge without one of them failing.
    expect(`${PLAN_PROGRESS.done}/${PLAN_PROGRESS.total} (${PLAN_PROGRESS.percent}%)`).toBe(EXPECTED_PROGRESS);
    expect(AS_OF).toBe(EXPECTED_AS_OF);
    expect(MISSION_PHASES.map(p => p.stage)).toEqual(EXPECTED_STAGES);

    for (const stage of EXPECTED_STAGES) {
      await expect(status.getByRole('heading', { name: stage })).toBeVisible();
    }
    // Two gates open and one explicitly unclaimed is the honest shape of the campaign.
    await expect(status.getByText('In progress', { exact: true })).toHaveCount(1);
    await expect(status.getByText('Not started', { exact: true })).toHaveCount(1);
    await expect(status.getByText('Not claimed', { exact: true })).toHaveCount(1);
    await expect(status).toContainText('Mainnet');
  });

  test('console section links only to routes that are real pages, not redirects', async ({ page }) => {
    await page.goto('/');
    const consoleSection = page.locator('#console');
    await consoleSection.scrollIntoViewIfNeeded();
    // Shown as code labels rather than links: these surfaces need an account, and the old
    // page's "View Shield Prototype" / "View Finance Prototype" links pointed at routes
    // that App.tsx now resolves with <Navigate>.
    for (const route of ['/dashboard', '/agents', '/ais', '/evidence', '/system', '/health']) {
      await expect(consoleSection.getByText(route, { exact: true })).toBeVisible();
    }
    await expect(consoleSection.getByRole('link', { name: /Prototype/ })).toHaveCount(0);
  });

  test('retired unsourced claims do not reappear anywhere on the page', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    for (const claim of [
      'Barretenberg',
      'Noir',
      'VC Data Model',
      'EIP-712',
      '9-Second',
      'under 50ms',
      '18-35ms',
      'uninsurable',
      'Launch MVP',
    ]) {
      await expect(body).not.toContainText(claim);
    }
  });

  test('specification section names SPEC.md as normative and the PDF as archived', async ({ page }) => {
    await page.goto('/');
    const spec = page.locator('#specification');
    await spec.scrollIntoViewIfNeeded();
    // The previous page claimed "v0.4 is normative", which DOCUMENT_STATUS.yaml contradicts.
    await expect(spec).toContainText('v1.0.0-draft');
    await expect(spec).not.toContainText('v0.4');
    await expect(spec.getByRole('link', { name: /Read docs\/SPEC\.md/ })).toHaveAttribute(
      'href',
      'https://github.com/XibalbaTechSol/integrity-core/blob/main/docs/SPEC.md'
    );
    await expect(spec.getByRole('link', { name: /Archived v0\.3 PDF/ })).toHaveAttribute(
      'href',
      '/integrity-protocol-specification-v0.3.pdf'
    );
  });

  test('FAQ accordion expands and collapses answer text on click', async ({ page }) => {
    await page.goto('/');
    const faq = page.locator('#faq');
    await faq.scrollIntoViewIfNeeded();
    const question = faq.getByText('Is this HIPAA compliant?');
    // Scoped to #faq, and keyed on a phrase unique to the answer. The obvious locator
    // (/excludes HIPAA certification and real-PHI readiness/) also matches the Gate C
    // card in #status, which is always visible — so the collapsed assertion failed
    // against the wrong element rather than against the accordion.
    const answer = faq.getByText(/worth distrusting/);

    await expect(answer).not.toBeVisible();
    await question.click();
    await expect(answer).toBeVisible();
    await question.click();
    await expect(answer).not.toBeVisible();
  });

  test('footer links to wiki, privacy, and terms routes', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByRole('link', { name: 'Integrity Wiki' })).toHaveAttribute('href', '/wiki');
    await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    await expect(footer.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
  });

  test('full-page screenshot captures hero, loop, status and console in final rendered state', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Every section is a framer-motion `whileInView` (viewport: {once: true}) reveal,
    // driven by IntersectionObserver — it needs each section to actually cross the
    // viewport with real rendered frames in between, not just a scrollTop mutation.
    // A tight `window.scrollBy` + `setTimeout` loop outruns the observer and leaves
    // below-the-fold sections stuck at opacity:0 (reproduced and confirmed — see
    // e2e/landing.spec.ts history). scrollIntoViewIfNeeded per section, each followed
    // by a real wait, mirrors how a user's scroll actually triggers the reveal.
    const sectionIds = ['#open-loop', '#loop', '#ais', '#status', '#console', '#faq', '#contact', '#specification'];
    for (const id of sectionIds) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
    // Per-project path: every project runs this spec, and a shared path means the last
    // project to finish silently overwrites the others' evidence.
    await page.screenshot({ path: `e2e/screenshots/landing-${testInfo.project.name}.png`, fullPage: true });
  });

  test('renders at 390px with no horizontal page scroll', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const sectionIds = ['#open-loop', '#loop', '#ais', '#status', '#console', '#specification'];
    for (const id of sectionIds) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
    }
    // The loop diagram is a fixed-viewBox SVG in an overflow-x:auto figure, so it may
    // scroll inside its own card — the *page* must not.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `page overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `e2e/screenshots/landing-390-${testInfo.project.name}.png`, fullPage: true });
  });
});
