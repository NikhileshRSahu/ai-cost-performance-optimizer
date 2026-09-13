import { createHash } from 'node:crypto';
import { and, desc, eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { summarizeCoverage } from '../coverage/coverage.js';
import {
  add,
  formatDecimal,
  parseDecimal,
  rational,
} from '../economics/exact.js';
import type { PersistenceDatabase } from '../persistence/database.js';
import { createEvidenceRepository } from '../persistence/repositories/evidence.js';
import {
  implementationRecords,
  importRuns,
  organizations,
  recommendations,
  usageRecords,
  verificationWindows,
  workloads,
} from '../persistence/schema.js';
import { requireOrganizationAccess } from '../persistence/tenant.js';
import { verifyPostChange } from '../verification/verify.js';
import type { VerificationResult } from '../verification/contracts.js';
import type { AuthenticatedSession } from './authz.js';
import { importCustomerUsage } from './import-service.js';

const constraintSchema = z
  .object({
    requiredQuality: z.string(),
    maxP95LatencyMs: z.string().nullable(),
    maxFailureRate: z.string().nullable(),
    version: z.literal('constraints-v1'),
  })
  .strict();

type AggregateWindow = Readonly<{
  cost: string;
  requests: string;
  currency: string;
  start: string;
  end: string;
  completeDays: readonly string[];
  configurationVersion: string;
}>;

function canonicalString(
  canonical: Record<string, unknown>,
  key: string,
): string | null {
  const value = canonical[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function aggregateWindow(
  rows: readonly (typeof usageRecords.$inferSelect)[],
  workloadName: string,
  timezone: string,
): AggregateWindow {
  const matching = rows.filter(
    (row) => canonicalString(row.canonical, 'workload') === workloadName,
  );
  if (matching.length === 0) throw new Error('WORKLOAD_USAGE_NOT_FOUND');

  const currencies = new Set(matching.map((row) => row.currency));
  if (currencies.size !== 1) throw new Error('MIXED_CURRENCY_WINDOW');
  const currency = matching[0]?.currency;
  if (currency === undefined) throw new Error('WINDOW_CURRENCY_REQUIRED');

  let totalCost = rational(0n);
  let requests = 0n;
  let start = matching[0]?.intervalStart;
  let end = matching[0]?.intervalEnd;
  const configurations = new Set<string>();

  for (const row of matching) {
    if (row.totalCost === null) throw new Error('WINDOW_COST_REQUIRED');
    totalCost = add(totalCost, parseDecimal(row.totalCost));
    requests += BigInt(row.requests);
    if (
      start === undefined ||
      Date.parse(row.intervalStart) < Date.parse(start)
    ) {
      start = row.intervalStart;
    }
    if (end === undefined || Date.parse(row.intervalEnd) > Date.parse(end)) {
      end = row.intervalEnd;
    }
    const configuration =
      canonicalString(row.canonical, 'configurationId') ?? row.model;
    if (configuration !== null) configurations.add(configuration);
  }

  if (start === undefined || end === undefined) {
    throw new Error('WINDOW_INTERVAL_REQUIRED');
  }
  if (configurations.size !== 1) {
    throw new Error('CONFIGURATION_WINDOW_NOT_STABLE');
  }
  const configurationVersion = [...configurations][0];
  if (configurationVersion === undefined) {
    throw new Error('CONFIGURATION_WINDOW_NOT_STABLE');
  }

  const coverage = summarizeCoverage({
    timezone,
    intervals: matching.map((row) => ({
      start: row.intervalStart,
      end: row.intervalEnd,
      complete: true,
    })),
  });

  return Object.freeze({
    cost: formatDecimal(totalCost, 12),
    requests: requests.toString(),
    currency,
    start,
    end,
    completeDays: coverage.completeDays,
    configurationVersion,
  });
}

function verificationId(
  input: Readonly<{
    organizationId: string;
    recommendationId: string;
    postImportId: string;
    measuredQuality: string;
    postP95LatencyMs: string | null;
    postFailureRate: string | null;
    qualitySourceRef: string;
    implementationCost: string;
    incrementalOperatingCost: string;
    attestations: Readonly<{
      unitDefinitionUnchanged: boolean;
      workloadMixComparable: boolean;
      concurrentDeploymentsResolved: boolean;
    }>;
  }>,
): string {
  const payload = [
    input.organizationId,
    input.recommendationId,
    input.postImportId,
    input.measuredQuality,
    input.postP95LatencyMs ?? '',
    input.postFailureRate ?? '',
    input.qualitySourceRef,
    input.implementationCost,
    input.incrementalOperatingCost,
    String(input.attestations.unitDefinitionUnchanged),
    String(input.attestations.workloadMixComparable),
    String(input.attestations.concurrentDeploymentsResolved),
  ].join('\0');
  const digest = createHash('sha256')
    .update(payload)
    .digest('hex')
    .slice(0, 24);
  return `verify-${digest}`;
}

export async function verifyCustomerChange(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    recommendationId: string;
    postFileName: string;
    postBytes: Uint8Array;
    receivedAt: string;
    measuredQuality: string;
    postP95LatencyMs: string | null;
    postFailureRate: string | null;
    qualitySourceRef: string;
    implementationCost: string;
    incrementalOperatingCost: string;
    attestations: Readonly<{
      unitDefinitionUnchanged: boolean;
      workloadMixComparable: boolean;
      concurrentDeploymentsResolved: boolean;
    }>;
  }>,
): Promise<
  Readonly<{
    verificationId: string;
    result: VerificationResult;
    baselineImportId: string;
    postImportId: string;
  }>
> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'SUBMIT_VERIFICATION',
  });

  const recommendation = (
    await input.db
      .select()
      .from(recommendations)
      .where(
        and(
          eq(recommendations.organizationId, input.organizationId),
          eq(recommendations.id, input.recommendationId),
        ),
      )
      .limit(1)
  ).at(0);
  if (recommendation === undefined) throw new Error('RECOMMENDATION_NOT_FOUND');
  if (recommendation.savingState !== 'TESTED') {
    throw new Error('TESTED_RECOMMENDATION_REQUIRED');
  }

  const implementation = (
    await input.db
      .select()
      .from(implementationRecords)
      .where(
        and(
          eq(implementationRecords.organizationId, input.organizationId),
          eq(implementationRecords.recommendationId, input.recommendationId),
        ),
      )
      .limit(1)
  ).at(0);
  if (implementation === undefined) throw new Error('IMPLEMENTATION_REQUIRED');

  if (recommendation.workloadId === null) throw new Error('WORKLOAD_REQUIRED');
  const workload = (
    await input.db
      .select()
      .from(workloads)
      .where(
        and(
          eq(workloads.organizationId, input.organizationId),
          eq(workloads.id, recommendation.workloadId),
        ),
      )
      .limit(1)
  ).at(0);
  if (workload === undefined) throw new Error('WORKLOAD_NOT_FOUND');
  const constraints = constraintSchema.parse(workload.constraintSet);

  const organization = (
    await input.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, input.organizationId))
      .limit(1)
  ).at(0);
  if (organization === undefined) throw new Error('ORGANIZATION_NOT_FOUND');

  const postImport = await importCustomerUsage({
    db: input.db,
    session: input.session,
    organizationId: input.organizationId,
    fileName: input.postFileName,
    bytes: input.postBytes,
    isDemo: recommendation.isDemo,
    receivedAt: input.receivedAt,
  });
  if (postImport.blocked) throw new Error('POST_IMPORT_BLOCKED');

  const allImports = await input.db
    .select()
    .from(importRuns)
    .where(
      and(
        eq(importRuns.organizationId, input.organizationId),
        or(
          eq(importRuns.status, 'COMPLETED'),
          eq(importRuns.status, 'PARTIAL'),
        ),
      ),
    )
    .orderBy(desc(importRuns.rangeEnd));

  const baselineImport = allImports.find(
    (run) =>
      run.id !== postImport.importId &&
      run.rangeEnd !== null &&
      Date.parse(run.rangeEnd) <= Date.parse(implementation.rolloutStart),
  );
  if (baselineImport === undefined) {
    throw new Error('BASELINE_IMPORT_NOT_FOUND');
  }

  const [baselineRows, postRows] = await Promise.all([
    input.db
      .select()
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.organizationId, input.organizationId),
          eq(usageRecords.importRunId, baselineImport.id),
        ),
      ),
    input.db
      .select()
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.organizationId, input.organizationId),
          eq(usageRecords.importRunId, postImport.importId),
        ),
      ),
  ]);

  const baseline = aggregateWindow(
    baselineRows,
    workload.name,
    organization.timezone,
  );
  const post = aggregateWindow(postRows, workload.name, organization.timezone);

  const result = verifyPostChange({
    implementation: {
      recommendationId: implementation.recommendationId,
      organizationId: implementation.organizationId,
      implementedAt: implementation.implementedAt,
      rolloutStart: implementation.rolloutStart,
      stabilizationEnd: implementation.stabilizationEnd,
      deploymentNote: implementation.deploymentNote,
      rollbackInstructions: implementation.rollbackInstructions,
      confirmedByUserId: implementation.confirmedByUserId,
    },
    baseline: {
      start: baseline.start,
      end: baseline.end,
      completeDays: baseline.completeDays,
      workload: workload.name,
      configurationVersion: baseline.configurationVersion,
      currency: baseline.currency,
      denominator: 'REQUESTS',
      attributionScope: workload.name,
      unitDefinition: 'request-v1',
      successDefinition: null,
      cost: baseline.cost,
      units: baseline.requests,
    },
    post: {
      start: post.start,
      end: post.end,
      completeDays: post.completeDays,
      workload: workload.name,
      configurationVersion: post.configurationVersion,
      currency: post.currency,
      denominator: 'REQUESTS',
      attributionScope: workload.name,
      unitDefinition: 'request-v1',
      successDefinition: null,
      actualCost: post.cost,
      units: post.requests,
      qualityEvidence: {
        measured: input.measuredQuality,
        requiredMinimum: constraints.requiredQuality,
        p95LatencyMs: input.postP95LatencyMs,
        maxP95LatencyMs: constraints.maxP95LatencyMs,
        failureRate: input.postFailureRate,
        maxFailureRate: constraints.maxFailureRate,
        sourceRef: input.qualitySourceRef,
      },
    },
    implementationCostInWindow: input.implementationCost,
    incrementalOperatingCost: input.incrementalOperatingCost,
    attestations: input.attestations,
  });

  const id = verificationId({
    organizationId: input.organizationId,
    recommendationId: input.recommendationId,
    postImportId: postImport.importId,
    measuredQuality: input.measuredQuality,
    postP95LatencyMs: input.postP95LatencyMs,
    postFailureRate: input.postFailureRate,
    qualitySourceRef: input.qualitySourceRef,
    implementationCost: input.implementationCost,
    incrementalOperatingCost: input.incrementalOperatingCost,
    attestations: input.attestations,
  });
  const existing = (
    await input.db
      .select()
      .from(verificationWindows)
      .where(
        and(
          eq(verificationWindows.organizationId, input.organizationId),
          eq(verificationWindows.id, id),
        ),
      )
      .limit(1)
  ).at(0);
  if (existing === undefined) {
    await createEvidenceRepository(input.db).saveVerification(input.session, {
      id,
      organizationId: input.organizationId,
      recommendationId: input.recommendationId,
      status: result.status,
      baselineStart: baseline.start,
      baselineEnd: baseline.end,
      postStart: post.start,
      postEnd: post.end,
      netImpactNumerator: result.netImpact?.numerator ?? null,
      netImpactDenominator: result.netImpact?.denominator ?? null,
      formulaVersion: result.formulaVersion,
      evidence: {
        reasons: result.reasons,
        direction: result.direction,
        baselineImportId: baselineImport.id,
        postImportId: postImport.importId,
        qualitySourceRef: input.qualitySourceRef,
        attestations: input.attestations,
      },
    });
  }

  if (result.status === 'VERIFIED') {
    const evidenceRepository = createEvidenceRepository(input.db);
    await evidenceRepository.appendLedgerEvent(input.session, {
      id: `${input.recommendationId}:verified:${id}`,
      recommendationId: input.recommendationId,
      organizationId: input.organizationId,
      type: 'STATE_RECORDED',
      state: 'VERIFIED',
      occurredAt: input.receivedAt,
      evidenceRef: `verification:${id}`,
      reason: null,
      invalidatesEventId: null,
    });
    await input.db
      .update(recommendations)
      .set({ savingState: 'VERIFIED' })
      .where(
        and(
          eq(recommendations.organizationId, input.organizationId),
          eq(recommendations.id, input.recommendationId),
        ),
      );
  }

  return Object.freeze({
    verificationId: id,
    result,
    baselineImportId: baselineImport.id,
    postImportId: postImport.importId,
  });
}
