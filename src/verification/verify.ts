import { z } from 'zod';
import { counterfactualImpact } from '../economics/calculations.js';
import { compare, parseDecimal, rational } from '../economics/exact.js';
import type {
  VerificationBlockReason,
  VerificationResult,
} from './contracts.js';

const countSchema = z
  .string()
  .regex(/^(0|[1-9]\d{0,25})$/)
  .nullable();

const windowBaseSchema = z.object({
  start: z.iso.datetime({ offset: true }),
  end: z.iso.datetime({ offset: true }),
  completeDays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  workload: z.string().trim().min(1),
  configurationVersion: z.string().trim().min(1),
  currency: z.string().regex(/^[A-Z]{3}$/),
  denominator: z.enum(['SUCCESSFUL_OUTCOMES', 'REQUESTS']),
  attributionScope: z.string().trim().min(1),
  unitDefinition: z.string().trim().min(1),
  successDefinition: z.string().trim().min(1).nullable(),
});

const qualityEvidenceSchema = z
  .object({
    measured: z.string(),
    requiredMinimum: z.string(),
    p95LatencyMs: z.string().nullable(),
    maxP95LatencyMs: z.string().nullable(),
    failureRate: z.string().nullable(),
    maxFailureRate: z.string().nullable(),
    sourceRef: z.string().trim().min(1),
  })
  .strict();

const verificationInputSchema = z
  .object({
    implementation: z
      .object({
        recommendationId: z.string().trim().min(1),
        organizationId: z.string().trim().min(1),
        implementedAt: z.iso.datetime({ offset: true }),
        rolloutStart: z.iso.datetime({ offset: true }),
        stabilizationEnd: z.iso.datetime({ offset: true }),
        deploymentNote: z.string().trim().min(1),
        rollbackInstructions: z.array(z.string().trim().min(1)).min(1),
        confirmedByUserId: z.string().trim().min(1),
      })
      .strict()
      .nullable(),
    baseline: windowBaseSchema
      .extend({
        cost: z.string(),
        units: countSchema,
      })
      .strict(),
    post: windowBaseSchema
      .extend({
        actualCost: z.string(),
        units: countSchema,
        qualityEvidence: qualityEvidenceSchema.nullable(),
      })
      .strict(),
    implementationCostInWindow: z.string(),
    incrementalOperatingCost: z.string(),
    attestations: z
      .object({
        unitDefinitionUnchanged: z.boolean(),
        workloadMixComparable: z.boolean(),
        concurrentDeploymentsResolved: z.boolean(),
      })
      .strict(),
  })
  .strict();

function intervalsOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
): boolean {
  return (
    Date.parse(firstStart) < Date.parse(secondEnd) &&
    Date.parse(secondStart) < Date.parse(firstEnd)
  );
}

function uniqueCompleteDays(days: readonly string[]): number {
  return new Set(days).size;
}

function blocked(reasons: VerificationBlockReason[]): VerificationResult {
  return Object.freeze({
    status: 'BLOCKED',
    reasons: Object.freeze(reasons),
    netImpact: null,
    direction: null,
    formulaVersion: null,
  });
}

