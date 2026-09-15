import { expect, test } from '@playwright/test';

test('free tools hub exposes exact-arithmetic acquisition calculators', async ({
  page,
}) => {
  await page.goto('/tools');

  await expect(
    page.getByRole('heading', {
      name: 'Make the AI economics visible before you optimize.',
    }),
  ).toBeVisible();
  await expect(page.getByText('LLM Cost Calculator')).toBeVisible();
  await expect(page.getByText('Cost per Successful Outcome')).toBeVisible();
  await expect(page.getByText('Prompt Cache Savings')).toBeVisible();
  await expect(page.getByText('AI Agent Cost Calculator')).toBeVisible();

  await page.goto('/tools/cost-per-outcome');
  await expect(
    page.getByRole('heading', {
      name: 'Cost per Successful Outcome Calculator',
    }),
  ).toBeVisible();
  await expect(page.getByText('USD 0.1250')).toBeVisible();
  await expect(page.getByText('USD 0.1000')).toBeVisible();
  await expect(page.getByText('USD 200.00')).toBeVisible();

  await page.goto('/tools/prompt-cache-savings');
  await expect(
    page.getByRole('heading', { name: 'Prompt Cache Savings Calculator' }),
  ).toBeVisible();
  await expect(page.getByText('USD 7.20')).toBeVisible();
  await expect(page.getByText('USD 10.00')).toBeVisible();
  await expect(page.getByText('USD 2.80')).toBeVisible();

  await page.goto('/tools/ai-agent-cost');
  await expect(
    page.getByRole('heading', { name: 'AI Agent Cost Calculator' }),
  ).toBeVisible();
  await expect(page.getByText('USD 54.00')).toBeVisible();
  await expect(page.getByText('USD 0.0108')).toBeVisible();
  await expect(page.getByText('USD 648.00')).toBeVisible();
});
