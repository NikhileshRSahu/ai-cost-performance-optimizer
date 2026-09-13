import { createHash } from 'node:crypto';

const orderedKeys = [
  'intervalStart','intervalEnd','provider','model','requests','totalCost','currency',
  'sourceEventId','project','workspace','workload','configurationId','operationId',
  'attemptNumber','retryCount','inputTokens','cachedInputTokens','cacheWriteTokens',
  'outputTokens','outputCost','toolCalls','toolCost','successes','failures',
  'latencyP50Ms','latencyP95Ms','granularity','stablePrefixHash','stablePrefixTokens',
  'cacheEligibleInputTokens'
] as const;

export function fingerprintRow(row: Readonly<Record<string, string | null>>): string {
  const payload = orderedKeys.map((key) => `${key}=${row[key] ?? ''}`).join('\n');
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

export function sha256Bytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}
