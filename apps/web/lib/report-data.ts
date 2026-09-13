import { and, desc, eq } from 'drizzle-orm';
import { formatDecimal, rational } from '../../../src/economics/exact.js';
import type { PersistenceDatabase } from '../../../src/persistence/database.js';
import {
  implementationRecords,
  recommendations,
  verificationWindows,
} from '../../../src/persistence/schema.js';
import { requireOrganizationAccess } from '../../../src/persistence/tenant.js';
import type {
  OptimizationReportEvidence,
  ReportFinancialClaim,
} from '../../../src/reports/report-view.js';
import type { AuthenticatedSession } from '../../../src/workbench/authz.js';
import { loadFounderDashboardEvidence } from './dashboard-data.js';
import { loadOptimizationLabEvidence } from './lab-data.js';

function stringField(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function stringList(
  record: Record<string, unknown>,
  key: string,
): readonly string[] {
  const value = record[key];
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze(
    value.filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0,
    ),
  );
}

function economicsClaim(
  row: typeof recommendations.$inferSelect,
  lab: Awaited<ReturnType<typeof loadOptimizationLabEvidence>>,
): ReportFinancialClaim | null {
  if (
    lab.economics.netSavingNumerator === null ||
    lab.economics.netSavingDenominator === null
  ) {
    return null;
  }

  const amount = formatDecimal(
    rational(
      BigInt(lab.economics.netSavingNumerator),
      BigInt(lab.economics.netSavingDenominator),
    ),
    2,
  );

  return Object.freeze({
    label: row.savingState === 'OPPORTUNITY' ? 'Potential net saving' : 'Tested net saving',
    amount,
    currency: lab.economics.currency,
    state: row.savingState === 'OPPORTUNITY' ? 'OPPORTUNITY' : 'TESTED',
    horizon: lab.economics.horizon,
    evidenceRef: lab.economics.evidenceRef,
    formulaVersion: lab.economics.formulaVersion,
  });
}

