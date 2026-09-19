import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { compare, parseDecimal, rational } from '../economics/exact.js';
import type { PersistenceDatabase } from '../persistence/database.js';
import { workloads } from '../persistence/schema.js';
import { requireOrganizationAccess } from '../persistence/tenant.js';
import type { AuthenticatedSession } from './authz.js';

const decimal = z
  .string()
  .trim()
  .regex(/^(0|[1-9]\d*)(\.\d+)?$/);

const workloadInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    environment: z.string().trim().min(1).max(80),
    requiredQuality: decimal,
    maxP95LatencyMs: decimal.nullable(),
    maxFailureRate: decimal.nullable(),
  })
  .strict();

export type WorkloadConstraintInput = z.infer<typeof workloadInputSchema>;

type PersistedWorkloadConstraintSet = Readonly<{
  requiredQuality: string;
  maxP95LatencyMs: string | null;
  maxFailureRate: string | null;
  version: 'constraints-v1';
}>;

function workloadId(
  organizationId: string,
  name: string,
  environment: string,
): string {
  const digest = createHash('sha256')
    .update(`${organizationId}\0${name}\0${environment}`)
    .digest('hex')
    .slice(0, 20);
  return `workload-${digest}`;
}

function validateFraction(value: string, code: string): void {
  const parsed = parseDecimal(value);
  if (compare(parsed, rational(0n)) < 0 || compare(parsed, rational(1n)) > 0) {
    throw new Error(code);
  }
}

export async function saveWorkloadConstraints(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    values: WorkloadConstraintInput;
  }>,
) {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'BENCHMARK',
  });

  const values = workloadInputSchema.parse(input.values);
  validateFraction(values.requiredQuality, 'REQUIRED_QUALITY_OUT_OF_RANGE');
  if (values.maxFailureRate !== null) {
    validateFraction(values.maxFailureRate, 'MAX_FAILURE_RATE_OUT_OF_RANGE');
  }
  if (
    values.maxP95LatencyMs !== null &&
    compare(parseDecimal(values.maxP95LatencyMs), rational(0n)) <= 0
  ) {
    throw new Error('MAX_P95_LATENCY_MUST_BE_POSITIVE');
  }

  const id = workloadId(input.organizationId, values.name, values.environment);
  const constraintSet: PersistedWorkloadConstraintSet = Object.freeze({
    requiredQuality: values.requiredQuality,
    maxP95LatencyMs: values.maxP95LatencyMs,
    maxFailureRate: values.maxFailureRate,
    version: 'constraints-v1',
  });

  const existing = (
    await input.db
      .select({ id: workloads.id })
      .from(workloads)
      .where(
        and(
          eq(workloads.organizationId, input.organizationId),
          eq(workloads.id, id),
        ),
      )
      .limit(1)
  ).at(0);

  if (existing === undefined) {
    await input.db.insert(workloads).values({
      id,
      organizationId: input.organizationId,
      name: values.name,
      environment: values.environment,
      constraintSet,
    });
  } else {
    await input.db
      .update(workloads)
      .set({ constraintSet })
      .where(
        and(
          eq(workloads.organizationId, input.organizationId),
          eq(workloads.id, id),
        ),
      );
  }

  return Object.freeze({
    id,
    organizationId: input.organizationId,
    name: values.name,
    environment: values.environment,
    constraintSet,
  });
}
