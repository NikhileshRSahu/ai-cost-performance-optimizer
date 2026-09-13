export type ReportFinancialState =
  'OBSERVED' | 'OPPORTUNITY' | 'TESTED' | 'VERIFIED';

export type ReportFinancialClaim = Readonly<{
  label: string;
  amount: string;
  currency: string;
  state: ReportFinancialState;
  horizon: string;
  evidenceRef: string;
  formulaVersion: string;
}>;

export type OptimizationReportEvidence = Readonly<{
  organizationName: string;
  reportPeriod: string;
  dataQuality: 'READY' | 'PARTIAL_DATA' | 'ZERO_USAGE' | 'NO_DATA';
  observedSpend: ReportFinancialClaim | null;
  opportunity: Readonly<{
    measuredFact: string;
    inference: string;
    hypothesis: string;
    savingState: 'OPPORTUNITY' | 'TESTED' | 'VERIFIED';
  }>;
  benchmark: Readonly<{
    decision: 'OPTIMIZE' | 'DO_NOT_CHANGE' | 'INSUFFICIENT_EVIDENCE';
    currentConfiguration: string;
    candidateConfiguration: string;
    constraintSummary: readonly string[];
  }>;
  economics: ReportFinancialClaim | null;
  confidence: Readonly<{
    band: 'LOW' | 'MEDIUM' | 'HIGH';
    reasons: readonly string[];
  }>;
  implementation: Readonly<{
    proposedChange: string;
    rollbackInstructions: readonly string[];
  }>;
  verification: Readonly<{
    status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'INSUFFICIENT_EVIDENCE';
    summary: string;
    financialClaim: ReportFinancialClaim | null;
  }>;
  methodologyVersion: string;
  limitations: readonly string[];
  isDemo: boolean;
}>;

export type ReportSectionId =
  | 'executive-summary'
  | 'scope-data-quality'
  | 'opportunity'
  | 'benchmark'
  | 'economics'
  | 'confidence'
  | 'implementation'
  | 'verification'
  | 'methodology-limitations';

export type ReportSection = Readonly<{
  id: ReportSectionId;
  title: string;
}>;

export type OptimizationReportView = Readonly<{
  organizationName: string;
  reportPeriod: string;
  dataQuality: OptimizationReportEvidence['dataQuality'];
  sections: readonly ReportSection[];
  financialClaims: readonly ReportFinancialClaim[];
  opportunity: OptimizationReportEvidence['opportunity'];
  benchmark: OptimizationReportEvidence['benchmark'];
  confidence: OptimizationReportEvidence['confidence'];
  implementation: OptimizationReportEvidence['implementation'];
  verification: OptimizationReportEvidence['verification'];
  methodologyVersion: string;
  limitations: readonly string[];
  demoDisclaimer: 'Synthetic demo data — not a customer result.' | null;
}>;

const SECTIONS: readonly ReportSection[] = Object.freeze([
  Object.freeze({ id: 'executive-summary', title: 'Executive summary' }),
  Object.freeze({
    id: 'scope-data-quality',
    title: 'Scope and data quality',
  }),
  Object.freeze({ id: 'opportunity', title: 'Opportunity' }),
  Object.freeze({ id: 'benchmark', title: 'Benchmark' }),
  Object.freeze({ id: 'economics', title: 'Economics' }),
  Object.freeze({ id: 'confidence', title: 'Confidence' }),
  Object.freeze({ id: 'implementation', title: 'Implementation and rollback' }),
  Object.freeze({ id: 'verification', title: 'Verification' }),
  Object.freeze({
    id: 'methodology-limitations',
    title: 'Methodology and limitations',
  }),
]);

function freezeClaim(claim: ReportFinancialClaim): ReportFinancialClaim {
  if (!/^[A-Z]{3}$/.test(claim.currency)) {
    throw new Error('INVALID_REPORT_CURRENCY');
  }
  if (
    claim.label.trim().length === 0 ||
    claim.horizon.trim().length === 0 ||
    claim.evidenceRef.trim().length === 0 ||
    claim.formulaVersion.trim().length === 0
  ) {
    throw new Error('INCOMPLETE_REPORT_FINANCIAL_CLAIM');
  }
  return Object.freeze({ ...claim });
}

export function buildOptimizationReportView(
  input: OptimizationReportEvidence,
): OptimizationReportView {
  const financialClaims: ReportFinancialClaim[] = [];
  const limitations = [...input.limitations];

  if (input.observedSpend === null) {
    limitations.push(
      'Observed spend is unavailable for the selected report scope.',
    );
  } else {
    financialClaims.push(freezeClaim(input.observedSpend));
  }

  if (input.economics !== null) {
    financialClaims.push(freezeClaim(input.economics));
  }

  if (input.verification.financialClaim !== null) {
    financialClaims.push(freezeClaim(input.verification.financialClaim));
  }

  return Object.freeze({
    organizationName: input.organizationName,
    reportPeriod: input.reportPeriod,
    dataQuality: input.dataQuality,
    sections: SECTIONS,
    financialClaims: Object.freeze(financialClaims),
    opportunity: Object.freeze({ ...input.opportunity }),
    benchmark: Object.freeze({
      ...input.benchmark,
      constraintSummary: Object.freeze([...input.benchmark.constraintSummary]),
    }),
    confidence: Object.freeze({
      band: input.confidence.band,
      reasons: Object.freeze([...input.confidence.reasons]),
    }),
    implementation: Object.freeze({
      proposedChange: input.implementation.proposedChange,
      rollbackInstructions: Object.freeze([
        ...input.implementation.rollbackInstructions,
      ]),
    }),
    verification: Object.freeze({
      status: input.verification.status,
      summary: input.verification.summary,
      financialClaim:
        input.verification.financialClaim === null
          ? null
          : freezeClaim(input.verification.financialClaim),
    }),
    methodologyVersion: input.methodologyVersion,
    limitations: Object.freeze(limitations),
    demoDisclaimer: input.isDemo
      ? 'Synthetic demo data — not a customer result.'
      : null,
  });
}
