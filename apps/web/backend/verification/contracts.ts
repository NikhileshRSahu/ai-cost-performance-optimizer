export type VerificationBlockReason =
  | 'IMPLEMENTATION_REQUIRED'
  | 'BASELINE_COVERAGE_INSUFFICIENT'
  | 'POST_COVERAGE_INSUFFICIENT'
  | 'WINDOWS_OVERLAP'
  | 'ROLLOUT_OR_STABILIZATION_OVERLAP'
  | 'WORKLOAD_MISMATCH'
  | 'CURRENCY_MISMATCH'
  | 'DENOMINATOR_MISMATCH'
  | 'ATTRIBUTION_SCOPE_MISMATCH'
  | 'UNIT_DEFINITION_CHANGED'
  | 'WORKLOAD_MIX_NOT_COMPARABLE'
  | 'CONCURRENT_DEPLOYMENT_UNRESOLVED'
  | 'POST_QUALITY_EVIDENCE_REQUIRED'
  | 'PERFORMANCE_CONSTRAINT_FAILED'
  | 'BASELINE_UNITS_MISSING_OR_ZERO'
  | 'POST_UNITS_MISSING';

export type VerificationResult = Readonly<{
  status: 'VERIFIED' | 'BLOCKED';
  reasons: readonly VerificationBlockReason[];
  netImpact: Readonly<{ numerator: string; denominator: string }> | null;
  direction: 'SAVING' | 'COST_INCREASE' | 'NO_CHANGE' | null;
  formulaVersion: 'economics-v1' | null;
}>;
