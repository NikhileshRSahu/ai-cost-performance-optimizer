import { and, desc, eq, or } from 'drizzle-orm';
import { summarizeCoverage } from '../../../src/coverage/coverage';
import { diagnoseUsage } from '../../../src/efficiency/usage-diagnosis';
import {
  add,
  formatDecimal,
  parseDecimal,
  rational,
} from '../../../src/economics/exact';
import type { PersistenceDatabase } from '../../../src/persistence/database';
import {
  importRuns,
  organizations,
  recommendations,
  usageRecords,
  verificationWindows,
} from '../../../src/persistence/schema';
import { requireOrganizationAccess } from '../../../src/persistence/tenant';
import { usageRecordSchema } from '../../../src/usage/contracts';
import type { AuthenticatedSession } from '../../../src/workbench/authz';
import type {
  DashboardDecision,
  DashboardEvidence,
  DashboardRecommendationEvidence,
  DashboardSavingsState,
  SavingsConfidence,
} from '../../../src/workbench/dashboard-view';

function evidenceString(
  evidence: Record<string, unknown>,
  key: string,
): string | null {
  const value = evidence[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function evidenceRank(evidence: Record<string, unknown>): number | null {
  const value = evidence.priorityRank;
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

function normalizedDecision(value: string): DashboardDecision {
  if (
    value === 'OPTIMIZE' ||
    value === 'DO_NOT_CHANGE' ||
    value === 'INSUFFICIENT_EVIDENCE'
  ) {
    return value;
  }
  return 'INSUFFICIENT_EVIDENCE';
}

function normalizedState(value: string): DashboardSavingsState {
  if (value === 'OPPORTUNITY' || value === 'TESTED' || value === 'VERIFIED') {
    return value;
  }
  throw new Error('INVALID_PERSISTED_SAVINGS_STATE');
}

function stateRank(value: string): number {
  if (value === 'VERIFIED') return 0;
  if (value === 'TESTED') return 1;
  return 2;
}

function normalizedConfidence(
  value: string | null,
): DashboardRecommendationEvidence['confidenceBand'] {
  if (value === 'HIGH' || value === 'MEDIUM') return value;
  return 'LOW';
}

function normalizedSavingsConfidence(
  evidence: Record<string, unknown>,
  state: DashboardSavingsState,
): SavingsConfidence {
  const value = evidence.savingsConfidence;
  if (
    value === 'UNMEASURED' ||
    value === 'MODELED' ||
    value === 'TESTED' ||
    value === 'VERIFIED'
  ) {
    return value;
  }
  if (state === 'VERIFIED') return 'VERIFIED';
  if (state === 'TESTED') return 'TESTED';
  return 'UNMEASURED';
}

function periodLabel(start: string | null, end: string | null): string {
  if (start === null || end === null) return 'Period unavailable';
  return `${start.slice(0, 10)} to ${end.slice(0, 10)}`;
}

function recommendationView(
  row: typeof recommendations.$inferSelect,
  priorityRank: number,
  projectionEligible: boolean,
  limitations: string[],
): DashboardRecommendationEvidence {
  const declaredHorizon =
    evidenceString(row.evidence, 'horizon') === 'THIRTY_DAY_PROJECTION'
      ? 'THIRTY_DAY_PROJECTION'
      : 'OBSERVED_PERIOD';

  let saving: DashboardRecommendationEvidence['saving'] = null;
  if (
    row.netSavingNumerator !== null &&
    row.netSavingDenominator !== null &&
    row.currency !== null
  ) {
    if (declaredHorizon === 'THIRTY_DAY_PROJECTION' && !projectionEligible) {
      limitations.push(
        'Thirty-day projection withheld because fewer than seven complete calendar days are covered.',
      );
    } else {
      const exact = rational(
        BigInt(row.netSavingNumerator),
        BigInt(row.netSavingDenominator),
      );
      saving = Object.freeze({
        amount: formatDecimal(exact, 2),
        currency: row.currency,
        horizon: declaredHorizon,
        evidenceRef:
          evidenceString(row.evidence, 'evidenceRef') ??
          `recommendation:${row.id}`,
      });
    }
  }

  const decision = normalizedDecision(row.decision);
  const state = normalizedState(row.savingState);
  const confidenceBand = normalizedConfidence(row.confidenceBand);
  const defaultNextAction =
    decision === 'OPTIMIZE'
      ? 'Review the implementation guide and staged rollout conditions.'
      : decision === 'DO_NOT_CHANGE'
        ? 'Keep the current configuration and review the failed constraint.'
        : 'Collect the missing benchmark or comparability evidence.';

  return Object.freeze({
    recommendationId: row.id,
    priorityRank,
    title:
      evidenceString(row.evidence, 'title') ??
      'Review the highest-ranked optimization evidence',
    state,
    decision,
    saving,
    modeledRange: null,
    detectionConfidence: normalizedConfidence(
      evidenceString(row.evidence, 'detectionConfidence') ?? row.confidenceBand,
    ),
    savingsConfidence: normalizedSavingsConfidence(row.evidence, state),
    confidenceBand,
    principalLimitation: evidenceString(row.evidence, 'principalLimitation'),
    nextAction: evidenceString(row.evidence, 'nextAction') ?? defaultNextAction,
  });
}

export async function loadFounderDashboardEvidence(
  db: PersistenceDatabase,
  session: AuthenticatedSession,
  organizationId: string,
): Promise<DashboardEvidence> {
  requireOrganizationAccess({ session, organizationId, action: 'READ' });

  const organization = (
    await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)
  ).at(0);
  if (organization === undefined) throw new Error('ORGANIZATION_NOT_FOUND');

  const latestAttempt = (
    await db
      .select()
      .from(importRuns)
      .where(eq(importRuns.organizationId, organizationId))
      .orderBy(desc(importRuns.receivedAt))
      .limit(1)
  ).at(0);

  const latestUsable = (
    await db
      .select()
      .from(importRuns)
      .where(
        and(
          eq(importRuns.organizationId, organizationId),
          or(
            eq(importRuns.status, 'COMPLETED'),
            eq(importRuns.status, 'PARTIAL'),
          ),
        ),
      )
      .orderBy(desc(importRuns.receivedAt))
      .limit(1)
  ).at(0);

  const limitations: string[] = [];
  if (
    latestAttempt?.status === 'FAILED' &&
    latestUsable !== undefined &&
    latestAttempt.id !== latestUsable.id
  ) {
    limitations.push(
      'The latest import failed; this view uses the most recent prior usable import.',
    );
  }

  if (latestUsable === undefined) {
    return Object.freeze({
      organizationName: organization.name,
      periodLabel: 'No comparable period',
      dataQuality: 'NO_DATA',
      observedSpend: null,
      completeCalendarDays: 0,
      recommendations: Object.freeze([]),
      nonOverlappingModeledTotal: null,
      strongestAction: null,
      verifiedNetSavings: null,
      diagnosticFacts: Object.freeze([]),
      isDemo: organization.isDemo,
      limitations: Object.freeze([
        ...limitations,
        'No completed or partial import is available for this organization.',
      ]),
    });
  }

  const coverage =
    latestUsable.rangeStart !== null && latestUsable.rangeEnd !== null
      ? summarizeCoverage({
          intervals: [
            {
              start: latestUsable.rangeStart,
              end: latestUsable.rangeEnd,
              complete: latestUsable.status === 'COMPLETED',
            },
          ],
          timezone: organization.timezone,
        })
      : null;

  if (coverage === null) {
    limitations.push('Import coverage boundaries are unavailable.');
  } else if (latestUsable.status === 'PARTIAL') {
    limitations.push(
      'The selected import is partial; missing intervals are unknown.',
    );
  }

  const rows = await db
    .select()
    .from(usageRecords)
    .where(
      and(
        eq(usageRecords.organizationId, organizationId),
        eq(usageRecords.importRunId, latestUsable.id),
      ),
    );

  let total = rational(0n);
  let hasCost = false;
  let mixedCurrencyExcluded = false;
  for (const row of rows) {
    if (row.totalCost === null) continue;
    if (row.currency !== organization.reportingCurrency) {
      mixedCurrencyExcluded = true;
      continue;
    }
    total = add(total, parseDecimal(row.totalCost));
    hasCost = true;
  }
  if (mixedCurrencyExcluded) {
    limitations.push(
      'Records in currencies other than the organization reporting currency are excluded from observed spend.',
    );
  }

  const canonicalRecords = rows.flatMap((row) => {
    const parsed = usageRecordSchema.safeParse(row.canonical);
    if (!parsed.success) {
      limitations.push(
        `Canonical usage evidence failed validation for record ${row.id}; diagnostic facts exclude it.`,
      );
      return [];
    }
    return [parsed.data];
  });
  const diagnosis = diagnoseUsage({
    records: canonicalRecords,
    reportingCurrency: organization.reportingCurrency,
  });
  limitations.push(...diagnosis.limitations);
  const diagnosticFacts = diagnosis.facts
    .filter((fact) => fact.key !== 'TOTAL_SPEND')
    .map((fact) =>
      Object.freeze({
        label: fact.label,
        value: fact.value,
        evidenceRef: `import:${latestUsable.id}#${fact.key}`,
        evidence: fact.evidence,
      }),
    );

  const recentRecommendationRows = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.organizationId, organizationId))
    .orderBy(desc(recommendations.createdAt))
    .limit(100);
  const currentEvidenceRows = recentRecommendationRows.filter((row) => {
    const sourceImportId = evidenceString(row.evidence, 'sourceImportId');
    if (sourceImportId !== null) return sourceImportId === latestUsable.id;
    return row.createdAt >= latestUsable.receivedAt;
  });
  const rankedRows = currentEvidenceRows
    .map((row) => ({ row, rank: evidenceRank(row.evidence) }))
    .filter(
      (
        item,
      ): item is { row: typeof recommendations.$inferSelect; rank: number } =>
        item.rank !== null,
    )
    .sort(
      (left, right) =>
        stateRank(left.row.savingState) - stateRank(right.row.savingState) ||
        left.rank - right.rank ||
        right.row.createdAt.localeCompare(left.row.createdAt) ||
        left.row.id.localeCompare(right.row.id),
    )
    .slice(0, 3);

  if (rankedRows.length === 0 && currentEvidenceRows.length > 0) {
    limitations.push(
      'Recommendation rank metadata is unavailable, so no strongest action is claimed.',
    );
  }

  const projectionEligible = coverage?.eligibleForThirtyDayProjection === true;
  const recommendationViews = Object.freeze(
    rankedRows.map(({ row, rank }) =>
      recommendationView(row, rank, projectionEligible, limitations),
    ),
  );
  const strongestAction = recommendationViews[0] ?? null;
  const rankOne = rankedRows.at(0)?.row;

  let verifiedNetSavings: DashboardEvidence['verifiedNetSavings'] = null;
  if (rankOne !== undefined) {
    const verification = (
      await db
        .select()
        .from(verificationWindows)
        .where(
          and(
            eq(verificationWindows.organizationId, organizationId),
            eq(verificationWindows.recommendationId, rankOne.id),
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
        currency: rankOne.currency ?? organization.reportingCurrency,
        evidenceRef: `verification:${verification.id}`,
        formulaVersion: verification.formulaVersion,
      });
    } else if (verification !== undefined) {
      limitations.push(
        'Verified impact is withheld because exact financial evidence or formula version is incomplete.',
      );
    }
  }

  const dataQuality =
    latestUsable.status === 'PARTIAL'
      ? 'PARTIAL_DATA'
      : latestUsable.acceptedRows === 0
        ? 'ZERO_USAGE'
        : 'READY';

  return Object.freeze({
    organizationName: organization.name,
    periodLabel: periodLabel(latestUsable.rangeStart, latestUsable.rangeEnd),
    dataQuality,
    observedSpend: hasCost
      ? Object.freeze({
          amount: formatDecimal(total, 2),
          currency: organization.reportingCurrency,
          evidenceRef: `import:${latestUsable.id}`,
        })
      : null,
    completeCalendarDays: coverage?.completeDays.length ?? 0,
    recommendations: recommendationViews,
    nonOverlappingModeledTotal: null,
    strongestAction,
    verifiedNetSavings,
    diagnosticFacts: Object.freeze(diagnosticFacts),
    isDemo:
      organization.isDemo ||
      latestUsable.isDemo ||
      rankedRows.some(({ row }) => row.isDemo),
    limitations: Object.freeze(limitations),
  });
}
