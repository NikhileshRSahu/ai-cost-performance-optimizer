import { expect, test } from '@playwright/test';

test('public beta trust path is visible without authentication', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'Find AI waste. Prove the fix.',
    }),
  ).toBeVisible();
  await expect(page.getByText('No invented savings')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Research' })).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Public' })
      .getByRole('link', { name: 'Methodology', exact: true }),
  ).toBeVisible();

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
  await expect(page.getByText('Potential', { exact: true })).toBeVisible();
  await expect(page.getByText('Verified', { exact: true })).toBeVisible();

  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy' }).click();
  await expect(
    page.getByRole('heading', { name: 'Use the minimum evidence needed.' }),
  ).toBeVisible();
  await expect(page.getByText('Legal-review status:')).toBeVisible();

  await page.getByRole('link', { name: 'Security' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Trust is a release gate, not a marketing claim.',
    }),
  ).toBeVisible();
  await expect(page.getByText('Gated by design')).toBeVisible();

  await page.getByRole('link', { name: 'Terms' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'A decision-support tool, not an automatic production operator.',
    }),
  ).toBeVisible();
  await expect(page.getByText('No guaranteed savings')).toBeVisible();
});
