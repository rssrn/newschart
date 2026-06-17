#!/usr/bin/env node
// CLI: runs layout tests, writes JSON report, and optionally takes Playwright screenshots.
// For milestone 1: no HTML report.
//
// Usage:
//   node scripts/run-layout-tests.mjs [--id <id>] [--tag <tag>] [--group <group>]
//                                      [--viewport <name>]
//                                      [--projection mercator|natural-earth]
//                                      [--screenshots] [--failures-only]
//
// --screenshots      Take Playwright screenshots (builds frontend, starts preview server)
// --failures-only    With --screenshots: only screenshot failing combinations (default: all)
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
const failuresOnly     = hasFlag('--failures-only');

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
  { name: 'desktop-fhd-typ',  w: 1920, h: 945  },
  { name: 'desktop-fhd-bare', w: 1920, h: 1030 },
  { name: 'laptop-1440-typ',  w: 1440, h: 770  },
  { name: 'laptop-1366-typ',  w: 1366, h: 625  },
  { name: 'tablet-landscape', w: 1024, h: 695  },
  { name: 'tablet-portrait',  w: 768,  h: 955  },
  { name: 'phone-large',      w: 414,  h: 715  },
  { name: 'phone-standard',   w: 390,  h: 660  },
  { name: 'phone-small',      w: 360,  h: 510  },
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

// --- Run all cases in a single vite-node subprocess ---
const viteNode = join(FRONTEND, 'node_modules/.bin/vite-node');

function runAllViaBatchedViteNode(runs) {
  const runnerPath   = join(FRONTEND, 'src/__tests__/layout/runner.ts').replace(/\\/g, '/');
  const projPath     = join(FRONTEND, 'src/__tests__/layout/projections.ts').replace(/\\/g, '/');

  const ts = Date.now();
  const tmpScript = join(OUTPUT_DIR, `_runner_batch_${ts}.mts`);
  const tmpOut    = join(OUTPUT_DIR, `_runner_batch_${ts}.json`);
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const batchScript = `
// Redirect console.log to stderr so algorithm debug output doesn't pollute results.
console.log = (...a) => process.stderr.write(a.join(' ') + '\\n');
import { writeFileSync } from 'node:fs';
import { runLayout, runTieredLayout } from '${runnerPath}';
import { PROJECTIONS } from '${projPath}';
const runs = ${JSON.stringify(runs.map(r => ({ fixture: r.fixture, projectionName: r.projection.name, viewport: r.viewport })))};
const results = runs.map(({ fixture, projectionName, viewport }) => {
  const proj = PROJECTIONS.find(p => p.name === projectionName);
  const isTiered = fixture.tags?.includes('tiered');
  return isTiered ? runTieredLayout(fixture, viewport, proj) : runLayout(fixture, viewport, proj);
});
writeFileSync(${JSON.stringify(tmpOut)}, JSON.stringify(results));
`;

  writeFileSync(tmpScript, batchScript);

  try {
    execSync(`${viteNode} --project ${join(FRONTEND, 'tsconfig.json')} ${tmpScript}`, {
      cwd: FRONTEND,
      encoding: 'utf-8',
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    return JSON.parse(readFileSync(tmpOut, 'utf-8'));
  } finally {
    for (const f of [tmpScript, tmpOut]) {
      try { import('node:fs').then(m => m.unlinkSync(f)); } catch { /* ignore */ }
    }
  }
}

let batchResults;
try {
  batchResults = runAllViaBatchedViteNode(runs);
} catch (err) {
  console.error('  ERROR: batch runner failed:', err.message);
  process.exit(1);
}

const results = [];
let passed = 0, failed = 0;

for (let i = 0; i < runs.length; i++) {
  const { fixture, projection, viewport } = runs[i];
  const result = batchResults[i];
  results.push(result);
  if (result.pass) { passed++; console.log(`  ${fixture.id} @ ${viewport.name} [${projection.name}] ... ✓ pass`); }
  else             { failed++; console.log(`  ${fixture.id} @ ${viewport.name} [${projection.name}] ... ✗ FAIL (${result.violations.length} violation(s))`); }
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

const screenshotRuns = failuresOnly ? runs.filter((_, i) => !batchResults[i].pass) : runs;
if (failuresOnly) console.log(`  ${screenshotRuns.length} failing combination(s) to screenshot\n`);

let screenshotCount = 0;
try {
  for (const { fixture, projection, viewport } of screenshotRuns) {
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
