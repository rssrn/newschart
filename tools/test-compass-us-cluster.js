/**
 * Quick test script for compass layout on us-cluster only
 * Usage: node tools/test-compass-us-cluster.js
 */
const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// US cluster test data (test case 2 from CalloutController)
const US_CLUSTER_DATA = JSON.stringify([
  {
    headline: "NYC Stock Market Surge",
    detail: "Wall Street sees biggest gains in a decade as tech sector leads market rally.",
    country: { latitude: 40.7128, longitude: -74.0060, name: "United States", iso2: "US" }
  },
  {
    headline: "Boston Tech Breakthrough",
    detail: "MIT researchers announce quantum computing breakthrough with potential applications in medicine.",
    country: { latitude: 42.3601, longitude: -71.0589, name: "United States", iso2: "US" }
  },
  {
    headline: "Philadelphia Sports Victory",
    detail: "Philadelphia celebrates championship win as fans flood the streets in jubilation.",
    country: { latitude: 39.9526, longitude: -75.1652, name: "United States", iso2: "US" }
  },
  {
    headline: "Washington Policy Shift",
    detail: "Congress passes landmark legislation affecting national infrastructure spending.",
    country: { latitude: 38.9072, longitude: -77.0369, name: "United States", iso2: "US" }
  }
]);

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  await page.route('**/api/news/calloutsForDay/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: US_CLUSTER_DATA })
  );

  await page.goto('http://localhost:3000?layout=compass', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Debug: log console messages from the page
  const logs = await page.evaluate(() => window._compassDebug || 'no debug info')
  console.log('Debug:', logs);

  const screenshotPath = path.join(SCREENSHOT_DIR, 'compass-us-cluster-test.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved: ${screenshotPath}`);

  await browser.close();
}

test().catch(console.error);
