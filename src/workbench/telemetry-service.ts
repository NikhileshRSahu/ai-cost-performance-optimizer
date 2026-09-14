import { and, eq, inArray } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import type { ProductionTelemetryBatch } from '../efficiency/telemetry-contracts.js';
import { telemetryEventToUsageRecord } from '../efficiency/telemetry-normalizer.js';
import type { PersistenceDatabase } from '../persistence/database.js';
import { importRuns, usageRecords } from '../persistence/schema.js';
import { requireOrganizationAccess } from '../persistence/tenant.js';
import type { AuthenticatedSession } from './authz.js';

export type TelemetryIngestResult = Readonly<{
  importId: string;
  accepted: number;
  skippedDuplicates: number;
  reusedBatch: boolean;
}>;

function checksum(batch: ProductionTelemetryBatch): string {
  return createHash('sha256').update(JSON.stringify(batch)).digest('hex');
}

function importId(value: string): string {
  return 'telemetry-' + value.slice(0, 24);
}

function assertUniqueEventIds(batch: ProductionTelemetryBatch): void {
  const seen = new Set<string>();
  for (const event of batch.events) {
    if (seen.has(event.eventId)) {
      throw new Error('DUPLICATE_TELEMETRY_EVENT_ID');
    }
    seen.add(event.eventId);
  }
}

export async function ingestProductionTelemetry(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    batch: ProductionTelemetryBatch;
    receivedAt: string;
    isDemo: boolean;
  }>,
): Promise<TelemetryIngestResult> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'IMPORT',
  });
  assertUniqueEventIds(input.batch);

  const batchChecksum = checksum(input.batch);
  const id = importId(batchChecksum);

  const existingBatch = (
    await input.db
      .select()
      .from(importRuns)
      .where(
        and(
          eq(importRuns.organizationId, input.organizationId),
          eq(importRuns.checksum, batchChecksum),
        ),
      )
      .limit(1)
  ).at(0);

  if (existingBatch !== undefined) {
    return Object.freeze({
      importId: existingBatch.id,
      accepted: existingBatch.acceptedRows,
      skippedDuplicates: existingBatch.skippedRows,
      reusedBatch: true,
    });
  }

  const sourceEventIds = input.batch.events.map((event) => event.eventId);
  const existingEvents =
    sourceEventIds.length === 0
      ? []
      : await input.db
          .select({ sourceEventId: usageRecords.sourceEventId })
          .from(usageRecords)
          .where(
            and(
              eq(usageRecords.organizationId, input.organizationId),
              eq(usageRecords.source, 'PRODUCTION_TELEMETRY'),
              inArray(usageRecords.sourceEventId, sourceEventIds),
            ),
          );

  const existingIds = new Set(
    existingEvents
      .map((row) => row.sourceEventId)
      .filter((value): value is string => value !== null),
  );
  const acceptedEvents = input.batch.events.filter(
    (event) => !existingIds.has(event.eventId),
  );
  const records = acceptedEvents.map((event, index) =>
    telemetryEventToUsageRecord({
      organizationId: input.organizationId,
      event,
      sourceLine: index + 1,
      isDemo: input.isDemo,
    }),
  );

  const timestamps = input.batch.events
    .map((event) => event.occurredAt)
    .sort((left, right) => left.localeCompare(right));
  const rangeStart = timestamps.at(0) ?? null;
  const rangeEnd = timestamps.at(-1) ?? null;

  await input.db.transaction(async (tx) => {
    await tx.insert(importRuns).values({
      id,
      organizationId: input.organizationId,
      source: 'PRODUCTION_TELEMETRY',
      checksum: batchChecksum,
      status: 'COMPLETED',
      rangeStart,
      rangeEnd,
      receivedAt: input.receivedAt,
      acceptedRows: records.length,
      skippedRows: input.batch.events.length - records.length,
      rejectedRows: 0,
      warningCount: 0,
      safeErrorCategory: null,
      isDemo: input.isDemo,
    });

    if (records.length > 0) {
      await tx.insert(usageRecords).values(
        records.map((record) => ({
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
    accepted: records.length,
    skippedDuplicates: input.batch.events.length - records.length,
    reusedBatch: false,
  });
}
