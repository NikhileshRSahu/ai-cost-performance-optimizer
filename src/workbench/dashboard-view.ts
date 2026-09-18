export type DashboardDataQuality =
  'READY' | 'PARTIAL_DATA' | 'ZERO_USAGE' | 'NO_DATA';

export type DashboardSourceKind = 'NONE' | 'CSV' | 'PROVIDER';
export type DashboardProviderName = 'OpenAI' | 'Anthropic';

export type DashboardSavingsState = 'OPPORTUNITY' | 'TESTED' | 'VERIFIED';

export type DashboardDecision =
  'OPTIMIZE' | 'DO_NOT_CHANGE' | 'INSUFFICIENT_EVIDENCE';

export type DashboardConfidenceBand = 'LOW' | 'MEDIUM' | 'HIGH';

export type SavingsConfidence =
  'UNMEASURED' | 'MODELED' | 'TESTED' | 'VERIFIED';

export type DisplayMoneyEvidence = Readonly<{
  amount: string;
  currency: string;
  evidenceRef: string;
}>;

export type DashboardSavingEvidence = DisplayMoneyEvidence &
  Readonly<{
    horizon: 'OBSERVED_PERIOD' | 'THIRTY_DAY_PROJECTION';
  }>;

export type ModeledSavingsRange = Readonly<{
  currency: string;
  horizon: 'OBSERVED_PERIOD' | 'THIRTY_DAY_PROJECTION';
  low: string;
  base: string;
  high: string;
  evidenceRef: string;
  formulaVersion: string;
  formula: string;
  assumptions: Readonly<Record<string, string>>;
  pricingRef: string | null;
  overlapGroup: string | null;
}>;

export type DashboardRecommendationEvidence = Readonly<{
  recommendationId: string;
  priorityRank?: number;
  title: string;
  state: DashboardSavingsState;
  decision: DashboardDecision;
  saving: DashboardSavingEvidence | null;
  modeledRange?: ModeledSavingsRange | null;
  detectionConfidence?: DashboardConfidenceBand;
  savingsConfidence?: SavingsConfidence;
  // Compatibility field retained while legacy consumers migrate.
  confidenceBand?: DashboardConfidenceBand;
  principalLimitation: string | null;
  nextAction: string;
}>;

export type VerifiedNetSavingsEvidence = Readonly<{
  numerator: string;
  denominator: string;
  currency: string;
  evidenceRef: string;
  formulaVersion: string;
}>;

export type DashboardDiagnosticFact = Readonly<{
  label: string;
  value: string;
  evidenceRef: string | null;
  evidence: Readonly<Record<string, string>>;
}>;

export type DashboardEvidence = Readonly<{
  organizationName: string;
  periodLabel: string;
  dataQuality: DashboardDataQuality;
  sourceKind?: DashboardSourceKind;
  providerName?: DashboardProviderName | null;
  observedSpend: DisplayMoneyEvidence | null;
  completeCalendarDays: number;
  recommendations?: readonly DashboardRecommendationEvidence[];
  nonOverlappingModeledTotal?: ModeledSavingsRange | null;
  // Compatibility field retained while dashboard loading migrates.
  strongestAction?: DashboardRecommendationEvidence | null;
  verifiedNetSavings: VerifiedNetSavingsEvidence | null;
  diagnosticFacts: readonly DashboardDiagnosticFact[];
  isDemo: boolean;
  limitations: readonly string[];
}>;

export type DashboardRecommendationView = Readonly<
  DashboardRecommendationEvidence & {
    priorityRank: number;
    modeledRange: ModeledSavingsRange | null;
    detectionConfidence: DashboardConfidenceBand;
    savingsConfidence: SavingsConfidence;
    confidenceBand: DashboardConfidenceBand;
    stateLabel: 'Potential saving' | 'Tested saving' | 'Verified saving';
  }
>;

export type VerifiedNetSavingsView = Readonly<{
  exactNumerator: string;
  exactDenominator: string;
  currency: string;
  evidenceRef: string;
  formulaVersion: string;
  direction: 'SAVING' | 'COST_INCREASE' | 'NO_CHANGE';
}>;

export type FounderDashboardView = Readonly<{
  organizationName: string;
  periodLabel: string;
  dataQuality: DashboardDataQuality;
  sourceKind: DashboardSourceKind;
  providerName: DashboardProviderName | null;
  observedSpend: DisplayMoneyEvidence | null;
  recommendations: readonly DashboardRecommendationView[];
  bestFirstMove: DashboardRecommendationView | null;
  nonOverlappingModeledTotal: ModeledSavingsRange | null;
  // Compatibility field retained while UI consumers migrate.
  strongestAction: DashboardRecommendationView | null;
  verifiedNetSavings: VerifiedNetSavingsView | null;
  diagnosticFacts: readonly DashboardDiagnosticFact[];
  monthlyProjectionAllowed: boolean;
  demoDisclaimer: 'Synthetic demo data — not a customer result.' | null;
  limitations: readonly string[];
}>;

