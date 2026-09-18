import { and, desc, eq } from 'drizzle-orm';
import {
  add,
  divide,
  formatDecimal,
  parseDecimal,
  rational,
} from '../../../src/economics/exact';
import type {
  ProviderCostEvidence,
  ProviderUsageEvidence,
} from '../../../src/ingestion/provider-evidence';
import type { PersistenceDatabase } from '../../../src/persistence/database';
import { providerEvidenceSnapshots } from '../../../src/persistence/provider-evidence-schema';
import {
  organizations,
  recommendations,
  verificationWindows,
} from '../../../src/persistence/schema';
import { requireOrganizationAccess } from '../../../src/persistence/tenant';
import type { AuthenticatedSession } from '../../../src/workbench/authz';
import type {
  DashboardDecision,
  DashboardEvidence,
  DashboardRecommendationEvidence,
  DashboardSavingsState,
} from '../../../src/workbench/dashboard-view';

function evidenceString(
  evidence: Record<string, unknown>,
  key: string,
): string | null {
  const value = evidence[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function priority(evidence: Record<string, unknown>): number {
  const value = evidence.priorityRank;
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Math.max(1, Number(value));
  }
  return Number.MAX_SAFE_INTEGER;
}

function stateRank(state: string): number {
  if (state === 'VERIFIED') return 0;
  if (state === 'TESTED') return 1;
  return 2;
}

function normalizedDecision(value: string): DashboardDecision {
  if (value === 'OPTIMIZE' || value === 'DO_NOT_CHANGE') return value;
  return 'INSUFFICIENT_EVIDENCE';
}

function normalizedState(value: string): DashboardSavingsState {
  if (value === 'VERIFIED' || value === 'TESTED' || value === 'OPPORTUNITY') {
    return value;
  }
  return 'OPPORTUNITY';
}

function recommendationView(
  row: typeof recommendations.$inferSelect,
): DashboardRecommendationEvidence {
  const evidence = row.evidence;
  const detectionConfidence =
    row.confidenceBand === 'HIGH' || row.confidenceBand === 'MEDIUM'
      ? row.confidenceBand
      : 'LOW';

  return Object.freeze({
    recommendationId: row.id,
    priorityRank: priority(evidence),
    title:
      evidenceString(evidence, 'title') ??
      'Review the strongest provider-backed optimization',
    state: normalizedState(row.savingState),
    decision: normalizedDecision(row.decision),
    saving: null,
    detectionConfidence,
    savingsConfidence:
      row.savingState === 'VERIFIED'
        ? 'VERIFIED'
        : row.savingState === 'TESTED'
          ? 'TESTED'
          : 'UNMEASURED',
    confidenceBand: detectionConfidence,
    principalLimitation: evidenceString(evidence, 'principalLimitation'),
    nextAction:
      evidenceString(evidence, 'nextAction') ??
      'Collect the smallest amount of comparison evidence needed to test this optimization.',
  });
}

function costInMajorUnits(cost: ProviderCostEvidence) {
  const amount = parseDecimal(cost.amount);
  return cost.amountUnit === 'LOWEST'
    ? divide(amount, rational(100n))
    : amount;
}

export async function loadLatestProviderDashboardEvidence(
  db: PersistenceDatabase,
  session: AuthenticatedSession,
  organizationId: string,
  newerThan: string | null,
): Promise<DashboardEvidence | null> {
  requireOrganizationAccess({ session, organizationId, action: 'READ' });

  const snapshot = (
    await db
      .select()
      .from(providerEvidenceSnapshots)
      .where(eq(providerEvidenceSnapshots.organizationId, organizationId))
      .orderBy(desc(providerEvidenceSnapshots.receivedAt))
      .limit(1)
  ).at(0);

  if (
    snapshot === undefined ||
    (newerThan !== null &&
      Date.parse(snapshot.receivedAt) < Date.parse(newerThan))
  ) {
    return null;
  }

  const organization = (
    await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)
  ).at(0);
  if (organization === undefined) throw new Error('ORGANIZATION_NOT_FOUND');

  const usage =
    snapshot.usageEvidence as unknown as readonly ProviderUsageEvidence[];
  const costs =
    snapshot.costEvidence as unknown as readonly ProviderCostEvidence[];
  const limitations: string[] = [
    'Provider APIs expose aggregate usage. Request-level latency, retries, success outcomes, prompt content, and quality are not inferred.',
  ];

  let spend = rational(0n);
  let hasSpend = false;
  let excludedCurrency = false;
  for (const cost of costs) {
    if (cost.currency !== organization.reportingCurrency) {
      excludedCurrency = true;
      continue;
    }
    spend = add(spend, costInMajorUnits(cost));
    hasSpend = true;
  }
  if (excludedCurrency) {
    limitations.push(
      'Provider costs outside the workspace reporting currency are excluded from observed spend.',
    );
  }
  if (costs.some((cost) => cost.coverageLimitation !== null)) {
    limitations.push(
      'The provider documents a cost-coverage limitation for part of this evidence window.',
    );
  }

  const modelNames = [
    ...new Set(
      usage.flatMap((row) => (row.model === null ? [] : [row.model])),
    ),
  ];
  const totalInputTokens = usage.reduce(
    (sum, row) => sum + BigInt(row.inputTokens),
    0n,
  );
  const totalOutputTokens = usage.reduce(
    (sum, row) => sum + BigInt(row.outputTokens),
    0n,
  );
  const cachedInputTokens = usage.reduce(
    (sum, row) => sum + BigInt(row.cachedInputTokens),
    0n,
  );

  const diagnosticFacts = Object.freeze([
    Object.freeze({
      label: 'Provider usage rows',
      value: String(usage.length),
      evidenceRef: `provider-snapshot:${snapshot.id}#usage-rows`,
      evidence: Object.freeze({ rows: String(usage.length) }),
    }),
    Object.freeze({
      label: 'Models observed',
      value: String(modelNames.length),
      evidenceRef: `provider-snapshot:${snapshot.id}#models`,
      evidence: Object.freeze({
        models: modelNames.join(', ') || 'Unavailable',
      }),
    }),
    Object.freeze({
      label: 'Input tokens observed',
      value: totalInputTokens.toString(),
      evidenceRef: `provider-snapshot:${snapshot.id}#input-tokens`,
      evidence: Object.freeze({ tokens: totalInputTokens.toString() }),
    }),
    Object.freeze({
      label: 'Output tokens observed',
      value: totalOutputTokens.toString(),
      evidenceRef: `provider-snapshot:${snapshot.id}#output-tokens`,
      evidence: Object.freeze({ tokens: totalOutputTokens.toString() }),
    }),
    Object.freeze({
      label: 'Cached input observed',
      value: cachedInputTokens.toString(),
      evidenceRef: `provider-snapshot:${snapshot.id}#cached-input`,
      evidence: Object.freeze({ tokens: cachedInputTokens.toString() }),
    }),
  ]);

  const recommendationRows = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.organizationId, organizationId))
    .orderBy(desc(recommendations.createdAt))
    .limit(100);

  const currentRows = recommendationRows
    .filter(
      (row) =>
        evidenceString(row.evidence, 'sourceProviderSnapshotId') === snapshot.id,
    )
    .sort(
      (left, right) =>
        stateRank(left.savingState) - stateRank(right.savingState) ||
        priority(left.evidence) - priority(right.evidence) ||
        Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );

  const recommendationViews = Object.freeze(
    currentRows.slice(0, 3).map(recommendationView),
  );
  const strongest = recommendationViews[0] ?? null;

  let verifiedNetSavings: DashboardEvidence['verifiedNetSavings'] = null;
  if (strongest !== null) {
    const verification = (
      await db
        .select()
        .from(verificationWindows)
        .where(
          and(
            eq(verificationWindows.organizationId, organizationId),
            eq(
              verificationWindows.recommendationId,
              strongest.recommendationId,
            ),
            eq(verificationWindows.status, 'VERIFIED'),
          ),
        )
        .orderBy(desc(verificationWindows.createdAt))
        .limit(1)
    ).at(0);

    if (
      verification !== undefined &&
      verification.netImpactNumerator !== null &&
      verification.netImpactDenominator !== null &&
      verification.formulaVersion !== null
    ) {
      verifiedNetSavings = Object.freeze({
        numerator: verification.netImpactNumerator,
        denominator: verification.netImpactDenominator,
        currency: organization.reportingCurrency,
        evidenceRef: `verification:${verification.id}`,
        formulaVersion: verification.formulaVersion,
      });
    }
  }

  const completeCalendarDays = Math.max(
    0,
    Math.floor(
      (Date.parse(snapshot.intervalEnd) - Date.parse(snapshot.intervalStart)) /
        (24 * 60 * 60 * 1000),
    ),
  );

  if (strongest === null && usage.length > 0) {
    limitations.push(
      'No optimization crossed the current evidence threshold, so Evalomics is not inventing a recommendation.',
    );
  }

  return Object.freeze({
    organizationName: organization.name,
    periodLabel: `${snapshot.intervalStart.slice(0, 10)} to ${snapshot.intervalEnd.slice(0, 10)}`,
    dataQuality:
      usage.length === 0 && costs.length === 0 ? 'ZERO_USAGE' : 'READY',
    observedSpend: hasSpend
      ? Object.freeze({
          amount: formatDecimal(spend, 2),
          currency: organization.reportingCurrency,
          evidenceRef: `provider-snapshot:${snapshot.id}#costs`,
        })
      : null,
    completeCalendarDays,
    recommendations: recommendationViews,
    nonOverlappingModeledTotal: null,
    strongestAction: strongest,
    verifiedNetSavings,
    diagnosticFacts,
    isDemo: false,
    limitations: Object.freeze(limitations),
  });
}
