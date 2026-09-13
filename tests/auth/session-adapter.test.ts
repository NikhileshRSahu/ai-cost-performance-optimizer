import { describe, expect, it } from 'vitest';
import {
  createPasswordlessSessionAdapter,
  parseTrustedPasswordlessIdentity,
} from '../../src/auth/session-adapter.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';

const persistedSession: AuthenticatedSession = {
  userId: 'user-1',
  memberships: [
    { organizationId: 'org-a', role: 'OWNER' },
    { organizationId: 'org-b', role: 'VIEWER' },
  ],
};

describe('passwordless session adapter', () => {
  it('accepts only verified trusted identity claims', () => {
    expect(
      parseTrustedPasswordlessIdentity({
        provider: 'magic-link',
        subject: 'subject-1',
        email: 'FOUNDER@EXAMPLE.COM',
        emailVerified: true,
      }),
    ).toEqual({
      provider: 'magic-link',
      subject: 'subject-1',
      email: 'founder@example.com',
      emailVerified: true,
    });

    expect(() =>
      parseTrustedPasswordlessIdentity({
        provider: 'magic-link',
        subject: 'subject-1',
        email: 'founder@example.com',
        emailVerified: false,
      }),
    ).toThrow();
  });

  it('never accepts role or organization authority from identity payloads', () => {
    expect(() =>
      parseTrustedPasswordlessIdentity({
        provider: 'magic-link',
        subject: 'subject-1',
        email: 'founder@example.com',
        emailVerified: true,
        role: 'OWNER',
        organizationId: 'org-attacker',
      }),
    ).toThrow();
  });

  it('resolves roles only through persisted identity membership lookup', async () => {
    const adapter = createPasswordlessSessionAdapter({
      sessionForIdentity(identity) {
        expect(identity.provider).toBe('magic-link');
        expect(identity.subject).toBe('subject-1');
        return Promise.resolve(persistedSession);
      },
    });

    await expect(
      adapter.resolve({
        provider: 'magic-link',
        subject: 'subject-1',
        email: 'founder@example.com',
        emailVerified: true,
      }),
    ).resolves.toEqual(persistedSession);
  });

  it('returns null for an unknown trusted identity', async () => {
    const adapter = createPasswordlessSessionAdapter({
      sessionForIdentity() {
        return Promise.resolve(null);
      },
    });

    await expect(
      adapter.resolve({
        provider: 'magic-link',
        subject: 'unknown',
        email: 'unknown@example.com',
        emailVerified: true,
      }),
    ).resolves.toBeNull();
  });
});
