import { and, count, eq, lt } from 'drizzle-orm';
import type { PersistenceDatabase } from '../persistence/database.js';
import {
  importRuns,
  jobs,
  organizations,
  usageRecords,
} from '../persistence/schema.js';
import { requireOrganizationAccess } from '../persistence/tenant.js';
import type { AuthenticatedSession } from './authz.js';

export type RetentionPreview = Readonly<{
  enabled: boolean;
  retentionDays: number | null;
  cutoff: string | null;
  usageRecords: number;
  importRuns: number;
  jobs: number;
  totalRawEvidenceRows: number;
  lastEnforcedAt: string | null;
}>;

export type RetentionEnforcementResult = Readonly<{
  cutoff: string;
  deletedUsageRecords: number;
  deletedImportRuns: number;
  deletedJobs: number;
  lastEnforcedAt: string;
}>;

function validateRetentionDays(value: number | null): void {
  if (value === null) return;
  if (!Number.isSafeInteger(value) || value < 30 || value > 3650) {
    throw new Error('INVALID_RETENTION_DAYS');
  }
}

function cutoffIso(now: string, retentionDays: number): string {
  const instant = new Date(now);
  if (Number.isNaN(instant.getTime())) throw new Error('INVALID_RETENTION_NOW');
  instant.setUTCDate(instant.getUTCDate() - retentionDays);
  return instant.toISOString();
}

async function loadOrganization(
  db: PersistenceDatabase,
  organizationId: string,
) {
  const organization = (
    await db
      .select({
        id: organizations.id,
        retentionDays: organizations.retentionDays,
        retentionLastEnforcedAt: organizations.retentionLastEnforcedAt,
      })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)
  ).at(0);
  if (organization === undefined) throw new Error('ORGANIZATION_NOT_FOUND');
  return organization;
}

export async function setRetentionPolicy(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    retentionDays: number | null;
  }>,
): Promise<Readonly<{ retentionDays: number | null }>> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'MANAGE_RETENTION',
  });
  validateRetentionDays(input.retentionDays);

  const updated = (
    await input.db
      .update(organizations)
      .set({ retentionDays: input.retentionDays })
      .where(eq(organizations.id, input.organizationId))
      .returning({ retentionDays: organizations.retentionDays })
  ).at(0);
  if (updated === undefined) throw new Error('ORGANIZATION_NOT_FOUND');
  return Object.freeze(updated);
}

export async function previewRetention(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    now: string;
  }>,
): Promise<RetentionPreview> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'MANAGE_RETENTION',
  });
  const organization = await loadOrganization(input.db, input.organizationId);
  if (organization.retentionDays === null) {
    return Object.freeze({
      enabled: false,
      retentionDays: null,
      cutoff: null,
      usageRecords: 0,
      importRuns: 0,
      jobs: 0,
      totalRawEvidenceRows: 0,
      lastEnforcedAt: organization.retentionLastEnforcedAt,
    });
  }

  const cutoff = cutoffIso(input.now, organization.retentionDays);
  const [usageCount, importCount, jobCount] = await Promise.all([
    input.db
      .select({ value: count() })
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.organizationId, input.organizationId),
          lt(usageRecords.intervalEnd, cutoff),
        ),
      ),
    input.db
      .select({ value: count() })
      .from(importRuns)
      .where(
        and(
          eq(importRuns.organizationId, input.organizationId),
          lt(importRuns.receivedAt, cutoff),
        ),
      ),
    input.db
      .select({ value: count() })
      .from(jobs)
      .where(
        and(
          eq(jobs.organizationId, input.organizationId),
          lt(jobs.createdAt, cutoff),
        ),
      ),
  ]);

  const usage = usageCount[0]?.value ?? 0;
  const imports = importCount[0]?.value ?? 0;
  const backgroundJobs = jobCount[0]?.value ?? 0;
  return Object.freeze({
    enabled: true,
    retentionDays: organization.retentionDays,
    cutoff,
    usageRecords: usage,
    importRuns: imports,
    jobs: backgroundJobs,
    totalRawEvidenceRows: usage + imports + backgroundJobs,
    lastEnforcedAt: organization.retentionLastEnforcedAt,
  });
}

export async function enforceRetention(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    now: string;
  }>,
): Promise<RetentionEnforcementResult> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'MANAGE_RETENTION',
  });
  const organization = await loadOrganization(input.db, input.organizationId);
  if (organization.retentionDays === null) {
    throw new Error('RETENTION_POLICY_DISABLED');
  }

  const cutoff = cutoffIso(input.now, organization.retentionDays);
  const result = await input.db.transaction(async (tx) => {
    const deletedUsage = await tx
      .delete(usageRecords)
      .where(
        and(
          eq(usageRecords.organizationId, input.organizationId),
          lt(usageRecords.intervalEnd, cutoff),
        ),
      )
      .returning({ id: usageRecords.id });
    const deletedImports = await tx
      .delete(importRuns)
      .where(
        and(
          eq(importRuns.organizationId, input.organizationId),
          lt(importRuns.receivedAt, cutoff),
        ),
      )
      .returning({ id: importRuns.id });
    const deletedJobs = await tx
      .delete(jobs)
      .where(
        and(
          eq(jobs.organizationId, input.organizationId),
          lt(jobs.createdAt, cutoff),
        ),
      )
      .returning({ id: jobs.id });

    await tx
      .update(organizations)
      .set({ retentionLastEnforcedAt: input.now })
      .where(eq(organizations.id, input.organizationId));

    return {
      deletedUsageRecords: deletedUsage.length,
      deletedImportRuns: deletedImports.length,
      deletedJobs: deletedJobs.length,
    };
  });

  return Object.freeze({
    cutoff,
    ...result,
    lastEnforcedAt: input.now,
  });
}
