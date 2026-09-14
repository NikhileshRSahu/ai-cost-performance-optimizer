import { expect, test } from '@playwright/test';

test('public beta trust path is visible without authentication', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'See where AI work is wasting money before changing production.',
    }),
  ).toBeVisible();
  await expect(page.getByText('No invented savings')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Research' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Methodology' })).toBeVisible();

  await page.getByRole('link', { name: 'Research' }).first().click();
  await expect(
    page.getByRole('heading', {
      name: 'Real public evidence, visibly separated from customer proof.',
    }),
  ).toBeVisible();
  await expect(page.getByText('BurstGPT v2.0')).toBeVisible();

  await page.getByRole('link', { name: 'Read the claim methodology' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Every recommendation should survive an evidence audit.',
    }),
  ).toBeVisible();
  await expect(page.getByText('Potential')).toBeVisible();
  await expect(page.getByText('Verified')).toBeVisible();
});
