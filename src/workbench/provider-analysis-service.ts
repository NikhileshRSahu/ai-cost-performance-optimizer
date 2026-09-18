import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { NormalizedProviderEvidence } from '../ingestion/provider-evidence.js';
import type { PersistenceDatabase } from '../persistence/database.js';
import { createEvidenceRepository } from '../persistence/repositories/evidence.js';
import { recommendations } from '../persistence/schema.js';
import { requireOrganizationAccess } from '../persistence/tenant.js';
import type { AuthenticatedSession } from './authz.js';

type ProviderOpportunity = Readonly<{
  kind: string;
  title: string;
  measuredFact: string;
  trigger: string;
  nextAction: string;
  limitation: string;
  confidence: 'LOW' | 'MEDIUM';
}>;

function opportunityFromEvidence(
  evidence: NormalizedProviderEvidence,
): ProviderOpportunity | null {
  let requests = 0n;
  let outputTokens = 0n;
  for (const row of evidence.usage) {
    if (row.requests !== null) requests += BigInt(row.requests);
    outputTokens += BigInt(row.outputTokens);
  }

  if (requests > 0n && outputTokens > requests * 500n) {
    const scaledAverage = (outputTokens * 100n) / requests;
    const average = Number(scaledAverage) / 100;
    return Object.freeze({
      kind: 'OUTPUT_LENGTH',
      title: 'Reduce oversized model outputs before paying for them',
      measuredFact: `Measured output volume averages ${average.toFixed(2)} tokens per request.`,
      trigger:
        'Observed output tokens per request exceed the current efficiency threshold.',
      nextAction:
        'Test a shorter output budget or tighter response format on representative requests while preserving answer quality.',
      limitation:
        'Provider usage proves output volume, not how much can be removed safely. Exact savings remain unmeasured until a controlled test.',
      confidence: 'MEDIUM',
    });
  }

  const modelTokens = new Map<string, bigint>();
  let totalTokens = 0n;
  for (const row of evidence.usage) {
    if (row.model === null) continue;
    const tokens = BigInt(row.inputTokens) + BigInt(row.outputTokens);
    if (tokens <= 0n) continue;
    totalTokens += tokens;
    modelTokens.set(row.model, (modelTokens.get(row.model) ?? 0n) + tokens);
  }
  const top = [...modelTokens.entries()].sort((left, right) =>
    left[1] === right[1] ? 0 : left[1] > right[1] ? -1 : 1,
  )[0];

  if (
    top !== undefined &&
    totalTokens > 0n &&
    top[1] * 100n >= totalTokens * 80n
  ) {
    const scaledShare = (top[1] * 10000n) / totalTokens;
    const share = Number(scaledShare) / 100;
    return Object.freeze({
      kind: 'MODEL_VOLUME_CONCENTRATION',
      title: `Test a cheaper candidate for high-volume ${top[0]} traffic`,
      measuredFact: `${top[0]} accounts for ${share.toFixed(2)}% of measured token volume.`,
      trigger: 'One model dominates the measured provider usage window.',
      nextAction:
        'Benchmark a lower-cost candidate on representative traffic and keep the current quality floor as the constraint.',
      limitation:
        'Token-volume concentration is measured, but provider billing does not prove model-level savings for this recommendation. Exact savings remain unmeasured.',
      confidence: 'MEDIUM',
    });
  }

  return null;
}

function recommendationId(
  organizationId: string,
  snapshotId: string,
  kind: string,
): string {
  const digest = createHash('sha256')
    .update(`${organizationId}\0${snapshotId}\0${kind}`)
    .digest('hex')
    .slice(0, 24);
  return `opp-${digest}`;
}

export async function analyzeProviderEvidence(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    snapshotId: string;
    evidence: NormalizedProviderEvidence;
  }>,
): Promise<Readonly<{ recommendationId: string | null }>> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'BENCHMARK',
  });

  const opportunity = opportunityFromEvidence(input.evidence);
  if (opportunity === null) {
    return Object.freeze({ recommendationId: null });
  }

  const id = recommendationId(
    input.organizationId,
    input.snapshotId,
    opportunity.kind,
  );
  const existing = (
    await input.db
      .select({ id: recommendations.id })
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
    const evidenceRef = `provider-snapshot:${input.snapshotId}`;
    await input.db.insert(recommendations).values({
      id,
      organizationId: input.organizationId,
      workloadId: null,
      decision: 'INSUFFICIENT_EVIDENCE',
      savingState: 'OPPORTUNITY',
      detectorVersion: 'provider-native-v1',
      confidenceBand: opportunity.confidence,
      netSavingNumerator: null,
      netSavingDenominator: null,
      currency: null,
      evidence: {
        priorityRank: 1,
        title: opportunity.title,
        measuredFact: opportunity.measuredFact,
        inference: opportunity.trigger,
        hypothesis: opportunity.nextAction,
        principalLimitation: opportunity.limitation,
        nextAction: opportunity.nextAction,
        evidenceRef,
        methodologyVersion: 'provider-native-v1',
        opportunityKind: opportunity.kind,
        sourceProviderSnapshotId: input.snapshotId,
        detectionConfidence: opportunity.confidence,
        savingsConfidence: 'UNMEASURED',
      },
      isDemo: false,
    });

    const evidenceRepository = createEvidenceRepository(input.db);
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

  return Object.freeze({ recommendationId: id });
}
