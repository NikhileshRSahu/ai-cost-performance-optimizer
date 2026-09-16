import { describe, expect, it } from 'vitest';
import { readBetterAuthIdentity } from '../../apps/web/lib/better-auth-session';

describe('Better Auth runtime identity bridge', () => {
  it('maps a verified Better Auth session to the existing trusted identity contract', async () => {
    const identity = await readBetterAuthIdentity(
      new Headers({ cookie: 'better-auth.session_token=test' }),
      async () => ({
        user: {
          id: 'auth-user-1',
          email: 'Founder@Example.com',
          emailVerified: true,
        },
      }),
    );

    expect(identity).toEqual({
      input: {
        provider: 'better-auth/google',
        subject: 'auth-user-1',
        email: 'Founder@Example.com',
        emailVerified: true,
      },
      allowProvision: true,
    });
  });

  it('rejects unverified identities', async () => {
    await expect(
      readBetterAuthIdentity(new Headers(), async () => ({
        user: {
          id: 'auth-user-1',
          email: 'founder@example.com',
          emailVerified: false,
        },
      })),
    ).resolves.toBeNull();
  });

  it('returns null when the auth server is unavailable', async () => {
    await expect(
      readBetterAuthIdentity(new Headers(), async () => {
        throw new Error('unavailable');
      }),
    ).resolves.toBeNull();
  });
});
