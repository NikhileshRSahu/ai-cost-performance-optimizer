import { and, eq } from 'drizzle-orm';
import { importUsageCsv } from '../ingestion/import.js';
import type { PersistenceDatabase } from '../persistence/database.js';
import { importRuns, usageRecords } from '../persistence/schema.js';
import { requireOrganizationAccess } from '../persistence/tenant.js';
import type { ImportIssue } from '../usage/contracts.js';
import type { AuthenticatedSession } from './authz.js';

export type ImportCustomerUsageStatus = 'COMPLETED' | 'PARTIAL' | 'FAILED';

export type ImportCustomerUsageResult = Readonly<{
  importId: string;
  fileName: string;
  status: ImportCustomerUsageStatus;
  accepted: number;
  skippedDuplicates: number;
  rejected: number;
  warnings: number;
  blocked: boolean;
  partial: boolean;
  reused: boolean;
  effectiveInterval: Readonly<{ start: string; end: string }> | null;
  issues: readonly ImportIssue[];
}>;

function importId(checksum: string): string {
  return `import-${checksum.slice(0, 24)}`;
}

function statusFor(input: {
  blocked: boolean;
  partial: boolean;
}): ImportCustomerUsageStatus {
  if (input.blocked) return 'FAILED';
  return input.partial ? 'PARTIAL' : 'COMPLETED';
}

function persistedStatus(
  status: typeof importRuns.$inferSelect.status,
): ImportCustomerUsageStatus {
  if (status === 'RECEIVED') {
    throw new Error('IMPORT_STILL_PROCESSING');
  }
  return status;
}

export async function importCustomerUsage(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    fileName: string;
    bytes: Uint8Array;
    isDemo: boolean;
    receivedAt: string;
  }>,
): Promise<ImportCustomerUsageResult> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'IMPORT',
  });

  const parsed = importUsageCsv({
    bytes: input.bytes,
    organizationId: input.organizationId,
    receivedAt: input.receivedAt,
    isDemo: input.isDemo,
  });
  const id = importId(parsed.run.checksum);

  const existing = (
    await input.db
      .select()
      .from(importRuns)
      .where(
        and(
          eq(importRuns.organizationId, input.organizationId),
          eq(importRuns.checksum, parsed.run.checksum),
        ),
      )
      .limit(1)
  ).at(0);

  if (existing !== undefined) {
    return Object.freeze({
      importId: existing.id,
      fileName: input.fileName,
      status: persistedStatus(existing.status),
      accepted: existing.acceptedRows,
      skippedDuplicates: existing.skippedRows,
      rejected: existing.rejectedRows,
      warnings: existing.warningCount,
      blocked: existing.status === 'FAILED',
      partial: existing.status === 'PARTIAL',
      reused: true,
      effectiveInterval:
        existing.rangeStart === null || existing.rangeEnd === null
          ? null
          : Object.freeze({
              start: existing.rangeStart,
              end: existing.rangeEnd,
            }),
      issues: Object.freeze([]),
    });
  }

  const status = statusFor(parsed.run);

  await input.db.transaction(async (tx) => {
    await tx.insert(importRuns).values({
      id,
      organizationId: input.organizationId,
      source: input.isDemo ? 'DEMO' : 'CSV',
      checksum: parsed.run.checksum,
      status,
      rangeStart: parsed.run.effectiveInterval?.start ?? null,
      rangeEnd: parsed.run.effectiveInterval?.end ?? null,
      receivedAt: input.receivedAt,
      acceptedRows: parsed.run.accepted,
      skippedRows: parsed.run.skippedDuplicates,
      rejectedRows: parsed.run.rejected,
      warningCount: parsed.run.warnings,
      safeErrorCategory: parsed.run.blocked ? 'ALL_ROWS_REJECTED' : null,
      isDemo: input.isDemo,
    });

    if (parsed.records.length > 0) {
      await tx.insert(usageRecords).values(
        parsed.records.map((record) => ({
          id: record.fingerprint,
          organizationId: input.organizationId,
          importRunId: id,
          source: record.source,
          sourceEventId: record.sourceEventId,
          fingerprint: record.fingerprint,
          workloadId: null,
          provider: record.provider,
          model: record.model,
          granularity: record.granularity,
          intervalStart: record.intervalStart,
          intervalEnd: record.intervalEnd,
          requests: record.requests,
          totalCost: record.totalCost,
          currency: record.currency,
          canonical: { ...record },
          isDemo: record.isDemo,
        })),
      );
    }
  });

  return Object.freeze({
    importId: id,
    fileName: input.fileName,
    status,
    accepted: parsed.run.accepted,
    skippedDuplicates: parsed.run.skippedDuplicates,
    rejected: parsed.run.rejected,
    warnings: parsed.run.warnings,
    blocked: parsed.run.blocked,
    partial: parsed.run.partial,
    reused: false,
    effectiveInterval: parsed.run.effectiveInterval,
    issues: parsed.run.issues,
  });
}
