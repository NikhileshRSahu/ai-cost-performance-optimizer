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
const JOURNEY_STATE_TIMEOUT_MS = 15_000;

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
  demo = true,
): Promise<'READY' | 'ALREADY_VERIFIED'> {
  await page.goto(
    `/o/${organizationId}/import?mode=csv${demo ? '&demo=true' : ''}`,
  );
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Drop your usage CSV here/i }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(baselineCsv);
  await expect(page.getByText('Ready to analyze')).toBeVisible();
  if (demo) {
    await expect(page.locator('input[name="isDemo"]')).toHaveValue('true');
  }
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
  await expect(page.getByText('Saving status', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Not measured yet', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Measure exact savings (optional)' }),
  ).toBeVisible();
  await expectAccessible(page);

  // Optional proof follows the same customer-facing path as the product.
  await page
    .getByRole('link', { name: 'Measure exact savings (optional)' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Measure exact savings' }),
  ).toBeVisible({ timeout: JOURNEY_STATE_TIMEOUT_MS });
  await page
    .getByRole('link', { name: 'Measure exact savings', exact: true })
    .click();

  const defineConstraints = page.getByRole('link', {
    name: 'Define constraints',
  });
  if (await defineConstraints.isVisible()) {
    await defineConstraints.click();
    await page.getByLabel('Workload name').fill('classification');
    await page.getByLabel('Environment').fill('production');
    await page.getByLabel('Minimum quality').fill('0.90');

    const latencyField = page.getByLabel('Maximum p95 latency (ms)');
    if (await latencyField.isVisible()) {
      await latencyField.fill('1000');
    }
    const failureRateField = page.getByLabel('Maximum failure rate');
    if (await failureRateField.isVisible()) {
      await failureRateField.fill('0.05');
    }

    await page
      .getByRole('button', { name: 'Save safety floor and continue' })
      .click();
  }

  await expect(
    page.getByRole('heading', {
      name: 'Test whether a cheaper setup is safe',
    }),
  ).toBeVisible({ timeout: JOURNEY_STATE_TIMEOUT_MS });
  await page.locator('input[name="benchmarkCsv"]').setInputFiles(benchmarkCsv);
  if (demo) {
    await page.locator('input[name="isDemo"]').check();
  }
  await page.getByRole('button', { name: 'Run safety test' }).click();

  await expect(
    page.getByRole('heading', { name: 'Current versus candidate' }),
  ).toBeVisible({ timeout: JOURNEY_STATE_TIMEOUT_MS });
  await expect(page.getByText('OPTIMIZE', { exact: true })).toBeVisible({
    timeout: JOURNEY_STATE_TIMEOUT_MS,
  });

  await page.getByLabel('Historical baseline cost').fill('1000');
  await page
    .getByLabel(
      'I confirm this window represents a comparable workload and volume basis for this projection.',
    )
    .check();
  await page.getByRole('button', { name: 'Replay historical cost' }).click();
  await expect(page.getByText('Projected gross saving')).toBeVisible({
    timeout: JOURNEY_STATE_TIMEOUT_MS,
  });
  await expect(
    page.getByText(
      'This replay is never written to the VERIFIED savings ledger.',
    ),
  ).toBeVisible();
  await expectAccessible(page);

  await page.goto(`/o/${organizationId}`);
  const verifiedBadge = page.locator('.state-badge.state-verified').first();
  if (await verifiedBadge.isVisible()) {
    return 'ALREADY_VERIFIED';
  }

  await expect(page.locator('.state-badge.state-tested').first()).toBeVisible({
    timeout: JOURNEY_STATE_TIMEOUT_MS,
  });
  await page.getByRole('link', { name: 'Prepare safe rollout' }).click();

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
  ).toBeVisible({ timeout: JOURNEY_STATE_TIMEOUT_MS });
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
    .getByLabel('Quality evidence reference')
    .fill('eval-suite:classification-v3');
  await page.getByLabel('Request/unit definition is unchanged.').check();
  await page.getByLabel('Workload mix is comparable to the baseline.').check();
  await page
    .getByLabel('Concurrent deployments are absent or accounted for.')
    .check();
  await page.getByRole('button', { name: 'Run verification' }).click();
}

test('hard customer journey reaches verified savings', async ({ page }) => {
  test.setTimeout(90_000);
  const state = await reachVerification(page, 'journey-org');
  if (state === 'READY') {
    await submitPostChange(page, '0.93');

    await expect(page.getByRole('heading', { name: 'VERIFIED' })).toBeVisible();
    await expect(page.getByText('Verified net impact')).toBeVisible();
    await expectAccessible(page);
  }

  await page.goto('/o/journey-org');
  await expect(
    page.locator('.state-badge.state-verified').first(),
  ).toBeVisible();
  await expect(
    page.getByText('Verified net saving', { exact: true }),
  ).toBeVisible();
});

test('non-demo customer path reaches verified savings without demo provenance', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const state = await reachVerification(page, 'journey-live-org', false);
  if (state === 'READY') {
    await submitPostChange(page, '0.93');
    await expect(page.getByRole('heading', { name: 'VERIFIED' })).toBeVisible();
  }

  await page.goto('/o/journey-live-org');
  await expect(
    page.locator('.state-badge.state-verified').first(),
  ).toBeVisible();
  await expect(
    page.getByText('Synthetic demo data — not a customer result.'),
  ).toHaveCount(0);
});

test('failed post-change quality never becomes verified', async ({ page }) => {
  await reachVerification(page, 'journey-bad-org');
  await submitPostChange(page, '0.80');

  await expect(page.getByRole('heading', { name: 'BLOCKED' })).toBeVisible();
  await expect(page.getByText('PERFORMANCE_CONSTRAINT_FAILED')).toBeVisible();
  await expect(page.getByText('Verified net impact')).toHaveCount(0);

  await page.goto('/o/journey-bad-org');
  await expect(page.locator('.state-badge.state-tested').first()).toBeVisible({
    timeout: JOURNEY_STATE_TIMEOUT_MS,
  });
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
  await expect(page).toHaveURL(/\/import\?mode=csv&demo=true$/);
  await expect(page.locator('input[name="isDemo"]')).toHaveValue('true');
  await expect(
    page.getByText('Synthetic demo data — not a customer result.'),
  ).toHaveCount(0);
});

test('owner can issue a telemetry-only machine credential', async ({
  page,
}) => {
  await page.goto('/o/journey-org/telemetry');
  await expect(
    page.getByRole('heading', {
      name: 'Connect unattended AI workloads safely',
    }),
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

test('recovery states stay actionable and accessible', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(
    page.getByRole('heading', { name: 'This workbench page does not exist.' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toBeVisible();
  await expectAccessible(page);

  await page.goto('/o/not-a-member');
  await expect(
    page.getByRole('heading', {
      name: 'You do not have access to this organization.',
    }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toBeVisible();
  await expectAccessible(page);

  await page.goto('/o/journey-org/lab/missing-recommendation');
  await expect(
    page.getByRole('heading', { name: 'Insufficient benchmark evidence' }),
  ).toBeVisible({ timeout: JOURNEY_STATE_TIMEOUT_MS });
  await expect(
    page.getByRole('link', { name: 'Return to benchmark' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Back to overview' }),
  ).toBeVisible();
  await expectAccessible(page);

  await page.goto('/o/journey-org/report/missing-recommendation');
  await expect(
    page.getByRole('heading', {
      name: 'This recommendation does not have complete report evidence.',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Return to benchmark' }),
  ).toBeVisible();
  await expectAccessible(page);
});
