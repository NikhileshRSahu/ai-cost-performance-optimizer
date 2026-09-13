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

type GuideData = z.infer<typeof guideSchema>;
type ImplementationData = z.infer<typeof implementationSchema>;

export type ImplementationGuide = Readonly<
  Omit<
    GuideData,
    | 'prerequisites'
    | 'rolloutSteps'
    | 'metricsToWatch'
    | 'stopConditions'
    | 'rollbackInstructions'
  > & {
    prerequisites: readonly string[];
    rolloutSteps: readonly string[];
    metricsToWatch: readonly string[];
    stopConditions: readonly string[];
    rollbackInstructions: readonly string[];
  }
>;

export type ImplementationRecord = Readonly<
  Omit<ImplementationData, 'rollbackInstructions'> & {
    rollbackInstructions: readonly string[];
  }
>;

function freezeList(values: readonly string[]): readonly string[] {
  return Object.freeze([...values]);
}

function requireOperatorAuthorization(
  authorization: AuthorizationResult,
  organizationId: string,
): void {
  if (
    !authorization.allowed ||
    (authorization.role !== 'OWNER' && authorization.role !== 'OPERATOR')
  ) {
    throw new Error('AUTHORIZED_OPERATOR_REQUIRED');
  }
  if (authorization.organizationId !== organizationId) {
    throw new Error('AUTHORIZED_ORGANIZATION_MISMATCH');
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
  requireOperatorAuthorization(input.authorization, input.guide.organizationId);
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
  requireOperatorAuthorization(input.authorization, input.organizationId);
  const candidate = {
    recommendationId: input.recommendationId,
    organizationId: input.organizationId,
    implementedAt: input.implementedAt,
    rolloutStart: input.rolloutStart,
    stabilizationEnd: input.stabilizationEnd,
    deploymentNote: input.deploymentNote,
    rollbackInstructions: input.rollbackInstructions,
    confirmedByUserId: input.confirmedByUserId,
  };
  const data = implementationSchema.parse(candidate);
  if (Date.parse(data.stabilizationEnd) < Date.parse(data.rolloutStart)) {
    throw new Error('INVALID_STABILIZATION_INTERVAL');
  }
  return Object.freeze({
    ...data,
    rollbackInstructions: freezeList(data.rollbackInstructions),
  });
}
