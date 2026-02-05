/**
 * Screenshot script for testing map callout layouts
 * Uses Playwright to capture screenshots of the NewsChart app
 *
 * @author Claude Opus 4.5 (claude-opus-4-5-20251101)
 *
 * Usage: node tools/screenshot-tests.js [options]
 *
 * Options:
 *   --algos, -a    Comma-separated list of algorithms (default: all)
 *                  Available: force, rails, compass, four-winds, exhaustive
 *   --tests, -t    Comma-separated list of test cases (default: all)
 *                  Available: 0-europe-asia, 1-wide-spread, 2-us-cluster,
 *                             3-asian-cluster, 4-southern-hemisphere, 5-single-location
 *   --bounds       Show bounding box overlay (red dashed rectangle)
 *
 * Examples:
 *   node screenshot-tests.js --algos exhaustive --bounds
 *   node screenshot-tests.js -a compass,four-winds -t 2-us-cluster,3-asian-cluster
 *   node screenshot-tests.js  (runs all)
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Frontend running on localhost:3000
 */

const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const FRONTEND_URL = 'http://localhost:3000';
const SAMPLE_CALLOUTS_URL = 'http://localhost:8080/api/news/sampleCallouts';

const ALL_TEST_CASES = {
  '0-europe-asia': 0,
  '1-wide-spread': 1,
  '2-us-cluster': 2,
  '3-asian-cluster': 3,
  '4-southern-hemisphere': 4,
  '5-single-location': 5
};

const ALL_ALGORITHMS = ['force', 'rails', 'compass', 'four-winds', 'exhaustive'];

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let algorithms = ALL_ALGORITHMS;
  let testCaseNames = Object.keys(ALL_TEST_CASES);
  let showBounds = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--algos' || arg === '-a') {
      algorithms = args[++i].split(',').map(s => s.trim());
    } else if (arg === '--tests' || arg === '-t') {
      testCaseNames = args[++i].split(',').map(s => s.trim());
    } else if (arg === '--bounds') {
      showBounds = true;
    }
  }

  return { algorithms, testCaseNames, showBounds };
}

async function takeScreenshots() {
  const { algorithms, testCaseNames, showBounds } = parseArgs();

  const fs = require('fs');
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  console.log(`Algorithms: ${algorithms.join(', ')}`);
  console.log(`Test cases: ${testCaseNames.join(', ')}\n`);

  for (const algorithm of algorithms) {
    console.log(`\n=== Algorithm: ${algorithm} ===`);

    for (const testName of testCaseNames) {
      const testCaseNum = ALL_TEST_CASES[testName];
      if (testCaseNum === undefined) {
        console.log(`⚠ Unknown test case: ${testName}, skipping`);
        continue;
      }

      // Fetch the specific test case from backend
      const response = await fetch(`${SAMPLE_CALLOUTS_URL}?testCase=${testCaseNum}`);
      const calloutData = await response.text();

      // Intercept the calloutsForDay API call and return pre-fetched data
      await page.route('**/api/news/calloutsForDay/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: calloutData
        });
      });

      // Navigate with layout algorithm param (and optional bounding box)
      const boundsParam = showBounds ? '&showBoundingBox=true' : '';
      const url = `${FRONTEND_URL}?layout=${algorithm}${boundsParam}`;
      await page.goto(url, { waitUntil: 'networkidle' });

      // Extra wait for map animations/rendering
      await page.waitForTimeout(2000);

      const screenshotPath = path.join(SCREENSHOT_DIR, `${algorithm}-${testName}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      console.log(`✓ Captured: ${algorithm}-${testName}.png`);

      // Clear route interception for next iteration
      await page.unrouteAll();
    }
  }

  await browser.close();
  console.log(`\nDone! Screenshots saved to: ${SCREENSHOT_DIR}`);
}

takeScreenshots().catch(console.error);
