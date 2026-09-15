import { expect, test } from '@playwright/test';

test('public LLM calculator estimates cost without authentication', async ({
  page,
}) => {
  await page.goto('/tools/llm-cost-calculator');

  await expect(page.getByRole('heading', { name: 'LLM cost,' })).toBeVisible();

  await expect(page.getByText('USD 20.00')).toBeVisible();
  await expect(page.getByText('USD 240.00')).toBeVisible();
  await expect(page.getByText('USD 0.002000')).toBeVisible();

  await page.getByLabel('Requests per month').fill('20000');
  await expect(page.getByText('USD 40.00')).toBeVisible();

  await page.getByLabel('Display currency').selectOption('EUR');
  await expect(page.getByText('EUR 40.00')).toBeVisible();
  await expect(page.getByText('No FX conversion is performed.')).toBeVisible();
});
