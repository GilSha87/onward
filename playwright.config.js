import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the Onward smoke suite.
 *
 * Local usage:
 *   npm run test:e2e               # headless Chromium
 *   npm run test:e2e -- --headed   # visible browser
 *
 * CI: set BASE_URL env var to the preview/production URL.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',

  /* Maximum time each test can run */
  timeout: 30_000,

  /* Re-use one worker in CI to avoid rate-limiting Supabase */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter */
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    /* Base URL - override with BASE_URL env var in CI */
    baseURL: process.env.BASE_URL || 'https://onward-tau.vercel.app',

    /* Capture a trace on first retry so failures are diagnosable */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
