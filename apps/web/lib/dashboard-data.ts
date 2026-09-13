import { and, desc, eq, or } from 'drizzle-orm';
import { summarizeCoverage } from '../../../src/coverage/coverage';
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

function hasRankOne(evidence: Record<string, unknown>): boolean {
  const value = evidence.priorityRank;
  return value === 1 || value === '1';
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

function normalizedConfidence(
  value: string | null,
): DashboardRecommendationEvidence['confidenceBand'] {
  if (value === 'HIGH' || value === 'MEDIUM') return value;
  return 'LOW';
}

function periodLabel(start: string | null, end: string | null): string {
  if (start === null || end === null) return 'Period unavailable';
  return `${start.slice(0, 10)} to ${end.slice(0, 10)}`;
}

function recommendationView(
  row: typeof recommendations.$inferSelect,
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
  const defaultNextAction =
    decision === 'OPTIMIZE'
      ? 'Review the implementation guide and staged rollout conditions.'
      : decision === 'DO_NOT_CHANGE'
        ? 'Keep the current configuration and review the failed constraint.'
        : 'Collect the missing benchmark or comparability evidence.';

  return Object.freeze({
    recommendationId: row.id,
    title:
      evidenceString(row.evidence, 'title') ??
      'Review the highest-ranked optimization evidence',
    state: normalizedState(row.savingState),
    decision,
    saving,
    confidenceBand: normalizedConfidence(row.confidenceBand),
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
      strongestAction: null,
      verifiedNetSavings: null,
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

  const rankedRows = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.organizationId, organizationId))
    .orderBy(desc(recommendations.createdAt))
    .limit(50);
  const rankOne = rankedRows.find((row) => hasRankOne(row.evidence));
  if (rankOne === undefined && rankedRows.length > 0) {
    limitations.push(
      'Recommendation rank metadata is unavailable, so no strongest action is claimed.',
    );
  }

  const projectionEligible = coverage?.eligibleForThirtyDayProjection === true;
  const strongestAction =
    rankOne === undefined
      ? null
      : recommendationView(rankOne, projectionEligible, limitations);

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
    strongestAction,
    verifiedNetSavings,
    isDemo:
      organization.isDemo || latestUsable.isDemo || rankOne?.isDemo === true,
    limitations: Object.freeze(limitations),
  });
}
