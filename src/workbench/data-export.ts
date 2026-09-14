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

export type OrganizationEvidenceExport = Readonly<{
  schemaVersion: 'organization-evidence-export-v1';
  exportedAt: string;
  organizationId: string;
  data: Readonly<{
    workloads: readonly unknown[];
    importRuns: readonly unknown[];
    usageRecords: readonly unknown[];
    recommendations: readonly unknown[];
    ledgerEvents: readonly unknown[];
    implementationRecords: readonly unknown[];
    verificationWindows: readonly unknown[];
    jobs: readonly unknown[];
    pilotInvoiceRequests: readonly unknown[];
  }>;
}>;

export async function exportOrganizationEvidence(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    exportedAt: string;
  }>,
): Promise<OrganizationEvidenceExport> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'EXPORT_DATA',
  });

  const [
    workloadRows,
    importRows,
    usageRows,
    recommendationRows,
    ledgerRows,
    implementationRows,
    verificationRows,
    jobRows,
    pilotInvoiceRows,
  ] = await Promise.all([
    input.db
      .select()
      .from(workloads)
      .where(eq(workloads.organizationId, input.organizationId)),
    input.db
      .select()
      .from(importRuns)
      .where(eq(importRuns.organizationId, input.organizationId)),
    input.db
      .select()
      .from(usageRecords)
      .where(eq(usageRecords.organizationId, input.organizationId)),
    input.db
      .select()
      .from(recommendations)
      .where(eq(recommendations.organizationId, input.organizationId)),
    input.db
      .select()
      .from(ledgerEvents)
      .where(eq(ledgerEvents.organizationId, input.organizationId)),
    input.db
      .select()
      .from(implementationRecords)
      .where(eq(implementationRecords.organizationId, input.organizationId)),
    input.db
      .select()
      .from(verificationWindows)
      .where(eq(verificationWindows.organizationId, input.organizationId)),
    input.db
      .select()
      .from(jobs)
      .where(eq(jobs.organizationId, input.organizationId)),
    input.db
      .select()
      .from(pilotInvoiceRequests)
      .where(eq(pilotInvoiceRequests.organizationId, input.organizationId)),
  ]);

  return Object.freeze({
    schemaVersion: 'organization-evidence-export-v1',
    exportedAt: input.exportedAt,
    organizationId: input.organizationId,
    data: Object.freeze({
      workloads: Object.freeze(workloadRows),
      importRuns: Object.freeze(importRows),
      usageRecords: Object.freeze(usageRows),
      recommendations: Object.freeze(recommendationRows),
      ledgerEvents: Object.freeze(ledgerRows),
      implementationRecords: Object.freeze(implementationRows),
      verificationWindows: Object.freeze(verificationRows),
      jobs: Object.freeze(jobRows),
      pilotInvoiceRequests: Object.freeze(pilotInvoiceRows),
    }),
  });
}
