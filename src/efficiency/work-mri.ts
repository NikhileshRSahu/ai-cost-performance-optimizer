import type { AnalysisDepth, AnalysisCapability } from './contracts.js';

export type MriEvidenceFact = Readonly<{
  label: string;
  value: string;
  evidenceRef: string | null;
  evidence: Readonly<Record<string, string>>;
}>;

export type MriStrongestAction = Readonly<{
  title: string;
  state: 'OPPORTUNITY' | 'TESTED' | 'VERIFIED';
  confidenceBand: 'LOW' | 'MEDIUM' | 'HIGH';
  savingLabel: string | null;
  limitation: string | null;
  nextAction: string;
}>;

export type WorkMriSnapshot = Readonly<{
  title: 'AI Work MRI';
  depth: AnalysisDepth;
  facts: readonly MriEvidenceFact[];
  strongestAction: MriStrongestAction | null;
  withheldClaims: readonly string[];
  nextUnlock: string | null;
}>;

export type WorkMriInput = Readonly<{
  depth: AnalysisDepth;
  additionalFacts: readonly MriEvidenceFact[];
  observedSpend: Readonly<{
    amount: string;
    currency: string;
    evidenceRef: string;
  }> | null;
  strongestAction: Readonly<{
    title: string;
    state: 'OPPORTUNITY' | 'TESTED' | 'VERIFIED';
    confidenceBand: 'LOW' | 'MEDIUM' | 'HIGH';
    saving: Readonly<{
      amount: string;
      currency: string;
      evidenceRef: string;
    }> | null;
    principalLimitation: string | null;
    nextAction: string;
  }> | null;
  verifiedNetSavings: Readonly<{
    numerator: string;
    denominator: string;
    currency: string;
    evidenceRef: string;
  }> | null;
}>;

function hasCapability(
  depth: AnalysisDepth,
  capability: AnalysisCapability,
): boolean {
  return depth.capabilities.includes(capability);
}

function buildWithheldClaims(depth: AnalysisDepth): readonly string[] {
  const withheld: string[] = [];

  if (!hasCapability(depth, 'PROMPT_STRUCTURE')) {
    withheld.push(
      'Prompt-quality claims are withheld until sanitized conversation content is provided.',
    );
  }
  if (!hasCapability(depth, 'REPEATED_CONTEXT')) {
    withheld.push(
      'Repeated-context and memory-waste estimates are withheld without content evidence.',
    );
  }
  if (!hasCapability(depth, 'KNOWLEDGE_RETRIEVAL')) {
    withheld.push(
      'Cross-tool knowledge and buried-decision claims are withheld without authorized workspace evidence.',
    );
  }
  if (!hasCapability(depth, 'COST_PER_SUCCESSFUL_OUTCOME')) {
    withheld.push(
      'Cost-per-successful-outcome is withheld until outcome-bearing production telemetry exists.',
    );
  }

  return Object.freeze(withheld);
}

function nextUnlockLabel(depth: AnalysisDepth): string | null {
  const next = depth.missingForNextLevel.at(0);
  switch (next) {
    case 'SANITIZED_AI_EXPORT':
      return 'Add a sanitized AI-history export to unlock prompt, repeated-context, and workflow analysis.';
    case 'AUTHORIZED_WORKSPACE':
      return 'Authorize selected workspace sources to unlock cross-tool knowledge analysis.';
    case 'PRODUCTION_TELEMETRY':
      return 'Connect outcome-bearing production telemetry to unlock cost-per-success and continuous verification.';
    case 'USAGE_CSV':
    case 'PROVIDER_ADMIN_USAGE':
      return 'Add usage evidence to begin the MRI.';
    case undefined:
      return null;
  }
}

export function buildWorkMriSnapshot(input: WorkMriInput): WorkMriSnapshot {
  const facts: MriEvidenceFact[] = input.additionalFacts.map((fact) =>
    Object.freeze({
      ...fact,
      evidence: Object.freeze({ ...fact.evidence }),
    }),
  );

  if (input.observedSpend !== null) {
    facts.push(
      Object.freeze({
        label: 'Observed AI spend',
        value: `${input.observedSpend.currency} ${input.observedSpend.amount}`,
        evidenceRef: input.observedSpend.evidenceRef,
        evidence: Object.freeze({
          amount: input.observedSpend.amount,
          currency: input.observedSpend.currency,
        }),
      }),
    );
  }

  if (input.verifiedNetSavings !== null) {
    facts.push(
      Object.freeze({
        label: 'Verified net savings',
        value: `${input.verifiedNetSavings.currency} ${input.verifiedNetSavings.numerator}/${input.verifiedNetSavings.denominator}`,
        evidenceRef: input.verifiedNetSavings.evidenceRef,
        evidence: Object.freeze({
          exactNumerator: input.verifiedNetSavings.numerator,
          exactDenominator: input.verifiedNetSavings.denominator,
          currency: input.verifiedNetSavings.currency,
        }),
      }),
    );
  }

  const strongestAction =
    input.strongestAction === null
      ? null
      : Object.freeze({
          title: input.strongestAction.title,
          state: input.strongestAction.state,
          confidenceBand: input.strongestAction.confidenceBand,
          savingLabel:
            input.strongestAction.saving === null
              ? null
              : `${input.strongestAction.saving.currency} ${input.strongestAction.saving.amount}`,
          limitation: input.strongestAction.principalLimitation,
          nextAction: input.strongestAction.nextAction,
        });

  return Object.freeze({
    title: 'AI Work MRI',
    depth: input.depth,
    facts: Object.freeze(facts),
    strongestAction,
    withheldClaims: buildWithheldClaims(input.depth),
    nextUnlock: nextUnlockLabel(input.depth),
  });
}
