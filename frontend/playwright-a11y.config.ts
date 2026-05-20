// @author Claude Sonnet 4.6 Anthropic
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/a11y',
  timeout: 60_000,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4174',
    trace: 'off',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4174 --host',
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
