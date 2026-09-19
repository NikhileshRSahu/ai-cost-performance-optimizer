import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const baselineCsv = fileURLToPath(
  new URL('../../../fixtures/demo/customer-loop-tough.csv', import.meta.url),
);

const JOURNEY_STATE_TIMEOUT_MS = 15_000;

test('usage analysis opens with an AI Efficiency MRI and split confidence', async ({
  page,
}) => {
  const organizationId = 'journey-org';

  await page.goto(`/o/${organizationId}/import?mode=csv&demo=true`);
  await page.locator('input[name="usageCsv"]').setInputFiles(baselineCsv);
  await expect(page.locator('input[name="isDemo"]')).toHaveValue('true');
  await page.getByRole('button', { name: 'Analyze my AI usage' }).click();

  await expect(page).toHaveURL(
    new RegExp(`/o/${organizationId}\\?source=import`),
  );
  await expect(
    page.getByRole('heading', { name: 'We analyzed your AI usage' }),
  ).toBeVisible({ timeout: JOURNEY_STATE_TIMEOUT_MS });
  await expect(
    page.getByText('Recommended action', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Detection confidence', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Savings confidence', { exact: true }),
  ).toBeVisible();
});
