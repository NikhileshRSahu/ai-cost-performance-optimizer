import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { PersistenceDatabase } from '../persistence/database.js';
import { providerEvidenceSnapshots } from '../persistence/provider-evidence-schema.js';
import { requireOrganizationAccess } from '../persistence/tenant.js';
import type { NormalizedProviderEvidence } from '../ingestion/provider-evidence.js';
import type { AuthenticatedSession } from './authz.js';

export type ProviderEvidenceSource = 'OPENAI_ADMIN_API' | 'ANTHROPIC_ADMIN_API';

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalJson(item)).join(',') + ']';
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return (
    '{' +
    keys
      .map((key) => JSON.stringify(key) + ':' + canonicalJson(record[key]))
      .join(',') +
    '}'
  );
}

function checksum(
  input: Readonly<{
    source: ProviderEvidenceSource;
    intervalStart: string;
    intervalEnd: string;
    evidence: NormalizedProviderEvidence;
  }>,
): string {
  return createHash('sha256')
    .update(
      canonicalJson({
        source: input.source,
        intervalStart: input.intervalStart,
        intervalEnd: input.intervalEnd,
        usageEvidence: input.evidence.usage,
        costEvidence: input.evidence.costs,
      }),
      'utf8',
    )
    .digest('hex');
}

function validIso(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

export async function persistProviderEvidenceSnapshot(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    source: ProviderEvidenceSource;
    intervalStart: string;
    intervalEnd: string;
    receivedAt: string;
    evidence: NormalizedProviderEvidence;
  }>,
): Promise<Readonly<{ snapshotId: string; reused: boolean }>> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'IMPORT',
  });

  if (
    !validIso(input.intervalStart) ||
    !validIso(input.intervalEnd) ||
    !validIso(input.receivedAt) ||
    Date.parse(input.intervalEnd) <= Date.parse(input.intervalStart)
  ) {
    throw new Error('PROVIDER_EVIDENCE_INVALID_INTERVAL');
  }

  const digest = checksum(input);
  const id = `provider-${digest.slice(0, 24)}`;
  const existing = (
    await input.db
      .select({ id: providerEvidenceSnapshots.id })
      .from(providerEvidenceSnapshots)
      .where(
        and(
          eq(providerEvidenceSnapshots.organizationId, input.organizationId),
          eq(providerEvidenceSnapshots.checksum, digest),
        ),
      )
      .limit(1)
  ).at(0);

  if (existing !== undefined) {
    return Object.freeze({ snapshotId: existing.id, reused: true });
  }

  await input.db.insert(providerEvidenceSnapshots).values({
    id,
    organizationId: input.organizationId,
    source: input.source,
    checksum: digest,
    intervalStart: input.intervalStart,
    intervalEnd: input.intervalEnd,
    receivedAt: input.receivedAt,
    usageEvidence: input.evidence.usage.map((item) => ({ ...item })),
    costEvidence: input.evidence.costs.map((item) => ({ ...item })),
    isDemo: false,
  });

  return Object.freeze({ snapshotId: id, reused: false });
}
