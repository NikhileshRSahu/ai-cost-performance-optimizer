import { z } from 'zod';
import type { AuthorizationResult } from '../workbench/authz.js';

const nonEmptyList = z.array(z.string().trim().min(1)).min(1);

const guideSchema = z
  .object({
    recommendationId: z.string().trim().min(1),
    organizationId: z.string().trim().min(1),
    proposedChange: z.string().trim().min(1),
    workload: z.string().trim().min(1),
    environment: z.string().trim().min(1),
    prerequisites: nonEmptyList,
    rolloutSteps: nonEmptyList,
    metricsToWatch: nonEmptyList,
    stopConditions: nonEmptyList,
    rollbackInstructions: nonEmptyList,
    expectedEconomicsEvidenceRef: z.string().trim().min(1),
    reviewedByOperatorUserId: z.string().trim().min(1).nullable(),
    reviewedAt: z.iso.datetime({ offset: true }).nullable(),
  })
  .strict();

const implementationSchema = z
  .object({
    recommendationId: z.string().trim().min(1),
    organizationId: z.string().trim().min(1),
    implementedAt: z.iso.datetime({ offset: true }),
    rolloutStart: z.iso.datetime({ offset: true }),
    stabilizationEnd: z.iso.datetime({ offset: true }),
    deploymentNote: z.string().trim().min(1),
    rollbackInstructions: nonEmptyList,
    confirmedByUserId: z.string().trim().min(1),
  })
  .strict();

export type ImplementationGuide = Readonly<z.infer<typeof guideSchema>>;
export type ImplementationRecord = Readonly<
  z.infer<typeof implementationSchema>
>;

function freezeList(values: readonly string[]): readonly string[] {
  return Object.freeze([...values]);
}

function requireOperatorAuthorization(
  authorization: AuthorizationResult,
): void {
  if (
    !authorization.allowed ||
    (authorization.role !== 'OWNER' && authorization.role !== 'OPERATOR')
  ) {
    throw new Error('AUTHORIZED_OPERATOR_REQUIRED');
  }
}

export function markGuideReviewed(
  input: Readonly<{
    guide: ImplementationGuide;
    authorization: AuthorizationResult;
    userId: string;
    reviewedAt: string;
  }>,
): ImplementationGuide {
  requireOperatorAuthorization(input.authorization);
  const data = guideSchema.parse({
    ...input.guide,
    reviewedByOperatorUserId: input.userId,
    reviewedAt: input.reviewedAt,
  });
  return Object.freeze({
    ...data,
    prerequisites: freezeList(data.prerequisites),
    rolloutSteps: freezeList(data.rolloutSteps),
    metricsToWatch: freezeList(data.metricsToWatch),
    stopConditions: freezeList(data.stopConditions),
    rollbackInstructions: freezeList(data.rollbackInstructions),
  });
}

export function createImplementationRecord(
  input: ImplementationRecord &
    Readonly<{
      authorization: AuthorizationResult;
    }>,
): ImplementationRecord {
  requireOperatorAuthorization(input.authorization);
  const { authorization: _authorization, ...candidate } = input;
  void _authorization;
  const data = implementationSchema.parse(candidate);
  if (Date.parse(data.stabilizationEnd) < Date.parse(data.rolloutStart)) {
    throw new Error('INVALID_STABILIZATION_INTERVAL');
  }
  return Object.freeze({
    ...data,
    rollbackInstructions: freezeList(data.rollbackInstructions),
  });
}
