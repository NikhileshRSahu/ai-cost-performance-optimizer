import { and, eq } from 'drizzle-orm';
import type { AuthenticatedSession } from '../../workbench/authz.js';
import type { PersistenceDatabase } from '../database.js';
import { jobs } from '../schema.js';
import { requireOrganizationAccess } from '../tenant.js';

export type PersistedJob = Readonly<{
  id: string;
  organizationId: string;
  kind: string;
}>;

const safeErrorCategoryPattern = /^[A-Z][A-Z0-9_]{2,63}$/;

function requireSafeErrorCategory(value: string): void {
  if (!safeErrorCategoryPattern.test(value)) {
    throw new Error('UNSAFE_ERROR_CATEGORY');
  }
}

export function createJobRepository(db: PersistenceDatabase) {
  return Object.freeze({
    async create(
      session: AuthenticatedSession,
      job: PersistedJob,
    ): Promise<void> {
      requireOrganizationAccess({
        session,
        organizationId: job.organizationId,
        action: 'BENCHMARK',
      });
      await db.insert(jobs).values({
        ...job,
        status: 'PENDING',
      });
    },

    async markSucceeded(
      session: AuthenticatedSession,
      organizationId: string,
      jobId: string,
      cursor: string | null,
    ): Promise<void> {
      requireOrganizationAccess({
        session,
        organizationId,
        action: 'BENCHMARK',
      });
      await db
        .update(jobs)
        .set({
          status: 'SUCCEEDED',
          cursor,
          safeErrorCategory: null,
          completedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(jobs.organizationId, organizationId),
            eq(jobs.id, jobId),
          ),
        );
    },

    async markFailed(
      session: AuthenticatedSession,
      organizationId: string,
      jobId: string,
      safeErrorCategory: string,
    ): Promise<void> {
      requireSafeErrorCategory(safeErrorCategory);
      requireOrganizationAccess({
        session,
        organizationId,
        action: 'BENCHMARK',
      });
      await db
        .update(jobs)
        .set({
          status: 'FAILED',
          safeErrorCategory,
          completedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(jobs.organizationId, organizationId),
            eq(jobs.id, jobId),
          ),
        );
    },

    async get(
      session: AuthenticatedSession,
      organizationId: string,
      jobId: string,
    ) {
      requireOrganizationAccess({
        session,
        organizationId,
        action: 'READ',
      });
      const [row] = await db
        .select()
        .from(jobs)
        .where(
          and(
            eq(jobs.organizationId, organizationId),
            eq(jobs.id, jobId),
          ),
        )
        .limit(1);
      return row ?? null;
    },
  });
}
