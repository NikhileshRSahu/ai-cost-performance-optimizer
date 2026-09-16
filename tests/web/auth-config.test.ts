import { afterEach, describe, expect, it } from 'vitest';
import {
  hasSelfHostedAuthConfiguration,
  resolveAuthBaseUrl,
  resolveGoogleCallbackUrl,
} from '../../apps/web/lib/auth-config';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('self-hosted Better Auth configuration', () => {
  it('uses the Evalomics production origin and callback exactly', () => {
    process.env.BETTER_AUTH_URL = 'https://evalomics.vercel.app/';

    expect(resolveAuthBaseUrl()).toBe('https://evalomics.vercel.app');
    expect(resolveGoogleCallbackUrl()).toBe(
      'https://evalomics.vercel.app/api/auth/callback/google',
    );
  });

  it('never derives the callback from NEON_AUTH_BASE_URL', () => {
    process.env.BETTER_AUTH_URL = 'https://evalomics.vercel.app';
    process.env.NEON_AUTH_BASE_URL =
      'https://example.neonauth.aws.neon.tech/evalomics/auth';

    expect(resolveGoogleCallbackUrl()).toBe(
      'https://evalomics.vercel.app/api/auth/callback/google',
    );
  });

  it('reports configured only when the self-hosted server inputs exist', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/evalomics';
    process.env.BETTER_AUTH_SECRET = 'x'.repeat(32);
    process.env.BETTER_AUTH_URL = 'https://evalomics.vercel.app';
    process.env.GOOGLE_CLIENT_ID = 'google-client';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';

    expect(hasSelfHostedAuthConfiguration()).toBe(true);

    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(hasSelfHostedAuthConfiguration()).toBe(false);
  });
});
