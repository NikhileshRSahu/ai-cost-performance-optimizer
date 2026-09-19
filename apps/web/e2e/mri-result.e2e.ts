import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const baselineCsv = fileURLToPath(
  new URL('../../../fixtures/demo/customer-loop-tough.csv', import.meta.url),
);

const JOURNEY_STATE_TIMEOUT_MS = 15_000;

test('usage analysis opens with a customer-first optimization result', async ({
  page,
}) => {
  const organizationId = 'journey-org';

  await page.goto(`/o/${organizationId}/import?mode=csv&demo=true`);
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Drop your usage CSV here/i }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(baselineCsv);
  await expect(page.getByText('Ready to analyze')).toBeVisible();
  await expect(page.locator('input[name="isDemo"]')).toHaveValue('true');
  await page.getByRole('button', { name: 'Analyze my AI usage' }).click();

  await expect(page).toHaveURL(
    new RegExp(`/o/${organizationId}\\?source=import`),
  );
  await expect(
    page.getByRole('heading', { name: 'Your AI spend at a glance' }),
  ).toBeVisible({ timeout: JOURNEY_STATE_TIMEOUT_MS });
  await expect(page.getByText('Best change', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Estimated savings', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Is this safe?', { exact: true })).toBeVisible();
  await expect(page.getByText('Next step', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Detection confidence', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText('Savings confidence', { exact: true }),
  ).toHaveCount(0);
});
