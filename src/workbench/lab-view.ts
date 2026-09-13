import { z } from 'zod';
import { compare, parseDecimal } from '../economics/exact.js';

export type LabDecision =
  'OPTIMIZE' | 'DO_NOT_CHANGE' | 'INSUFFICIENT_EVIDENCE';

export type ConfigurationEvidence = Readonly<{
  configurationId: string;
  cost: string | null;
  quality: string | null;
  p95LatencyMs: string | null;
  failureRate: string | null;
}>;

export type ConstraintEvidence = Readonly<{
  name: string;
  kind: 'MINIMUM' | 'MAXIMUM';
  required: string;
  currentMeasured: string | null;
  candidateMeasured: string | null;
}>;

export type ConstraintDisplayRow = ConstraintEvidence &
  Readonly<{ status: 'PASS' | 'FAIL' | 'MISSING' }>;

export type LabEconomicsEvidence = Readonly<{
  currency: string;
  baselineCost: string | null;
  candidateCost: string | null;
  netSavingNumerator: string | null;
  netSavingDenominator: string | null;
  horizon: 'OBSERVED_PERIOD' | 'THIRTY_DAY_PROJECTION';
  evidenceRef: string;
  formulaVersion: string;
}>;

export type OptimizationLabEvidence = Readonly<{
  recommendationId: string;
  persistedDecision: LabDecision;
  current: ConfigurationEvidence;
  candidate: ConfigurationEvidence;
  constraints: readonly ConstraintEvidence[];
  economics: LabEconomicsEvidence;
  confidence: Readonly<{
    band: 'LOW' | 'MEDIUM' | 'HIGH';
    reasons: readonly string[];
  }>;
  evidenceLinks: readonly Readonly<{ label: string; ref: string }>[];
  isDemo: boolean;
}>;

export type OptimizationLabView = Readonly<{
  recommendationId: string;
  decision: LabDecision;
  current: ConfigurationEvidence;
  candidate: ConfigurationEvidence;
  constraints: readonly ConstraintDisplayRow[];
  economics: LabEconomicsEvidence;
  confidence: OptimizationLabEvidence['confidence'];
  evidenceLinks: OptimizationLabEvidence['evidenceLinks'];
  demoDisclaimer: 'Synthetic demo data — not a customer result.' | null;
}>;

const decimalSchema = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/);
const nullableDecimalSchema = decimalSchema.nullable();

const configurationSchema = z
  .object({
    configurationId: z.string().trim().min(1),
    cost: nullableDecimalSchema,
    quality: nullableDecimalSchema,
    p95LatencyMs: nullableDecimalSchema,
    failureRate: nullableDecimalSchema,
  })
  .strict();

const constraintSchema = z
  .object({
    name: z.string().trim().min(1),
    kind: z.enum(['MINIMUM', 'MAXIMUM']),
    required: decimalSchema,
    currentMeasured: nullableDecimalSchema,
    candidateMeasured: nullableDecimalSchema,
  })
  .strict();

const optimizationLabEvidenceSchema = z
  .object({
    recommendationId: z.string().trim().min(1),
    persistedDecision: z.enum([
      'OPTIMIZE',
      'DO_NOT_CHANGE',
      'INSUFFICIENT_EVIDENCE',
    ]),
    current: configurationSchema,
    candidate: configurationSchema,
    constraints: z.array(constraintSchema).min(1),
    economics: z
      .object({
        currency: z.string().regex(/^[A-Z]{3}$/),
        baselineCost: nullableDecimalSchema,
        candidateCost: nullableDecimalSchema,
        netSavingNumerator: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .nullable(),
        netSavingDenominator: z
          .string()
          .regex(/^(?:[1-9]\d*)$/)
          .nullable(),
        horizon: z.enum(['OBSERVED_PERIOD', 'THIRTY_DAY_PROJECTION']),
        evidenceRef: z.string().trim().min(1),
        formulaVersion: z.string().trim().min(1),
      })
      .strict(),
    confidence: z
      .object({
        band: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        reasons: z.array(z.string().trim().min(1)),
      })
      .strict(),
    evidenceLinks: z.array(
      z
        .object({
          label: z.string().trim().min(1),
          ref: z.string().trim().min(1),
        })
        .strict(),
    ),
    isDemo: z.boolean(),
  })
  .strict();

function freezeEvidence(
  input: z.infer<typeof optimizationLabEvidenceSchema>,
): OptimizationLabEvidence {
  return Object.freeze({
    ...input,
    current: Object.freeze({ ...input.current }),
    candidate: Object.freeze({ ...input.candidate }),
    constraints: Object.freeze(
      input.constraints.map((constraint) => Object.freeze({ ...constraint })),
    ),
    economics: Object.freeze({ ...input.economics }),
    confidence: Object.freeze({
      band: input.confidence.band,
      reasons: Object.freeze([...input.confidence.reasons]),
    }),
    evidenceLinks: Object.freeze(
      input.evidenceLinks.map((link) => Object.freeze({ ...link })),
    ),
  });
}

export function parseOptimizationLabEvidence(
  input: unknown,
): OptimizationLabEvidence {
  return freezeEvidence(optimizationLabEvidenceSchema.parse(input));
}

function constraintStatus(
  constraint: ConstraintEvidence,
): ConstraintDisplayRow['status'] {
  if (constraint.candidateMeasured === null) return 'MISSING';
  const measured = parseDecimal(constraint.candidateMeasured);
  const required = parseDecimal(constraint.required);
  const comparison = compare(measured, required);
  if (constraint.kind === 'MINIMUM') {
    return comparison >= 0 ? 'PASS' : 'FAIL';
  }
  return comparison <= 0 ? 'PASS' : 'FAIL';
}

export function buildOptimizationLabView(
  input: OptimizationLabEvidence,
): OptimizationLabView {
  const constraints = Object.freeze(
    input.constraints.map((constraint) =>
      Object.freeze({
        ...constraint,
        status: constraintStatus(constraint),
      }),
    ),
  );

  const hasFailure = constraints.some(
    (constraint) => constraint.status === 'FAIL',
  );
  const hasMissing = constraints.some(
    (constraint) => constraint.status === 'MISSING',
  );

  const decision: LabDecision = hasFailure
    ? 'DO_NOT_CHANGE'
    : hasMissing
      ? 'INSUFFICIENT_EVIDENCE'
      : input.persistedDecision;

  return Object.freeze({
    recommendationId: input.recommendationId,
    decision,
    current: Object.freeze({ ...input.current }),
    candidate: Object.freeze({ ...input.candidate }),
    constraints,
    economics: Object.freeze({ ...input.economics }),
    confidence: Object.freeze({
      band: input.confidence.band,
      reasons: Object.freeze([...input.confidence.reasons]),
    }),
    evidenceLinks: Object.freeze(
      input.evidenceLinks.map((link) => Object.freeze({ ...link })),
    ),
    demoDisclaimer: input.isDemo
      ? 'Synthetic demo data — not a customer result.'
      : null,
  });
}
