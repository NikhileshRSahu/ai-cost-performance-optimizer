import { and, desc, eq } from 'drizzle-orm';
import type { AuthenticatedSession } from '../../workbench/authz.js';
import type { PersistenceDatabase } from '../database.js';
import { importRuns } from '../schema.js';
import { requireOrganizationAccess } from '../tenant.js';

export type PersistedImportRun = Readonly<{
  id: string;
  organizationId: string;
  source: string;
  checksum: string;
  status: 'RECEIVED' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  safeErrorCategory: string | null;
}>;

export function createImportRepository(db: PersistenceDatabase) {
  return Object.freeze({
    async create(
      session: AuthenticatedSession,
      input: PersistedImportRun,
    ): Promise<void> {
      requireOrganizationAccess({
        session,
        organizationId: input.organizationId,
        action: 'IMPORT',
      });
      await db.insert(importRuns).values(input);
    },

    async lastSuccessful(
      session: AuthenticatedSession,
      organizationId: string,
      source: string,
    ) {
      requireOrganizationAccess({
        session,
        organizationId,
        action: 'READ',
      });
      const [row] = await db
        .select()
        .from(importRuns)
        .where(
          and(
            eq(importRuns.organizationId, organizationId),
            eq(importRuns.source, source),
            eq(importRuns.status, 'COMPLETED'),
          ),
        )
        .orderBy(desc(importRuns.receivedAt))
        .limit(1);
      return row ?? null;
    },
  });
}
