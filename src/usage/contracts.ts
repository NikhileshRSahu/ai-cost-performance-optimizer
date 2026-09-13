import { z } from 'zod';

export const dataSourceSchema = z.enum(['DEMO','CSV','OPENAI_ADMIN_API','ANTHROPIC_ADMIN_API']);
export const granularitySchema = z.enum(['REQUEST','AGGREGATE_BUCKET']);
export const nullableString = z.string().trim().min(1).nullable();
export const nullableCount = z.string().regex(/^(0|[1-9]\d{0,25})$/).nullable();

export const usageRecordSchema = z.object({
  organizationId: z.string().min(1),
  source: dataSourceSchema,
  granularity: granularitySchema,
  intervalStart: z.string().datetime({ offset: true }),
  intervalEnd: z.string().datetime({ offset: true }),
  provider: z.string().min(1),
  model: z.string().min(1),
  requests: z.string().regex(/^(0|[1-9]\d{0,25})$/),
  totalCost: z.string(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  sourceEventId: nullableString,
  project: nullableString,
  workspace: nullableString,
  workload: nullableString,
  configurationId: nullableString,
  operationId: nullableString,
  attemptNumber: nullableCount,
  retryCount: nullableCount,
  inputTokens: nullableCount,
  cachedInputTokens: nullableCount,
  cacheWriteTokens: nullableCount,
  outputTokens: nullableCount,
  outputCost: z.string().nullable(),
  toolCalls: nullableCount,
  toolCost: z.string().nullable(),
  successes: nullableCount,
  failures: nullableCount,
  latencyP50Ms: z.string().regex(/^(0|[1-9]\d*)(\.\d+)?$/).nullable(),
  latencyP95Ms: z.string().regex(/^(0|[1-9]\d*)(\.\d+)?$/).nullable(),
  stablePrefixHash: nullableString,
  stablePrefixTokens: nullableCount,
  cacheEligibleInputTokens: nullableCount,
  sourceLine: z.number().int().positive(),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  isDemo: z.boolean(),
}).strict();

export type DataSource = z.infer<typeof dataSourceSchema>;
export type Granularity = z.infer<typeof granularitySchema>;
export type UsageRecord = z.infer<typeof usageRecordSchema>;

export type ImportIssue = Readonly<{
  line: number | null;
  code: string;
  message: string;
}>;

export type ImportRun = Readonly<{
  checksum: string;
  source: DataSource;
  receivedAt: string;
  accepted: number;
  skippedDuplicates: number;
  rejected: number;
  warnings: number;
  blocked: boolean;
  partial: boolean;
  issues: readonly ImportIssue[];
}>;

export type CoverageInterval = Readonly<{ start: string; end: string; complete: boolean }>;
export type CoverageSummary = Readonly<{
  timezone: string;
  completeDays: readonly string[];
  incompleteIntervals: readonly CoverageInterval[];
  excludedIntervals: readonly CoverageInterval[];
  eligibleForThirtyDayProjection: boolean;
}>;
