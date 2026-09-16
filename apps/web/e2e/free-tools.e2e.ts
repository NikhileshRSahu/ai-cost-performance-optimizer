import { expect, test } from '@playwright/test';

test('free tools hub exposes exact-arithmetic acquisition calculators', async ({
  page,
}) => {
  await page.goto('/tools');

  await expect(
    page.getByRole('heading', {
      name: 'Measure one thing before you optimize it.',
    }),
  ).toBeVisible();
  await expect(page.getByText('LLM Cost')).toBeVisible();
  await expect(page.getByText('Cost / outcome')).toBeVisible();
  await expect(page.getByText('Prompt cache')).toBeVisible();
  await expect(page.getByText('Agent cost')).toBeVisible();

  await page.goto('/tools/cost-per-outcome');
  await expect(
    page.getByRole('heading', { name: 'Cost per outcome,' }),
  ).toBeVisible();
  await expect(page.getByText('USD 0.1250')).toBeVisible();
  await expect(page.getByText('USD 0.1000')).toBeVisible();
  await expect(page.getByText('USD 200.00')).toBeVisible();

  await page.goto('/tools/prompt-cache-savings');
  await expect(
    page.getByRole('heading', { name: 'Prompt caching,' }),
  ).toBeVisible();
  await expect(page.getByText('USD 7.20')).toBeVisible();
  await expect(page.getByText('USD 10.00')).toBeVisible();
  await expect(page.getByText('USD 2.80')).toBeVisible();

  await page.getByLabel('Cached input price / 1M tokens', { exact: true }).fill('2');
  await expect(page.getByText('Estimated monthly cache premium')).toBeVisible();
  await expect(page.getByText('USD 8.00')).toBeVisible();

  await page.goto('/tools/ai-agent-cost');
  await expect(
    page.getByRole('heading', { name: 'Agent cost,' }),
  ).toBeVisible();
  await expect(
    page.getByRole('strong').filter({ hasText: 'USD 54.00' }).first(),
  ).toBeVisible();
  await expect(page.getByText('USD 0.0108')).toBeVisible();
  await expect(page.getByText('USD 648.00')).toBeVisible();
});