export async function loadOptimizationReportEvidence(
  db: PersistenceDatabase,
  session: AuthenticatedSession,
  organizationId: string,
  recommendationId: string,
): Promise<OptimizationReportEvidence> {
  requireOrganizationAccess({ session, organizationId, action: 'READ' });

  const [row] = await db
    .select()
    .from(recommendations)
    .where(
      and(
        eq(recommendations.organizationId, organizationId),
        eq(recommendations.id, recommendationId),
      ),
    )
    .limit(1);
  if (row === undefined) throw new Error('RECOMMENDATION_NOT_FOUND');

  const [dashboard, lab] = await Promise.all([
    loadFounderDashboardEvidence(db, session, organizationId),
    loadOptimizationLabEvidence(
      db,
      session,
      organizationId,
      recommendationId,
    ),
  ]);

  const limitations = [...dashboard.limitations];

  const measuredFact =
    stringField(row.evidence, 'measuredFact') ??
    'Measured fact was not recorded in the persisted recommendation evidence.';
  const inference =
    stringField(row.evidence, 'inference') ??
    'Inference was not recorded in the persisted recommendation evidence.';
  const hypothesis =
    stringField(row.evidence, 'hypothesis') ??
    'Optimization hypothesis was not recorded in the persisted recommendation evidence.';

  if (stringField(row.evidence, 'measuredFact') === null) {
    limitations.push('Measured-fact narrative is missing from recommendation evidence.');
  }
  if (stringField(row.evidence, 'inference') === null) {
    limitations.push('Inference narrative is missing from recommendation evidence.');
  }
  if (stringField(row.evidence, 'hypothesis') === null) {
    limitations.push('Optimization hypothesis narrative is missing from recommendation evidence.');
  }

  const [implementation] = await db
    .select()
    .from(implementationRecords)
    .where(
      and(
        eq(implementationRecords.organizationId, organizationId),
        eq(implementationRecords.recommendationId, recommendationId),
      ),
    )
    .limit(1);

  const [verification] = await db
    .select()
    .from(verificationWindows)
    .where(
      and(
        eq(verificationWindows.organizationId, organizationId),
        eq(verificationWindows.recommendationId, recommendationId),
      ),
    )
    .orderBy(desc(verificationWindows.createdAt))
    .limit(1);

  let verificationClaim: ReportFinancialClaim | null = null;
  if (
    verification?.status === 'VERIFIED' &&
    verification.netImpactNumerator !== null &&
    verification.netImpactDenominator !== null &&
    verification.formulaVersion !== null
  ) {
    verificationClaim = Object.freeze({
      label: 'Verified net impact',
      amount: formatDecimal(
        rational(
          BigInt(verification.netImpactNumerator),
          BigInt(verification.netImpactDenominator),
        ),
        2,
      ),
      currency: row.currency ?? dashboard.observedSpend?.currency ?? 'USD',
      state: 'VERIFIED',
      horizon: `${verification.postStart.slice(0, 10)} to ${verification.postEnd.slice(0, 10)}`,
      evidenceRef: `verification:${verification.id}`,
      formulaVersion: verification.formulaVersion,
    });
  } else if (verification?.status === 'VERIFIED') {
    limitations.push(
      'Verification is marked VERIFIED but exact financial evidence is incomplete, so no verified financial claim is rendered.',
    );
  }

  const observedSpend =
    dashboard.observedSpend === null
      ? null
      : Object.freeze({
          label: 'Observed spend',
          amount: dashboard.observedSpend.amount,
          currency: dashboard.observedSpend.currency,
          state: 'OBSERVED' as const,
          horizon: dashboard.periodLabel,
          evidenceRef: dashboard.observedSpend.evidenceRef,
          formulaVersion: 'source-cost-v1',
        });

  const fallbackRollback = stringList(row.evidence, 'rollbackInstructions');
  const implementationEvidence =
    implementation === undefined
      ? Object.freeze({
          proposedChange:
            stringField(row.evidence, 'proposedChange') ??
            'Implementation has not been confirmed.',
          rollbackInstructions:
            fallbackRollback.length > 0
              ? fallbackRollback
              : Object.freeze(['No persisted rollback instruction is available yet.']),
        })
      : Object.freeze({
          proposedChange: implementation.deploymentNote,
          rollbackInstructions: Object.freeze([
            ...implementation.rollbackInstructions,
          ]),
        });

  if (implementation === undefined) {
    limitations.push('Implementation has not been confirmed in the evidence ledger.');
  }

  const verificationStatus =
    verification === undefined
      ? 'PENDING'
      : verification.status === 'VERIFIED'
        ? 'VERIFIED'
        : verification.status === 'FAILED'
          ? 'FAILED'
          : 'INSUFFICIENT_EVIDENCE';

  return Object.freeze({
    organizationName: dashboard.organizationName,
    reportPeriod: dashboard.periodLabel,
    dataQuality: dashboard.dataQuality,
    observedSpend,
    opportunity: Object.freeze({
      measuredFact,
      inference,
      hypothesis,
      savingState: row.savingState,
    }),
    benchmark: Object.freeze({
      decision: lab.persistedDecision,
      currentConfiguration: lab.current.configurationId,
      candidateConfiguration: lab.candidate.configurationId,
      constraintSummary: Object.freeze(
        lab.constraints.map(
          (constraint) =>
            `${constraint.name}: ${constraint.candidateMeasured ?? 'MISSING'} against ${constraint.kind === 'MINIMUM' ? '≥' : '≤'} ${constraint.required}`,
        ),
      ),
    }),
    economics: economicsClaim(row, lab),
    confidence: Object.freeze({
      band: lab.confidence.band,
      reasons: Object.freeze([...lab.confidence.reasons]),
    }),
    implementation: implementationEvidence,
    verification: Object.freeze({
      status: verificationStatus,
      summary:
        verification === undefined
          ? 'Comparable post-change verification evidence is not available yet.'
          : `Verification status: ${verification.status}.`,
      financialClaim: verificationClaim,
    }),
    methodologyVersion:
      row.detectorVersion ?? stringField(row.evidence, 'methodologyVersion') ?? 'optimizer-v0',
    limitations: Object.freeze(limitations),
    isDemo: dashboard.isDemo || row.isDemo || lab.isDemo,
  });
}
