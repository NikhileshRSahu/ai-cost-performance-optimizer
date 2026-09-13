import { describe, expect, it } from 'vitest';
import { authorize } from '../../src/workbench/authz.js';

describe('organization data export authorization', () => {
  it('allows only owners to export complete organization evidence', () => {
    const owner = {
      userId: 'owner',
      memberships: [{ organizationId: 'org-1', role: 'OWNER' as const }],
    };
    const operator = {
      userId: 'operator',
      memberships: [{ organizationId: 'org-1', role: 'OPERATOR' as const }],
    };

    expect(authorize(owner, 'org-1', 'EXPORT_DATA').allowed).toBe(true);
    expect(authorize(operator, 'org-1', 'EXPORT_DATA').allowed).toBe(false);
  });
});
