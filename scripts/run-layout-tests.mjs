#!/usr/bin/env node
// CLI: runs layout tests, writes JSON report, and optionally takes Playwright screenshots.
// For milestone 1: no HTML report.
//
// Usage:
//   node scripts/run-layout-tests.mjs [--id <id>] [--tag <tag>] [--group <group>]
//                                      [--viewport <name>]
//                                      [--projection mercator|natural-earth]
//                                      [--screenshots]
//
// @author Claude Sonnet 4.6 Anthropic

import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FRONTEND = join(ROOT, 'frontend');
const FIXTURES_DIR = join(FRONTEND, 'src/__tests__/layout/fixtures');
const OUTPUT_DIR = join(FRONTEND, 'test-output');
const SCREENSHOTS_DIR = join(OUTPUT_DIR, 'screenshots');

// --- CLI arg parsing ---
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
}
function hasFlag(name) { return args.includes(name); }

const filterIds        = args.filter((_, i) => args[i - 1] === '--id');
const filterTags       = args.filter((_, i) => args[i - 1] === '--tag');
const filterGroup      = getArg('--group');
const filterViewport   = getArg('--viewport');
const filterProjection = getArg('--projection'); // mercator | natural-earth
const takeScreenshots  = hasFlag('--screenshots');

// --- Load fixtures ---
const allFixtures = readdirSync(FIXTURES_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(readFileSync(join(FIXTURES_DIR, f), 'utf-8')));

const fixtures = allFixtures.filter(f => {
  if (filterIds.length > 0 && !filterIds.includes(f.id)) return false;
  if (filterGroup && f.group !== filterGroup) return false;
  if (filterTags.length > 0 && !filterTags.some(t => f.tags?.includes(t))) return false;
  return true;
});

// --- Viewports (mirrors viewports.ts) ---
const ALL_VIEWPORTS = [
  { name: 'desktop-fhd-typ', w: 1920, h: 945 },
  { name: 'phone-large',     w: 414,  h: 715 },
];

const SVG_WIDTH = 800;
function deriveParams(viewport, bottomReservedPx) {
  const visibleSvgHeight = Math.min(600, SVG_WIDTH * (viewport.h / viewport.w));
  const bottomPaddingSvg = bottomReservedPx * (SVG_WIDTH / viewport.w);
  return { ...viewport, visibleSvgHeight, bottomPaddingSvg };
}

const viewports = filterViewport
  ? ALL_VIEWPORTS.filter(v => v.name === filterViewport)
  : ALL_VIEWPORTS;

// --- Projections (mirrors projections.ts) ---
const ALL_PROJECTIONS = [
  { name: 'mercator',      projectionType: 'geoMercator',      center: [0, -25], scale: 90  },
  { name: 'natural-earth', projectionType: 'geoNaturalEarth1', center: [0, -28], scale: 153 },
];

const projections = filterProjection
  ? ALL_PROJECTIONS.filter(p => p.name === filterProjection)
  : ALL_PROJECTIONS;

// --- Build the run matrix ---
const runs = [];
for (const fixture of fixtures) {
  for (const projection of projections) {
    for (const viewport of viewports) {
      runs.push({ fixture, projection, viewport });
    }
  }
}

console.log(`\n  ${fixtures.length} fixture(s) × ${projections.length} projection(s) × ${viewports.length} viewport(s) = ${runs.length} run(s)\n`);

if (runs.length === 0) {
  console.log('  No runs matched the given filters.');
  process.exit(0);
}

// --- Run algorithm + evaluation via vite-node ---
const viteNode = join(FRONTEND, 'node_modules/.bin/vite-node');

