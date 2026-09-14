import { createHash } from 'node:crypto';
import type { UsageRecord } from '../usage/contracts.js';
import type { ProductionTelemetryEvent } from './telemetry-contracts.js';

function fingerprint(
  organizationId: string,
  event: ProductionTelemetryEvent,
): string {
  return createHash('sha256')
    .update(
      [
        organizationId,
        event.eventId,
        event.occurredAt,
        event.provider,
        event.model,
      ].join('\u0000'),
    )
    .digest('hex');
}

export function telemetryEventToUsageRecord(
  input: Readonly<{
    organizationId: string;
    event: ProductionTelemetryEvent;
    sourceLine: number;
    isDemo: boolean;
  }>,
): UsageRecord {
  const success = input.event.outcome === 'SUCCESS';

  return {
    organizationId: input.organizationId,
    source: 'PRODUCTION_TELEMETRY',
    granularity: 'REQUEST',
    intervalStart: input.event.occurredAt,
    intervalEnd: input.event.occurredAt,
    provider: input.event.provider,
    model: input.event.model,
    requests: '1',
    totalCost: input.event.totalCost,
    currency: input.event.currency,
    sourceEventId: input.event.eventId,
    project: null,
    workspace: null,
    workload: input.event.workload,
    configurationId: input.event.configurationId,
    operationId: input.event.operationId,
    attemptNumber: input.event.attemptNumber,
    retryCount: input.event.retryCount,
    inputTokens: input.event.inputTokens,
    cachedInputTokens: input.event.cachedInputTokens,
    cacheWriteTokens: input.event.cacheWriteTokens,
    outputTokens: input.event.outputTokens,
    outputCost: input.event.outputCost,
    toolCalls: input.event.toolCalls,
    toolCost: input.event.toolCost,
    successes: success ? '1' : '0',
    failures: success ? '0' : '1',
    latencyP50Ms: input.event.latencyMs,
    latencyP95Ms: input.event.latencyMs,
    stablePrefixHash: input.event.stablePrefixHash,
    stablePrefixTokens: input.event.stablePrefixTokens,
    cacheEligibleInputTokens: input.event.cacheEligibleInputTokens,
    sourceLine: input.sourceLine,
    fingerprint: fingerprint(input.organizationId, input.event),
    isDemo: input.isDemo,
  };
}
