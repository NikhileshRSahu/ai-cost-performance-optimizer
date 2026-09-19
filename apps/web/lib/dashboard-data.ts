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
import { loadLatestProviderDashboardEvidence } from './provider-dashboard-data';
import type {
  DashboardDecision,
  DashboardEvidence,
  DashboardRecommendationEvidence,
  DashboardSavingsState,
} from '../../../src/workbench/dashboard-view';

export type DashboardSelection =
  | Readonly<{ source: 'AUTO' }>
  | Readonly<{ source: 'IMPORT'; importId: string }>
  | Readonly<{ source: 'DEMO'; importId: string }>
  | Readonly<{
      source: 'PROVIDER';
      providerName: 'OpenAI' | 'Anthropic' | null;
    }>;

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
    workloadName: evidenceString(row.evidence, 'workloadName'),
    currentConfigurationId: evidenceString(
      row.evidence,
      'currentConfigurationId',
    ),
    measuredFact: evidenceString(row.evidence, 'measuredFact'),
    inference: evidenceString(row.evidence, 'inference'),
    qualityGuard: evidenceString(row.evidence, 'qualityGuard'),
  });
}

export async function loadFounderDashboardEvidence(
  db: PersistenceDatabase,
  session: AuthenticatedSession,
  organizationId: string,
  selection: DashboardSelection = Object.freeze({ source: 'AUTO' }),
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

  const explicitImportId =
    selection.source === 'IMPORT' || selection.source === 'DEMO'
      ? selection.importId
      : null;

  const explicitImport =
    explicitImportId === null
      ? undefined
      : (
          await db
            .select()
            .from(importRuns)
            .where(
              and(
                eq(importRuns.organizationId, organizationId),
                eq(importRuns.id, explicitImportId),
              ),
            )
            .limit(1)
        ).at(0);

  const latestAttempt =
    explicitImportId === null
      ? (
          await db
            .select()
            .from(importRuns)
            .where(eq(importRuns.organizationId, organizationId))
            .orderBy(desc(importRuns.receivedAt))
            .limit(1)
        ).at(0)
      : explicitImport;

  let latestUsable =
    explicitImportId === null
      ? (
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
        ).at(0)
      : explicitImport !== undefined &&
          (explicitImport.status === 'COMPLETED' ||
            explicitImport.status === 'PARTIAL') &&
          (selection.source !== 'DEMO' || explicitImport.isDemo)
        ? explicitImport
        : undefined;

  if (selection.source === 'AUTO' && latestUsable !== undefined) {
    const recentVerifications = await db
      .select({ evidence: verificationWindows.evidence })
      .from(verificationWindows)
      .where(eq(verificationWindows.organizationId, organizationId))
      .orderBy(desc(verificationWindows.createdAt))
      .limit(50);

    const verificationForLatestImport = recentVerifications.find(
      (row) =>
        evidenceString(row.evidence, 'postImportId') === latestUsable?.id,
    );
    const baselineImportId =
      verificationForLatestImport === undefined
        ? null
        : evidenceString(
            verificationForLatestImport.evidence,
            'baselineImportId',
          );

    if (baselineImportId !== null) {
      const baselineImport = (
        await db
          .select()
          .from(importRuns)
          .where(
            and(
              eq(importRuns.organizationId, organizationId),
              eq(importRuns.id, baselineImportId),
              or(
                eq(importRuns.status, 'COMPLETED'),
                eq(importRuns.status, 'PARTIAL'),
              ),
            ),
          )
          .limit(1)
      ).at(0);

      if (baselineImport !== undefined) {
        latestUsable = baselineImport;
      }
    }
  }

  if (selection.source === 'PROVIDER') {
    const providerEvidence = await loadLatestProviderDashboardEvidence(
      db,
      session,
      organizationId,
      null,
      selection.providerName,
    );
    if (providerEvidence !== null) return providerEvidence;

    return Object.freeze({
      organizationName: organization.name,
      periodLabel: 'No provider evidence window',
      dataQuality: 'NO_DATA',
      sourceKind: 'PROVIDER',
      providerName: selection.providerName,
      observedSpend: null,
      completeCalendarDays: 0,
      strongestAction: null,
      verifiedNetSavings: null,
      diagnosticFacts: Object.freeze([]),
      isDemo: false,
      limitations: Object.freeze([
        'No completed provider evidence snapshot is available for the selected connection.',
      ]),
    });
  }

  if (selection.source === 'AUTO') {
    const providerEvidence = await loadLatestProviderDashboardEvidence(
      db,
      session,
      organizationId,
      latestUsable?.receivedAt ?? null,
      null,
    );
    if (providerEvidence !== null) return providerEvidence;
  }

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
      sourceKind:
        selection.source === 'DEMO'
          ? 'DEMO'
          : selection.source === 'IMPORT'
            ? 'CSV'
            : 'NONE',
      providerName: null,
      observedSpend: null,
      completeCalendarDays: 0,
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

  const rankedRows = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.organizationId, organizationId))
    .orderBy(desc(recommendations.createdAt))
    .limit(50);
  const scopedRecommendationRows = rankedRows.filter(
    (row) => evidenceString(row.evidence, 'sourceImportId') === latestUsable.id,
  );
  const rankOne = scopedRecommendationRows.find((row) =>
    hasRankOne(row.evidence),
  );
  if (rankOne === undefined && scopedRecommendationRows.length > 0) {
    limitations.push(
      'Recommendation rank metadata is unavailable for this evidence window, so no strongest action is claimed.',
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
    sourceKind: latestUsable.isDemo ? 'DEMO' : 'CSV',
    providerName: null,
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
    diagnosticFacts: Object.freeze(diagnosticFacts),
    isDemo:
      organization.isDemo || latestUsable.isDemo || rankOne?.isDemo === true,
    limitations: Object.freeze(limitations),
  });
}
