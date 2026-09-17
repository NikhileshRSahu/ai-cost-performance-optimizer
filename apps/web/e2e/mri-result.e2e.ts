import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const baselineCsv = fileURLToPath(
  new URL('../../../fixtures/demo/customer-loop-tough.csv', import.meta.url),
);

const JOURNEY_STATE_TIMEOUT_MS = 15_000;

test('usage analysis opens with an AI Efficiency MRI and split confidence', async ({
  page,
}) => {
  const organizationId = 'mri-org';

  await page.goto(`/o/${organizationId}/import`);
  await page.locator('input[name="usageCsv"]').setInputFiles(baselineCsv);
  await page.locator('input[name="isDemo"]').check();
  await page.getByRole('button', { name: 'Analyze this usage' }).click();

  await expect(page).toHaveURL(
    new RegExp(`/o/${organizationId}\\?source=import`),
  );
  await expect(
    page.getByRole('heading', { name: 'AI Efficiency MRI' }),
  ).toBeVisible({ timeout: JOURNEY_STATE_TIMEOUT_MS });
  await expect(
    page.getByText('Best first move', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Detection confidence', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Savings confidence', { exact: true }),
  ).toBeVisible();
});
