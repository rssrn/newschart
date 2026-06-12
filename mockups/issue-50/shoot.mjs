/* Screenshots the issue-50 mockup pages. Run from frontend/ so playwright resolves.
   @author Claude Fable 5 Anthropic */
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const pages = process.argv.length > 2 ? process.argv.slice(2)
  : ['1-consensus-day-view', '2-event-inspector', '3-divergence-map', '4-worst-case-tiered'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1914, height: 885 } });
for (const name of pages) {
  await page.goto('file://' + path.join(dir, name + '.html'));
  await page.waitForFunction('window.__ready === true', null, { timeout: 30000 });
  await page.waitForTimeout(400); // let flag images finish
  await page.screenshot({ path: path.join(dir, name + '.png') });
  console.log('shot', name);
}
await browser.close();
