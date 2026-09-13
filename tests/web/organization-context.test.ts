import { describe, expect, it } from 'vitest';
import type { PasswordlessSessionAdapter } from '../../src/auth/session-adapter.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';
import {
  requireOrganizationContext,
  resolveWebSession,
} from '../../src/workbench/web-session.js';

const session: AuthenticatedSession = {
  userId: 'founder-1',
  memberships: [
    { organizationId: 'org-owner', role: 'OWNER' },
    { organizationId: 'org-viewer', role: 'VIEWER' },
  ],
};

describe('founder web organization context', () => {
  it('resolves the authenticated session only through the trusted adapter', async () => {
    const adapter: PasswordlessSessionAdapter = {
      async resolve(input: unknown) {
        expect(input).toEqual({ trusted: 'identity' });
        return Promise.resolve(session);
      },
    };

    await expect(
      resolveWebSession(
        () => Promise.resolve({ trusted: 'identity' }),
        adapter,
      ),
    ).resolves.toEqual(session);
  });

  it('returns null when no trusted identity is available', async () => {
    let called = false;
    const adapter: PasswordlessSessionAdapter = {
      async resolve() {
        called = true;
        return Promise.resolve(session);
      },
    };

    await expect(
      resolveWebSession(() => Promise.resolve(null), adapter),
    ).resolves.toBeNull();
    expect(called).toBe(false);
  });

  it('derives the organization role from memberships', () => {
    expect(requireOrganizationContext(session, 'org-viewer')).toEqual({
      organizationId: 'org-viewer',
      role: 'VIEWER',
    });
  });

  it('rejects a URL organization that is not in the authenticated session', () => {
    expect(() => requireOrganizationContext(session, 'org-other')).toThrow(
      'ORGANIZATION_MEMBERSHIP_REQUIRED',
    );
  });
});
