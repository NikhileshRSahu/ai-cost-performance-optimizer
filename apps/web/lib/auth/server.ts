import { createNeonAuth } from '@neondatabase/auth/next/server';

const baseUrl =
  process.env.NEON_AUTH_BASE_URL ||
  'https://ep-green-night-b4iaryax.neonauth.c-6.us-east-2.aws.neon.tech/evalomics/auth';

const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ||
  process.env.BETTER_AUTH_SECRET ||
  (process.env.NODE_ENV !== 'production'
    ? 'evalomics-local-development-cookie-secret-2026'
    : undefined);

if (!cookieSecret) {
  throw new Error(
    'A production auth cookie secret is required. Set NEON_AUTH_COOKIE_SECRET (preferred) or BETTER_AUTH_SECRET to a 32+ character random value.',
  );
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
    sameSite: 'lax',
  },
  logLevel: 'warn',
});
