import { eq } from 'drizzle-orm';
import type { AuthenticatedSession } from '../../workbench/authz.js';
import type { PersistenceDatabase } from '../database.js';
import { memberships } from '../schema.js';
import { requireOrganizationAccess } from '../tenant.js';

export function createMembershipRepository(db: PersistenceDatabase) {
  return Object.freeze({
    async listForOrganization(
      session: AuthenticatedSession,
      organizationId: string,
    ) {
      requireOrganizationAccess({
        session,
        organizationId,
        action: 'READ',
      });
      return db
        .select()
        .from(memberships)
        .where(eq(memberships.organizationId, organizationId));
    },
  });
}
