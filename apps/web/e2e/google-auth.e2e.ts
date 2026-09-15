import { expect, test } from '@playwright/test';

test('login page is usable when Neon Auth is not configured', async ({
  page,
}) => {
  await page.goto('/login');

  await expect(
    page.getByRole('heading', { name: 'Start your AI Work MRI.' }),
  ).toBeVisible();
  await expect(
    page.getByText('Sign-in is not configured on this deployment.'),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Try the free LLM cost calculator' }),
  ).toBeVisible();
});
