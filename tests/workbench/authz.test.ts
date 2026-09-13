import { describe, expect, it } from 'vitest';
import {
  authorize,
  type AuthenticatedSession,
} from '../../src/workbench/authz.js';

const session: AuthenticatedSession = {
  userId: 'user-1',
  memberships: [
    { organizationId: 'org-owner', role: 'OWNER' },
    { organizationId: 'org-operator', role: 'OPERATOR' },
    { organizationId: 'org-viewer', role: 'VIEWER' },
  ],
};

describe('session-derived authorization', () => {
  it('keeps viewers read-only', () => {
    expect(authorize(session, 'org-viewer', 'READ').allowed).toBe(true);
    expect(authorize(session, 'org-viewer', 'IMPORT').allowed).toBe(false);
    expect(authorize(session, 'org-viewer', 'MARK_IMPLEMENTED').allowed).toBe(
      false,
    );
  });

  it('lets operators execute workbench evidence actions but not owner administration', () => {
    for (const action of [
      'READ',
      'IMPORT',
      'BENCHMARK',
      'PREPARE_GUIDE',
      'MARK_IMPLEMENTED',
      'SUBMIT_VERIFICATION',
    ] as const) {
      expect(authorize(session, 'org-operator', action).allowed).toBe(true);
    }
    expect(
      authorize(session, 'org-operator', 'MANAGE_MEMBERSHIP').allowed,
    ).toBe(false);
    expect(
      authorize(session, 'org-operator', 'MANAGE_CREDENTIAL_REFERENCE').allowed,
    ).toBe(false);
  });

  it('lets owners perform every action', () => {
    expect(authorize(session, 'org-owner', 'MANAGE_MEMBERSHIP')).toEqual({
      allowed: true,
      role: 'OWNER',
      reason: null,
    });
    expect(
      authorize(session, 'org-owner', 'MANAGE_CREDENTIAL_REFERENCE').allowed,
    ).toBe(true);
  });

  it('denies cross-tenant requests when the authenticated session has no membership', () => {
    expect(authorize(session, 'org-other', 'READ')).toEqual({
      allowed: false,
      role: null,
      reason: 'ORGANIZATION_MEMBERSHIP_REQUIRED',
    });
  });
});
