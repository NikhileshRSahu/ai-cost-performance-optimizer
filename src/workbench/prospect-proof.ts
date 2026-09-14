import type { FounderDashboardView } from './dashboard-view.js';

export type ProspectProofClassification =
  | 'SYNTHETIC_DEMO'
  | 'INSUFFICIENT_EVIDENCE'
  | 'SANITIZED_PROSPECT_EVIDENCE';

export type ProspectProofPack = Readonly<{
  classification: ProspectProofClassification;
  organizationName: string;
  evidenceWindow: string;
  dataQuality: FounderDashboardView['dataQuality'];
  observedSpend: Readonly<{
    amount: string;
    currency: string;
    evidenceRef: string;
  }> | null;
  strongestFinding: Readonly<{
    title: string;
    state: 'OPPORTUNITY' | 'TESTED' | 'VERIFIED';
    stateLabel: string;
    confidenceBand: 'LOW' | 'MEDIUM' | 'HIGH';
    saving: Readonly<{
      amount: string;
      currency: string;
      horizon: 'OBSERVED_PERIOD' | 'THIRTY_DAY_PROJECTION';
      evidenceRef: string;
    }> | null;
    nextAction: string;
  }> | null;
  verifiedNetSavings: Readonly<{
    numerator: string;
    denominator: string;
    currency: string;
    evidenceRef: string;
    formulaVersion: string;
    direction: 'SAVING' | 'COST_INCREASE' | 'NO_CHANGE';
  }> | null;
  diagnosticFacts: readonly Readonly<{
    label: string;
    value: string;
    evidenceRef: string | null;
  }>[];
  limitations: readonly string[];
  publicationPermissionRequired: true;
  customerResultClaimAllowed: boolean;
  commercialSummary: string;
}>;

export function buildProspectProofPack(
  view: FounderDashboardView,
): ProspectProofPack {
  const classification: ProspectProofClassification =
    view.demoDisclaimer !== null
      ? 'SYNTHETIC_DEMO'
      : view.dataQuality !== 'READY' ||
          view.observedSpend === null ||
          view.strongestAction === null
        ? 'INSUFFICIENT_EVIDENCE'
        : 'SANITIZED_PROSPECT_EVIDENCE';

  const customerResultClaimAllowed =
    classification === 'SANITIZED_PROSPECT_EVIDENCE';

  const commercialSummary =
    classification === 'SYNTHETIC_DEMO'
      ? 'Synthetic demo only. Use this to demonstrate product behavior, never as customer or prospect proof.'
      : classification === 'INSUFFICIENT_EVIDENCE'
        ? 'Evidence is not yet strong enough for a prospect proof claim. Collect or repair the missing usage evidence first.'
        : view.verifiedNetSavings === null
          ? 'Sanitized prospect evidence is ready for private review. Savings remain potential or tested until comparable post-change verification exists.'
          : 'Sanitized prospect evidence includes verified net-impact evidence. Publication still requires explicit written permission.';

  return Object.freeze({
    classification,
    organizationName: view.organizationName,
    evidenceWindow: view.periodLabel,
    dataQuality: view.dataQuality,
    observedSpend:
      view.observedSpend === null
        ? null
        : Object.freeze({ ...view.observedSpend }),
    strongestFinding:
      view.strongestAction === null
        ? null
        : Object.freeze({
            title: view.strongestAction.title,
            state: view.strongestAction.state,
            stateLabel: view.strongestAction.stateLabel,
            confidenceBand: view.strongestAction.confidenceBand,
            saving:
              view.strongestAction.saving === null
                ? null
                : Object.freeze({ ...view.strongestAction.saving }),
            nextAction: view.strongestAction.nextAction,
          }),
    verifiedNetSavings:
      view.verifiedNetSavings === null
        ? null
        : Object.freeze({ ...view.verifiedNetSavings }),
    diagnosticFacts: Object.freeze(
      view.diagnosticFacts.map((fact) =>
        Object.freeze({
          label: fact.label,
          value: fact.value,
          evidenceRef: fact.evidenceRef,
        }),
      ),
    ),
    limitations: Object.freeze([...view.limitations]),
    publicationPermissionRequired: true,
    customerResultClaimAllowed,
    commercialSummary,
  });
}
