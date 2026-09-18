import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { diagnoseUsage } from '../efficiency/usage-diagnosis.js';
import {
  generateOptimizationHypotheses,
  type HypothesisPolicy,
} from '../efficiency/hypotheses.js';
import type { PersistenceDatabase } from '../persistence/database.js';
import { createEvidenceRepository } from '../persistence/repositories/evidence.js';
import {
  importRuns,
  organizations,
  recommendations,
  usageRecords,
} from '../persistence/schema.js';
import { requireOrganizationAccess } from '../persistence/tenant.js';
import { usageRecordSchema } from '../usage/contracts.js';
import type { AuthenticatedSession } from './authz.js';

const DEFAULT_POLICY: HypothesisPolicy = Object.freeze({
  maximumTopModelCostShare: '0.80',
  maximumOutputTokensPerRequest: '500',
  minimumCacheHitRatio: '0.50',
});

export type PersistedUsageOpportunity = Readonly<{
  recommendationId: string;
  priorityRank: number;
  title: string;
  kind: string;
  state: 'OPPORTUNITY';
  decision: 'INSUFFICIENT_EVIDENCE';
  reused: boolean;
}>;

function recommendationId(
  organizationId: string,
  importId: string,
  hypothesisId: string,
): string {
  const digest = createHash('sha256')
    .update(`${organizationId}\0${importId}\0${hypothesisId}`)
    .digest('hex')
    .slice(0, 24);
  return `opp-${digest}`;
}

export async function analyzeImportedUsage(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    importId: string;
    policy?: HypothesisPolicy;
  }>,
): Promise<
  Readonly<{
    recommendations: readonly PersistedUsageOpportunity[];
    limitations: readonly string[];
  }>
> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'BENCHMARK',
  });

  const organization = (
    await input.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, input.organizationId))
      .limit(1)
  ).at(0);
  if (organization === undefined) throw new Error('ORGANIZATION_NOT_FOUND');

  const importRun = (
    await input.db
      .select()
      .from(importRuns)
      .where(
        and(
          eq(importRuns.organizationId, input.organizationId),
          eq(importRuns.id, input.importId),
        ),
      )
      .limit(1)
  ).at(0);
  if (importRun === undefined) throw new Error('IMPORT_NOT_FOUND');
  if (importRun.status === 'FAILED' || importRun.status === 'RECEIVED') {
    throw new Error('USABLE_IMPORT_REQUIRED');
  }

  const rows = await input.db
    .select()
    .from(usageRecords)
    .where(
      and(
        eq(usageRecords.organizationId, input.organizationId),
        eq(usageRecords.importRunId, input.importId),
      ),
    );

  const limitations: string[] = [];
  const canonicalRecords = rows.flatMap((row) => {
    const parsed = usageRecordSchema.safeParse(row.canonical);
    if (!parsed.success) {
      limitations.push(
        `Canonical usage evidence failed validation for record ${row.id}.`,
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

  const hypotheses = generateOptimizationHypotheses({
    diagnosis,
    policy: input.policy ?? DEFAULT_POLICY,
  });

  const workloadNames = [
    ...new Set(
      canonicalRecords.flatMap((record) =>
        record.workload === null ? [] : [record.workload],
      ),
    ),
  ];
  const models = [
    ...new Set(
      canonicalRecords.flatMap((record) =>
        record.model === null ? [] : [record.model],
      ),
    ),
  ];
  const concentratedModel =
    diagnosis.facts.find((fact) => fact.key === 'TOP_MODEL_COST_SHARE')
      ?.evidence.model ?? null;
  const inferredCurrentConfiguration =
    typeof concentratedModel === 'string' && concentratedModel.length > 0
      ? concentratedModel
      : models.length === 1
        ? models[0] ?? null
        : null;
  const inferredWorkload =
    workloadNames.length === 1 ? workloadNames[0] ?? null : null;

  const persisted: PersistedUsageOpportunity[] = [];
  const evidenceRepository = createEvidenceRepository(input.db);

  for (const [index, hypothesis] of hypotheses.entries()) {
    const id = recommendationId(
      input.organizationId,
      input.importId,
      hypothesis.id,
    );
    const priorityRank = index + 1;
    const existing = (
      await input.db
        .select()
        .from(recommendations)
        .where(
          and(
            eq(recommendations.organizationId, input.organizationId),
            eq(recommendations.id, id),
          ),
        )
        .limit(1)
    ).at(0);

    if (existing === undefined) {
      const evidenceRef = `usage-hypothesis:${input.importId}:${hypothesis.id}`;
      const measuredFact = diagnosis.facts
        .filter((fact) => hypothesis.evidenceKeys.includes(fact.key))
        .map((fact) => `${fact.label}: ${fact.value}`)
        .join('; ');

      await input.db.insert(recommendations).values({
        id,
        organizationId: input.organizationId,
        workloadId: null,
        decision: 'INSUFFICIENT_EVIDENCE',
        savingState: 'OPPORTUNITY',
        detectorVersion: 'usage-hypothesis-v1',
        confidenceBand: 'LOW',
        netSavingNumerator: null,
        netSavingDenominator: null,
        currency: null,
        evidence: {
          priorityRank,
          title: hypothesis.title,
          measuredFact:
            measuredFact.length > 0
              ? measuredFact
              : 'Measured usage evidence triggered this hypothesis.',
          inference: hypothesis.trigger,
          hypothesis: hypothesis.mechanism,
          principalLimitation: hypothesis.notClaimed,
          nextAction: hypothesis.testPlan,
          qualityGuard: hypothesis.qualityGuard,
          evidenceRef,
          methodologyVersion: 'usage-hypothesis-v1',
          opportunityKind: hypothesis.kind,
          sourceImportId: input.importId,
          workloadName: inferredWorkload,
          currentConfigurationId: inferredCurrentConfiguration,
        },
        isDemo: organization.isDemo || importRun.isDemo,
      });

      await evidenceRepository.appendLedgerEvent(input.session, {
        id: `${id}:opportunity`,
        recommendationId: id,
        organizationId: input.organizationId,
        type: 'STATE_RECORDED',
        state: 'OPPORTUNITY',
        occurredAt: new Date().toISOString(),
        evidenceRef,
        reason: null,
        invalidatesEventId: null,
      });
    }

    persisted.push(
      Object.freeze({
        recommendationId: id,
        priorityRank,
        title: hypothesis.title,
        kind: hypothesis.kind,
        state: 'OPPORTUNITY',
        decision: 'INSUFFICIENT_EVIDENCE',
        reused: existing !== undefined,
      }),
    );
  }

  return Object.freeze({
    recommendations: Object.freeze(persisted),
    limitations: Object.freeze(limitations),
  });
}
