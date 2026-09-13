import { and, eq } from 'drizzle-orm';
import type { TrustedPasswordlessIdentity } from '../../auth/contracts.js';
import type { AuthenticatedSession } from '../../workbench/authz.js';
import type { PersistenceDatabase } from '../database.js';
import { memberships, users } from '../schema.js';
import { requireOrganizationAccess } from '../tenant.js';

export function createMembershipRepository(db: PersistenceDatabase) {
  return Object.freeze({
    async sessionForIdentity(
      identity: TrustedPasswordlessIdentity,
    ): Promise<AuthenticatedSession | null> {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.authProvider, identity.provider),
            eq(users.authSubject, identity.subject),
          ),
        )
        .limit(1);

      if (user === undefined) return null;

      const rows = await db
        .select({
          organizationId: memberships.organizationId,
          role: memberships.role,
        })
        .from(memberships)
        .where(eq(memberships.userId, user.id))
        .orderBy(memberships.organizationId);

      return Object.freeze({
        userId: user.id,
        memberships: Object.freeze(
          rows.map((row) =>
            Object.freeze({
              organizationId: row.organizationId,
              role: row.role,
            }),
          ),
        ),
      });
    },

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
