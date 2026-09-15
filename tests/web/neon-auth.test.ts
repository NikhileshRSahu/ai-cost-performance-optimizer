import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  hasNeonAuthConfiguration,
  readNeonAuthIdentity,
} from '../../apps/web/lib/neon-auth.js';

const originalBaseUrl = process.env.NEON_AUTH_BASE_URL;

afterEach(() => {
  if (originalBaseUrl === undefined) {
    delete process.env.NEON_AUTH_BASE_URL;
  } else {
    process.env.NEON_AUTH_BASE_URL = originalBaseUrl;
  }
  vi.restoreAllMocks();
});

describe('Neon Auth session adapter', () => {
  it('fails closed when Neon Auth is not configured', async () => {
    delete process.env.NEON_AUTH_BASE_URL;
    expect(hasNeonAuthConfiguration()).toBe(false);

    const result = await readNeonAuthIdentity(new Headers(), vi.fn());
    expect(result).toBeNull();
  });

  it('maps a verified Neon Auth user into the trusted Evalomics identity contract', async () => {
    process.env.NEON_AUTH_BASE_URL =
      'https://example.neonauth.aws.neon.tech/evalomics/auth';

    const fetcher = vi.fn((url: string | URL, init?: RequestInit) => {
      expect(url).toBe(
        'https://example.neonauth.aws.neon.tech/evalomics/auth/get-session',
      );
      expect(new Headers(init?.headers).get('cookie')).toBe(
        'session_cookie=value',
      );
      return Promise.resolve(
        new Response(
          JSON.stringify({
            session: { id: 'session-1', userId: 'neon-user-1' },
            user: {
              id: 'neon-user-1',
              email: 'founder@example.com',
              emailVerified: true,
            },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      );
    });

    const result = await readNeonAuthIdentity(
      new Headers({ cookie: 'session_cookie=value' }),
      fetcher,
    );

    expect(result).toEqual({
      input: {
        provider: 'neon-auth',
        subject: 'neon-user-1',
        email: 'founder@example.com',
        emailVerified: true,
      },
      allowProvision: true,
    });
  });

  it('rejects unverified, malformed, or expired sessions', async () => {
    process.env.NEON_AUTH_BASE_URL =
      'https://example.neonauth.aws.neon.tech/evalomics/auth';

    const unverified = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            session: { id: 'session-1' },
            user: {
              id: 'neon-user-1',
              email: 'user@example.com',
              emailVerified: false,
            },
          }),
          { status: 200 },
        ),
      ),
    );
    expect(await readNeonAuthIdentity(new Headers(), unverified)).toBeNull();

    const expired = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 401 })),
    );
    expect(await readNeonAuthIdentity(new Headers(), expired)).toBeNull();
  });
});
