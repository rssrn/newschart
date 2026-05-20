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

  // Ensure we start in day view regardless of localStorage state.
  await page.addInitScript(() => {
    localStorage.setItem('viewMode', 'day');
    localStorage.setItem('newsSource', 'GOOGLE_GEMINI');
  });

  await page.goto('/');
  // Wait for the react-simple-maps SVG (class rsm-svg), not the icon SVGs.
  await page.waitForSelector('svg.rsm-svg', { state: 'visible' });
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
