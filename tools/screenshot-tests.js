/**
 * Screenshot script for testing map callout layouts
 * Uses Playwright to capture screenshots of the NewsChart app
 *
 * @author Claude Opus 4.5 (claude-opus-4-5-20251101)
 *
 * Usage: node tools/screenshot-tests.js
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

const TEST_CASE_NAMES = [
  '0-europe-asia',
  '1-wide-spread',
  '2-us-cluster',
  '3-asian-cluster',
  '4-southern-hemisphere',
  '5-single-location'
];

async function takeScreenshots() {
  const fs = require('fs');
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  console.log('Taking screenshots of all test cases...\n');

  // Pre-fetch all test cases first (to get them in order)
  const testCaseData = [];
  for (let i = 0; i < TEST_CASE_NAMES.length; i++) {
    const response = await fetch(SAMPLE_CALLOUTS_URL);
    const body = await response.text();
    testCaseData.push(body);
  }

  for (let i = 0; i < TEST_CASE_NAMES.length; i++) {
    const testName = TEST_CASE_NAMES[i];
    const calloutData = testCaseData[i];

    // Intercept the calloutsForDay API call and return pre-fetched data
    await page.route('**/api/news/calloutsForDay/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: calloutData
      });
    });

    // Navigate and wait for map to render
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    // Extra wait for map animations/rendering
    await page.waitForTimeout(2000);

    const screenshotPath = path.join(SCREENSHOT_DIR, `test-${testName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    console.log(`✓ Captured: test-${testName}.png`);

    // Clear route interception for next iteration
    await page.unrouteAll();
  }

  await browser.close();
  console.log(`\nDone! Screenshots saved to: ${SCREENSHOT_DIR}`);
}

takeScreenshots().catch(console.error);
