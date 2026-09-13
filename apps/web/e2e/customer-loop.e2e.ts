import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const baselineCsv = fileURLToPath(
  new URL('../../../fixtures/demo/customer-loop-tough.csv', import.meta.url),
);
const benchmarkCsv = fileURLToPath(
  new URL(
    '../../../fixtures/demo/customer-loop-benchmark.csv',
    import.meta.url,
  ),
);
const postCsv = fileURLToPath(
  new URL(
    '../../../fixtures/demo/customer-loop-post-change.csv',
    import.meta.url,
  ),
);

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) =>
      violation.impact === 'critical' || violation.impact === 'serious',
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

async function reachVerification(page: Page, organizationId: string) {
  await page.goto(`/o/${organizationId}/import`);
  await page.locator('input[name="usageCsv"]').setInputFiles(baselineCsv);
  await page.locator('input[name="isDemo"]').check();
  await page.getByRole('button', { name: 'Validate and import' }).click();
  await expect(page.getByRole('heading', { name: 'PARTIAL' })).toBeVisible();
  await expect(page.locator('.summary-grid')).toContainText('28');
  await expect(page.locator('.summary-grid')).toContainText('5');
  await expectAccessible(page);

  await page.getByRole('link', { name: 'Define workload constraints' }).click();
  await page.getByLabel('Workload name').fill('classification');
  await page.getByLabel('Environment').fill('production');
  await page.getByLabel('Minimum quality').fill('0.90');
  await page.getByLabel('Maximum p95 latency (ms)').fill('1000');
  await page.getByLabel('Maximum failure rate').fill('0.05');
  await page
    .getByRole('button', { name: 'Save constraints and continue' })
    .click();

  await expect(
    page.getByRole('heading', { name: 'Test the cheaper candidate' }),
  ).toBeVisible();
  await page.locator('input[name="benchmarkCsv"]').setInputFiles(benchmarkCsv);
  await page.locator('input[name="isDemo"]').check();
  await page.getByRole('button', { name: 'Evaluate candidate' }).click();

  await expect(
    page.getByRole('heading', { name: 'Current versus candidate' }),
  ).toBeVisible();
  await expect(page.getByText('OPTIMIZE', { exact: true })).toBeVisible();
  await expectAccessible(page);

  await page.goto(`/o/${organizationId}`);
  await expect(page.getByText('Tested saving')).toBeVisible();
  await page.getByRole('link', { name: 'Implement tested change' }).click();

  await page.getByLabel('Implemented at (UTC)').fill('2026-08-30T08:00');
  await page.getByLabel('Rollout started (UTC)').fill('2026-08-30T08:00');
  await page.getByLabel('Stabilization ends (UTC)').fill('2026-09-01T08:00');
  await page.getByRole('button', { name: 'Confirm implementation' }).click();

  await expect(
    page.getByRole('heading', { name: 'Measure what actually changed' }),
  ).toBeVisible();
  await expectAccessible(page);
}

async function submitPostChange(
  page: Page,
  measuredQuality: string,
): Promise<void> {
  await page.locator('input[name="postCsv"]').setInputFiles(postCsv);
  await page.getByLabel('Measured post-change quality').fill(measuredQuality);
  await page.getByLabel('Post-change p95 latency (ms)').fill('844');
  await page.getByLabel('Post-change failure rate').fill('0.018');
  await page
    .getByLabel('Performance evidence reference')
    .fill('eval-suite:classification-v3');
  await page.getByLabel('Request/unit definition is unchanged.').check();
  await page.getByLabel('Workload mix is comparable to the baseline.').check();
  await page
    .getByLabel('Concurrent deployments are absent or accounted for.')
    .check();
  await page.getByRole('button', { name: 'Run verification' }).click();
}

test('hard customer journey reaches verified savings', async ({ page }) => {
  await reachVerification(page, 'journey-org');
  await submitPostChange(page, '0.93');

  await expect(page.getByRole('heading', { name: 'VERIFIED' })).toBeVisible();
  await expect(page.getByText('Verified net impact')).toBeVisible();
  await expectAccessible(page);

  await page.goto('/o/journey-org');
  await expect(page.getByText('Verified saving')).toBeVisible();
  await expect(page.getByText('Verified net impact')).toBeVisible();
});

test('failed post-change quality never becomes verified', async ({ page }) => {
  await reachVerification(page, 'journey-bad-org');
  await submitPostChange(page, '0.80');

  await expect(page.getByRole('heading', { name: 'BLOCKED' })).toBeVisible();
  await expect(page.getByText('PERFORMANCE_CONSTRAINT_FAILED')).toBeVisible();
  await expect(page.getByText('Verified net impact')).toHaveCount(0);

  await page.goto('/o/journey-bad-org');
  await expect(page.getByText('Tested saving')).toBeVisible();
  await expect(page.getByText('Verified saving')).toHaveCount(0);
});
