import { expect, test } from '@playwright/test';

test('public LLM calculator estimates cost without authentication', async ({
  page,
}) => {
  await page.route('**/api/fx?base=USD&quote=INR', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        base: 'USD',
        quote: 'INR',
        rate: '95.5',
        asOf: '2026-09-16',
        source: 'test-reference',
      }),
    });
  });

  await page.goto('/tools/llm-cost-calculator');

  await expect(page.getByRole('heading', { name: 'LLM cost,' })).toBeVisible();

  await expect(page.getByText('USD 20.00')).toBeVisible();
  await expect(page.getByText('USD 240.00')).toBeVisible();
  await expect(page.getByText('USD 0.002000')).toBeVisible();

  await page.getByLabel('Requests per month').fill('20000');
  await expect(page.getByText('USD 40.00')).toBeVisible();

  await page.getByLabel('Display results in').selectOption('INR');
  await expect(page.getByText('INR 3820.00')).toBeVisible();
  await expect(page.getByText(/1 USD = 95.5 INR/)).toBeVisible();
});

test('provider preset populates dated official rates', async ({ page }) => {
  await page.goto('/tools/llm-cost-calculator');

  await page
    .getByLabel('Provider/model pricing preset')
    .selectOption('openai-gpt-5.6-sol-standard');

  await expect(page.getByLabel('Input price / 1M tokens')).toHaveValue('4');
  await expect(page.getByLabel('Output price / 1M tokens')).toHaveValue('20');
  await expect(page.getByText('USD 90.00')).toBeVisible();
  await expect(page.getByText(/source checked 2026-09-16/)).toBeVisible();
});
