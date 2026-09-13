import { and, eq } from 'drizzle-orm';
import type { PersistenceDatabase } from '../../../src/persistence/database.js';
import { recommendations } from '../../../src/persistence/schema.js';
import { requireOrganizationAccess } from '../../../src/persistence/tenant.js';
import type { AuthenticatedSession } from '../../../src/workbench/authz.js';
import {
  parseOptimizationLabEvidence,
  type LabDecision,
  type OptimizationLabEvidence,
} from '../../../src/workbench/lab-view.js';

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('LAB_EVIDENCE_INCOMPLETE');
  }
  return value as Record<string, unknown>;
}

function persistedDecision(value: string): LabDecision {
  if (
    value === 'OPTIMIZE' ||
    value === 'DO_NOT_CHANGE' ||
    value === 'INSUFFICIENT_EVIDENCE'
  ) {
    return value;
  }
  return 'INSUFFICIENT_EVIDENCE';
}

export async function loadOptimizationLabEvidence(
  db: PersistenceDatabase,
  session: AuthenticatedSession,
  organizationId: string,
  recommendationId: string,
): Promise<OptimizationLabEvidence> {
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

  const lab = asRecord(row.evidence.lab);
  return parseOptimizationLabEvidence({
    ...lab,
    recommendationId: row.id,
    persistedDecision: persistedDecision(row.decision),
    isDemo: row.isDemo,
  });
}
