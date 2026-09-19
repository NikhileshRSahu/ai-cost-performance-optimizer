import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const demoDisclaimer = 'Synthetic demo data — not a customer result.';

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

test('founder gets one direct answer before optional evidence details', async ({
  page,
}) => {
  await page.goto('/o/demo-org');
  await expect(
    page.getByRole('heading', { name: /we analyzed your ai usage/i }),
  ).toBeVisible();
  await expect(page.getByText(demoDisclaimer)).toBeVisible();
  await expect(page.getByText(/recommended action/i)).toBeVisible();
  await expect(page.getByText(/evaluated saving/i)).toBeVisible();

  const detectionConfidence = page.getByText('Detection confidence', {
    exact: true,
  });
  const savingsConfidence = page.getByText('Savings confidence', {
    exact: true,
  });
  await expect(detectionConfidence).toBeVisible();
  await expect(page.getByText('HIGH', { exact: true })).toBeVisible();
  await expect(savingsConfidence).toBeVisible();
  await expect(page.getByText('TESTED', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /prepare safe rollout/i }),
  ).toBeVisible();
  await expect(page.getByText(/see details/i)).toBeVisible();
  await expect(page.getByText(/what should we test next/i)).toHaveCount(0);
  await expect(page.getByText(/evidence: import:/i)).toHaveCount(0);
  await expectAccessible(page);

  await page.getByText(/see details/i).click();
  await expect(
    page.getByRole('heading', { name: 'Current versus candidate' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Performance gate' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Same-volume economics' }),
  ).toBeVisible();
  await expect(page.getByText('Show evidence details')).toBeVisible();

  await page.goto('/o/demo-org/lab/rec-1');
  await expect(
    page.getByRole('heading', { name: 'Current versus candidate' }),
  ).toBeVisible();
  await expect(page.getByText(demoDisclaimer)).toBeVisible();
  await expect(page.getByText('OPTIMIZE', { exact: true })).toBeVisible();
  await expectAccessible(page);

  await page.goto('/o/demo-org/report/rec-1');
  await expect(
    page.getByRole('heading', { name: 'Demo Optimizer Co' }),
  ).toBeVisible();
  await expect(page.getByText(demoDisclaimer)).toBeVisible();
  for (const section of [
    'Executive summary',
    'Scope and data quality',
    'Opportunity',
    'Benchmark',
    'Economics',
    'Confidence',
    'Implementation and rollback',
    'Verification',
    'Methodology and limitations',
  ]) {
    await expect(page.getByRole('heading', { name: section })).toBeVisible();
  }
  await expect(
    page.getByRole('link', { name: 'Back to verification' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'View result evidence' }),
  ).toBeVisible();
  await expectAccessible(page);
});

test('cross-tenant URL is denied without leaking organization content', async ({
  page,
}) => {
  await page.goto('/o/other-org');
  await expect(page).toHaveURL(/\/unauthorized$/);
  await expect(
    page.getByRole('heading', {
      name: 'You do not have access to this organization.',
    }),
  ).toBeVisible();
  await expect(page.getByText('Other Org Secret')).toHaveCount(0);
});
