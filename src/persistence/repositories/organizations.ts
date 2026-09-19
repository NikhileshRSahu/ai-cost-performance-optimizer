import { eq } from 'drizzle-orm';
import type { AuthenticatedSession } from '../../workbench/authz.js';
import type { PersistenceDatabase } from '../database.js';
import { organizations } from '../schema.js';
import { requireOrganizationAccess } from '../tenant.js';

export function createOrganizationRepository(db: PersistenceDatabase) {
  return Object.freeze({
    async get(session: AuthenticatedSession, organizationId: string) {
      requireOrganizationAccess({
        session,
        organizationId,
        action: 'READ',
      });
      const [row] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);
      return row ?? null;
    },

    async updateMaterialityTarget(
      session: AuthenticatedSession,
      organizationId: string,
      materialityTarget: string,
    ) {
      requireOrganizationAccess({
        session,
        organizationId,
        action: 'MANAGE_MEMBERSHIP',
      });
      const [row] = await db
        .update(organizations)
        .set({ materialityTarget })
        .where(eq(organizations.id, organizationId))
        .returning();
      return row ?? null;
    },
  });
}
