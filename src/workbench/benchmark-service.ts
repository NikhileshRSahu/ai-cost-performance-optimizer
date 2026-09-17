import { and, desc, eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { parseBenchmarkCsv } from '../benchmarks/csv.js';
import {
  evaluateBenchmark,
  type BenchmarkDecision,
} from '../benchmarks/evaluate.js';
import { formatDecimal, rational } from '../economics/exact.js';
import { createEvidenceRepository } from '../persistence/repositories/evidence.js';
import type { PersistenceDatabase } from '../persistence/database.js';
import {
  importRuns,
  recommendations,
  workloads,
} from '../persistence/schema.js';
import { requireOrganizationAccess } from '../persistence/tenant.js';
import { sha256Bytes } from '../usage/fingerprint.js';
import type { AuthenticatedSession } from './authz.js';

const constraintSetSchema = z
  .object({
    requiredQuality: z.string(),
    maxP95LatencyMs: z.string().nullable(),
    maxFailureRate: z.string().nullable(),
    version: z.literal('constraints-v1'),
  })
  .strict();

function exactDecimal(
  value: Readonly<{ numerator: string; denominator: string }> | null,
  places = 6,
): string | null {
  if (value === null) return null;
  return formatDecimal(
    rational(BigInt(value.numerator), BigInt(value.denominator)),
    places,
  );
}

function recommendationId(
  organizationId: string,
  workloadId: string,
  bytes: Uint8Array,
): string {
  const digest = sha256Bytes(
    new TextEncoder().encode(
      `${organizationId}\0${workloadId}\0${sha256Bytes(bytes)}`,
    ),
  ).slice(0, 24);
  return `rec-${digest}`;
}

function stateFor(decision: BenchmarkDecision): 'OPPORTUNITY' | 'TESTED' {
  return decision === 'OPTIMIZE' ? 'TESTED' : 'OPPORTUNITY';
}

export async function evaluateAndPersistBenchmark(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    workloadId: string;
    bytes: Uint8Array;
    currentConfigurationId: string;
    candidateConfigurationId: string;
    evaluatorVersion: string;
    currency: string;
    isDemo: boolean;
  }>,
) {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'BENCHMARK',
  });

  const workload = (
    await input.db
      .select()
      .from(workloads)
      .where(
        and(
          eq(workloads.organizationId, input.organizationId),
          eq(workloads.id, input.workloadId),
        ),
      )
      .limit(1)
  ).at(0);
  if (workload === undefined) throw new Error('WORKLOAD_NOT_FOUND');

  const sourceImport = (
    await input.db
      .select({ id: importRuns.id })
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
      .orderBy(desc(importRuns.receivedAt))
      .limit(1)
  ).at(0);

  const constraints = constraintSetSchema.parse(workload.constraintSet);
  const cases = parseBenchmarkCsv(input.bytes);
  const evaluation = evaluateBenchmark({
    cases,
    currentConfigurationId: input.currentConfigurationId,
    candidateConfigurationId: input.candidateConfigurationId,
    evaluatorVersion: input.evaluatorVersion,
    constraints: {
      requiredQuality: constraints.requiredQuality,
      maxP95LatencyMs: constraints.maxP95LatencyMs,
      maxFailureRate: constraints.maxFailureRate,
      targetCases: 30,
    },
  });

  const id = recommendationId(
    input.organizationId,
    input.workloadId,
    input.bytes,
  );
  const existing = (
    await input.db
      .select()
      .from(recommendations)
      .where(
        and(
          eq(recommendations.organizationId, input.organizationId),
          eq(recommendations.id, id),
        ),
      )
      .limit(1)
  ).at(0);
  if (existing !== undefined) {
    return Object.freeze({
      recommendationId: existing.id,
      decision: existing.decision as BenchmarkDecision,
      savingState: existing.savingState,
      reused: true,
    });
  }

  const state = stateFor(evaluation.decision);
  const candidateQuality = exactDecimal(evaluation.metrics.candidateQuality);
  const candidateLatency = exactDecimal(
    evaluation.metrics.candidateP95LatencyMs,
  );
  const candidateFailure = exactDecimal(
    evaluation.metrics.candidateFailureRate,
  );
  const baselineCost = exactDecimal(
    evaluation.metrics.currentComparableCost,
    6,
  );
  const candidateCost = exactDecimal(
    evaluation.metrics.candidateComparableCost,
    6,
  );

  const constraintsForLab: Record<string, unknown>[] = [
    {
      name: 'Quality',
      kind: 'MINIMUM',
      required: constraints.requiredQuality,
      currentMeasured: null,
      candidateMeasured: candidateQuality,
    },
  ];
  if (constraints.maxP95LatencyMs !== null) {
    constraintsForLab.push({
      name: 'p95 latency',
      kind: 'MAXIMUM',
      required: constraints.maxP95LatencyMs,
      currentMeasured: null,
      candidateMeasured: candidateLatency,
    });
  }
  if (constraints.maxFailureRate !== null) {
    constraintsForLab.push({
      name: 'Failure rate',
      kind: 'MAXIMUM',
      required: constraints.maxFailureRate,
      currentMeasured: null,
      candidateMeasured: candidateFailure,
    });
  }

  const evidenceRef = `benchmark:${id}`;
  const evidence = {
    sourceImportId: sourceImport?.id ?? null,
    priorityRank: 1,
    title: `Evaluate ${input.candidateConfigurationId} for ${workload.name}`,
    measuredFact: `${String(evaluation.pairedValidCases)} paired benchmark cases were evaluated.`,
    inference:
      evaluation.decision === 'OPTIMIZE'
        ? 'The candidate is cheaper on the paired benchmark while meeting configured constraints.'
        : 'The candidate does not yet justify a production change.',
    hypothesis: `Use ${input.candidateConfigurationId} only if staged rollout evidence remains comparable.`,
    principalLimitation:
      evaluation.reasons.length === 0
        ? 'Production impact still requires implementation and post-change verification.'
        : evaluation.reasons.join(', '),
    nextAction:
      evaluation.decision === 'OPTIMIZE'
        ? 'Review the implementation guide and staged rollout conditions.'
        : 'Review the failed or missing benchmark evidence before changing production.',
    evidenceRef,
    methodologyVersion: 'benchmark-v1',
    lab: {
      current: {
        configurationId: input.currentConfigurationId,
        cost: baselineCost,
        quality: null,
        p95LatencyMs: null,
        failureRate: null,
      },
      candidate: {
        configurationId: input.candidateConfigurationId,
        cost: candidateCost,
        quality: candidateQuality,
        p95LatencyMs: candidateLatency,
        failureRate: candidateFailure,
      },
      constraints: constraintsForLab,
      economics: {
        currency: input.currency,
        baselineCost,
        candidateCost,
        netSavingNumerator: evaluation.metrics.netSaving.numerator,
        netSavingDenominator: evaluation.metrics.netSaving.denominator,
        horizon: 'OBSERVED_PERIOD',
        evidenceRef,
        formulaVersion: 'economics-v1',
      },
      confidence: {
        band: evaluation.confidence.band,
        reasons: [
          `${String(evaluation.pairedValidCases)} paired cases`,
          `Confidence score ${evaluation.confidence.score.toFixed(3)}`,
          ...(evaluation.reasons.length > 0
            ? evaluation.reasons
            : ['All configured benchmark constraints passed.']),
        ],
      },
      evidenceLinks: [
        { label: 'Benchmark evidence', ref: evidenceRef },
        { label: 'Confidence', ref: evaluation.confidence.version },
      ],
    },
    proposedChange: `Canary ${input.candidateConfigurationId} for the ${workload.name} workload before wider rollout.`,
    rollbackInstructions: [
      `Restore ${input.currentConfigurationId} for the ${workload.name} workload.`,
    ],
  };

  await input.db.insert(recommendations).values({
    id,
    organizationId: input.organizationId,
    workloadId: input.workloadId,
    decision: evaluation.decision,
    savingState: state,
    detectorVersion: 'benchmark-v1',
    confidenceBand: evaluation.confidence.band,
    netSavingNumerator: evaluation.metrics.netSaving.numerator,
    netSavingDenominator: evaluation.metrics.netSaving.denominator,
    currency: input.currency,
    evidence,
    isDemo: input.isDemo,
  });

  const evidenceRepository = createEvidenceRepository(input.db);
  await evidenceRepository.appendLedgerEvent(input.session, {
    id: `${id}:opportunity`,
    recommendationId: id,
    organizationId: input.organizationId,
    type: 'STATE_RECORDED',
    state: 'OPPORTUNITY',
    occurredAt: new Date().toISOString(),
    evidenceRef,
    reason: null,
    invalidatesEventId: null,
  });
  if (state === 'TESTED') {
    await evidenceRepository.appendLedgerEvent(input.session, {
      id: `${id}:tested`,
      recommendationId: id,
      organizationId: input.organizationId,
      type: 'STATE_RECORDED',
      state: 'TESTED',
      occurredAt: new Date().toISOString(),
      evidenceRef,
      reason: null,
      invalidatesEventId: null,
    });
  }

  return Object.freeze({
    recommendationId: id,
    decision: evaluation.decision,
    savingState: state,
    reused: false,
  });
}
