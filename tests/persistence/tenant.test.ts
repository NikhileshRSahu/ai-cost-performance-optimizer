import { describe, expect, it } from 'vitest';
import { requireOrganizationAccess } from '../../src/persistence/tenant.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';

const session: AuthenticatedSession = {
  userId: 'user-1',
  memberships: [
    { organizationId: 'org-a', role: 'OPERATOR' },
    { organizationId: 'org-view', role: 'VIEWER' },
  ],
};

describe('tenant persistence guard', () => {
  it('allows actions granted by the authenticated membership', () => {
    expect(
      requireOrganizationAccess({
        session,
        organizationId: 'org-a',
        action: 'IMPORT',
      }),
    ).toMatchObject({
      allowed: true,
      organizationId: 'org-a',
      role: 'OPERATOR',
    });
  });

  it('rejects cross-tenant access even when the caller supplies an organization id', () => {
    expect(() =>
      requireOrganizationAccess({
        session,
        organizationId: 'org-b',
        action: 'READ',
      }),
    ).toThrow('ORGANIZATION_MEMBERSHIP_REQUIRED');
  });

  it('keeps viewer persistence access read-only', () => {
    expect(
      requireOrganizationAccess({
        session,
        organizationId: 'org-view',
        action: 'READ',
      }).allowed,
    ).toBe(true);
    expect(() =>
      requireOrganizationAccess({
        session,
        organizationId: 'org-view',
        action: 'IMPORT',
      }),
    ).toThrow('ACTION_NOT_ALLOWED');
  });
});
