import { describe, expect, it } from 'vitest';
import { parseBetterAuthIdentity } from '../../src/auth/better-auth-identity.js';

describe('Better Auth trusted identity mapping', () => {
  it('maps a verified Better Auth user into the existing identity contract', () => {
    expect(
      parseBetterAuthIdentity({
        user: {
          id: 'auth-user-1',
          email: 'Founder@Example.com',
          emailVerified: true,
        },
      }),
    ).toEqual({
      input: {
        provider: 'better-auth/google',
        subject: 'auth-user-1',
        email: 'Founder@Example.com',
        emailVerified: true,
      },
      allowProvision: true,
    });
  });

  it('rejects an unverified identity', () => {
    expect(
      parseBetterAuthIdentity({
        user: {
          id: 'auth-user-1',
          email: 'founder@example.com',
          emailVerified: false,
        },
      }),
    ).toBeNull();
  });

  it('rejects missing sessions and empty identity fields', () => {
    expect(parseBetterAuthIdentity(null)).toBeNull();
    expect(
      parseBetterAuthIdentity({
        user: {
          id: '',
          email: 'founder@example.com',
          emailVerified: true,
        },
      }),
    ).toBeNull();
    expect(
      parseBetterAuthIdentity({
        user: {
          id: 'auth-user-1',
          email: '',
          emailVerified: true,
        },
      }),
    ).toBeNull();
  });
});
