export type DashboardDataQuality =
  'READY' | 'PARTIAL_DATA' | 'ZERO_USAGE' | 'NO_DATA';

export type DashboardSavingsState = 'OPPORTUNITY' | 'TESTED' | 'VERIFIED';

export type DashboardDecision =
  'OPTIMIZE' | 'DO_NOT_CHANGE' | 'INSUFFICIENT_EVIDENCE';

export type DisplayMoneyEvidence = Readonly<{
  amount: string;
  currency: string;
  evidenceRef: string;
}>;

export type DashboardSavingEvidence = DisplayMoneyEvidence &
  Readonly<{
    horizon: 'OBSERVED_PERIOD' | 'THIRTY_DAY_PROJECTION';
  }>;

export type DashboardRecommendationEvidence = Readonly<{
  recommendationId: string;
  title: string;
  state: DashboardSavingsState;
  decision: DashboardDecision;
  saving: DashboardSavingEvidence | null;
  confidenceBand: 'LOW' | 'MEDIUM' | 'HIGH';
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

export type DashboardEvidence = Readonly<{
  organizationName: string;
  periodLabel: string;
  dataQuality: DashboardDataQuality;
  observedSpend: DisplayMoneyEvidence | null;
  completeCalendarDays: number;
  strongestAction: DashboardRecommendationEvidence | null;
  verifiedNetSavings: VerifiedNetSavingsEvidence | null;
  isDemo: boolean;
  limitations: readonly string[];
}>;

export type DashboardRecommendationView = Readonly<
  DashboardRecommendationEvidence & {
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
  observedSpend: DisplayMoneyEvidence | null;
  strongestAction: DashboardRecommendationView | null;
  verifiedNetSavings: VerifiedNetSavingsView | null;
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
  const strongestAction =
    input.strongestAction === null
      ? null
      : Object.freeze({
          ...input.strongestAction,
          stateLabel: savingsStateLabel(input.strongestAction.state),
        });

  return Object.freeze({
    organizationName: input.organizationName,
    periodLabel: input.periodLabel,
    dataQuality: input.dataQuality,
    observedSpend:
      input.observedSpend === null
        ? null
        : Object.freeze({ ...input.observedSpend }),
    strongestAction,
    verifiedNetSavings: verifiedImpactView(input.verifiedNetSavings),
    monthlyProjectionAllowed: input.completeCalendarDays >= 7,
    demoDisclaimer: input.isDemo
      ? 'Synthetic demo data — not a customer result.'
      : null,
    limitations: Object.freeze([...input.limitations]),
  });
}