function savingsStateLabel(
  state: DashboardSavingsState,
): DashboardRecommendationView['stateLabel'] {
  switch (state) {
    case 'OPPORTUNITY':
      return 'Potential saving';
    case 'TESTED':
      return 'Tested saving';
    case 'VERIFIED':
      return 'Verified saving';
  }
}

function savingsConfidence(
  recommendation: DashboardRecommendationEvidence,
): SavingsConfidence {
  if (recommendation.savingsConfidence !== undefined) {
    return recommendation.savingsConfidence;
  }
  if (recommendation.state === 'VERIFIED') return 'VERIFIED';
  if (recommendation.state === 'TESTED') return 'TESTED';
  return recommendation.modeledRange === undefined ||
    recommendation.modeledRange === null
    ? 'UNMEASURED'
    : 'MODELED';
}

function freezeModeledRange(
  value: ModeledSavingsRange | null,
): ModeledSavingsRange | null {
  if (value === null) return null;
  return Object.freeze({
    ...value,
    assumptions: Object.freeze({ ...value.assumptions }),
  });
}

function recommendationView(
  recommendation: DashboardRecommendationEvidence,
  fallbackRank: number,
): DashboardRecommendationView {
  const detectionConfidence =
    recommendation.detectionConfidence ??
    recommendation.confidenceBand ??
    'LOW';
  const modeledRange = recommendation.modeledRange ?? null;

  return Object.freeze({
    ...recommendation,
    priorityRank: recommendation.priorityRank ?? fallbackRank,
    modeledRange: freezeModeledRange(modeledRange),
    detectionConfidence,
    savingsConfidence: savingsConfidence(recommendation),
    confidenceBand: detectionConfidence,
    stateLabel: savingsStateLabel(recommendation.state),
  });
}

function verifiedImpactView(
  value: VerifiedNetSavingsEvidence | null,
): VerifiedNetSavingsView | null {
  if (value === null) return null;

  const numerator = BigInt(value.numerator);
  const denominator = BigInt(value.denominator);
  if (denominator <= 0n) {
    throw new Error('INVALID_VERIFIED_IMPACT_DENOMINATOR');
  }

  const direction =
    numerator > 0n ? 'SAVING' : numerator < 0n ? 'COST_INCREASE' : 'NO_CHANGE';

  return Object.freeze({
    exactNumerator: value.numerator,
    exactDenominator: value.denominator,
    currency: value.currency,
    evidenceRef: value.evidenceRef,
    formulaVersion: value.formulaVersion,
    direction,
  });
}

export function buildFounderDashboardView(
  input: DashboardEvidence,
): FounderDashboardView {
  const recommendationEvidence =
    input.recommendations ??
    (input.strongestAction === undefined || input.strongestAction === null
      ? []
      : [input.strongestAction]);

  const recommendations = Object.freeze(
    recommendationEvidence
      .map((recommendation, index) =>
        recommendationView(recommendation, index + 1),
      )
      .sort(
        (left, right) =>
          left.priorityRank - right.priorityRank ||
          left.recommendationId.localeCompare(right.recommendationId),
      )
      .slice(0, 3),
  );
  const bestFirstMove = recommendations[0] ?? null;
  const nonOverlappingModeledTotal = input.nonOverlappingModeledTotal ?? null;

  return Object.freeze({
    organizationName: input.organizationName,
    periodLabel: input.periodLabel,
    dataQuality: input.dataQuality,
    sourceKind:
      input.sourceKind ?? (input.dataQuality === 'NO_DATA' ? 'NONE' : 'CSV'),
    providerName: input.providerName ?? null,
    observedSpend:
      input.observedSpend === null
        ? null
        : Object.freeze({ ...input.observedSpend }),
    recommendations,
    bestFirstMove,
    nonOverlappingModeledTotal: freezeModeledRange(nonOverlappingModeledTotal),
    strongestAction: bestFirstMove,
    verifiedNetSavings: verifiedImpactView(input.verifiedNetSavings),
    diagnosticFacts: Object.freeze(
      input.diagnosticFacts.map((fact) =>
        Object.freeze({
          ...fact,
          evidence: Object.freeze({ ...fact.evidence }),
        }),
      ),
    ),
    monthlyProjectionAllowed: input.completeCalendarDays >= 7,
    demoDisclaimer: input.isDemo
      ? 'Synthetic demo data — not a customer result.'
      : null,
    limitations: Object.freeze([...input.limitations]),
  });
}
