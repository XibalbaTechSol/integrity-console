import { test, expect, type Page } from '@playwright/test';

/**
 * Design-system conformance, measured from computed styles in a real browser
 * rather than asserted in prose. This exists because the console had drifted
 * into three visual languages at once: 153 distinct hex literals, 12 border
 * radii, 7 loaded typefaces, and two different accent colours (the app shell
 * painted its chrome protocol-blue while the active theme told every other
 * page the accent was emerald).
 *
 * Every check carries a vacuity guard. A route that measured nothing fails
 * instead of passing quietly -- a clean sweep that covered zero elements is
 * the usual way a UI audit reports green while finding nothing.
 */

const ROUTES = ['/', '/auth', '/docs', '/dashboard', '/agents', '/ais', '/evidence', '/treasury', '/health', '/system', '/settings'];

/** One radius. 50% is reserved for status dots and avatars. */
const ALLOWED_RADII = new Set(['0px', '4px', '50%']);

/** One sans, one mono. KaTeX ships its own faces for the AIS formulas. */
const ALLOWED_FONT_PREFIXES = ['Inter', 'ui-monospace', 'monospace', 'KaTeX', 'math', 'system-ui'];

/**
 * The canonical palette. Pure white and pure black stay allowed: white is
 * legitimate ink on an accent fill, black is shadow.
 */
const ALLOWED_HEX = new Set([
  '#08111b', '#0d1824', '#111f2d', '#213246', '#0a1520', '#09131e', '#0b1621', '#06111c',
  '#eef5fb', '#8ea1b4', '#536b83', '#2d4361',
  '#36a7ff', '#5cb8ff', '#1b8cd4',
  '#42d68b', '#f0b429', '#ff6b7a',
  '#3987e5', '#199e70', '#9085e9', '#d55181',
  '#ffffff', '#000000',
]);

type Measured = {
  n: number;
  radii: Record<string, string[]>;
  fonts: Record<string, string[]>;
  colors: Record<string, string[]>;
};

const measure = (page: Page) => page.evaluate(() => {
  const out: Measured = { n: 0, radii: {}, fonts: {}, colors: {} };
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
    // NAMED EXEMPTION: Google Identity Services renders its own sign-in button,
    // and Google branding requires its colours and Google Sans. It cannot be
    // restyled, so it is excluded by name rather than by widening the palette.
    if (el.closest('#google-signin-container')) continue;
    out.n++;
    const label = el.tagName.toLowerCase()
      + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '');
    const add = (bucket: keyof Measured, key: string) => {
      const target = out[bucket] as Record<string, string[]>;
      (target[key] ||= []).push(label);
    };
    if (cs.borderRadius && cs.borderRadius !== '0px') add('radii', cs.borderRadius);
    add('fonts', cs.fontFamily.split(',')[0].replace(/["']/g, '').trim());
    for (const prop of ['color', 'backgroundColor', 'borderTopColor'] as const) {
      const v = cs[prop];
      if (!v || v === 'rgba(0, 0, 0, 0)') continue;
      if (prop === 'borderTopColor' && cs.borderTopWidth === '0px') continue;
      add('colors', v);
    }
  }
  return out;
});

const toHex = (rgb: string): string | null => {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(rgb);
  if (!m) return null;
  if (m[4] !== undefined && Number(m[4]) === 0) return null;
  return '#' + [m[1], m[2], m[3]].map(n => Number(n).toString(16).padStart(2, '0')).join('');
};

for (const route of ROUTES) {
  test(`design system: ${route}`, async ({ page }) => {
    const keyWarnings: string[] = [];
    page.on('console', m => {
      if (/same key|unique "key"/i.test(m.text())) keyWarnings.push(m.text().slice(0, 120));
    });

    await page.goto(route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const data = await measure(page);

    // Vacuity guard: prove the sweep actually looked at this page.
    expect(data.n, `${route} measured too few elements to prove anything`).toBeGreaterThan(20);

    const badRadii = Object.entries(data.radii).filter(([r]) => !ALLOWED_RADII.has(r));
    expect(badRadii.map(([r, where]) => `${r} on ${where[0]}`), `${route}: off-scale border-radius`).toEqual([]);

    const badFonts = Object.entries(data.fonts)
      .filter(([f]) => !ALLOWED_FONT_PREFIXES.some(p => f.startsWith(p)));
    expect(badFonts.map(([f, where]) => `${f} on ${where[0]}`), `${route}: unexpected typeface`).toEqual([]);

    const badColors = Object.entries(data.colors)
      .map(([rgb, where]) => [toHex(rgb), where] as const)
      .filter(([hex]) => hex && !ALLOWED_HEX.has(hex));
    expect(badColors.map(([hex, where]) => `${hex} on ${where[0]}`), `${route}: off-palette colour`).toEqual([]);

    expect(keyWarnings, `${route}: duplicate React keys`).toEqual([]);
  });

  test(`no horizontal overflow at 390px: ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const count = await page.locator('body *').count();
    expect(count, `${route} rendered too little to measure overflow`).toBeGreaterThan(20);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${route} scrolls sideways on a phone`).toBe(0);
  });
}
