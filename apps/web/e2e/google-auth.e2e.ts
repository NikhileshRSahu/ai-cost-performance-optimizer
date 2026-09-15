import { expect, test } from '@playwright/test';

test('login page is usable when Neon Auth is not configured', async ({
  page,
}) => {
  await page.goto('/login');

  await expect(
    page.getByRole('heading', { name: 'Start with real evidence.' }),
  ).toBeVisible();
  await expect(
    page.getByText('Google sign-in is disabled on this preview host.'),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Back to Evalomics' }),
  ).toBeVisible();
});