function runViaViteNode(fixture, projection, viewport) {
  const inlineScript = `
import { runLayout } from '${join(FRONTEND, 'src/__tests__/layout/runner.ts').replace(/\\/g, '/')}';
import { PROJECTIONS } from '${join(FRONTEND, 'src/__tests__/layout/projections.ts').replace(/\\/g, '/')}';
const fixture = ${JSON.stringify(fixture)};
const viewport = ${JSON.stringify(viewport)};
const proj = PROJECTIONS.find(p => p.name === ${JSON.stringify(projection.name)});
const result = runLayout(fixture, viewport, proj);
process.stdout.write(JSON.stringify(result));
`;

  const tmpFile = join(OUTPUT_DIR, `_runner_tmp_${Date.now()}.mts`);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(tmpFile, inlineScript);

  try {
    const output = execSync(`${viteNode} --project ${join(FRONTEND, 'tsconfig.json')} ${tmpFile}`, {
      cwd: FRONTEND,
      encoding: 'utf-8',
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    const jsonStart = output.indexOf('{');
    if (jsonStart === -1) throw new Error(`No JSON in output: ${output}`);
    return JSON.parse(output.slice(jsonStart));
  } catch (err) {
    console.error(`  ERROR running ${fixture.id} @ ${viewport.name} [${projection.name}]:`, err.message);
    const vp = deriveParams(viewport, 90);
    return {
      fixtureId: fixture.id,
      group: fixture.group,
      tags: fixture.tags,
      projection: projection.name,
      viewport: { ...vp },
      pass: false,
      violations: [{ type: 'runner-error', calloutA: 'runner', detail: err.message }],
      metrics: {},
      placements: [],
      diagnostics: {},
      screenshot: null,
    };
  } finally {
    try { import('node:fs').then(fs => fs.unlinkSync(tmpFile)); } catch { /* ignore */ }
  }
}

const results = [];
let passed = 0, failed = 0;

for (const { fixture, projection, viewport } of runs) {
  process.stdout.write(`  ${fixture.id} @ ${viewport.name} [${projection.name}] ... `);
  const result = runViaViteNode(fixture, projection, viewport);
  results.push(result);
  if (result.pass) { passed++; console.log('✓ pass'); }
  else             { failed++; console.log(`✗ FAIL (${result.violations.length} violation(s))`); }
}

// --- Console summary ---
console.log(`\n  ${passed} passed / ${failed} failed\n`);
if (failed > 0) {
  console.log('  Failures:\n');
  for (const r of results.filter(r => !r.pass)) {
    const v = r.violations[0];
    console.log(`  ${r.fixtureId} @ ${r.viewport.name} [${r.projection}]`);
    console.log(`    ${v.type}: ${v.calloutA}${v.calloutB ? ` / ${v.calloutB}` : ''} — ${v.detail}\n`);
  }
}

// --- Write JSON report ---
mkdirSync(OUTPUT_DIR, { recursive: true });
const reportPath = join(OUTPUT_DIR, 'layout-report.json');
writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`  Report: ${reportPath}`);

// --- Playwright screenshots ---
if (!takeScreenshots) {
  process.exit(failed > 0 ? 1 : 0);
}

console.log('\n  Taking screenshots via Playwright...\n');

console.log('  Building frontend...');
execSync('npm run build', { cwd: FRONTEND, stdio: 'inherit' });

const preview = spawn('npx', ['vite', 'preview', '--port', '4174', '--host'], {
  cwd: FRONTEND,
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: false,
});

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Preview server timeout')), 30000);
  preview.stdout.on('data', (d) => {
    if (d.toString().includes('4174') || d.toString().includes('Local:')) { clearTimeout(timeout); resolve(); }
  });
  preview.stderr.on('data', (d) => {
    const s = d.toString();
    if (s.includes('4174') || s.includes('Local:')) { clearTimeout(timeout); resolve(); }
  });
  preview.on('error', (err) => { clearTimeout(timeout); reject(err); });
});

await new Promise(r => setTimeout(r, 1000));

mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const _pw = await import(join(FRONTEND, 'node_modules/@playwright/test/index.js'));
const chromium = (_pw.default ?? _pw['module.exports'] ?? _pw).chromium;
const browser = await chromium.launch({ headless: true });

// Screenshot filename: {id}__{projection}__{viewport}.png
function screenshotFilename(fixture, projection, viewport) {
  return `${fixture.id}__${projection.name}__${viewport.name}.png`;
}

let screenshotCount = 0;
try {
  for (const { fixture, projection, viewport } of runs) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: viewport.w, height: viewport.h });

    const url = `http://localhost:4174/__layout-test?case=${fixture.id}&strip=1&projection=${projection.name}`;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('svg', { timeout: 10000 });
    await page.waitForTimeout(800);

    const filename = screenshotFilename(fixture, projection, viewport);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, filename), fullPage: false });

    const result = results.find(r =>
      r.fixtureId === fixture.id &&
      r.projection === projection.name &&
      r.viewport.name === viewport.name
    );
    if (result) result.screenshot = `screenshots/${filename}`;

    screenshotCount++;
    console.log(`  ${filename}`);
    await page.close();
  }
} finally {
  await browser.close();
  preview.kill('SIGTERM');
}

writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n  ${screenshotCount} screenshot(s) in ${SCREENSHOTS_DIR}`);
console.log(`  Report: ${reportPath}`);

process.exit(failed > 0 ? 1 : 0);
