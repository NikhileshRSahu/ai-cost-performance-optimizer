import { describe, expect, it } from 'vitest';
import {
  designPartnerPermissions,
  implementationRecords,
  importRuns,
  jobs,
  ledgerEvents,
  memberships,
  organizations,
  pilotInvoiceRequests,
  rateLimitWindows,
  recommendations,
  telemetryCredentials,
  usageRecords,
  users,
  verificationWindows,
  workloads,
} from '../../src/persistence/schema.js';

describe('persistent workbench schema', () => {
  it('keeps organization ownership explicit on every tenant-owned table', () => {
    for (const table of [
      memberships,
      workloads,
      importRuns,
      usageRecords,
      recommendations,
      telemetryCredentials,
      rateLimitWindows,
      ledgerEvents,
      designPartnerPermissions,
      implementationRecords,
      verificationWindows,
      jobs,
      pilotInvoiceRequests,
    ]) {
      expect(table.organizationId).toBeDefined();
    }
    expect(organizations.id).toBeDefined();
    expect(users.id).toBeDefined();
  });

  it('stores financial and evidence values without floating point columns', () => {
    expect(usageRecords.totalCost.dataType).toBe('string');
    expect(recommendations.netSavingNumerator.dataType).toBe('string');
    expect(recommendations.netSavingDenominator.dataType).toBe('string');
    expect(verificationWindows.netImpactNumerator.dataType).toBe('string');
    expect(verificationWindows.netImpactDenominator.dataType).toBe('string');
  });

  it('keeps append-only ledger evidence fields explicit', () => {
    expect(ledgerEvents.eventId).toBeDefined();
    expect(ledgerEvents.state).toBeDefined();
    expect(ledgerEvents.evidenceRef).toBeDefined();
    expect(ledgerEvents.invalidatesEventId).toBeDefined();
    expect(ledgerEvents.occurredAt).toBeDefined();
  });

  it('supports both provider event IDs and canonical fingerprints for usage dedupe', () => {
    expect(usageRecords.sourceEventId).toBeDefined();
    expect(usageRecords.fingerprint).toBeDefined();
    expect(usageRecords.source).toBeDefined();
  });
});
