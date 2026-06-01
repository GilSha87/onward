import { test, expect } from '@playwright/test';

// In a production build with no Supabase session, the app gates on the login
// screen. These tests exercise that entry flow end-to-end against the built
// app (demo/placeholder backend).
test.describe('login entry flow', () => {
  test('shows the sign-in form', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByPlaceholder('you@duda.co')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('submitting empty credentials does not navigate away', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign in' }).click();
    // Validation short-circuits the submit; the form stays put.
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('invalid credentials surface a user-facing error', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('you@duda.co').fill('nobody@example.com');
    await page.getByPlaceholder('••••••••').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    // The placeholder backend rejects, so the app shows its friendly error.
    await expect(page.getByText('Invalid email or password. Please try again.')).toBeVisible({ timeout: 15_000 });
  });
});
