// @author Claude Sonnet 4.6 Anthropic
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fix = (name: string) => JSON.parse(readFileSync(join(__dirname, 'fixtures', name), 'utf8'));
const statsAllCallouts = fix('stats-all-callouts.json');
const availableDays = fix('available-days.json');
const calloutsForDay = fix('callouts-for-day.json');

const isMobile = (viewport: { width: number } | null) =>
  viewport !== null && viewport.width < 640;

const countryStoriesPage = {
  content: [
    { headline: 'Test story', detail: 'Test detail', country: { iso2: 'US', name: 'United States' }, source: 'GOOGLE_GEMINI', generatedAt: '2026-01-01T00:00:00Z' },
  ],
  totalPages: 1,
  totalElements: 1,
  number: 0,
  size: 10,
};

test.beforeEach(async ({ page }) => {
  // Stub all /api/news/* calls deterministically — no backend required.
  await page.route('**/api/news/statsAllCallouts', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statsAllCallouts) })
  );
  await page.route('**/api/news/availableDays**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(availableDays) })
  );
  await page.route('**/api/news/calloutsForDay/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(calloutsForDay) })
  );
  await page.route('**/api/news/calloutsForSourceAndCountry**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(countryStoriesPage) })
  );

  // Ensure we start in day view regardless of localStorage state.
  await page.addInitScript(() => {
    localStorage.setItem('viewMode', 'day');
    localStorage.setItem('newsSource', 'GOOGLE_GEMINI');
  });

  await page.goto('/');
  // Wait for the map SVG (class geo-svg), not the icon SVGs.
  await page.waitForSelector('svg.geo-svg', { state: 'visible' });
  // Give React a moment to render callouts after the fetch stub resolves.
  await page.waitForTimeout(500);
});

test('day view — no axe violations', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(v => `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map(n => n.target.join(', ')).join('\n  ')}`)
      .join('\n\n');
    console.error('Axe violations in day view:\n' + summary);
  }

  expect(results.violations, 'axe violations in day view').toEqual([]);
});

test('heatmap view — no axe violations', async ({ page, viewport }) => {
  // On mobile the view-mode radio is hidden behind the controls sheet.
  if (isMobile(viewport)) {
    await page.click('button[aria-label="Open map settings"]');
    await page.waitForSelector('.mobile-sheet-radio-label', { state: 'visible' });
    await page.click('input[name="view-mode-mobile"][value="heatmap"]');
    // Dismiss the sheet. The sheet overlaps the backdrop, so force the click.
    await page.click('.mobile-controls-backdrop', { force: true });
  } else {
    await page.click('input[name="view-mode"][value="heatmap"]');
  }

  // The heatmap legend pill is hidden on mobile (CSS breakpoint); on desktop it confirms render.
  if (!isMobile(viewport)) {
    await page.waitForSelector('.heatmap-legend-pill', { state: 'visible' });
  } else {
    await page.waitForTimeout(800);
  }

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(v => `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map(n => n.target.join(', ')).join('\n  ')}`)
      .join('\n\n');
    console.error('Axe violations in heatmap view:\n' + summary);
  }

  expect(results.violations, 'axe violations in heatmap view').toEqual([]);
});

