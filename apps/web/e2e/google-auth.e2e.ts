import { expect, test } from '@playwright/test';

test('login page is usable when production auth is unavailable in local E2E', async ({
  page,
}) => {
  await page.goto('/login');

  await expect(
    page.getByRole('heading', { name: 'Give us usage. Get one answer.' }),
  ).toBeVisible();
  await expect(
    page.getByText('Google sign-in is disabled on this preview host.'),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Back to your chosen flow' }),
  ).toBeVisible();
});

test('chosen source survives the sign-in continuation path', async ({ page }) => {
  await page.goto(
    '/login?returnTo=%2Fstart%3Fmode%3Dconnect%26provider%3DOPENAI',
  );

  const back = page.getByRole('link', { name: 'Back to your chosen flow' });
  await expect(back).toHaveAttribute(
    'href',
    '/start?mode=connect&provider=OPENAI',
  );
});

test('authenticated source launchpad opens the selected intake path', async ({
  page,
}) => {
  await page.goto('/start?intent=analyze');
  await expect(
    page.getByRole('heading', { name: 'Connect your AI usage' }),
  ).toBeVisible();

  await page.getByRole('link', { name: /OpenAI/i }).click();
  await expect(page).toHaveURL(
    /\/o\/demo-org\/import\?mode=connect&provider=OPENAI$/,
  );
  await expect(
    page.getByRole('heading', { name: 'Connect the source you chose' }),
  ).toBeVisible();
});
