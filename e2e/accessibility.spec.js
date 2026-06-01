import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Accessibility checks against the surfaces an unauthenticated visitor sees.
// In the production build with no Supabase session, the app renders the login
// screen, so that is the primary surface we can audit without credentials.
test.describe('accessibility', () => {
  test('login screen has no serious or critical violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );

    expect(
      blocking,
      blocking.map((v) => `${v.id} (${v.impact}): ${v.help}`).join('\n')
    ).toEqual([]);
  });
});