function pushOnce(
  reasons: VerificationBlockReason[],
  reason: VerificationBlockReason,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

export function verifyPostChange(input: unknown): VerificationResult {
  const data = verificationInputSchema.parse(input);
  const reasons: VerificationBlockReason[] = [];

  if (data.implementation === null) {
    reasons.push('IMPLEMENTATION_REQUIRED');
  }
  if (uniqueCompleteDays(data.baseline.completeDays) < 7) {
    reasons.push('BASELINE_COVERAGE_INSUFFICIENT');
  }
  if (uniqueCompleteDays(data.post.completeDays) < 7) {
    reasons.push('POST_COVERAGE_INSUFFICIENT');
  }
  if (
    intervalsOverlap(
      data.baseline.start,
      data.baseline.end,
      data.post.start,
      data.post.end,
    )
  ) {
    reasons.push('WINDOWS_OVERLAP');
  }

  if (data.implementation !== null) {
    for (const window of [data.baseline, data.post]) {
      if (
        intervalsOverlap(
          window.start,
          window.end,
          data.implementation.rolloutStart,
          data.implementation.stabilizationEnd,
        )
      ) {
        pushOnce(reasons, 'ROLLOUT_OR_STABILIZATION_OVERLAP');
      }
    }
  }

  if (data.baseline.workload !== data.post.workload) {
    reasons.push('WORKLOAD_MISMATCH');
  }
  if (data.baseline.currency !== data.post.currency) {
    reasons.push('CURRENCY_MISMATCH');
  }
  if (data.baseline.denominator !== data.post.denominator) {
    reasons.push('DENOMINATOR_MISMATCH');
  }
  if (data.baseline.attributionScope !== data.post.attributionScope) {
    reasons.push('ATTRIBUTION_SCOPE_MISMATCH');
  }

  const successfulOutcomeDefinitionMissing =
    data.baseline.denominator === 'SUCCESSFUL_OUTCOMES' &&
    (data.baseline.successDefinition === null ||
      data.post.successDefinition === null);

  if (
    !data.attestations.unitDefinitionUnchanged ||
    data.baseline.unitDefinition !== data.post.unitDefinition ||
    data.baseline.successDefinition !== data.post.successDefinition ||
    successfulOutcomeDefinitionMissing
  ) {
    reasons.push('UNIT_DEFINITION_CHANGED');
  }
  if (!data.attestations.workloadMixComparable) {
    reasons.push('WORKLOAD_MIX_NOT_COMPARABLE');
  }
  if (!data.attestations.concurrentDeploymentsResolved) {
    reasons.push('CONCURRENT_DEPLOYMENT_UNRESOLVED');
  }

  if (data.baseline.units === null || data.baseline.units === '0') {
    reasons.push('BASELINE_UNITS_MISSING_OR_ZERO');
  }
  if (data.post.units === null) {
    reasons.push('POST_UNITS_MISSING');
  }

  const performance = data.post.qualityEvidence;
  if (performance === null) {
    reasons.push('POST_QUALITY_EVIDENCE_REQUIRED');
  } else {
    let missingConfiguredMeasurement = false;
    let failedConstraint = false;

    if (
      compare(
        parseDecimal(performance.measured),
        parseDecimal(performance.requiredMinimum),
      ) < 0
    ) {
      failedConstraint = true;
    }

    if (performance.maxP95LatencyMs !== null) {
      if (performance.p95LatencyMs === null) {
        missingConfiguredMeasurement = true;
      } else if (
        compare(
          parseDecimal(performance.p95LatencyMs),
          parseDecimal(performance.maxP95LatencyMs),
        ) > 0
      ) {
        failedConstraint = true;
      }
    }

    if (performance.maxFailureRate !== null) {
      if (performance.failureRate === null) {
        missingConfiguredMeasurement = true;
      } else if (
        compare(
          parseDecimal(performance.failureRate),
          parseDecimal(performance.maxFailureRate),
        ) > 0
      ) {
        failedConstraint = true;
      }
    }

    if (missingConfiguredMeasurement) {
      pushOnce(reasons, 'POST_QUALITY_EVIDENCE_REQUIRED');
    }
    if (failedConstraint) {
      pushOnce(reasons, 'PERFORMANCE_CONSTRAINT_FAILED');
    }
  }

  if (reasons.length > 0) return blocked(reasons);

  const calculation = counterfactualImpact({
    baselineCost: data.baseline.cost,
    baselineUnits: data.baseline.units,
    actualPostCost: data.post.actualCost,
    postUnits: data.post.units,
    implementationCost: data.implementationCostInWindow,
    operatingCost: data.incrementalOperatingCost,
    currency: data.baseline.currency,
    horizon: `${data.post.start}/${data.post.end}`,
  });

  if (calculation.value === null) {
    throw new Error('VERIFICATION_CALCULATION_UNAVAILABLE');
  }

  const exact = rational(
    BigInt(calculation.value.numerator),
    BigInt(calculation.value.denominator),
  );
  const relation = compare(exact, rational(0n));

  return Object.freeze({
    status: 'VERIFIED',
    reasons: Object.freeze([]),
    netImpact: Object.freeze({ ...calculation.value }),
    direction:
      relation > 0 ? 'SAVING' : relation < 0 ? 'COST_INCREASE' : 'NO_CHANGE',
    formulaVersion: calculation.formulaVersion,
  });
}
