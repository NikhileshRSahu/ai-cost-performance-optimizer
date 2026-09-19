import { z } from 'zod';

const countSchema = z.string().regex(/^(0|[1-9]\d{0,25})$/);
const moneySchema = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/);
const latencySchema = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/);

export const productionOutcomeSchema = z.enum([
  'SUCCESS',
  'FAILURE',
  'TIMEOUT',
  'CANCELLED',
]);

export const productionTelemetryEventSchema = z
  .object({
    schemaVersion: z.literal('production-telemetry-v1'),
    eventId: z.string().trim().min(1).max(256),
    occurredAt: z.iso.datetime({ offset: true }),
    provider: z.string().trim().min(1).max(128),
    model: z.string().trim().min(1).max(256),
    workload: z.string().trim().min(1).max(256),
    configurationId: z.string().trim().min(1).max(256),
    operationId: z.string().trim().min(1).max(256),
    attemptNumber: countSchema,
    retryCount: countSchema,
    outcome: productionOutcomeSchema,
    totalCost: moneySchema,
    currency: z.string().regex(/^[A-Z]{3}$/),
    latencyMs: latencySchema,
    inputTokens: countSchema.nullable(),
    cachedInputTokens: countSchema.nullable(),
    cacheWriteTokens: countSchema.nullable(),
    outputTokens: countSchema.nullable(),
    outputCost: moneySchema.nullable(),
    toolCalls: countSchema.nullable(),
    toolCost: moneySchema.nullable(),
    stablePrefixHash: z.string().trim().min(1).max(256).nullable(),
    stablePrefixTokens: countSchema.nullable(),
    cacheEligibleInputTokens: countSchema.nullable(),
    outcomeValue: z.string().trim().min(1).max(256).nullable(),
    outcomeUnit: z.string().trim().min(1).max(128).nullable(),
    tags: z.record(z.string().max(64), z.string().max(256)).default({}),
  })
  .strict();

export type ProductionTelemetryEvent = z.infer<
  typeof productionTelemetryEventSchema
>;

export const productionTelemetryBatchSchema = z
  .object({
    schemaVersion: z.literal('production-telemetry-batch-v1'),
    events: z.array(productionTelemetryEventSchema).min(1).max(10_000),
  })
  .strict();

export type ProductionTelemetryBatch = z.infer<
  typeof productionTelemetryBatchSchema
>;
