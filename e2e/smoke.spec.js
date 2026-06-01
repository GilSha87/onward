import { test, expect } from '@playwright/test';
import { ROUTES } from './routes.js';

// Console messages that are expected when the app runs in E2E/demo mode
// (no Supabase env vars => placeholder backend). Anything NOT matching these
// patterns is treated as an unexpected error and fails the test (Group 8).
const ALLOWED_CONSOLE_PATTERNS = [
  /\[Onward\] VITE_SUPABASE_URL not set/,   // demo-mode warning from supabase.js
  /\[onward:monitor\]/,                      // expected api_error vs placeholder backend
  /Failed to load resource/,                 // placeholder.supabase.co network failures
  /net::ERR_/,                               // network errors against placeholder host
  /supabase\.co/,                            // requests to the placeholder host
];

function attachConsoleGuard(page) {
  const unexpected = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (!ALLOWED_CONSOLE_PATTERNS.some((re) => re.test(text))) {
      unexpected.push(text);
    }
  });
  page.on('pageerror', (err) => {
    unexpected.push(`pageerror: ${err.message}`);
  });
  return unexpected;
}

test.describe('smoke', () => {
  test('home page mounts and has correct metadata', async ({ page }) => {
    const unexpected = attachConsoleGuard(page);
    await page.goto('/');

    await expect(page).toHaveTitle(/Onward/);

    // App mounts: #root has real content beyond the static loading shell.
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();

    // robots meta keeps this internal tool out of search indexes.
    const robots = page.locator('head meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);

    // Wait for the app to settle, then assert no unexpected console errors.
    await page.waitForTimeout(1500);
    expect(unexpected, `Unexpected console errors:\n${unexpected.join('\n')}`).toHaveLength(0);
  });

  // The SPA fallback (vercel.json rewrites) must serve the app for any URL a
  // user might refresh on, even though routing is state-based in memory.
  for (const route of ROUTES) {
    test(`SPA fallback serves the app for ${route}`, async ({ page }) => {
      const res = await page.goto(route);
      expect(res?.status()).toBeLessThan(400);
      await expect(page).toHaveTitle(/Onward/);
      await expect(page.locator('#root')).not.toBeEmpty();
    });
  }
});
