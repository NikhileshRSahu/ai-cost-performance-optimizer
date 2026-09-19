import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('public beta trust path is visible without authentication', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'Make the invisible economics of AI visible.',
    }),
  ).toBeVisible();
  await expect(page.getByText('Full launch beta · $0')).toBeVisible();
  await expect(page.getByText('No credit card', { exact: true })).toBeVisible();
  await expect(page.getByText('No invented savings')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Analyze my AI usage' }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Explore live demo' }).first(),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Methodology', exact: true }).first().click();
  await expect(
    page.getByRole('heading', {
      name: 'Every recommendation should survive an evidence audit.',
    }),
  ).toBeVisible();
  await expect(page.getByText('Potential', { exact: true })).toBeVisible();
  await expect(page.getByText('Verified', { exact: true })).toBeVisible();

  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy' }).click();
  await expect(
    page.getByRole('heading', { name: 'Use the minimum evidence needed.' }),
  ).toBeVisible();
  await expect(page.getByText('Beta transparency:')).toBeVisible();

  await page.getByRole('link', { name: 'Security' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Trust is a release gate, not a marketing claim.',
    }),
  ).toBeVisible();
  await expect(page.getByText('Bounded connector scope')).toBeVisible();

  await page.getByRole('link', { name: 'Terms' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'A decision-support tool, not an automatic production operator.',
    }),
  ).toBeVisible();
  await expect(page.getByText('No guaranteed savings')).toBeVisible();
});

test('public CTA foregrounds remain readable on their backgrounds', async ({
  page,
}) => {
  await page.goto('/');

  const heroPrimary = page.getByRole('link', {
    name: 'Analyze my AI usage',
  }).first();
  await expect(heroPrimary).toBeVisible();
  const heroStyles = await heroPrimary.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, backgroundColor: style.backgroundColor };
  });
  expect(heroStyles.color).not.toBe(heroStyles.backgroundColor);

  const calculatorCta = page.getByRole('link', {
    name: 'Free cost calculator',
  });
  await expect(calculatorCta).toBeVisible();
  const calculatorStyles = await calculatorCta.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, backgroundColor: style.backgroundColor };
  });
  expect(calculatorStyles.color).not.toBe(calculatorStyles.backgroundColor);

  await page.goto('/pricing');

  const freeCta = page.getByRole('link', {
    name: 'Start free with your data',
  });
  await expect(freeCta).toBeVisible();
  const freeStyles = await freeCta.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, backgroundColor: style.backgroundColor };
  });
  expect(freeStyles.color).not.toBe(freeStyles.backgroundColor);
});

test('public launch surfaces have no serious accessibility blockers', async ({
  page,
}) => {
  const routes = [
    '/',
    '/pricing',
    '/tools',
    '/login',
    '/privacy',
    '/security',
    '/terms',
    '/support',
  ] as const;

  for (const route of routes) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const blocking = results.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious',
    );
    expect(blocking, route + '\n' + JSON.stringify(blocking, null, 2)).toEqual(
      [],
    );
  }
});

test('public acquisition pages fit a phone viewport without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ['/', '/pricing', '/login', '/tools'] as const) {
    await page.goto(route);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(
      dimensions.scrollWidth,
      route + ' overflows the mobile viewport',
    ).toBeLessThanOrEqual(dimensions.innerWidth + 1);
  }
});
