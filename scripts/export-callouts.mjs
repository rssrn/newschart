#!/usr/bin/env node
// Manual helper: fetch callouts from the backend API and save as live-* fixture files.
// Never runs automatically — developer tool only.
//
// Usage:
//   node scripts/export-callouts.mjs --base-url <url> --providers <a,b,...>
//       (--date <yyyy-mm-dd> | --from <yyyy-mm-dd> --to <yyyy-mm-dd>)
//       [--out <dir>] [--force]
//
// @author Claude Sonnet 4.6 Anthropic

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DEFAULT_OUT = join(ROOT, 'frontend/src/__tests__/layout/fixtures');

// --- Provider slug map ---
const PROVIDER_SLUGS = {
  NEW_YORK_TIMES: 'nyt',
  GOOGLE_GEMINI:  'gemini',
  PERPLEXITY:     'perplexity',
  OPENAI:         'openai',
  ANTHROPIC:      'anthropic',
  XAI:            'xai',
};

// --- CLI arg parsing ---
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] ?? null : null;
}
function hasFlag(name) { return args.includes(name); }

const baseUrl   = getArg('--base-url');
const providers = getArg('--providers')?.split(',').map(p => p.trim().toUpperCase()) ?? [];
const dateArg   = getArg('--date');
const fromArg   = getArg('--from');
const toArg     = getArg('--to');
const outDir    = getArg('--out') ?? DEFAULT_OUT;
const force     = hasFlag('--force');

// --- Validation ---
const errors = [];
if (!baseUrl) errors.push('--base-url is required');
if (providers.length === 0) errors.push('--providers is required');
if (!dateArg && !(fromArg && toArg)) errors.push('--date or --from + --to is required');
if (dateArg && (fromArg || toArg)) errors.push('--date and --from/--to are mutually exclusive');

const unknownProviders = providers.filter(p => !PROVIDER_SLUGS[p]);
if (unknownProviders.length > 0) {
  errors.push(`Unknown provider(s): ${unknownProviders.join(', ')}. Valid: ${Object.keys(PROVIDER_SLUGS).join(', ')}`);
}

if (errors.length > 0) {
  for (const e of errors) console.error(`  error: ${e}`);
  process.exit(1);
}

// --- Build date list ---
function parseDateStr(s) {
  const d = new Date(`${s}T00:00:00Z`);
  if (isNaN(d)) throw new Error(`Invalid date: ${s}`);
  return d;
}
function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}
function dateRange(from, to) {
  const dates = [];
  const cur = parseDateStr(from);
  const end = parseDateStr(to);
  if (cur > end) throw new Error('--from must be before or equal to --to');
  while (cur <= end) {
    dates.push(fmtDate(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

const dates = dateArg ? [dateArg] : dateRange(fromArg, toArg);

mkdirSync(outDir, { recursive: true });

// --- Stats ---
let written = 0, skippedExists = 0, skippedFew = 0, failed = 0;

// --- Main loop ---
for (const date of dates) {
  for (const provider of providers) {
    const slug = PROVIDER_SLUGS[provider];
    const id = `live-${date}-${slug}`;
    const outPath = join(outDir, `${id}.json`);

    process.stdout.write(`  ${id} ... `);

    // Refuse to overwrite without --force
    if (existsSync(outPath) && !force) {
      skippedExists++;
      console.log('skip (exists; use --force to overwrite)');
      continue;
    }

    // Fetch from API
    let callouts;
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/api/news/calloutsForDay/${date}?source=${provider}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const raw = await res.json();

      // Map to fixture format (only the fields we need)
      callouts = raw.map(c => ({
        headline: c.headline ?? '',
        detail:   c.detail   ?? '',
        country: {
          name:      c.country?.name      ?? '',
          iso2:      c.country?.iso2      ?? '',
          latitude:  c.country?.latitude  ?? 0,
          longitude: c.country?.longitude ?? 0,
        },
      }));
    } catch (err) {
      failed++;
      console.log(`FAIL (${err.message})`);
      continue;
    }

    if (callouts.length < 3) {
      skippedFew++;
      console.log(`skip (only ${callouts.length} callout(s); need ≥3)`);
      continue;
    }

    const trimmed = callouts.length > 3;
    const fixture = {
      id,
      group: 'live',
      tags: [],
      notes: trimmed ? `Trimmed from ${callouts.length} to 3 callouts. Consider hand-crafting a -b variant.` : '',
      source: { baseUrl, date, provider },
      callouts: callouts.slice(0, 3),
    };

    writeFileSync(outPath, JSON.stringify(fixture, null, 2) + '\n');
    written++;
    console.log(`wrote${trimmed ? ` (trimmed from ${callouts.length})` : ''}`);
  }
}

// --- Summary ---
console.log(`\n  ${dates.length} date(s) × ${providers.length} provider(s) = ${dates.length * providers.length} combination(s)`);
console.log(`  written: ${written}  skipped-exists: ${skippedExists}  skipped-too-few: ${skippedFew}  failed: ${failed}`);
if (skippedExists > 0) console.log(`  (re-run with --force to overwrite existing fixtures)`);

process.exit(failed > 0 ? 1 : 0);
