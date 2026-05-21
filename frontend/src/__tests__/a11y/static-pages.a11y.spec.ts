// @author Claude Sonnet 4.6 Anthropic
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Violation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

function logViolations(context: string, violations: Violation[]) {
  if (violations.length === 0) return;
  const summary = violations
    .map(v => `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map(n => n.target.join(', ')).join('\n  ')}`)
    .join('\n\n');
  console.error(`Axe violations on ${context}:\n` + summary);
}

test('/method page — no axe violations', async ({ page }) => {
  await page.goto('/method');
  await page.waitForSelector('h1', { state: 'visible' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  logViolations('/method', results.violations);
  expect(results.violations, 'axe violations on /method').toEqual([]);
});

test('/credits page — no axe violations', async ({ page }) => {
  await page.goto('/credits');
  await page.waitForSelector('h1', { state: 'visible' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  logViolations('/credits', results.violations);
  expect(results.violations, 'axe violations on /credits').toEqual([]);
});

test('/accessibility page — no axe violations', async ({ page }) => {
  await page.goto('/accessibility');
  await page.waitForSelector('h1', { state: 'visible' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  logViolations('/accessibility', results.violations);
  expect(results.violations, 'axe violations on /accessibility').toEqual([]);
});
