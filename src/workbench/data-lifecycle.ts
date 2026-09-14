import { eq } from 'drizzle-orm';
import type { PersistenceDatabase } from '../persistence/database.js';
import {
  implementationRecords,
  importRuns,
  jobs,
  pilotInvoiceRequests,
  ledgerEvents,
  recommendations,
  usageRecords,
  verificationWindows,
  workloads,
} from '../persistence/schema.js';
import { requireOrganizationAccess } from '../persistence/tenant.js';
import type { AuthenticatedSession } from './authz.js';

export type PurgeOrganizationEvidenceResult = Readonly<{
  organizationId: string;
  purged: true;
  retained: readonly ['organization', 'memberships', 'users'];
}>;

export async function purgeOrganizationEvidence(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    confirmationOrganizationId: string;
  }>,
): Promise<PurgeOrganizationEvidenceResult> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'DELETE_DATA',
  });

  if (input.confirmationOrganizationId !== input.organizationId) {
    throw new Error('DATA_DELETION_CONFIRMATION_MISMATCH');
  }

  await input.db.transaction(async (tx) => {
    await tx
      .delete(verificationWindows)
      .where(eq(verificationWindows.organizationId, input.organizationId));
    await tx
      .delete(implementationRecords)
      .where(eq(implementationRecords.organizationId, input.organizationId));
    await tx
      .delete(ledgerEvents)
      .where(eq(ledgerEvents.organizationId, input.organizationId));
    await tx
      .delete(recommendations)
      .where(eq(recommendations.organizationId, input.organizationId));
    await tx
      .delete(usageRecords)
      .where(eq(usageRecords.organizationId, input.organizationId));
    await tx
      .delete(importRuns)
      .where(eq(importRuns.organizationId, input.organizationId));
    await tx.delete(jobs).where(eq(jobs.organizationId, input.organizationId));
    await tx
      .delete(pilotInvoiceRequests)
      .where(eq(pilotInvoiceRequests.organizationId, input.organizationId));
    await tx
      .delete(workloads)
      .where(eq(workloads.organizationId, input.organizationId));
  });

  return Object.freeze({
    organizationId: input.organizationId,
    purged: true,
    retained: Object.freeze(['organization', 'memberships', 'users'] as const),
  });
}
