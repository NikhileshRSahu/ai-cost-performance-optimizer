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

async function reachVerification(
  page: Page,
  organizationId: string,
): Promise<'READY' | 'ALREADY_VERIFIED'> {
  await page.goto(`/o/${organizationId}/import`);
  await page.locator('input[name="usageCsv"]').setInputFiles(baselineCsv);
  await page.locator('input[name="isDemo"]').check();
  await page.getByRole('button', { name: 'Validate and import' }).click();
  await expect(page.getByRole('heading', { name: 'PARTIAL' })).toBeVisible();
  const importSummary = page.getByLabel('Import evidence summary');
  await expect(importSummary).toContainText('28');
  await expect(importSummary).toContainText('5');
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

  await page.getByLabel('Historical baseline cost').fill('1000');
  await page
    .getByLabel(
      'I confirm this window represents a comparable workload and volume basis for this projection.',
    )
    .check();
  await page.getByRole('button', { name: 'Replay historical cost' }).click();
  await expect(page.getByText('Projected gross saving')).toBeVisible();
  await expect(
    page.getByText(
      'This replay is never written to the VERIFIED savings ledger.',
    ),
  ).toBeVisible();
  await expectAccessible(page);

  await page.goto(`/o/${organizationId}`);
  const verifiedBadge = page.locator('.state-badge.state-verified');
  if (await verifiedBadge.isVisible()) {
    return 'ALREADY_VERIFIED';
  }

  await expect(page.locator('.state-badge.state-tested')).toBeVisible();
  await page.getByRole('link', { name: 'Implement tested change' }).click();

  const implementedAt = page.getByLabel('Implemented at (UTC)');
  const continueLink = page.getByRole('link', {
    name: 'Continue to verification',
  });

  await expect
    .poll(async () => {
      if (await implementedAt.isVisible()) return 'fresh';
      if (await continueLink.isVisible()) return 'saved';
      return 'loading';
    })
    .not.toBe('loading');

  if (await implementedAt.isVisible()) {
    await implementedAt.fill('2026-08-30T08:00');
    await page.getByLabel('Rollout started (UTC)').fill('2026-08-30T08:00');
    await page.getByLabel('Stabilization ends (UTC)').fill('2026-09-01T08:00');
    await page.getByRole('button', { name: 'Confirm implementation' }).click();
  } else {
    await continueLink.click();
  }

  await expect(
    page.getByRole('heading', { name: 'Measure what actually changed' }),
  ).toBeVisible();
  await expectAccessible(page);
  return 'READY';
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
  const state = await reachVerification(page, 'journey-org');
  if (state === 'READY') {
    await submitPostChange(page, '0.93');

    await expect(page.getByRole('heading', { name: 'VERIFIED' })).toBeVisible();
    await expect(page.getByText('Verified net impact')).toBeVisible();
    await expectAccessible(page);
  }

  await page.goto('/o/journey-org');
  await expect(page.locator('.state-badge.state-verified')).toBeVisible();
  await expect(page.getByText('Verified net impact')).toBeVisible();
});

test('failed post-change quality never becomes verified', async ({ page }) => {
  await reachVerification(page, 'journey-bad-org');
  await submitPostChange(page, '0.80');

  await expect(page.getByRole('heading', { name: 'BLOCKED' })).toBeVisible();
  await expect(page.getByText('PERFORMANCE_CONSTRAINT_FAILED')).toBeVisible();
  await expect(page.getByText('Verified net impact')).toHaveCount(0);

  await page.goto('/o/journey-bad-org');
  await expect(page.locator('.state-badge.state-tested')).toBeVisible();
  await expect(page.locator('.state-badge.state-verified')).toHaveCount(0);
});

test('guided synthetic walkthrough preselects demo mode', async ({ page }) => {
  await page.goto('/o/journey-org/demo');
  await expect(
    page.getByRole('heading', {
      name: 'See the full proof loop without using customer data',
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Open demo import' }).click();
  await expect(page.locator('input[name="isDemo"]')).toBeChecked();
  await expect(
    page.getByText('Synthetic demo data — not a customer result.'),
  ).toHaveCount(0);
});


test('owner can issue a telemetry-only machine credential', async ({ page }) => {
  await page.goto('/o/journey-org/telemetry');
  await expect(
    page.getByRole('heading', { name: 'Connect unattended AI workloads safely' }),
  ).toBeVisible();

  await page.getByLabel('Agent label').fill('e2e-production-agent');
  await page
    .getByRole('button', { name: 'Create telemetry credential' })
    .click();

  await expect(page.getByText('Copy now', { exact: true })).toBeVisible();
  const token = page.getByLabel('Telemetry bearer token');
  await expect(token).toHaveValue(/^aie_tlm_[a-f0-9]{32}\.[A-Za-z0-9_-]+$/);
  await expect(page.getByText('e2e-production-agent').first()).toBeVisible();
  await expectAccessible(page);
});
