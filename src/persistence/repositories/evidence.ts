import { and, asc, eq } from 'drizzle-orm';
import { appendState, type LedgerEvent } from '../../ledger/ledger.js';
import type { ImplementationRecord } from '../../implementation/records.js';
import type { AuthenticatedSession } from '../../workbench/authz.js';
import type { PersistenceDatabase } from '../database.js';
import {
  implementationRecords,
  ledgerEvents,
  verificationWindows,
} from '../schema.js';
import { requireOrganizationAccess } from '../tenant.js';

export type PersistedVerificationWindow = Readonly<{
  id: string;
  organizationId: string;
  recommendationId: string;
  status: string;
  baselineStart: string;
  baselineEnd: string;
  postStart: string;
  postEnd: string;
  netImpactNumerator: string | null;
  netImpactDenominator: string | null;
  formulaVersion: string | null;
  evidence: Record<string, unknown>;
}>;

function toLedgerEvent(row: typeof ledgerEvents.$inferSelect): LedgerEvent {
  return Object.freeze({
    id: row.eventId,
    recommendationId: row.recommendationId,
    organizationId: row.organizationId,
    type: row.type,
    state: row.state,
    occurredAt: row.occurredAt,
    evidenceRef: row.evidenceRef,
    reason: row.reason,
    invalidatesEventId: row.invalidatesEventId,
  });
}

export function createEvidenceRepository(db: PersistenceDatabase) {
  return Object.freeze({
    async appendLedgerEvent(
      session: AuthenticatedSession,
      event: LedgerEvent,
    ): Promise<void> {
      requireOrganizationAccess({
        session,
        organizationId: event.organizationId,
        action: 'BENCHMARK',
      });

      const existingRows = await db
        .select()
        .from(ledgerEvents)
        .where(
          and(
            eq(ledgerEvents.organizationId, event.organizationId),
            eq(ledgerEvents.recommendationId, event.recommendationId),
          ),
        )
        .orderBy(asc(ledgerEvents.occurredAt), asc(ledgerEvents.eventId));
      const history = existingRows.map(toLedgerEvent);
      appendState({ history, event });

      await db.insert(ledgerEvents).values({
        eventId: event.id,
        recommendationId: event.recommendationId,
        organizationId: event.organizationId,
        type: event.type,
        state: event.state,
        occurredAt: event.occurredAt,
        evidenceRef: event.evidenceRef,
        reason: event.reason,
        invalidatesEventId: event.invalidatesEventId,
      });
    },

    async listLedgerEvents(
      session: AuthenticatedSession,
      organizationId: string,
      recommendationId: string,
    ): Promise<readonly LedgerEvent[]> {
      requireOrganizationAccess({
        session,
        organizationId,
        action: 'READ',
      });
      const rows = await db
        .select()
        .from(ledgerEvents)
        .where(
          and(
            eq(ledgerEvents.organizationId, organizationId),
            eq(ledgerEvents.recommendationId, recommendationId),
          ),
        )
        .orderBy(asc(ledgerEvents.occurredAt), asc(ledgerEvents.eventId));
      return Object.freeze(rows.map(toLedgerEvent));
    },

    async saveImplementation(
      session: AuthenticatedSession,
      record: ImplementationRecord,
    ): Promise<void> {
      requireOrganizationAccess({
        session,
        organizationId: record.organizationId,
        action: 'MARK_IMPLEMENTED',
      });
      await db.insert(implementationRecords).values({
        recommendationId: record.recommendationId,
        organizationId: record.organizationId,
        implementedAt: record.implementedAt,
        rolloutStart: record.rolloutStart,
        stabilizationEnd: record.stabilizationEnd,
        deploymentNote: record.deploymentNote,
        rollbackInstructions: record.rollbackInstructions,
        confirmedByUserId: record.confirmedByUserId,
      });
    },

    async saveVerification(
      session: AuthenticatedSession,
      input: PersistedVerificationWindow,
    ): Promise<void> {
      requireOrganizationAccess({
        session,
        organizationId: input.organizationId,
        action: 'SUBMIT_VERIFICATION',
      });
      await db.insert(verificationWindows).values(input);
    },
  });
}
