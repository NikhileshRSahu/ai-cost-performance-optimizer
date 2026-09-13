import { and, eq } from 'drizzle-orm';
import {
  createImplementationRecord,
  type ImplementationRecord,
} from '../implementation/records.js';
import type { PersistenceDatabase } from '../persistence/database.js';
import { createEvidenceRepository } from '../persistence/repositories/evidence.js';
import {
  implementationRecords,
  recommendations,
} from '../persistence/schema.js';
import { requireOrganizationAccess } from '../persistence/tenant.js';
import type { AuthenticatedSession } from './authz.js';

export async function confirmImplementation(input: Readonly<{
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  organizationId: string;
  recommendationId: string;
  implementedAt: string;
  rolloutStart: string;
  stabilizationEnd: string;
  deploymentNote: string;
  rollbackInstructions: readonly string[];
}>): Promise<ImplementationRecord> {
  const authorization = requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'MARK_IMPLEMENTED',
  });

  const recommendation = (
    await input.db
      .select()
      .from(recommendations)
      .where(
        and(
          eq(recommendations.organizationId, input.organizationId),
          eq(recommendations.id, input.recommendationId),
        ),
      )
      .limit(1)
  ).at(0);
  if (recommendation === undefined) throw new Error('RECOMMENDATION_NOT_FOUND');
  if (
    recommendation.savingState !== 'TESTED' ||
    recommendation.decision !== 'OPTIMIZE'
  ) {
    throw new Error('RECOMMENDATION_NOT_READY_FOR_IMPLEMENTATION');
  }

  const existing = (
    await input.db
      .select()
      .from(implementationRecords)
      .where(
        and(
          eq(implementationRecords.organizationId, input.organizationId),
          eq(
            implementationRecords.recommendationId,
            input.recommendationId,
          ),
        ),
      )
      .limit(1)
  ).at(0);

  if (existing !== undefined) {
    return Object.freeze({
      recommendationId: existing.recommendationId,
      organizationId: existing.organizationId,
      implementedAt: existing.implementedAt,
      rolloutStart: existing.rolloutStart,
      stabilizationEnd: existing.stabilizationEnd,
      deploymentNote: existing.deploymentNote,
      rollbackInstructions: Object.freeze([...existing.rollbackInstructions]),
      confirmedByUserId: existing.confirmedByUserId,
    });
  }

  const record = createImplementationRecord({
    recommendationId: input.recommendationId,
    organizationId: input.organizationId,
    implementedAt: input.implementedAt,
    rolloutStart: input.rolloutStart,
    stabilizationEnd: input.stabilizationEnd,
    deploymentNote: input.deploymentNote,
    rollbackInstructions: input.rollbackInstructions,
    confirmedByUserId: input.session.userId,
    authorization,
  });

  await createEvidenceRepository(input.db).saveImplementation(
    input.session,
    record,
  );
  return record;
}