test('contact modal open — no axe violations', async ({ page, viewport }) => {
  const contactBtn = isMobile(viewport)
    ? page.locator('.mobile-nav-footer button.map-footer-btn')
    : page.locator('.map-footer-overlay button.map-footer-btn');
  await contactBtn.click();
  await page.waitForSelector('.contact-modal-card', { state: 'visible' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(v => `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map(n => n.target.join(', ')).join('\n  ')}`)
      .join('\n\n');
    console.error('Axe violations in contact modal:\n' + summary);
  }

  expect(results.violations, 'axe violations in contact modal').toEqual([]);
});

test('heatmap country modal open — no axe violations', async ({ page, viewport }) => {
  if (isMobile(viewport)) {
    await page.click('button[aria-label="Open map settings"]');
    await page.waitForSelector('.mobile-sheet-radio-label', { state: 'visible' });
    await page.click('input[name="view-mode-mobile"][value="heatmap"]');
    await page.click('button.mobile-sheet-done');
    await page.waitForSelector('.mobile-controls-sheet:not(.open)');

    await page.waitForSelector('.mobile-coverage-item', { state: 'visible' });
    await page.locator('.mobile-coverage-item').first().click();
  } else {
    await page.click('input[name="view-mode"][value="heatmap"]');
    await page.waitForSelector('.heatmap-legend-pill', { state: 'visible' });

    // Click the first coloured country path (stroke differs from the default #2d4257)
    const coords = await page.evaluate(() => {
      const defaultStroke = '#2d4257';
      const paths = Array.from(document.querySelectorAll<SVGPathElement>('path.geo-country'));
      for (const path of paths) {
        if (path.getAttribute('stroke') === defaultStroke) continue;
        const rect = path.getBoundingClientRect();
        if (rect.width > 10 && rect.height > 10) {
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
      }
      return null;
    });
    expect(coords, 'a heatmap country path should be found').not.toBeNull();
    await page.mouse.click(coords!.x, coords!.y);
  }

  await page.waitForSelector('.heatmap-modal-card', { state: 'visible' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(v => `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map(n => n.target.join(', ')).join('\n  ')}`)
      .join('\n\n');
    console.error('Axe violations in heatmap country modal:\n' + summary);
  }

  expect(results.violations, 'axe violations in heatmap country modal').toEqual([]);
});

test('consensus view — no axe violations', async ({ page }) => {
  // Consensus is the default; override localStorage if a prior test set it
  await page.addInitScript(() => {
    localStorage.setItem('viewMode', 'consensus');
    localStorage.setItem('newsSource', 'GOOGLE_GEMINI');
  });
  // Re-navigate so addInitScript takes effect
  await page.goto('/');
  await page.waitForSelector('svg.geo-svg', { state: 'visible' });
  await page.waitForTimeout(500);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(v => `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map(n => n.target.join(', ')).join('\n  ')}`)
      .join('\n\n');
    console.error('Axe violations in consensus view:\n' + summary);
  }

  expect(results.violations, 'axe violations in consensus view').toEqual([]);
});

test('consensus view with highlight active — no axe violations', async ({ page, viewport }) => {
  test.skip(isMobile(viewport), 'consensus highlight test is desktop-only');

  const allSourcesFix = fix('callouts-all-sources.json');
  await page.route('**/api/news/calloutsForDay/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(allSourcesFix) })
  );
  await page.addInitScript(() => { localStorage.setItem('viewMode', 'consensus'); });
  await page.goto('/');
  await page.waitForSelector('svg.geo-svg', { state: 'visible' });
  await page.waitForTimeout(500);

  // Select the first Highlight radio (first non-"All models" source)
  const highlightRadio = page.locator('input[name="highlight-source"]').nth(1);
  await highlightRadio.waitFor({ state: 'visible' });
  await highlightRadio.click();
  await page.waitForTimeout(300);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(v => `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map(n => n.target.join(', ')).join('\n  ')}`)
      .join('\n\n');
    console.error('Axe violations in consensus view with highlight:\n' + summary);
  }

  expect(results.violations, 'axe violations in consensus view with highlight').toEqual([]);
});

test('consensus chip click → story detail modal — no axe violations', async ({ page, viewport }) => {
  test.skip(isMobile(viewport), 'consensus chip test is desktop-only');

  const allSourcesFix = fix('callouts-all-sources.json');
  // Override calloutsForDay to serve multi-source fixture (LIFO takes precedence over beforeEach stub)
  await page.route('**/api/news/calloutsForDay/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(allSourcesFix) })
  );
  // Load directly in consensus — avoids a mode-switch re-fetch that can race with allSources data
  await page.addInitScript(() => { localStorage.setItem('viewMode', 'consensus'); });
  await page.goto('/');
  await page.waitForSelector('svg.geo-svg', { state: 'visible' });
  await page.waitForTimeout(500);

  // Single-source chips open the story detail modal directly (skipping the inspector)
  const chip = page.locator('.consensus-chip-pill').first();
  await chip.waitFor({ state: 'visible' });
  await chip.click();
  await page.waitForSelector('.story-detail-card', { state: 'visible' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(v => `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map(n => n.target.join(', ')).join('\n  ')}`)
      .join('\n\n');
    console.error('Axe violations in story detail modal (chip trigger):\n' + summary);
  }

  expect(results.violations, 'axe violations in story detail modal from chip').toEqual([]);
});

test('consensus full-size callout click → inspector modal — no axe violations', async ({ page, viewport }) => {
  test.skip(isMobile(viewport), 'consensus callout test is desktop-only');

  const allSourcesFix = fix('callouts-all-sources.json');
  // Override calloutsForDay to serve multi-source fixture (LIFO takes precedence over beforeEach stub)
  await page.route('**/api/news/calloutsForDay/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(allSourcesFix) })
  );
  // Load directly in consensus — avoids a mode-switch re-fetch that can race with allSources data
  await page.addInitScript(() => { localStorage.setItem('viewMode', 'consensus'); });
  await page.goto('/');
  await page.waitForSelector('svg.geo-svg', { state: 'visible' });
  await page.waitForTimeout(500);

  // Click the first full-size consensus callout box
  const box = page.locator('.map-annotation-box--consensus').first();
  await box.waitFor({ state: 'visible' });
  await box.click();
  await page.waitForSelector('.inspector-card', { state: 'visible' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(v => `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map(n => n.target.join(', ')).join('\n  ')}`)
      .join('\n\n');
    console.error('Axe violations in inspector modal (callout trigger):\n' + summary);
  }

  expect(results.violations, 'axe violations in inspector modal from callout').toEqual([]);
});

test('mobile sheet open — no axe violations', async ({ page, viewport }) => {
  test.skip(!isMobile(viewport), 'mobile controls sheet only exists on mobile viewports');

  await page.click('button[aria-label="Open map settings"]');
  await page.waitForSelector('.mobile-controls-sheet.open', { state: 'visible' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(v => `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map(n => n.target.join(', ')).join('\n  ')}`)
      .join('\n\n');
    console.error('Axe violations in mobile sheet:\n' + summary);
  }

  expect(results.violations, 'axe violations in mobile sheet').toEqual([]);
});
