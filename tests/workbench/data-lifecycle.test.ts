import { describe, expect, it } from 'vitest';
import { authorize } from '../../src/workbench/authz.js';

describe('customer evidence deletion authorization', () => {
  it('allows only an organization owner to delete customer evidence', () => {
    const owner = {
      userId: 'owner',
      memberships: [{ organizationId: 'org-1', role: 'OWNER' as const }],
    };
    const operator = {
      userId: 'operator',
      memberships: [{ organizationId: 'org-1', role: 'OPERATOR' as const }],
    };
    const viewer = {
      userId: 'viewer',
      memberships: [{ organizationId: 'org-1', role: 'VIEWER' as const }],
    };

    expect(authorize(owner, 'org-1', 'DELETE_DATA').allowed).toBe(true);
    expect(authorize(operator, 'org-1', 'DELETE_DATA').allowed).toBe(false);
    expect(authorize(viewer, 'org-1', 'DELETE_DATA').allowed).toBe(false);
  });
});
