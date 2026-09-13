import { compare, parseDecimal } from '../economics/exact.js';

export type LabDecision =
  | 'OPTIMIZE'
  | 'DO_NOT_CHANGE'
  | 'INSUFFICIENT_EVIDENCE';

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
